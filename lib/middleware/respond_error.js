"use strict";
const logger = require("../util/logger");

module.exports = function(req, res, customError) {
    logger.info(customError.logMessage);
    res.status(customError.statusCode).json({ url: req.originalUrl, message: customError.message });
};