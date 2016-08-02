cd /opt/bitnami/apps/dreamfactory/df-iot/config
token=$(curl  -X POST "http://localhost/api/v2/system/admin/session" -d '{ "email" : "user@example.com", "password" : "bitnami", "remember_me": true }' -H "Content-Type: application/json" | jq '{session_token}' | jq '.session_token' | tr -d '"')
sudo cp config.json.template config.json
sudo sed -i "s/DreamFactory_URL/localhost/" config.json
sudo sed -i "s/DreamFactory_TOKEN/$token/" config.json
sudo cp config.json ..
token=
cd /opt/bitnami/apps/dreamfactory/df-iot && node index.js --config config.json
