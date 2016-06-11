'use strict'

const Hapi = require('hapi')
const pino = require('hapi-pino')

function build (opts, logger, cb) {
  const server = new Hapi.Server()

  server.connection({ port: opts.httpPort })

  server.register({
    register: pino.register,
    options: {
      instance: logger.child({ proto: 'http' })
    }
  })

  server.start((err) => {
    cb(err, server)
  })

  return server
}

module.exports = build
