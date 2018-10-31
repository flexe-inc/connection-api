'use strict';
const config = require('./server_config');
const shippoRouter = require('./lib/shippo/shippo_router');

module.exports = {
    health: {
        method: 'GET',
        path: '/health',
        function: function(req, res) {
            res.status(200).json({ message: 'I am alive' });
        }
    },
    about: {
        method: 'GET',
        path: '/about',
        function: function(req, res) {
            res.status(200).json({
                message: 'Server (Version ' + config.getConfig('APP_SETTINGS.VERSION') + ') developed by Flexe Inc. ' +
                    'All Rights reserved.'
            });
        }
    },
    addressValidation: {
        method: 'POST',
        path: '/queries/validate-address',
        function: shippoRouter.doAddressValidation
    },
    shippingRate: {
        method: 'POST',
        path: '/queries/shipping-rate',
        function: shippoRouter.getShippingRate
    },
};
