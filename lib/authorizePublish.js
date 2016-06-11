'use strict'

const buildFetch = require('./fetch')

function build (opts, logger) {
  const fetchDevice = buildFetch(opts, logger)

  return function authorizePublish (credentials, callback) {
    const deviceId = credentials.deviceId
    fetchDevice(credentials, (err, res, body) => {
      if (err) {
        return callback(err)
      }

      if (res.statusCode > 300 || res.statusCode < 200) {
        logger.info({ deviceId }, 'publish authorization failed because device was deleted')
        // denying authorization
        return callback(null, false)
      }

      if (body.resource.length === 0) {
        logger.info({ deviceId }, 'publish authorization failed because device was deleted')
        // denying authorization
        return callback(null, false)
      }

      if (!body.resource[0].Publish) {
        logger.info({ deviceId }, 'publish authorization failed because of missing Publish permission')
        // denying authorization
        return callback(null, false)
      }

      logger.info({ deviceId }, 'publish authorization successful')

      callback(null, true)
    })
  }
}

module.exports = build
