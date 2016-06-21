'use strict'

const start = require('..')
const redis = require('redis')
const nock = require('nock')

module.exports = function (lab, started) {
  const beforeEach = lab.beforeEach
  const afterEach = lab.afterEach
  const after = lab.after

  const redisClient = redis.createClient()

  var server

  beforeEach((done) => {
    redisClient.flushdb(() => {
      server = start({
        dreamFactory: 'http://dream.factory',
        apiKey: 'abcde',
        sessionToken: 'session',
        authorizationToken: 'Basic authToken',
        logger: {
          level: 'error'
        }
      }, (err) => {
        if (!err) {
          if (started) {
            started(server)
          }
        }
        done(err)
      })
    })
  })

  afterEach((done) => {
    nock.cleanAll()
    server.close(done)
    server = null
  })

  after((done) => {
    redisClient.quit(done)
  })
}

module.exports.setupAuth = function setupAuth (query, code, response) {
  let result = nock('http://dream.factory', {
    reqheaders: {
      'Accept': 'application/json',
      'X-DreamFactory-Session-Token': 'session',
      'X-DreamFactory-Api-Key': 'abcde',
      'Authorization': 'Basic authToken'
    }
  })

  result = result
    .get('/api/v2/devices/_table/devices')
    .query((actual) => {
      const result = Object.keys(query).reduce((acc, key) => {
        return acc && query[key] === actual[key]
      }, true)
      return result
    })
    .reply(code, JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json'
      }
    })

  return result
}

module.exports.mockIngestion = function mockIngestion (body, code, response) {
  let result = nock('http://dream.factory', {
    reqheaders: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-DreamFactory-Api-Key': 'abcde',
      'X-DreamFactory-Session-Token': 'session',
      'Authorization': 'Basic authToken'
    }
  })

  result = result
    .post('/api/v2/telemetry/_table/telemetry', body)
    .reply(code, JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json'
      }
    })

  return result
}
