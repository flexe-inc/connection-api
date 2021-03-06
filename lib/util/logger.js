'use strict';

const logger = require('pino')();
let correlationId = 'N/A';

module.exports = {
    fatal: function (msg, dataObj = null) {
        logger.fatal(dataObj, '[' + correlationId + '] ' + msg);
    },
    error: function (msg, dataObj = null) {
        logger.error(dataObj, '[' + correlationId + '] ' + msg);
    },
    warn: function (msg, dataObj = null) {
        logger.warn(dataObj, '[' + correlationId + '] ' + msg);
    },
    info: function (msg, dataObj = null) {
        logger.info(dataObj, '[' + correlationId + '] ' + msg);
    },
    debug: function (msg, dataObj = null) {
        logger.debug(dataObj, '[' + correlationId + '] ' + msg);
    },
    flush: function() {
        logger.flush();
    },
    setOptions: function (options) {
        if (options) {
            if (options.time) {
                if (options.time === 'slow') {
                    logger.time = logger.stdTimeFunctions.slowTime;
                } else {
                    logger.time = logger.stdTimeFunctions.epochTime;
                }
            }

            if (options.correlationId) {
                correlationId = options.correlationId;
            } else {
                correlationId = 'N/A';
            }

            if (options.level) {
                logger.level = options.level;
            }
        }
    },
};
