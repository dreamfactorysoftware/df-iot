'use strict'

const minimist = require('minimist')
const mosca = require('mosca')
const request = require('request')
const Parse = require('fast-json-parse')
const fs = require('fs')

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

  opts.logger = opts.logger || {
    level: 'info',
    name: 'df-iot'
  }

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

  var server = new mosca.Server(opts, cb)

  function fetchDevice (deviceId, password, cb) {
    const reqData = {
      method: 'GET',
      baseUrl: opts.dreamFactory,
      url: '/api/v2/devices/_table/devices',
      json: true,
      timeout: 1000 * 10, // 10 seconds
      qs: {
        filter: '(DeviceID=\'' + deviceId + '\') AND (Token=\'' + password + '\')'
      },
      headers: {
        'X-DreamFactory-Api-Key': opts.apiKey,
        'X-DreamFactory-Session-Token': opts.sessionToken,
        'Authorization': opts.authorizationToken
      }
    }

    server.logger.debug(reqData, 'fetching device')
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
        server.logger.info({ deviceId }, 'authentication denied for wrong status code')
        // denying authorization
        return callback(null, false)
      }

      if (body.resource.length === 0) {
        server.logger.info({ deviceId }, 'authentication denied for missing device')
        // denying authorization
        return callback(null, false)
      }

      if (!body.resource[0].Connect) {
        server.logger.info({ deviceId }, 'authentication denied because client is disabled')
        // denying authorization
        return callback(null, false)
      }

      client.credentials = {
        deviceId,
        password
      }

      server.logger.info({ deviceId }, 'authentication successful')

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
        server.logger.info({ deviceId }, 'publish authorization failed because device was deleted')
        // denying authorization
        return callback(null, false)
      }

      if (body.resource.length === 0) {
        server.logger.info({ deviceId }, 'publish authorization failed because device was deleted')
        // denying authorization
        return callback(null, false)
      }

      if (!body.resource[0].Publish) {
        server.logger.info({ deviceId }, 'publish authorization failed because of missing Publish permission')
        // denying authorization
        return callback(null, false)
      }

      server.logger.info({ deviceId }, 'publish authorization successful')

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
        server.logger.info({ deviceId }, 'subscribe authorization failed because of delete device')
        // denying authorization
        return callback(new Error('missing device'))
      }

      if (body.resource.length === 0) {
        server.logger.info({ deviceId }, 'subscribe authorization failed because of delete device')
        // denying authorization
        return callback(new Error('missing device'))
      }

      if (!body.resource[0].Subscribe) {
        server.logger.info({ deviceId }, 'subscribe authorization failed because of missing Subscribe permission')
        // denying authorization
        return callback(null, false)
      }

      server.logger.info({ deviceId }, 'publish authorization successful')
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
  let opts = minimist(process.argv.slice(2))
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
