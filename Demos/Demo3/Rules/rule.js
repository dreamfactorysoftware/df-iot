var lodash = require("lodash.min.js");
var options = {
"CURLOPT_HTTPHEADER": ['Content-type: application/json','X-DF-DEVICEID: rpi-pub','X-DF-DEVICETOKEN: rpi-pub', 'X-DF-RETAIN: false', 'X-DF-QOS: 0' ]
};
var result;

var led='{"color":"green"}';

if (event.request.payload.resource) {
        
    lodash._.each(event.request.payload.resource, function( record ) {
        var_dump(record);

        if (parseFloat(record.payload.h) < 48.0)
            led='{"color":"green"}';
        else
            led='{"color":"red"}';
            
    });
result = platform.api.post("http://DreamFactory_IP:3000/p/df-iot/temp",led, options);            
}
