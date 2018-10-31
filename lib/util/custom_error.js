'use strict';

const ERROR_CODES = require('../../server_config').getErrorCodes();
const logger = require('./logger');

function CustomError(errorCode, details = null) {
    this.errorCode = errorCode;
    this.statusCode = errorCode && errorCode.slice(0, 3);

    let reasonMessage = ERROR_CODES[errorCode];
    let needDetails = reasonMessage.indexOf('%{details}') !== -1;
    if (details) {
        if (needDetails) {
            reasonMessage = reasonMessage.replace('%{details}', details);
        } else {
            logger.error('Unexpected CustomError details \'' + details + '\' was provided to errorCode ' + errorCode);
        }
    } else {
        if (needDetails) {
            logger.error('CustomError details was NOT provided to errorCode ' + errorCode);
            reasonMessage = reasonMessage.replace('%{details}', 'N/A');
        }
    }

    this.message = (this.statusCode === '500') ? 'Wops, this is embarrassing' : reasonMessage;
    this.logMessage = '[' + errorCode + '] ' + reasonMessage;
}

CustomError.prototype.constructor = CustomError;

module.exports = CustomError;
