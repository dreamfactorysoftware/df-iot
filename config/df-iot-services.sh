token=$(curl  -X POST "http://localhost/api/v2/system/admin/session" -d '{ "email" : "user@example.com", "password" : "bitnami", "remember_me": true }' -H "Content-Type: application/json" | jq '{session_token}' | jq '.session_token' | tr -d '"')

curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'X-DreamFactory-Api-Key: 36fda24fe5588fa4285ac6c6c2fdfbdb6b6bc9834699774c9bf777f706d05a88' --header "X-DreamFactory-Session-Token: $token" --header 'Authorization: Basic dXNlckBleGFtcGxlLmNvbTpiaXRuYW1p' -d '{
  "resource": [
{
      "name": "devices",
      "label": "Device Registry",
      "description": "DreamFactory IoT Device Gateway",
      "is_active": true,
      "type": "mongodb",
      "mutable": true,
      "deletable": true,
      "created_by_id": 1,
      "last_modified_by_id": 1,
      "config": {
        "service_id": 9,
        "dsn": "mongodb://localhost/df-iot",
        "options": null,
        "driver_options": null,
        "cache_enabled": false,
        "cache_ttl": 0
      }
    }  ],
  "ids": [
    0
  ]
}' 'http://localhost/api/v2/system/service'

curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'X-DreamFactory-Api-Key: 36fda24fe5588fa4285ac6c6c2fdfbdb6b6bc9834699774c9bf777f706d05a88' --header "X-DreamFactory-Session-Token: $token" --header 'Authorization: Basic dXNlckBleGFtcGxlLmNvbTpiaXRuYW1p' -d '{
  "resource": [
{
      "name": "telemetry",
      "label": "Telemetry Service",
      "description": "DreamFactory IoT Telemetry Service",
      "is_active": true,
      "type": "mongodb",
      "mutable": true,
      "deletable": true,
      "created_by_id": 1,
      "last_modified_by_id": 1,
      "config": {
        "service_id": 9,
        "dsn": "mongodb://localhost/df-iot",
        "options": null,
        "driver_options": null,
        "cache_enabled": false,
        "cache_ttl": 0
      }
    }  ],
  "ids": [
    0
  ]
}' 'http://localhost/api/v2/system/service'

curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'X-DreamFactory-Api-Key: 36fda24fe5588fa4285ac6c6c2fdfbdb6b6bc9834699774c9bf777f706d05a88' --header "X-DreamFactory-Session-Token: $token" --header 'Authorization: Basic dXNlckBleGFtcGxlLmNvbTpiaXRuYW1p' -d '{
  "resource": [
{
      "name": "messages",
      "label": "Messages",
      "description": "DreamFactory IoT Message Service",
      "is_active": true,
      "type": "mongodb",
      "mutable": true,
      "deletable": true,
      "created_by_id": 1,
      "last_modified_by_id": 1,
      "config": {
        "service_id": 9,
        "dsn": "mongodb://localhost/df-iot",
        "options": null,
        "driver_options": null,
        "cache_enabled": false,
        "cache_ttl": 0
      }
    }  ],
  "ids": [
    0
  ]
}' 'http://localhost/api/v2/system/service'
