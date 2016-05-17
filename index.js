'use strict'

const minimist = require('minimist')
const mosca = require('mosca')

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
