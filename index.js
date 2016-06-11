'use strict'

const minimist = require('minimist')
const Parse = require('fast-json-parse')
const fs = require('fs')
const pino = require('pino')
const moscaSerializers = require('mosca/lib/serializers')
const steed = require('steed')
const mqtt = require('./lib/mqtt')
const http = require('./lib/http')

function start (opts, cb) {
  opts = opts || {}

  opts.interfaces = [
    { type: 'mqtt', port: opts.mqttPort || 1883 }
  ]

  opts.httpPort = opts.httpPort || 3000

  const loggerLevel = opts.logger && opts.logger.level || 'info'
  const loggerName = opts.logger && opts.logger.name || 'df-iot'

  const logger = pino({
    level: loggerLevel,
    name: loggerName,
    serializers: {
      client: moscaSerializers.clientSerializer,
      packet: moscaSerializers.packetSerializer
    }
  })

  if (!opts.dreamFactory) {
    throw new Error('missing dreamFactory base url')
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

  const servers = []

  steed.parallel([
    function startMqtt (cb) {
      const server = mqtt(opts, {
        // hack to correctly support pino
        // TODO remove in mosca v2
        child: (opts) => {
          delete opts.serializers
          return logger.child(opts)
        }
      }, cb)
      servers.push(server)

      server.on('error', function (err) {
        // TODO close gracefully
        throw err
      })
    },

    function startHttp (cb) {
      const server = http(opts, logger, cb)
      servers.push(server)

      server.on('error', function (err) {
        // TODO close gracefully
        throw err
      })
    }
  ], cb)

  return {
    close: (done) => {
      steed.map(servers, (server, cb) => {
        if (server.close) {
          // mosca
          server.close(cb)
        } else {
          // hapi
          server.stop(cb)
        }
      }, done)
    }
  }
}

module.exports = start

if (require.main === module) {
  let opts = minimist(process.argv.slice(2), {
    alias: {
      config: 'c'
    }
  })
  if (opts.config) {
    let parse = new Parse(fs.readFileSync(opts.config))
    if (parse.err) {
      console.error('problems in parsing the JSON config file')
      console.error(parse.err)
      process.exit(1)
    } else {
      opts = parse.value
    }
  }
  start(opts)
}
