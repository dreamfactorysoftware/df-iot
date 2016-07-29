#!/usr/bin/env python

import sys
import time
import grovepi
import paho.mqtt.client as mqtt

button = 3
mqtt_host=sys.argv[1]

grovepi.pinMode(button,"INPUT")
mqttc = mqtt.Client()
mqttc.username_pw_set("rpi-pub", "rpi-pub")
mqttc.connect(mqtt_host, 1883)

while True:
    try:
        button_state=grovepi.digitalRead(button)
        if button_state == 1:
                mqttc.publish("df-iot/button",'{"Button" : "on"}')
        else:
                mqttc.publish("df-iot/button",'{"Button" : "off"}')
        time.sleep(.5)
        print(button_state)
    except IOError:
        print ("Error")