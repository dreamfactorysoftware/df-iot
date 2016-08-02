#!/usr/bin/env python

import sys
import json
import paho.mqtt.client as mqtt
import grovepi

led=4
button="off";
mqtt_host=sys.argv[1]

def on_message(client, userdata, msg):
        button=json.loads(msg.payload)["Button"]
        if button == "on":
                grovepi.digitalWrite(led,1)
        else:
                grovepi.digitalWrite(led,0)
        print(button);

def on_connect(mosq, obj, rc):
    print("rc: "+str(rc))
    mqttc.subscribe("df-iot/button")

def on_subscribe(mosq, obj, mid, granted_qos):
    print("Subscribed: "+str(mid)+" "+str(granted_qos))


grovepi.pinMode(led,"OUTPUT")

mqttc = mqtt.Client()
mqttc.username_pw_set("rpi-sub", "rpi-sub")
mqttc.on_connect = on_connect
mqttc.on_subscribe = on_subscribe
mqttc.on_message = on_message
mqttc.connect(mqtt_host, 1883)
mqttc.loop_forever()
