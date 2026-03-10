#!/bin/bash
set -e

NPM_URL="http://127.0.0.1:81/api"

# Login
TOKEN=$(curl -s "$NPM_URL/tokens" -X POST \
  -H "Content-Type: application/json" \
  -d '{"identity":"mindreader420123@gmail.com","secret":"EGcontabo420123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

echo "Token: ${TOKEN:0:20}..."

# Update proxy host 22 to use container names
echo "=== Updating proxy host to use Docker container names ==="
RESULT=$(curl -s "$NPM_URL/nginx/proxy-hosts/22" -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domain_names": ["extractiq.polytronx.com"],
    "forward_scheme": "http",
    "forward_host": "extractiq-frontend",
    "forward_port": 80,
    "allow_websocket_upgrade": true,
    "block_exploits": true,
    "access_list_id": 0,
    "certificate_id": 0,
    "ssl_forced": false,
    "http2_support": false,
    "hsts_enabled": false,
    "hsts_subdomains": false,
    "meta": {"letsencrypt_agree": false, "dns_challenge": false},
    "advanced_config": "",
    "locations": [
      {
        "path": "/api",
        "forward_scheme": "http",
        "forward_host": "extractiq-api",
        "forward_port": 4000,
        "advanced_config": ""
      }
    ]
  }')

echo "$RESULT" | python3 -c "
import sys,json
r = json.load(sys.stdin)
if 'id' in r:
    print(f'SUCCESS: Updated proxy host ID={r[\"id\"]}')
    print(f'  Forward: {r.get(\"forward_host\")}:{r.get(\"forward_port\")}')
    locs = r.get('locations', [])
    for loc in locs:
        print(f'  Location {loc[\"path\"]} -> {loc[\"forward_host\"]}:{loc[\"forward_port\"]}')
else:
    print(f'ERROR: {json.dumps(r, indent=2)}')
"
