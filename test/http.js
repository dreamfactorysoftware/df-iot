'use strict'

const Lab = require('lab')
const Code = require('code')
const mqtt = require('mqtt')
const request = require('request')

const lab = exports.lab = Lab.script()
const describe = lab.describe
const it = lab.it
const expect = Code.expect

const start = require('./helper')
const setupAuth = start.setupAuth
const mockIngestion = start.mockIngestion

describe('http integration', () => {
  start(lab)

  it('should support basic mqtt', (done) => {
    // first call done for auth of client "a"
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

    // second call done for authorizing the SUBSCRIBE of client "a"
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

    const client = mqtt.connect('mqtt://a:b@localhost', {
      clientId: 'a'
    })

    client.subscribe('hello', (err, results) => {
      if (err) {
        return done(err)
      }
      // third call done for authorizing the PUBLISH from client "b" over HTTP
      const cCall = setupAuth({
        filter: '(DeviceID=\'c\') AND (Token=\'d\')'
      }, 200, {
        resource: [{
          DeviceId: 'c',
          Token: 'd',
          Connect: true,
          Publish: true,
          Subscribe: true
        }]
      })

      const pCall = mockIngestion((body) => {
        const res = body.resource[0]
        const result =
          res.topic === 'hello' &&
          res.clientId === 'c' &&
          res.payload.some === 'data'

        const date = new Date(res.timestamp)
        const now = new Date()

        return result && now >= date
      }, 200, {})

      const toSend = {
        some: 'data'
      }

      request({
        method: 'POST',
        baseUrl: 'http://localhost:3000',
        url: '/publish',
        json: true,
        auth: {
          username: 'c',
          password: 'd'
        },
        body: {
          topic: 'hello',
          payload: toSend
        }
      }, (err, res, body) => {
        if (err) {
          return done(err)
        }
        expect(res.statusCode).to.equal(200)
      })

      client.on('message', (topic, payload) => {
        expect(topic).to.equal('hello')
        expect(JSON.parse(payload)).to.deep.equal(toSend)
        client.end()
        expect(aCall.isDone()).to.be.true()
        expect(bCall.isDone()).to.be.true()
        expect(cCall.isDone()).to.be.true()
        setImmediate(() => {
          expect(pCall.isDone()).to.be.true()
          done()
        })
      })
    })
  })

  it('should require a payload', (done) => {
    const cCall = setupAuth({
      filter: '(DeviceID=\'c\') AND (Token=\'d\')'
    }, 200, {
      resource: [{
        DeviceId: 'c',
        Token: 'd',
        Connect: true,
        Publish: true,
        Subscribe: true
      }]
    })
    request({
      method: 'POST',
      baseUrl: 'http://localhost:3000',
      url: '/publish',
      json: true,
      auth: {
        username: 'c',
        password: 'd'
      },
      body: {
        topic: 'hello'
      }
    }, (err, res, body) => {
      if (err) {
        return done(err)
      }
      expect(res.statusCode).to.equal(400)
      expect(cCall.isDone()).to.be.true()
      done()
    })
  })

  it('should require a topic', (done) => {
    const cCall = setupAuth({
      filter: '(DeviceID=\'c\') AND (Token=\'d\')'
    }, 200, {
      resource: [{
        DeviceId: 'c',
        Token: 'd',
        Connect: true,
        Publish: true,
        Subscribe: true
      }]
    })
    request({
      method: 'POST',
      baseUrl: 'http://localhost:3000',
      url: '/publish',
      json: true,
      auth: {
        username: 'c',
        password: 'd'
      },
      body: {
        payload: { hello: 'world' }
      }
    }, (err, res, body) => {
      if (err) {
        return done(err)
      }
      expect(res.statusCode).to.equal(400)
      expect(cCall.isDone()).to.be.true()
      done()
    })
  })

  it('should fail auth on bad status code in DF', (done) => {
    const aCall = setupAuth({
      filter: '(DeviceID=\'a\') AND (Token=\'b\')'
    }, 400, '')

    request({
      method: 'POST',
      baseUrl: 'http://localhost:3000',
      url: '/publish',
      json: true,
      auth: {
        username: 'a',
        password: 'b'
      },
      body: {
        topic: 'hello',
        payload: { a: 'thing' }
      }
    }, (err, res, body) => {
      if (err) {
        return done(err)
      }
      expect(res.statusCode).to.equal(401)
      expect(aCall.isDone()).to.be.true()
      done()
    })
  })

  it('should fail auth on missing resource', (done) => {
    const aCall = setupAuth({
      filter: '(DeviceID=\'a\') AND (Token=\'b\')'
    }, 200, {
      resource: []
    })

    request({
      method: 'POST',
      baseUrl: 'http://localhost:3000',
      url: '/publish',
      json: true,
      auth: {
        username: 'a',
        password: 'b'
      },
      body: {
        topic: 'hello',
        payload: { a: 'thing' }
      }
    }, (err, res, body) => {
      if (err) {
        return done(err)
      }
      expect(res.statusCode).to.equal(401)
      expect(aCall.isDone()).to.be.true()
      done()
    })
  })

  it('should fail auth on disallowed publish', (done) => {
    const aCall = setupAuth({
      filter: '(DeviceID=\'a\') AND (Token=\'b\')'
    }, 200, {
      resource: [{
        _id: 'abcde',
        DeviceId: 'a',
        Token: 'b',
        Connect: true,
        Publish: false,
        Subscribe: true
      }]
    })

    request({
      method: 'POST',
      baseUrl: 'http://localhost:3000',
      url: '/publish',
      json: true,
      auth: {
        username: 'a',
        password: 'b'
      },
      body: {
        topic: 'hello',
        payload: { a: 'thing' }
      }
    }, (err, res, body) => {
      if (err) {
        return done(err)
      }
      expect(res.statusCode).to.equal(401)
      expect(aCall.isDone()).to.be.true()
      done()
    })
  })
})
