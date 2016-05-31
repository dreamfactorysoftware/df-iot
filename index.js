'use strict'

const minimist = require('minimist')
const mosca = require('mosca')
const request = require('request')
const Parse = require('fast-json-parse')

function start (opts, cb) {
  opts = opts || {}

  opts.interfaces = opts.interfaces || [
    { type: 'mqtt', port: 1883 }
  ]

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

  if (!opts.apiKey) {
    throw new Error('missing apiKey')
  }

  if (!opts.sessionToken) {
    throw new Error('missing sessionToken')
  }

  if (!opts.authorizationToken) {
    throw new Error('missing authorizationToken')
  }

  var server = new mosca.Server(opts, cb)

  function fetchDevice (deviceId, password, cb) {
    const reqData = {
      method: 'GET',
      baseUrl: opts.dreamFactory,
      url: '/api/v2/devices/_table/devices',
      json: true,
      timeout: 1000 * 10, // 10 seconds
      qs: {
        filter: '(DeviceID=\\\'' + deviceId + '\\\') AND (Token=\\\'' + password + '\\\')'
      },
      headers: {
        'X-DreamFactory-Api-Key': opts.apiKey,
        'X-DreamFactory-Session-Token': opts.sessionToken,
        'Authorization': opts.authorizationToken
      }
    }
    request(reqData, cb)
  }

  // TODO add logging
  server.authenticate = function (client, username, password, callback) {
    const deviceId = username || client.clientId
    fetchDevice(deviceId, password, (err, res, body) => {
      if (err) {
        return callback(err)
      }

      if (res.statusCode > 300 || res.statusCode < 200) {
        // denying authorization
        return callback(null, false)
      }

      if (body.resource.length === 0) {
        // denying authorization
        return callback(null, false)
      }

      if (!body.resource[0].Connect) {
        // denying authorization
        return callback(null, false)
      }

      client.credentials = {
        deviceId,
        password
      }

      callback(null, true)
    })
  }

  server.authorizePublish = function (client, topic, payload, callback) {
    const deviceId = client.credentials.deviceId
    const password = client.credentials.password
    fetchDevice(deviceId, password, (err, res, body) => {
      if (err) {
        return callback(err)
      }

      if (res.statusCode > 300 || res.statusCode < 200) {
        // denying authorization
        return callback(null, false)
      }

      if (body.resource.length === 0) {
        // denying authorization
        return callback(null, false)
      }

      if (!body.resource[0].Publish) {
        // denying authorization
        return callback(null, false)
      }

      callback(null, true)
    })
  }

  server.authorizeSubscribe = function (client, topic, callback) {
    const deviceId = client.credentials.deviceId
    const password = client.credentials.password
    fetchDevice(deviceId, password, (err, res, body) => {
      if (err) {
        return callback(err)
      }

      if (res.statusCode > 300 || res.statusCode < 200) {
        // denying authorization
        return callback(null, false)
      }

      if (body.resource.length === 0) {
        // denying authorization
        return callback(null, false)
      }

      if (!body.resource[0].Subscribe) {
        // denying authorization
        return callback(null, false)
      }

      callback(null, true)
    })
  }

  server.published = function (packet, client, callback) {
    if (!client) {
      return callback()
    }

    const parsed = new Parse(packet.payload)
    if (parsed.err) {
      return callback(parsed.err)
    }

    // TODO setup agent
    request({
      method: 'POST',
      baseUrl: opts.dreamFactory,
      url: '/api/v2/telemetry/_table/telemetry',
      json: true,
      timeout: 1000 * 10, // 10 seconds
      headers: {
        'X-DreamFactory-Api-Key': opts.apiKey,
        'X-DreamFactory-Session-Token': opts.sessionToken,
        'Authorization': opts.authorizationToken
      },
      body: {
        resource: [{
          clientId: client.credentials.deviceId,
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
        // denying authorization
        return callback(null, false)
      }

      callback(null, 200)
    })
  }

  server.on('error', function (err) {
    // TODO close gracefully
    throw err
  })

  return server
}

module.exports = start

if (require.main === module) {
  start(minimist(process.argv.slice(2)))
}
