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
  let scope

  beforeEach((done) => {
    scope = nock('http://dream.factory', {
      reqheaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-DreamFactory-Api-Key': 'abcde'
      }
    })

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
    const result = scope.post('/v2/user/session', body)
    return result.reply(code, JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json'
      }
    })
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

    const bCall = setupAuth({
      email: 'c',
      password: 'd',
      duration: 0
    }, 200, {
      session_token: 'btoken'
    })

    const client1 = mqtt.connect('mqtt://a:b@localhost')
    const client2 = mqtt.connect('mqtt://c:d@localhost')

    client1.subscribe('hello', () => {
      client2.publish('hello', 'world')
    })

    client1.on('message', (topic, payload) => {
      expect(topic).to.equal('hello')
      expect(payload.toString()).to.equal('world')
      client1.end()
      client2.end()
      expect(aCall.isDone()).to.be.true()
      expect(bCall.isDone()).to.be.true()
      done()
    })
  })
})
