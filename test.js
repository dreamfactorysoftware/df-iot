'use strict'

const Lab = require('lab')
const Code = require('code')
const redis = require('redis')
const mqtt = require('mqtt')
const nock = require('nock')

const lab = exports.lab = Lab.script()
const describe = lab.describe
const it = lab.it
const expect = Code.expect
const beforeEach = lab.beforeEach
const afterEach = lab.afterEach
const after = lab.after

const start = require('.')

describe('df-iot', () => {
  const redisClient = redis.createClient()

  let server

  beforeEach((done) => {
    redisClient.flushdb(() => {
      server = start({
        dreamFactory: 'http://dream.factory',
        apiKey: 'abcde'
      }, done)
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

  function setupAuth (body, code, response) {
    let result = nock('http://dream.factory', {
      reqheaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-DreamFactory-Api-Key': 'abcde'
      }
    })

    result = result.post('/api/v2/user/session', body)

    result = result.reply(code, JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    return result
  }

  function authorizePublish (token, body, code, response) {
    let result = nock('http://dream.factory', {
      reqheaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-DreamFactory-Api-Key': 'abcde',
        'X-DreamFactory-Session-Token': token
      }
    })

    result = result.post('/api/v2/telemetry/_table/telemetry', body)

    result = result.reply(code, JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    return result
  }

  it('should support positive auth', (done) => {
    const aCall = setupAuth({
      email: 'a',
      password: 'b',
      duration: 0
    }, 200, {
      session_token: 'atoken'
    })

    const client = mqtt.connect('mqtt://a:b@localhost')

    client.on('connect', () => {
      expect(aCall.isDone()).to.be.true()
      client.end()
      done()
    })
  })

  it('should support negative auth via a statusCode', (done) => {
    const aCall = setupAuth({
      email: 'a',
      password: 'b',
      duration: 0
    }, 400, {})

    const client = mqtt.connect('mqtt://a:b@localhost')

    client.on('error', () => {
      expect(aCall.isDone()).to.be.true()
      client.end()
      done()
    })
  })

  it('should support basic mqtt', { plan: 4 }, (done) => {
    const aCall = setupAuth({
      email: 'a',
      password: 'b',
      duration: 0
    }, 200, {
      session_token: 'atoken'
    })

    const client1 = mqtt.connect('mqtt://a:b@localhost')
    const now = new Date()

    const pCall = authorizePublish('atoken', (body) => {
      const res = body.resource[0]
      const result =
        res.topic === 'hello' &&
        res.clientId === client1.options.clientId &&
        res.payload.some === 'data'

      const date = new Date(res.timestamp)

      return result && now <= date
    }, 200, {})

    const toSend = JSON.stringify({
      some: 'data'
    })

    client1.subscribe('hello', () => {
      client1.publish('hello', toSend)
    })

    client1.on('message', (topic, payload) => {
      expect(topic).to.equal('hello')
      expect(payload.toString()).to.equal(toSend)
      client1.end()
      expect(aCall.isDone()).to.be.true()
      expect(pCall.isDone()).to.be.true()
      done()
    })
  })
})
