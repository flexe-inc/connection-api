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
    HTTP_STATUS_CODES: { // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/206
        200: 'Ok',
        201: 'Created',
        202: 'Accepted',
        206: 'Partial Content',
        400: 'Bad request',
        401: 'Unauthorized',
        404: 'Not Found',
        405: 'Method Not Allowed',
        415: 'Unsupported Media Type',
        500: 'Wops, this is embarrassing',
        504: 'Gateway Timeout',
    },
    ERROR_REASON_CODES: {
        // the first three digits are the corresponding status code; the text will be used in log
        400101: 'No address data provided',
        400102: 'Invalid address data; must provide street1, city and state',
        400106: 'Invalid Shippo API Token',
        401101: 'Missing api key',
        401102: 'Unknown api key',
        404101: 'Resource not found: %{details}',
        405101: '%{details} method is not allowed',
        415101: 'Content-Type %{details} is not allowed',
        500101: 'Unexpected error: %{details}',
        500102: 'Shippo request timed-out',
        504101: 'Server timed-out'
    }
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
