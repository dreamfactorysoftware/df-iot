'use strict'

const request = require('request')
const devices = require('./endpoints').devices

function build (opts, logger) {
  return function fetchDevice (credentials, cb) {
    const reqData = {
      method: 'GET',
      baseUrl: opts.dreamFactory,
      url: devices.path,
      json: true,
      timeout: 1000 * 10, // 10 seconds
      qs: devices.qs(credentials),
      headers: {
        'X-DreamFactory-Api-Key': opts.apiKey,
        'X-DreamFactory-Session-Token': opts.sessionToken
      }
    }

    logger.debug(reqData, 'fetching device')
    request(reqData, cb)
  }
}

module.exports = build
