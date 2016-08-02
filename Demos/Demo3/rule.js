var lodash = require("lodash.min.js");
var options = {
"CURLOPT_HTTPHEADER": ['Content-type: application/json','X-DF-DEVICEID: rpi-pub','X-DF-DEVICETOKEN: rpi-pub']
};
var result;

var led;

if (event.request.payload.resource) {
    
    lodash._.each(event.request.payload.resource, function( record ) {
        if (record.payload.h < 50)
            led='{"color":"green"}';
        else
            led='{"color":"red"}';
            
    result = platform.api.post("http://192.168.0.116:3000/p/df-iot/temp",led, options);        
    });
}