# df-iot

Requirements:

* an instance of Redis running on localhost

To setup:

```
git clone git@github.com:dreamfactorysoftware/df-iot.git
cd df-iot
npm install
npm install mqtt -g
```

The sessionToken inside `config.json` is created with:

```
curl -i -k -3 -X POST "http://localhost:8080/api/v2/system/admin/session" -d '{ "email" : "user@example.com", "password" : "pass123" }' -H "Content-Type: application/json"
```

To launch:

```
node index.js --config config.json
```

To test, one one shell:

```
mqtt sub -u Fan1 -P Fan1 -v -t '#'
```

On another shell:

```
mqtt pub -u TempSensor1 -P TempSensor1 -v -t 'hello' -m '{ "hello": "world" }'
```

You can also use an HTTP endpoint to publish:

```
curl -v -X POST -H 'content-type: application/json' -d '{ "some": "data" }'  http://TempSensor1:TempSensor1@localhost:3000/p/hello
```

You can also set the `X-DF-RETAIN` header to `true` to set the message
as retained. The `X-DF-QOS` value can be used to set the MQTT QoS level
(0 or 1 are supported).
