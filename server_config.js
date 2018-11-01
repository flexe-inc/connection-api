'use strict';

const common = require('./lib/util/common');

const MODULE_CONFIGS = {
    SHIPPO_SETTINGS: require('./lib/shippo/shippo_config')
};

const ENVS = {
    production: 'production',
    staging: 'staging',
    dev: 'dev'
};

const APP_ENV = process.env.NODE_ENV || ENVS.dev;
const IS_DEV_ENV = APP_ENV === ENVS.dev;

const SUPPORTED_HTTP_HEADERS = {
    authorization: 'Authorization',
    contentType: 'Content-Type',
    correlationId: 'Correlation-ID'
};

const CONFIG_OBJ = {
    SERVER_SETTINGS: {
        PORT: process.env.PORT || 3100,
        REQUEST_TIMEOUT: 12000,
        VERSION: 0.1,
        MIN_LOG_LEVEL: {
            production: 'info',
            default: 'debug'
        }
    }
};
for (let module in MODULE_CONFIGS) {
    CONFIG_OBJ[module] = MODULE_CONFIGS[module].getConfigs();
}

const ERROR_CODES = {
    // the first three digits are the corresponding http status code
    '401-01-001': 'Missing api key',
    '401-01-002': 'Unknown api key',
    '404-01-001': 'Resource not found: %{name}',
    '405-01-001': '%{method} method is not allowed on %{path}',
    '415-01-001': 'Content-Type %{name} is not allowed',
    '500-01-001': 'Unexpected error: %{details}',
    '500-01-002': 'Unable to generate response; please retry if needed',
    '504-01-001': 'Server timed-out'
};
for (let module in MODULE_CONFIGS) {
    let moduleErrorCodes = MODULE_CONFIGS[module].getErrorCodes();
    for (let errorCode in moduleErrorCodes) {
        ERROR_CODES[errorCode] = moduleErrorCodes[errorCode];
    }
}

const CLIENT_SECRETS = {
    '3736db4d9cfb8b2ab94d76d87c123b3c': 'FLEXE'
};

module.exports = {

    isLocal: function () {
        return process.platform === 'darwin';
    },

    isDevEnv: function() {
        return IS_DEV_ENV;
    },

    getConfig: function (key, defaultValue) {
        let config = common.getIn(CONFIG_OBJ, key, defaultValue);
        if (typeof config === 'object') { // this is an env-specific config
            return config[APP_ENV] || config.default;
        } else {
            return config;
        }
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
