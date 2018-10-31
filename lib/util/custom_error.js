"use strict";

const ERROR_CODES = require("../../server_config").getErrorCodes();
const logger = require("./logger");

function CustomError(reasonCode, details = null) {
    this.reasonCode = reasonCode;
    this.statusCode = reasonCode && parseInt(reasonCode.slice(0, 3));

    let reasonMessage = ERROR_CODES.ERROR_REASON_CODES[reasonCode];
    let needDetails = reasonMessage.indexOf("%{details}") !== -1;
    if (details) {
        if (needDetails) {
            reasonMessage = reasonMessage.replace("%{details}", details);
        } else {
            logger.error("CustomError details \"" + details + "\" was provided to reasonCode " + reasonCode);
        }
    } else {
        if (needDetails) {
            logger.error("CustomError details was NOT provided to reasonCode " + reasonCode);
            reasonMessage = reasonMessage.replace("%{details}", "N/A");
        }
    }

    this.message = reasonMessage;
    this.logMessage = "[" + reasonCode + "] " + reasonMessage;
}

CustomError.prototype.constructor = CustomError;

module.exports = CustomError;
