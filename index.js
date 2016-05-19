'use strict'

const minimist = require('minimist')
const mosca = require('mosca')
const request = require('request')

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
      url: '/v2/user/session',
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
