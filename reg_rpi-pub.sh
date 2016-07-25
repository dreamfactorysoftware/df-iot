token=$(curl  -X POST "http://localhost/api/v2/system/admin/session" -d '{ "email" : "user@example.com", "password" : "bitnami", "remember_me": true }' -H "Content-Type: application/json" | jq '{session_token}' | jq '.session_token' | tr -d '"')


curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'X-DreamFactory-Api-Key: 36fda24fe5588fa4285ac6c6c2fdfbdb6b6bc9834699774c9bf777f706d05a88' --header "X-DreamFactory-Session-Token: $token" --header 'Authorization: Basic dXNlckBleGFtcGxlLmNvbTpiaXRuYW1p' -d '{
  "resource": [
{ "DeviceID": "rpi-pub", "DeviceType": "Sensor", "UserID": "user", "Connected": false, "Timestamp": "", "Token": "rpi-pub", "Connect": true, "Publish": true, "Subscribe": false, "LWTTopic": "", "AdditionalMedata": "" } 
 ]  
}' 'http://localhost/api/v2/devices/_table/devices'
