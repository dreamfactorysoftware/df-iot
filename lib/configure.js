'use strict'

const prompt = require('prompt')
const request = require('request')
const validUrl = require('valid-url')
const isEmail = require('email-validator').validate

function configure (args) {
  prompt.start()
  prompt.delimiter = ''
  prompt.message = ''

  prompt.get({
    properties: {
      baseUrl: {
        description: 'What is DreamFactory base URL?',
        required: true,
        message: 'Invalid URL',
        conform: validUrl.isWebUri
      },
      apiKey: {
        description: 'What is the API key?',
        required: true,
        message: 'Missing API key'
      },
      email: {
        description: 'What is the email of your DreamFactory account?',
        required: true,
        message: 'Invalid email',
        conform: isEmail
      },
      password: {
        description: 'What is the password of your DreamFactory account?',
        required: true,
        message: 'Missing password',
        hidden: true
      }
    }
  }, function (err, results) {
    if (err) {
      console.log()
      console.log('Canceled')
      // nothing to do
      return
    }

    request({
      method: 'POST',
      baseUrl: results.baseUrl,
      url: '/api/v2/system/admin/session',
      json: true,
      body: {
        email: results.email,
        password: results.password,
        duration: 0
      },
      headers: {
        'X-DreamFactory-Api-Key': results.apiKey
      }
    }, (err, res, body) => {
      if (err) {
        console.log(err.message)
        return
      }
      if (err || res.statusCode !== 200) {
        let msg = body && body.error && body.error.message || 'Unable to generate, check your credentials'
        console.log(msg)
      } else {
        let config = {
          dreamFactory: results.baseUrl,
          apiKey: results.apiKey,
          sessionToken: body.sessionToken,
          logger: {
            level: 'info'
          }
        }
        let data = JSON.stringify(config, null, 2)
        console.log(data)
      }
    })
  })
}

module.exports = configure
