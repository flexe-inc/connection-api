'use strict';

const common = require('../util/common');
const CustomError = require('../util/custom_error');
const shippoManager = require('./shippo_manager');
const createResponse = require('../middlewares/create_response');
const logger = require('../util/logger');

function isAddressProperlyFormatted(address) {
    return typeof address === 'object' && address.street1 && address.city && address.state;
}

module.exports = {
    doAddressValidation: function (req, res) {
        const address = common.getIn(req, 'body.data.address');
        if (!address) {
            createResponse.failure(req, res, new CustomError('400-02-002'));
            return;
        }
        if (!isAddressProperlyFormatted(address)) {
            createResponse.failure(req, res, new CustomError('400-02-003'));
            return;
        }
        const shippoApiToken = common.getIn(req, 'body.data.shippoApiToken');
        shippoManager.validateAddress(address, shippoApiToken, (err, data) => {
            if (req.timedout) {
                return;
            }
            if (err) {
                createResponse.failure(req, res, err);
            } else {
                createResponse.success(req, res, data);
            }
        });
    },

    getShippingRate: function (req, res) {
        const shipmentData = common.getIn(req, 'body.data.shipmentData');
        if (typeof shipmentData !== 'object' || !(shipmentData.addressFrom && shipmentData.addressTo && shipmentData.parcel)) {
            createResponse.failure(req, res, new CustomError('400-02-004'));
            return;
        }
        if (!isAddressProperlyFormatted(shipmentData.addressFrom) ||
            !isAddressProperlyFormatted(shipmentData.addressTo) ||
            (shipmentData.addressReturn && !isAddressProperlyFormatted(shipmentData.addressReturn))) {
            createResponse.failure(req, res, new CustomError('400-02-003'));
            return;
        }
        if (typeof shipmentData.parcel !== 'object' || !common.isArrayEqual(
            Object.keys(shipmentData.parcel), ['length', 'width', 'height', 'distanceUnit', 'weight', 'massUnit'])) {
            createResponse.failure(req, res, new CustomError('400-02-005'));
            return;
        }
        if (shipmentData.options && typeof shipmentData.options !== 'object') {
            createResponse.failure(req, res, new CustomError('400-02-006'));
            return;
        }
        if (shipmentData.metadata && typeof shipmentData.metadata !== 'string') {
            createResponse.failure(req, res, new CustomError('400-02-007'));
            return;
        }
        const shippoApiToken = common.getIn(req, 'body.data.shippoApiToken');
        shippoManager.getShippingRate(shipmentData, shippoApiToken, (err, data) => {
            if (req.timedout) {
                return;
            }
            if (err) {
                createResponse.failure(req, res, err);
            } else {
                if (!data) {
                    logger.debug('Shippo dos not return data');
                }
                createResponse.success(req, res, data);
            }
        });
    },
};
