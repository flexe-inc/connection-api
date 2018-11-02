'use strict';

const config = require('../../server_config.js');
const CustomError = require('../util/custom_error');
const common = require('../util/common');
const logger = require('../util/logger');
const toYaml = require('../util/to_yaml');

const FLEXE_API_TOKEN = config.getConfig('SHIPPO_SETTINGS.FLEXE_SHIPPO_API_TOKEN');
const SHIPPO_CLIENTS = {
    FLEXE_API_TOKEN: require('shippo')(FLEXE_API_TOKEN),
};

const DEFAULT_NUM_RETRIES = 2;

const ACCEPTED_EXTRAS_IN_SHIPMENT_DATA = {
    signatureConfirmation: 'signature_confirmation',
    bypassAddressValidation: 'bypass_address_validation',
    reference1: 'reference_1',
    reference2: 'reference_2'
};
const ADDRESS_FIELDS_IN_SHIPMENT_DATA = ['address_from', 'address_to', 'address_return'];
const PARCEL_FIELDS_TO_CHANGE_SHIPMENT_DATA = {
    massUnit: 'mass_unit',
    distanceUnit: 'distance_unit'
};

function toShippoAddress(addressData) {
    let shippoAddress = {
        name: addressData.name,
        company: addressData.company,
        street1: addressData.street1,
        street2: addressData.street2,
        city: addressData.city,
        state: addressData.state,
        zip: addressData.zip,
        country: addressData.country || 'US',
        phone: addressData.phone,
        email: addressData.email,
        is_residential: addressData.isResidential
    };
    for (let key in shippoAddress) {
        if (shippoAddress[key] === null || shippoAddress[key] === undefined) {
            delete shippoAddress[key];
        }
    }
    return shippoAddress;
}

function getShippo(apiToken) {
    let shippo = SHIPPO_CLIENTS[apiToken];
    if (!shippo) {
        shippo = require('shippo')(apiToken);
        shippo.setTimeout(config.getConfig('SHIPPO_SETTINGS.SHIPPO_TIMEOUT'));
        SHIPPO_CLIENTS[apiToken] = shippo;
    }
    return shippo;
}

function handleShippoError(err) {
    if (err.type === 'ShippoAuthenticationError') {
        return new CustomError('400-02-001');
    } else if (err.type === 'ShippoConnectionError' && common.getIn(err, 'detail.code') === 'ETIMEDOUT') {
        return new CustomError('500-02-001');
    } else {
        return new CustomError('500-01-001', { details: err.message });
    }
}

function _validateAddress(addressData, apiToken, numRetries, callback) {
    numRetries = numRetries || DEFAULT_NUM_RETRIES;
    const shippo = getShippo(apiToken || FLEXE_API_TOKEN);
    const requestData = toShippoAddress(addressData);
    requestData.validate = true;
    shippo.address.create(requestData)
        .then(data => {
            if (!data) {
                if (numRetries > 0) {
                    _validateAddress(addressData, apiToken, --numRetries, callback);
                } else {
                    callback(new CustomError('500-01-002'));
                }
                return;
            }
            callback(null, {
                address: {
                    name: data.name,
                    company: data.company,
                    street1: data.street1,
                    street2: data.street2,
                    city: data.city,
                    state: data.state,
                    zip: data.zip,
                    country: data.country,
                    phone: data.phone,
                    email: data.email,
                    isResidential: data.is_residential,
                },
                isValid: common.getIn(data, 'validation_results.is_valid'),
                messages: common.getIn(data, 'validation_results.messages')
            });
        })
        .catch(err => {
            if (numRetries > 0 && err.type === 'ShippoConnectionError' && common.getIn(err, 'detail.code') === 'ETIMEDOUT') {
                _validateAddress(addressData, apiToken, --numRetries, callback);
            } else {
                logger.error('Error encountered while requesting from Shippo: ' + err.message);
                let customError = handleShippoError(err);
                callback(customError);
            }
        });
}

function _getShippingRate(shipmentData, apiToken, numRetries, callback) {
    if (numRetries == null) {
        numRetries = DEFAULT_NUM_RETRIES;
    }
    const shippo = getShippo(apiToken || FLEXE_API_TOKEN);
    let rateRequestData = {
        address_from: toShippoAddress(shipmentData.addressFrom),
        address_to: toShippoAddress(shipmentData.addressTo),
        parcels: [shipmentData.parcel],
        async: false
    };
    if (shipmentData.addressReturn) {
        rateRequestData.address_return = toShippoAddress(shipmentData.addressReturn);
    }
    for (let i = 0; i < ADDRESS_FIELDS_IN_SHIPMENT_DATA.length; i++) {
        let address = ADDRESS_FIELDS_IN_SHIPMENT_DATA[i];
        if (rateRequestData[address] && 'isResidential' in rateRequestData[address]) {
            rateRequestData[address].is_residential = rateRequestData[address].isResidential;
            delete rateRequestData[address].isResidential;
        }
    }
    let parcel = rateRequestData.parcels[0];
    for (let key in PARCEL_FIELDS_TO_CHANGE_SHIPMENT_DATA) {
        if (key in parcel) {
            parcel[PARCEL_FIELDS_TO_CHANGE_SHIPMENT_DATA[key]] = parcel[key];
            delete parcel[key];
        }
    }
    if (shipmentData.metadata) {
        rateRequestData.metadata = shipmentData.metadata;
    }
    if (shipmentData.options) {
        for (let key in ACCEPTED_EXTRAS_IN_SHIPMENT_DATA) {
            if (key in shipmentData.options) {
                rateRequestData.extra = rateRequestData.extra || {};
                rateRequestData.extra[ACCEPTED_EXTRAS_IN_SHIPMENT_DATA[key]] = shipmentData.options[key];
            }
        }
        if ('carrierAccounts' in shipmentData.options) {
            rateRequestData.carrier_accounts = shipmentData.options.carrierAccounts;
        }
    }

    shippo.shipment.create(rateRequestData)
        .then(data => {
            if (!data || !data.rates || !data.rates.length) {
                if (numRetries > 0) {
                    _getShippingRate(shipmentData, apiToken, --numRetries, callback);
                } else {
                    logger.info('Shippo dos not return rates');
                    callback(new CustomError('500-02-002'));
                }
                return;
            }

            logger.debug('Shippo returns ' + data.rates.length + ' rates');
            let curLowestRateAmount = Number.MAX_SAFE_INTEGER;
            let curLowestRate = null;
            for (let i = 0; i < data.rates.length; i++) {
                let rate = data.rates[i];
                if (shipmentData.options && shipmentData.options.serviceLevel) {
                    if (shipmentData.options.serviceLevel === rate.servicelevel.token) {
                        let curAmount = Number(rate.amount);
                        if (curAmount < curLowestRateAmount) {
                            curLowestRate = {
                                rateId: rate.object_id,
                                amount: rate.amount,
                                currency: rate.currency,
                                serviceLevel: rate.servicelevel.token,
                                carrierAccount: rate.carrier_account
                            };
                            curLowestRateAmount = curAmount;
                        }
                    }
                } else {
                    let curAmount = Number(rate.amount);
                    if (curAmount < curLowestRateAmount) {
                        curLowestRate = {
                            rateId: rate.object_id,
                            amount: rate.amount,
                            currency: rate.currency,
                            serviceLevel: '',
                            carrierAccount: rate.carrier_account
                        };
                        curLowestRateAmount = curAmount;
                    }
                }
            }
            callback(null, curLowestRate);
        })
        .catch(err => {
            if (numRetries > 0 && err.type === 'ShippoConnectionError' && common.getIn(err, 'detail.code') === 'ETIMEDOUT') {
                _getShippingRate(shipmentData, apiToken, --numRetries, callback);
            } else {
                logger.error('Error encountered while requesting from Shippo: ' + err.message);
                let customError = handleShippoError(err);
                callback(customError);
            }
        });
}

module.exports = {
    /**
     * Validate address via USPS
     *
     * @param addressData An object with the following properties (street1, city, state are required):
         {
            "name": "Shawn Ippotle",
            "company": "Shippo",
            "street1": "215 Clayton St.",
            "street2": "",
            "city": "San Francisco",
            "state": "CA",
            "zip": "94117",
            "country": "US",
            "phone": "+1 555 341 9393",
            "email": "shippotle@goshippo.com",
            "isResidential": true
         }
     * @param apiToken The apiToken provided by Shippo. If null, FLEXE api token will be used
     * @param callback, The data object is of the following structure:
         {
            "address": {
               "name": "Shawn Ippotle",
               "company": "Shippo",
               "street1": "215 Clayton St.",
               "street2": "",
               "city": "San Francisco",
               "state": "CA",
               "zip": "94117",
               "country": "US",
               "phone": "+1 555 341 9393",
               "email": "shippotle@goshippo.com",
               "isResidential": true
            },
            "isValid": false,
            "messages": [
               {
                  "source": "USPS",
                  "code": "Unknown Street",
                  "text": "City, State and ZIP Code are valid, but street address is not a match."
               }
            ]
         }
     */
    validateAddress: _validateAddress,

    /**
     *
     * @param shipmentData An object of the following structure (parcel, addressTo, and addressFrom are required):
         {
            "parcel": {
                "length": "10",
                "width": "15",
                "height": "10",
                "distanceUnit": "in",
                "weight": "1",
                "massUnit": "lb"
            },
            "addressTo": {
                "name": "Mr Hippo",
                "street1": "965 Mission St #572",
                "city": "San Francisco",
                "state": "CA",
                "zip": "94103",
                "country": "US",
                "phone": "4151234567",
                "email": "mrhippo@goshippo.com",
                "isResidential": true
            },
            "addressFrom": {
                "name": "Mrs Hippo",
                "street1": "1092 Indian Summer Ct",
                "city": "San Jose",
                "state": "CA",
                "zip": "95122",
                "country": "US",
                "phone": "4159876543",
                "email": "mrshippo@goshippo.com"
            },
            "addressReturn": {
                "name": "Mrs Hippo",
                "street1": "1092 Indian Summer Ct",
                "city": "San Jose",
                "state": "CA",
                "zip": "95122",
                "country": "US",
                "phone": "4159876543",
                "email": "mrshippo@goshippo.com"
            },
            "metadata": "Customer ID 123456",
            "options": {
                "carrierAccounts": ["379cf5ddaee24eaa818bb5844f6aadfd"],
                "serviceLevel": "ups_ground",
                "signatureConfirmation": "ADULT",
                "bypassAddressValidation": true,
                "reference1": "PO 123",
                "reference2": "CO 2323"
            }
         }
     * @param apiToken The apiToken provided by Shippo. If null, FLEXE api token will be used
     * @param callback
     */
    getShippingRate: _getShippingRate,
};
