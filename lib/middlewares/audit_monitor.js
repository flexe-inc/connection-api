'use strict';

const config = require('../../server_config');
const CustomError = require('../util/custom_error');
const common = require('../util/common');

module.exports = function(req, res, next) {
    const path = req.path;
    const actor = common.getIn(req, 'body.actor');
    const data = common.getIn(req, 'body.data');
    // TODO: Persist the data into an auditing datastore
    next();
};