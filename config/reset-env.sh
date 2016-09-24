token=$(curl  -X POST "http://localhost/api/v2/system/admin/session" -d '{ "email" : "user@example.com", "password" : "bitnami", "remember_me": true }' -H "Content-Type: application/json" | jq '{session_token}' | jq '.session_token' | tr -d '"')

# Delete MongoDB Collections
sudo mongo < /opt/bitnami/apps/dreamfactory/df-iot/config/df-iot-mongo-reset.js
sudo cp /opt/bitnami/mongodb/mongodb.conf.bak /opt/bitnami/mongodb/mongodb.conf
sudo /opt/bitnami/mongodb/scripts/ctl.sh stop
sudo /opt/bitnami/mongodb/scripts/ctl.sh start

# Delete Freeboard
sudo rm -rf /opt/bitnami/apps/freeboard/
sudo cp /opt/bitnami/apache2/conf/bitnami/bitnami-apps-prefix.bak /opt/bitnami/apache2/conf/bitnami/bitnami-apps-prefix.conf
sudo sh /opt/bitnami/ctlscript.sh restart apache
sudo rm -rf /opt/bitnami/apps/dreamfactory/htdocs/storage/app/Freeboard

# Delete DreamFactory IoT Services
devices_svc_id=$(curl -X GET --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'X-DreamFactory-Api-Key: 36fda24fe5588fa4285ac6c6c2fdfbdb6b6bc9834699774c9bf777f706d05a88' --header "X-DreamFactory-Session-Token: $token" --header 'Authorization: Basic dXNlckBleGFtcGxlLmNvbTpiaXRuYW1p' 'http://localhost/api/v2/system/service' | jq '.resource[] | select(.name=="devices")'| jq .id)
messages_svc_id=$(curl -X GET --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'X-DreamFactory-Api-Key: 36fda24fe5588fa4285ac6c6c2fdfbdb6b6bc9834699774c9bf777f706d05a88' --header "X-DreamFactory-Session-Token: $token" --header 'Authorization: Basic dXNlckBleGFtcGxlLmNvbTpiaXRuYW1p' 'http://localhost/api/v2/system/service' | jq '.resource[] | select(.name=="messages")'| jq .id)
telemetry_svc_id=$(curl -X GET --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'X-DreamFactory-Api-Key: 36fda24fe5588fa4285ac6c6c2fdfbdb6b6bc9834699774c9bf777f706d05a88' --header "X-DreamFactory-Session-Token: $token" --header 'Authorization: Basic dXNlckBleGFtcGxlLmNvbTpiaXRuYW1p' 'http://localhost/api/v2/system/service' | jq '.resource[] | select(.name=="telemetry")'| jq .id)
curl -X DELETE --header 'Accept: application/json' --header 'X-DreamFactory-Api-Key: 36fda24fe5588fa4285ac6c6c2fdfbdb6b6bc9834699774c9bf777f706d05a88' --header "X-DreamFactory-Session-Token: $token" "http://localhost/api/v2/system/service?force=false&ids=$devices_svc_id"
curl -X DELETE --header 'Accept: application/json' --header 'X-DreamFactory-Api-Key: 36fda24fe5588fa4285ac6c6c2fdfbdb6b6bc9834699774c9bf777f706d05a88' --header "X-DreamFactory-Session-Token: $token" "http://localhost/api/v2/system/service?force=false&ids=$messages_svc_id"
curl -X DELETE --header 'Accept: application/json' --header 'X-DreamFactory-Api-Key: 36fda24fe5588fa4285ac6c6c2fdfbdb6b6bc9834699774c9bf777f706d05a88' --header "X-DreamFactory-Session-Token: $token" "http://localhost/api/v2/system/service?force=false&ids=$telemetry_svc_id"

