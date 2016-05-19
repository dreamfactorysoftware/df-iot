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

  var server = new mosca.Server(opts, cb)

  server.authenticate = function (client, username, password, callback) {
    request({
      method: 'POST',
      baseUrl: opts.dreamFactory,
      url: '/api/v2/user/session',
      json: true,
      timeout: 1000 * 10, // 10 seconds
      headers: {
        'X-DreamFactory-Api-Key': opts.apiKey
      },
      body: {
        email: username,
        password: password.toString(),
        duration: 0
      }
    }, (err, res, body) => {
      if (err) {
        console.log('authenticate', err)
        return callback(err)
      }

      if (res.statusCode > 300 || res.statusCode < 200) {
        // denying authorization
        return callback(null, false)
      }

      if (!body.session_token) {
        return callback(new Error('no session_token in a valid response'))
      }

      client.sessionToken = body.session_token

      callback(null, true)
    })
  }

  server.authorizePublish = function (client, topic, payload, callback) {
    const parsed = new Parse(payload)
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
        'X-DreamFactory-Session-Token': client.sessionToken
      },
      body: {
        resource: [{
          clientId: client.id,
          topic: topic,
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
