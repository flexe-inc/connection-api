module.exports = (function () {
    'use strict';
    // Temporarily use cluster. Should switch to Nginx for better performance per this article:
    // https://medium.com/@fermads/node-js-process-load-balancing-comparing-cluster-iptables-and-nginx-6746aaf38272
    const cluster = require('cluster');
    const config = require('./server_config');
    const logger = require('./lib/util/logger');
    const cpuCount = config.isLocal() || config.isDevEnv() ? 1 : require('os').cpus().length;

    function initServer() {
        const http = require('http');
        const events = require('events');
        const express = require('express');
        const server = express();
        http.globalAgent.maxSockets = Infinity;
        process.setMaxListeners(50);
        events.EventEmitter.defaultMaxListeners = 50;
        // Shared App Configuration settings
        server.set('port', config.getConfig('SERVER_SETTINGS.PORT'));

        require('./server_router')(server);

        http.createServer(server).listen(server.get('port'), function () {
            server.set('initialized', true);
            server.emit('app:initialized');
            logger.info('Express server listening on port ' + server.get('port'));
        });
    }

    if (process.env.npm_package_engines_node !== undefined &&
        process.env.npm_package_engines_node !== process.versions.node) {
        logger.error('Current Node.js version is ' + process.versions.node +
            '. app requires Node.js version: ' + process.env.npm_package_engines_node + '.');
        process.exit();
    }
    if (cpuCount > 1 && cluster.isMaster) {
        logger.info('CPU Count: ' + cpuCount);
        cluster.setupMaster({
            exec: 'server.js'
        });
        // Create a worker for each CPU
        for (let i = 0; i < cpuCount; i++) {
            logger.info('Spawning cluster worker: ' + i);
            cluster.fork();
        }
        cluster.on('exit', function (worker) {
            logger.error('Worker %s died. Restarting...', { worker_process_pid: worker.process.pid });
            cluster.fork();
        });
    } else {
        if (cluster.isWorker) {
            logger.info('Starting Cluster Worker\'s AppServer: pid=' + cluster.worker.process.pid);
        }
        initServer();
    }
})();
