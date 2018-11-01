'use strict';

const CONFIGS = {
    SHIPPO_TIMEOUT: 10000,
    FLEXE_SHIPPO_API_TOKEN: {
        production: 'shippo_live_c88ada74233fbf7732a51d2d7cc2c69f337f73cb',
        default: 'shippo_test_0a8c50ef458223ef7df0535c27ab4c35a1d181a4'
    }
};
const ERROR_CODES = {
    // the first three digits are the corresponding http status code
    '400-02-001': 'Invalid Shippo API Token',
    '400-02-002': 'No address data provided',
    '400-02-003': 'Invalid address data for %{name}; must provide street1, city and state',
    '400-02-004': 'Invalid shipmentData; must provide addressFrom, addressTo and parcel',
    '400-02-005': 'Invalid parcel data in shipmentData; must provide length, width, height, distanceUnit, weight and massUnit',
    '400-02-006': 'Invalid options data in shipmentData; must be a JSON',
    '400-02-007': 'Invalid metadata data in shipmentData; must be a string',
    '500-02-001': 'Shippo request timed-out',
    '500-02-002': 'No rate was found; please retry if needed'
};

module.exports = {
    getConfigs: function () {
        return CONFIGS;
    },
    getErrorCodes: function () {
        return ERROR_CODES;
    }
};
