#!/usr/bin/env python

import sys
import time
import grovepi
import json
import paho.mqtt.client as mqtt

dht_sensor_port = 7
mqtt_host=sys.argv[1]

mqttc = mqtt.Client()
mqttc.username_pw_set("rpi-pub", "rpi-pub")
mqttc.connect(mqtt_host, 1883)

while True:
    try:
        [ t,h ]=grovepi.dht(dht_sensor_port,0)
        mqttc.publish("df-iot/env",json.dumps({'t':t,'h':h}))
        time.sleep(.5)
        print(str(t) + "\t" + str(h));
    except IOError:
        print ("Error")