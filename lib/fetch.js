'use strict'

const request = require('request')

function build (opts, logger) {
  return function fetchDevice (credentials, cb) {
    const deviceId = credentials.deviceId
    const password = credentials.password
    const reqData = {
      method: 'GET',
      baseUrl: opts.dreamFactory,
      url: '/api/v2/devices/_table/devices',
      json: true,
      timeout: 1000 * 10, // 10 seconds
      qs: {
        filter: '(DeviceID=\'' + deviceId + '\') AND (Token=\'' + password + '\')'
      },
      headers: {
        'X-DreamFactory-Api-Key': opts.apiKey,
        'X-DreamFactory-Session-Token': opts.sessionToken,
        'Authorization': opts.authorizationToken
      }
    }

    logger.debug(reqData, 'fetching device')
    request(reqData, cb)
  }
}

module.exports = build
