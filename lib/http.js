'use strict'

const Hapi = require('hapi')
const pino = require('hapi-pino')
const buildAuthorizePublish = require('./authorizePublish')

function build (opts, mqtt, logger, cb) {
  const server = new Hapi.Server()

  server.connection({ port: opts.httpPort })

  server.register([{
    register: pino.register,
    options: {
      instance: logger.child({ proto: 'http' })
    }
  }, require('hapi-auth-basic')], (err) => {
    if (err) {
      return cb(err)
    }

    const authorizePublish = buildAuthorizePublish(opts, server.app.logger)

    server.auth.strategy('df-device', 'basic', false, {
      isSecure: false,
      validateFunc: (req, deviceId, password, cb) => {
        const credentials = {
          deviceId,
          password
        }
        authorizePublish(credentials, (err, isValid) => {
          cb(err, isValid, credentials)
        })
      }
    })

    server.route({
      method: 'POST',
      path: '/publish',
      config: {
        auth: 'df-device'
      },
      handler: (req, reply) => {
        mqtt.publish({
          topic: req.payload.topic,
          payload: JSON.stringify(req.payload.payload)
        }, {
          credentials: req.auth.credentials,
          logger: server.app.logger
        }, (err) => {
          reply(err)
        })
      }
    })

    server.start((err) => {
      cb(err, server)
    })
  })

  return server
}

module.exports = build
