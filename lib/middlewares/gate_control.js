'use strict';

const config = require('../../server_config');
const CustomError = require('../util/custom_error');
const createResponse = require('./create_response');

module.exports = function(req, res, next) {
    let apiKey = (req.get(config.getSupportedHttpHeaders().authorization) || '').slice(10);
    if (!apiKey) {
        if (config.isDevEnv()) {
            next();
        } else {
            let error = new CustomError('401-01-001');
            createResponse.failure(req, res, error);
        }
    } else {
        if (config.getSecrets()[apiKey]) {
            next();
        } else {
            let error = new CustomError('401-01-002');
            createResponse.failure(req, res, error);
        }
    }
};
