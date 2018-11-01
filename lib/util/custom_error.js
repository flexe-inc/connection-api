'use strict';

const ERROR_CODES = require('../../server_config').getErrorCodes();
const logger = require('./logger');

function CustomError(errorCode, parameters = null) {
    this.errorCode = errorCode;
    this.statusCode = errorCode && errorCode.slice(0, 3);

    let reasonMessage = ERROR_CODES[errorCode];
    let hasPlaceHolders = reasonMessage.indexOf('%{') !== -1;
    if (parameters) {
        if (hasPlaceHolders) {
            for (let param in parameters) {
                reasonMessage = reasonMessage.replace('%{' + param + '}', parameters[param]);
            }
        } else {
            logger.error('Unexpected CustomError details \'' + parameters + '\' was provided to errorCode ' + errorCode);
        }
    } else {
        if (hasPlaceHolders) {
            logger.error('CustomError details was NOT provided to errorCode ' + errorCode);
        }
    }

    this.message = (this.statusCode === '500') ? 'Wops, this is embarrassing' : reasonMessage;
    this.logMessage = '[' + errorCode + '] ' + reasonMessage;
}

CustomError.prototype.constructor = CustomError;

module.exports = CustomError;
