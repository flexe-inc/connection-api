"use strict";
const timeout = require("connect-timeout");
const responseTime = require('response-time');
const bodyParser = require('body-parser');
const config = require("./server_config");
const auditMonitor = require("./lib/middleware/audit_monitor");
const gateControl = require("./lib/middleware/gate_control");
const respondError = require("./lib/middleware/respond_error");
const common = require("./lib/util/common");
const logger = require("./lib/util/logger");
const CustomError = require("./lib/util/custom_error");
const serverRoutes = require("./server_routes.json");
const shippoClient = require("./lib/shippo/shippo_client");


function serverErrorHandler(err, req, res, next) {
    if (res.headersSent) { // just because of your current problem, no need to exacerbate it.
        return next(err);
    }

    let error = (err.code === "ETIMEDOUT") ? new CustomError("504101") : new CustomError("500101", err.message + err.stack);
    respondError(req, res, error);
}

function setLoggerOptions(req, res, next) {
    logger.setOptions({
        level: config.getConfig("APP_SETTINGS.MIN_LOG_LEVEL"),
        correlationId: req.get("Correlation-ID") || "",
    });
    next();
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

function haltOnTimedout (req, res, next) {
    if (!req.timedout) {
        next();
    }
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

    const address = common.getValue(req, "body.data.address");
    const shippoApiToken = common.getValue(req, "body.data.shippoApiToken");
    if (!address) {
        return respondError(req, res, new CustomError("400101"));
    }
    shippoClient.validateAddress(address, shippoApiToken, (err, data) => {
        if (req.timedout) {
            return;
        }
        if (err) {
            respondError(req, res, err);
        } else {
            res.status(200).json(data);
        }
    });
}

function handleShippingRate(req, res) {
    const shippoApiToken = common.getValue(req, "body.data.shippoApiToken");
    shippoClient.getShippingRate(null, shippoApiToken, (err, data) => {
        if (req.timedout) {
            return;
        }
        if (err) {
            respondError(req, res, err);
        } else {
            res.status(200).json(data);
        }
    });
}

module.exports = function(server) {
    server.use(timeout(config.getConfig("APP_SETTINGS.REQUEST_TIMEOUT")));
    server.use(responseTime());
    server.use(haltOnTimedout);
    server.use(setLoggerOptions);
    server.use(convertQueryKeyToLowerCase);
    server.use(gateControl);
    server.use(auditMonitor);
    server.use(bodyParser.json());
    server.use(haltOnTimedout);

    server.get(serverRoutes.about.path, handleAbout);
    server.get(serverRoutes.healthCheck.path, handleHealthCheck);
    server.post(serverRoutes.addressValidation.path, handleAddressValidation);
    server.post(serverRoutes.shippingRate.path, handleShippingRate);

    server.all("*", (req, res) => {
        let err = new CustomError("404101", req.method + " " + req.originalUrl);
        logger.info(err.logMessage);
        res.status(err.statusCode).json({ url: req.originalUrl, method: req.method, message: err.message });
    });

    server.use(serverErrorHandler);
};