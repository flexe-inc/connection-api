"use strict";

const Promise = require('promise');
const config = require("../../server_config.js");
const logger = require("../util/logger");
const CustomError = require("../util/custom_error");

const FLEXE_API_TOKEN = config.getConfig("FLEXE_SHIPPO_API_TOKEN");
const SHIPPO_CLIENTS = {
    FLEXE_API_TOKEN: require("shippo")(FLEXE_API_TOKEN),
};

function getShippo(apiToken) {
    let shippo = SHIPPO_CLIENTS[apiToken];
    if (!shippo) {
        shippo = require("shippo")(apiToken);
        SHIPPO_CLIENTS[apiToken] = shippo;
    }
    return shippo;
}

module.exports = {
    validateAddress: function (addressData, apiToken, callback) {
        throw new Error("BROKEN1");
        const shippo = getShippo(apiToken || FLEXE_API_TOKEN);
        const addressDataForRequest = {
            name: addressData.name || "",
            company: addressData.company || "",
            street1: addressData.street1 || "",
            street2: addressData.street2 || "",
            city: addressData.city || "",
            state: addressData.state || "",
            zip: addressData.zip || "",
            country: addressData.country || "US",
            phone: addressData.phone || "",
            email: addressData.email || "",
            is_residential: addressData.is_residential || "",
            validate: true,
        };

        shippo.address.create(addressDataForRequest)
            .then(data => {
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
                        is_residential: data.is_residential,
                    },
                    isValid: data.validation_results.is_valid,
                    messages: data.validation_results.messages,
                });
            })
            .catch(err => {
                throw new Error("BROKEN");
                const error = (err.message === "Invalid credentials") ?
                    new CustomError("400101") : new CustomError("500101", err.message);
                callback(error);
            });
/*
        //return new Promise(function(resolve, reject) {
            shippo.address.create({
                name: addressData.name || "",
                company: addressData.company || "",
                street1: addressData.street1 || "",
                street2: addressData.street2 || "",
                city: addressData.city || "",
                state: addressData.state || "",
                zip: addressData.zip || "",
                country: addressData.country || "US",
                phone: addressData.phone || "",
                email: addressData.email || "",
                is_residential: addressData.is_residential || "",
                validate: true,
            }, (err, data) => {
                if (err) {
                    let error = null;
                    if (err.message === "Invalid credentials") {
                        error = new CustomError("400101");
                    } else {
                        error = new CustomError("500101", err.message);
                    }
                    logger.error(error.logMessage);
                    cb(error);
                } else {
                    cb(null, {
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
                            is_residential: data.is_residential,
                        },
                        isValid: data.validation_results.is_valid,
                        messages: data.validation_results.messages,
                    });
                }
            });
            */
//        });
    },

    /**
     *
     * @param rateRequestData
     *         rate_request_data =
     {
                carrier_account_ids: carrier_account_ids,
                from_address: Fulfillment::Manager.get_ship_from_address(res_cfg.reservation),
                to_address: Fulfillment::Manager.get_ship_to_address(order_data),
                return_address: Fulfillment::Manager.get_ship_return_address(res_cfg.reservation),
                dimensions: Fulfillment::Manager.get_shipment_weight_dimensions(
                    customer_order_uuid,
                    order_data[:items],
                    res_cfg.reservation_id,
                    inventory_properties),
                signature_confirmation: shipping_label_data[:signature_confirmation],
                service_type: shipping_label_data[:service_type],
                shipping_reference_1: shipping_label_data[:shipping_reference_1],
                shipping_reference_2: shipping_label_data[:shipping_reference_2],
                force_given_address: true
            }
     */
    // get_shipping_rate: function (rateRequestData, apiToken, cb) {
    //     const shippo = getShippo(apiToken || FLEXE_API_TOKEN);
    //     cb;
    // },
};

/******************************************************************************
const address = {
    street1: "215 Clayton St.",
    city: "San Francisco",
    state: "CA",
};

module.exports.validate_address(address, null, function (err, data) {
    if (err) {
        console.log(err.message);
    } else {
        console.log(data);
    }
});  */
