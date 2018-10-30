"use strict";
const timeout = require("connect-timeout");
const bodyParser = require('body-parser');
const config = require("./server_config");
const logger = require("./lib/util/logger");
const CustomError = require("./lib/util/custom_error");
const serverRoutes = require("./server_routes.json");
const shippoClient = require("./lib/shippo/shippo_client");

function respondError(req, res, customError) {
    logger.info(customError.logMessage);
    res.status(customError.statusCode).json({ url: req.originalUrl, message: customError.message });
}

function setLoggerOptions(req, res, next) {
    logger.setOptions({
        level: config.getConfig("APP_SETTINGS.MIN_LOG_LEVEL"),
        correlationId: req.get("Correlation-ID") || "",
    });
    next();
}

function serverErrorHandler(err, req, res, next) {
    if (res.headersSent) { // just because of your current problem, no need to exacerbate it.
        return next(err);
    }
    let error = new CustomError("500101", err.message + err.stack);
    respondError(req, res, error);
}

function gateControl(req, res, next) {
    let apiKey = (req.get("Authorization") || "").slice(10);
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
}

function convertQueryKeyToLowerCase(req, res, next) {
    for (let key in req.query) {
        if (req.query.hasOwnProperty(key)) {
            let lowerCaseKey = key.toLowerCase();
            if (key !== lowerCaseKey) {
                req.query[lowerCaseKey] = req.query[key];
                req.query[key] = null;
            }
        }
    }
    next();
}

function handleAbout(req, res) {
    res.status(200).json({
        message: "Server (Version " + config.getConfig("APP_SETTINGS.VERSION") + ") developed by Flexe Inc. " +
            "All Rights reserved."
    });
}

function handleHealthCheck(req, res) {
    res.status(200).json({ message: "I am alive" });
}

function handleAddressValidation(req, res) {
    const address = req.body.data.address;
    const shippoApiToken = req.body.data.shippoApiToken;
    shippoClient.validateAddress(address, shippoApiToken, (err, data) => {
        if (err) {
            respondError(req, res, error);
        } else {
            res.status(200).json(data);
        }
    });
}

module.exports = function(server) {
    server.use(setLoggerOptions);
    server.use(bodyParser.json());
    server.use(timeout(config.getConfig("APP_SETTINGS.REQUEST_TIMEOUT")));
    server.use(convertQueryKeyToLowerCase);
    server.use(gateControl);

    server.get(serverRoutes.about.path, handleAbout);
    server.get(serverRoutes.healthCheck.path, handleHealthCheck);
    server.post(serverRoutes.addressValidation.path, handleAddressValidation);

    server.all("*", (req, res) => {
        let err = new CustomError("404101", req.method + " " + req.originalUrl);
        logger.info(err.logMessage);
        res.status(err.statusCode).json({ url: req.originalUrl, method: req.method, message: err.message });
    });

    server.use(serverErrorHandler);
};