'use strict'

const Lab = require('lab')
const Code = require('code')
const mqtt = require('mqtt')

const lab = exports.lab = Lab.script()
const describe = lab.describe
const it = lab.it
const expect = Code.expect

const start = require('./helper')
const setupAuth = start.setupAuth
const mockIngestion = start.mockIngestion

describe('mqtt integration', () => {
  start(lab)

  it('should support positive auth', (done) => {
    const aCall = setupAuth({
      filter: '(DeviceID=\'a\') AND (Token=\'b\')'
    }, 200, {
      resource: [{
        _id: 'abcde',
        DeviceId: 'a',
        Token: 'b',
        Connect: true,
        Publish: true,
        Subscribe: true
      }]
    })

    const client = mqtt.connect('mqtt://a:b@localhost', {
      clientId: 'a'
    })

    client.on('connect', () => {
      expect(aCall.isDone()).to.be.true()
      client.end()
      done()
    })
  })

  it('should support negative auth via a statusCode', (done) => {
    const aCall = setupAuth({
      filter: '(DeviceID=\'a\') AND (Token=\'b\')'
    }, 400, '')

    const client = mqtt.connect('mqtt://a:b@localhost')

    client.on('error', () => {
      expect(aCall.isDone()).to.be.true()
      client.end()
      done()
    })
  })

  it('should support negative auth via Connect=false', (done) => {
    const aCall = setupAuth({
      filter: '(DeviceID=\'a\') AND (Token=\'b\')'
    }, 200, {
      resource: [{
        _id: 'abcde',
        DeviceId: 'a',
        Token: 'b',
        Connect: false,
        Publish: true,
        Subscribe: true
      }]
    })

    const client = mqtt.connect('mqtt://a:b@localhost')

    client.on('error', () => {
      expect(aCall.isDone()).to.be.true()
      client.end()
      done()
    })
  })

  it('should support negative auth via missing resource', (done) => {
    const aCall = setupAuth({
      filter: '(DeviceID=\'a\') AND (Token=\'b\')'
    }, 200, {
      resource: []
    })

    const client = mqtt.connect('mqtt://a:b@localhost')

    client.on('error', () => {
      expect(aCall.isDone()).to.be.true()
      client.end()
      done()
    })
  })

  it('should support basic mqtt', { plan: 6 }, (done) => {
    // first call done for auth
    const aCall = setupAuth({
      filter: '(DeviceID=\'a\') AND (Token=\'b\')'
    }, 200, {
      resource: [{
        _id: 'abcde',
        DeviceId: 'a',
        Token: 'b',
        Connect: true,
        Publish: true,
        Subscribe: true
      }]
    })

    // second call done for authorizing the SUBSCRIBE
    const bCall = setupAuth({
      filter: '(DeviceID=\'a\') AND (Token=\'b\')'
    }, 200, {
      resource: [{
        _id: 'abcde',
        DeviceId: 'a',
        Token: 'b',
        Connect: true,
        Publish: true,
        Subscribe: true
      }]
    })

    // second call done for authorizing the PUBLISH
    const cCall = setupAuth({
      filter: '(DeviceID=\'a\') AND (Token=\'b\')'
    }, 200, {
      resource: [{
        _id: 'abcde',
        DeviceId: 'a',
        Token: 'b',
        Connect: true,
        Publish: true,
        Subscribe: true
      }]
    })

    const client1 = mqtt.connect('mqtt://a:b@localhost')
    const now = new Date()

    const pCall = mockIngestion((body) => {
      const res = body.resource[0]
      const result =
        res.topic === 'hello' &&
        res.clientId === 'a' &&
        res.payload.some === 'data'

      const date = new Date(res.timestamp)

      return result && now <= date
    }, 200, {})

    const toSend = JSON.stringify({
      some: 'data'
    })

    client1.subscribe('hello', () => {
      client1.publish('hello', toSend, { qos: 1 }, () => {
        expect(pCall.isDone()).to.be.true()
        done()
      })
    })

    client1.on('message', (topic, payload) => {
      expect(topic).to.equal('hello')
      expect(payload.toString()).to.equal(toSend)
      client1.end()
      expect(aCall.isDone()).to.be.true()
      expect(bCall.isDone()).to.be.true()
      expect(cCall.isDone()).to.be.true()
    })
  })
})
