'use strict';

const common = require('../util/common');
const CustomError = require('../util/custom_error');
const shippoManager = require('./shippo_manager');
const respondError = require('../middlewares/respond_error');

module.exports = {
    doAddressValidation: function (req, res) {
        const address = common.getIn(req, 'body.data.address');
        if (!address) {
            respondError(req, res, new CustomError('400101'));
            return;
        }
        if (typeof address !== 'object' || !(address.street1 && address.city || address.state)) {
            respondError(req, res, new CustomError('400102'));
            return;
        }
        const shippoApiToken = common.getIn(req, 'body.data.shippoApiToken');
        shippoManager.validateAddress(address, shippoApiToken, (err, data) => {
            if (req.timedout) {
                return;
            }
            if (err) {
                respondError(req, res, err);
            } else {
                res.status(200).json(data);
            }
        });
    },

    getShippingRate: function (req, res) {
        const shipmentData = common.getIn(req, 'body.data.shipmentData');
        // TODO: validate input
        const shippoApiToken = common.getIn(req, 'body.data.shippoApiToken');
        shippoManager.getShippingRate(shipmentData, shippoApiToken, (err, data) => {
            if (req.timedout) {
                return;
            }
            if (err) {
                respondError(req, res, err);
            } else {
                res.status(200).json(data);
            }
        });
    },
};
