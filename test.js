'use strict'

const Lab = require('lab')
const Code = require('code')
const redis = require('redis')
const mqtt = require('mqtt')

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
      server = start({}, done)
    })
  })

  afterEach((done) => {
    server.close(done)
    server = null
  })

  after((done) => {
    redisClient.quit(done)
  })

  it('should support basic mqtt', (done) => {
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
      done()
    })
  })
})
