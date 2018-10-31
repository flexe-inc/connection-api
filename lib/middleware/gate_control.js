"use strict";
const config = require("../../server_config");
const CustomError = require("../util/custom_error");
const respondError = require("./respond_error");

module.exports = function(req, res, next) {
    let apiKey = (req.get(config.getSupportedHttpHeaders().authorization) || "").slice(10);
    if (!apiKey) {
        if (config.isDevEnv()) {
            next();
        } else {
            let error = new CustomError("401101");
            respondError(req, res, error);
        }
    } else {
        if (config.getSecrets()[apiKey]) {
            next();
        } else {
            let error = new CustomError("401102");
            respondError(req, res, error);
        }
    }
};
