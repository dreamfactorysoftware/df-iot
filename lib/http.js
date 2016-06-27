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
        const retain = !!req.headers['x-df-retain']
        mqtt.publish({
          topic: req.params.topic,
          payload: JSON.stringify(req.payload),
          retain: retain,
          qos: getQoS(req)
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

function getQoS (req) {
  const qos = parseInt(req.headers['x-df-qos'])

  if (isNaN(qos) || qos < 0) {
    return 0
  }

  if (qos > 1) {
    return 1
  }

  return qos
}

module.exports = build
