'use strict'

const Hapi = require('hapi')
const pino = require('hapi-pino')
const Joi = require('joi')

function build (opts, mqtt, logger, cb) {
  const server = new Hapi.Server()

  server.connection({ port: opts.httpPort })

  server.register([{
    register: pino.register,
    options: {
      instance: logger.child({ proto: 'http' })
    }
  }, require('./http-auth')], (err) => {
    if (err) {
      return cb(err)
    }

    server.auth.strategy('df-device', 'df-device', false, opts)

    server.route({
      method: 'POST',
      path: '/p/{topic*}',
      config: {
        auth: 'df-device',
        validate: {
          params: {
            topic: Joi.string().min(1).required()
          },
          payload: Joi.object().required()
        }
      },
      handler: (req, reply) => {
        mqtt.publish({
          topic: req.params.topic,
          payload: JSON.stringify(req.payload)
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
