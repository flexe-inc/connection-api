# How to run the app on your local machine

# Warehouser
* Node version: 9.5.0

A gateway layer for FLEXE to connect to external services, via RESTful requests or batch processing.

It also serves as a barebone Node service.

## Core Features as a barebone NODE services:

* cluster support: in non-dev env, fork x numbers for worker process on the same machine, based on # of CPUs.
* Gate Control: checking client API keys and rejected unauthorized requests.
* Monitoring and auditing: record all the request with path, data, correlation-ID, actor, etc, as well as statistics.
* Correlation-ID support: write all log message with correlation-ID from the client request's header
* Error handling: catch unhandled errors and respond to the client gracefully. 
* Error response: standard response structure with error code and error message, relating to the http status code.
* Time-out support: respond client on fixed latency upper-bound (timeout setting). Add elapsed time in the response header.
* env-specific config: define different configuration value for different environment
