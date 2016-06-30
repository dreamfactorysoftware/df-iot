'use strict'

const Boom = require('boom')
const buildAuthorizePublish = require('./authorizePublish')

exports.register = function (plugin, options, next) {
  plugin.auth.scheme('df-device', implementation)
  next()
}

exports.register.attributes = {
  name: 'df-device'
}

function implementation (server, options) {
  const authorizePublish = buildAuthorizePublish(options, server.app.logger)

  const scheme = {
    authenticate: function (request, reply) {
      const req = request.raw.req
      const deviceId = req.headers['x-df-deviceid']
      const password = req.headers['x-df-devicetoken']

      if (!deviceId || !password) {
        return reply(Boom.unauthorized('Missing X-DF-DEVICEID and X-DF-DEVICETOKEN headers'))
      }

      const credentials = {
        deviceId,
        password
      }
      authorizePublish(credentials, (err, isValid) => {
        if (err) {
          return reply(err, null, { credentials: credentials })
        }

        if (!isValid) {
          return reply(Boom.unauthorized('Bad X-DF-DEVICEID and X-DF-DEVICETOKEN headers'))
        }

        // Authenticated
        return reply.continue({ credentials: credentials })
      })
    }
  }

  return scheme
}
