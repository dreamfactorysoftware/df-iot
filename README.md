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
curl -v -X POST -H 'content-type: application/json' -d '{ "topic": "aaa", "payload": { "some": "data" } }'  http://TempSensor1:TempSensor1@localhost:3000/publish
```
