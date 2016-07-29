#!/usr/bin/env python

import paho.mqtt.client as mqtt
import json
import grovepi

led=4
button="off";

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
mqttc.username_pw_set("Fan1", "Fan1")
mqttc.on_connect = on_connect
mqttc.on_subscribe = on_subscribe
mqttc.on_message = on_message
mqttc.connect("192.168.0.113", 1883)
mqttc.loop_forever()
    