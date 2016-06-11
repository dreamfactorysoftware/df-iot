'use strict'

const buildFetch = require('./fetch')

function build (opts, logger) {
  const fetchDevice = buildFetch(opts, logger)

  return function authorizeSubscribe (credentials, callback) {
    const deviceId = credentials.deviceId
    fetchDevice(credentials, (err, res, body) => {
      if (err) {
        return callback(err)
      }

      if (res.statusCode > 300 || res.statusCode < 200) {
        logger.info({ deviceId }, 'subscribe authorization failed because of delete device')
        // denying authorization
        return callback(new Error('missing device'))
      }

      if (body.resource.length === 0) {
        logger.info({ deviceId }, 'subscribe authorization failed because of delete device')
        // denying authorization
        return callback(new Error('missing device'))
      }

      if (!body.resource[0].Subscribe) {
        logger.info({ deviceId }, 'subscribe authorization failed because of missing Subscribe permission')
        // denying authorization
        return callback(null, false)
      }

      logger.info({ deviceId }, 'publish authorization successful')
      callback(null, true)
    })
  }
}

module.exports = build
