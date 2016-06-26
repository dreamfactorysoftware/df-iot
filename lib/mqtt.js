'use strict'

const request = require('request')
const Parse = require('fast-json-parse')
const mosca = require('mosca')
const buildAuthenticate = require('./authenticate')
const buildAuthorizePublish = require('./authorizePublish')
const buildAuthorizeSubscribe = require('./authorizeSubscribe')

function build (opts, logger, cb) {
  opts.persistence = {
    factory: mosca.persistence.Redis,
    host: opts.redisHost,
    port: opts.redisPort,
    db: opts.redisDb,
    ttl: {
      subscriptions: 1000 * 60 * 10,
      packets: 1000 * 60 * 10
    }
  }

  opts.backend = {
    type: 'redis',
    host: opts.redisHost,
    port: opts.redisPort,
    db: opts.redisDb
  }

  opts.logger = {
    childOf: logger,
    level: logger.level,
    proto: 'mqtt'
  }

  const server = new mosca.Server(opts, cb)

  const authenticate = buildAuthenticate(opts, server.logger)
  const authorizePublish = buildAuthorizePublish(opts, server.logger)
  const authorizeSubscribe = buildAuthorizeSubscribe(opts, server.logger)

  server.authenticate = function (client, username, password, callback) {
    const deviceId = username || client.clientId
    authenticate({ deviceId, password }, (err, credentials) => {
      client.credentials = credentials
      callback(err, !!credentials)
    })
  }

  server.authorizePublish = function (client, topic, payload, callback) {
    authorizePublish(client.credentials, callback)
  }

  server.authorizeSubscribe = function (client, topic, callback) {
    authorizeSubscribe(client.credentials, callback)
  }

  server.published = function (packet, client, callback) {
    if (!client) {
      return callback()
    }

    const deviceId = client.credentials.deviceId
    const logger = server.logger

    const parsed = new Parse(packet.payload)
    if (parsed.err) {
      logger.debug({ deviceId, err: parsed.err }, 'unable to parse payload as json')
      return callback(parsed.err)
    }

    logger.debug({ deviceId, payload: parsed.value }, 'uploading to telemetry')

    // TODO setup agent
    request({
      method: 'POST',
      baseUrl: opts.dreamFactory,
      url: '/api/v2/telemetry/_table/telemetry',
      json: true,
      timeout: 1000 * 10, // 10 seconds
      headers: {
        'X-DreamFactory-Api-Key': opts.apiKey,
        'X-DreamFactory-Session-Token': opts.sessionToken
      },
      body: {
        resource: [{
          clientId: deviceId,
          topic: packet.topic,
          timestamp: new Date(),
          payload: parsed.value
        }]
      }
    }, (err, res, body) => {
      if (err) {
        return callback(err)
      }

      if (res.statusCode > 300 || res.statusCode < 200) {
        logger.warn({ deviceId }, 'published failed')
        // denying authorization
        return callback(null, false)
      }
      logger.debug({ deviceId }, 'upload to telemetry completed')

      callback(null, 200)
    })
  }

  return server
}

module.exports = build
