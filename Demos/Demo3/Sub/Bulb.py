#!/usr/bin/env python

import sys
import paho.mqtt.client as mqtt
import json
import grovepi

r_led=4
g_led=3
mqtt_host=sys.argv[1]

def on_message(client, userdata, msg):
        print msg.payload
	led=json.loads(msg.payload)["color"]
	if led == "red":
		grovepi.digitalWrite(r_led,1)
		grovepi.digitalWrite(g_led,0)
	if led == "green":
		grovepi.digitalWrite(r_led,0)
		grovepi.digitalWrite(g_led,1)
	print(led);

def on_connect(mosq, obj, rc):
    print("rc: "+str(rc))
    mqttc.subscribe("df-iot/temp")

def on_subscribe(mosq, obj, mid, granted_qos):
    print("Subscribed: "+str(mid)+" "+str(granted_qos))

grovepi.pinMode(r_led,"OUTPUT")
grovepi.pinMode(g_led,"OUTPUT")

mqttc = mqtt.Client()
mqttc.username_pw_set("rpi-sub", "rpi-sub")
mqttc.on_connect = on_connect
mqttc.on_subscribe = on_subscribe
mqttc.on_message = on_message
mqttc.connect(mqtt_host, 1883)
mqttc.loop_forever()