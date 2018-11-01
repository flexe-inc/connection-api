'use strict';

const logger = require('../util/logger');

module.exports = {
    failure: function(req, res, customError) {
        logger.info(customError.logMessage);
        res.status(customError.statusCode).json({
            url: req.originalUrl,
            method: req.method,
            code: customError.errorCode,
            message: customError.message });
    },
    success: function(req, res, data) {
        if (data) {
            res.status(200).json(data);
        } else {
            res.status(204).send();
        }
    }
};