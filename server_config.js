'use strict';

const common = require('./lib/util/common');

const ENVS = {
    production: 'production',
    staging: 'staging',
    dev: 'dev'
};

const APP_ENV = process.env.NODE_ENV || ENVS.dev;
const IS_DEV_ENV = APP_ENV === ENVS.dev;
const IS_PRODUCTION_ENV = APP_ENV === ENVS.production;

const CONFIG_OBJ = {
    APP_SETTINGS: {
        PORT: process.env.PORT || 3100,
        MAX_CONNECTION: 500,
        REQUEST_TIMEOUT: 12000,
        VERSION: 0.1,
        MIN_LOG_LEVEL: IS_DEV_ENV ? 'debug' : 'info'
    },
    SHIPPO_TIMEOUT: 10000,
    DEFAULT_ENCODING: 'utf8',
    FLEXE_SHIPPO_API_TOKEN: 'shippo_live_c88ada74233fbf7732a51d2d7cc2c69f337f73cb',
};

const SUPPORTED_HTTP_HEADERS = {
    authorization: 'Authorization',
    contentType: 'Content-Type',
    correlationId: 'Correlation-ID',
};


const ERROR_CODES = {
    // the first three digits are the corresponding status code; the text will be used in log
    '400-02-001': 'Invalid Shippo API Token',
    '400-02-002': 'No address data provided',
    '400-02-003': 'Invalid address data; must provide street1, city and state',
    '400-02-004': 'Invalid shipmentData; must provide addressFrom, addressTo and parcel',
    '400-02-005': 'Invalid parcel data in shipmentData; must provide length, width, height, distanceUnit, weight and massUnit',
    '400-02-006': 'Invalid options data in shipmentData; must be a JSON',
    '400-02-007': 'Invalid metadata data in shipmentData; must be a string',
    '401-01-001': 'Missing api key',
    '401-01-002': 'Unknown api key',
    '404-01-001': 'Resource not found: %{details}',
    '405-01-001': '%{details} method is not allowed',
    '415-01-001': 'Content-Type %{details} is not allowed',
    '500-01-001': 'Unexpected error: %{details}',
    '500-02-001': 'Shippo request timed-out',
    '504-01-001': 'Server timed-out'
};

const CLIENT_SECRETS = {
    '3736db4d9cfb8b2ab94d76d87c123b3c': 'FLEXE'
};

module.exports = {

    isLocal: function () {
        return process.platform === 'darwin';
    },

    getAppEnv: function() {
        return APP_ENV;
    },

    isDevEnv: function() {
        return IS_DEV_ENV;
    },

    isProdEnv: function() {
        return IS_PRODUCTION_ENV;
    },

    getConfig: function (key, defaultValue) {
        return common.getIn(CONFIG_OBJ, key, defaultValue);
    },

    getErrorCodes: function() {
        return ERROR_CODES;
    },

    getSecrets: function() {
        return CLIENT_SECRETS;
    },

    getSupportedHttpHeaders: function() {
        return SUPPORTED_HTTP_HEADERS;
    }

};
