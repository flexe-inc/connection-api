'use strict';
const timeout = require('connect-timeout');
const responseTime = require('response-time');
const bodyParser = require('body-parser');
const config = require('./server_config');
const auditMonitor = require('./lib/middlewares/audit_monitor');
const gateControl = require('./lib/middlewares/gate_control');
const createResponse = require('./lib/middlewares/create_response');
const logger = require('./lib/util/logger');
const CustomError = require('./lib/util/custom_error');
const serverRoutes = require('./server_routes.js');

const allRoutes = (function() {
    let definedRoutes = new Set();
    for (let key in serverRoutes) {
        definedRoutes.add(serverRoutes[key].path);
    }
    return definedRoutes;
})();


function serverErrorHandler(err, req, res, next) {
    if (res.headersSent) { // just because of your current problem, no need to exacerbate it.
        next(err);
        return;
    }

    let error = (err.code === 'ETIMEDOUT') ? new CustomError('504-01-001') : new CustomError('500-01-001', err.message);
    createResponse.failure(req, res, error);
}

function setLoggerOptions(req, res, next) {
    logger.setOptions({
        level: config.getConfig('SERVER_SETTINGS.MIN_LOG_LEVEL'),
        correlationId: req.get(config.getSupportedHttpHeaders().correlationId) || '',
    });
    next();
}

function preprocessRequestResponse(req, res, next) {
    let contentType = req.get(config.getSupportedHttpHeaders().contentType);
    if (contentType !== 'application/json') {
        createResponse.failure(req, res, new CustomError('415-01-001', contentType));
        return;
    }
    // convert all the parameters keys into lower case
    for (let key in req.query) {
        if (req.query.hasOwnProperty(key)) {
            let lowerCaseKey = key.toLowerCase();
            if (key !== lowerCaseKey) {
                req.query[lowerCaseKey] = req.query[key];
                req.query[key] = null;
            }
        }
    }
    let correlationIdKey = config.getSupportedHttpHeaders().correlationId;
    res.setHeader(correlationIdKey, req.get(correlationIdKey) || '');
    next();
}

function haltOnTimedout (req, res, next) {
    if (!req.timedout) {
        next();
    }
}

module.exports = function(server) {
    server.use(timeout(config.getConfig('SERVER_SETTINGS.REQUEST_TIMEOUT')));
    server.use(responseTime());
    server.use(haltOnTimedout);
    server.use(setLoggerOptions);
    server.use(preprocessRequestResponse);
    server.use(gateControl);
    server.use(auditMonitor);
    server.use(bodyParser.json());
    server.use(haltOnTimedout);

    for (let key in serverRoutes) {
        switch(serverRoutes[key].method) {
            case 'GET':
                server.get(serverRoutes[key].path, serverRoutes[key].function);
                break;
            case 'POST':
                server.post(serverRoutes[key].path, serverRoutes[key].function);
                break;
            case 'PUT':
                server.put(serverRoutes[key].path, serverRoutes[key].function);
                break;
            default:
                throw new Error(serverRoutes[key].method + ' not supported on ' + key);
        }
    }

    server.all('*', (req, res) => {
        let err = allRoutes.has(req.path) ? new CustomError('405-01-001', req.method) : new CustomError('404-01-001', req.path);
        createResponse.failure(req, res, err);
    });

    server.use(serverErrorHandler);
};