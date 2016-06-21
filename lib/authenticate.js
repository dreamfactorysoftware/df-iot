'use strict'

const buildFetch = require('./fetch')

function build (opts, logger) {
  const fetchDevice = buildFetch(opts, logger)

  return function authenticate (credentials, callback) {
    const deviceId = credentials.deviceId
    fetchDevice(credentials, (err, res, body) => {
      if (err) {
        return callback(err)
      }

      if (res.statusCode > 300 || res.statusCode < 200) {
        logger.info({ deviceId, statusCode: res.statusCode }, 'authentication denied for wrong status code')
        // denying authorization
        return callback(null, null)
      }

      if (body.resource.length === 0) {
        logger.info({ deviceId }, 'authentication denied for missing device')
        // denying authorization
        return callback(null, null)
      }

      if (!body.resource[0].Connect) {
        logger.info({ deviceId }, 'authentication denied because client is disabled')
        // denying authorization
        return callback(null, null)
      }

      logger.info({ deviceId }, 'authentication successful')

      callback(null, credentials)
    })
  }
}

module.exports = build
