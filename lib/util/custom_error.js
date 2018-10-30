"use strict";

const config = require("../../server_config");
const logger = require("./logger");

function CustomError(reasonCode, details = null) {
    this.reasonCode = reasonCode;
    this.statusCode = reasonCode && parseInt(reasonCode.slice(0, 3));
    this.message = config.getErrorCodes().HTTP_STATUS_CODES[this.statusCode] + ": " + reasonCode;

    let logMessageStr = config.getErrorCodes().ERROR_REASON_CODES[reasonCode];
    let needDetails = logMessageStr.indexOf("%{details}") !== -1;
    if (details) {
        if (needDetails) {
            logMessageStr = logMessageStr.replace("%{details}", details);
        } else {
            logger.error("CustomError details \"" + details + "\" was provided to reasonCode " + reasonCode);
        }
    } else {
        if (needDetails) {
            logger.error("CustomError details was NOT provided to reasonCode " + reasonCode);
            logMessageStr = logMessageStr.replace("%{details}", "N/A");
        }
    }
    this.logMessage = this.message + " [" + logMessageStr + "]";
}

CustomError.prototype.constructor = CustomError;

module.exports = CustomError;
