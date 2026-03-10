#!/bin/bash
set -e

NPM_URL="http://127.0.0.1:81/api"
NPM_EMAIL="mindreader420123@gmail.com"
NPM_PASS="EGcontabo420123"

echo "=== Logging in to NPM ==="
TOKEN=$(curl -s "$NPM_URL/tokens" -X POST \
  -H "Content-Type: application/json" \
  -d "{\"identity\":\"$NPM_EMAIL\",\"secret\":\"$NPM_PASS\"}" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

if [ -z "$TOKEN" ]; then
  echo "Failed to get NPM token"
  exit 1
fi
echo "Token obtained: ${TOKEN:0:20}..."

# Check if extractiq host already exists
echo "=== Checking existing hosts ==="
EXISTING=$(curl -s "$NPM_URL/nginx/proxy-hosts" \
  -H "Authorization: Bearer $TOKEN")

EXTRACTIQ_ID=$(echo "$EXISTING" | python3 -c "
import sys,json
hosts = json.load(sys.stdin)
for h in hosts:
    if 'extractiq.polytronx.com' in h.get('domain_names', []):
        print(h['id'])
        break
" 2>/dev/null)

echo "All hosts:"
echo "$EXISTING" | python3 -c "
import sys,json
hosts = json.load(sys.stdin)
for h in hosts:
    domains = ','.join(h.get('domain_names',[]))
    fwd = f\"{h.get('forward_host','?')}:{h.get('forward_port','?')}\"
    ssl = 'SSL' if h.get('certificate_id') else 'no-SSL'
    print(f'  ID={h[\"id\"]} {domains} -> {fwd} [{ssl}]')
"

# Create or update the proxy host
PROXY_DATA='{
  "domain_names": ["extractiq.polytronx.com"],
  "forward_scheme": "http",
  "forward_host": "127.0.0.1",
  "forward_port": 4101,
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
      "forward_host": "127.0.0.1",
      "forward_port": 4100,
      "advanced_config": ""
    },
    {
      "path": "/app",
      "forward_scheme": "http",
      "forward_host": "127.0.0.1",
      "forward_port": 4101,
      "advanced_config": ""
    }
  ]
}'

if [ -n "$EXTRACTIQ_ID" ]; then
  echo ""
  echo "=== Updating existing proxy host ID=$EXTRACTIQ_ID ==="
  RESULT=$(curl -s "$NPM_URL/nginx/proxy-hosts/$EXTRACTIQ_ID" -X PUT \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$PROXY_DATA")
else
  echo ""
  echo "=== Creating new proxy host ==="
  RESULT=$(curl -s "$NPM_URL/nginx/proxy-hosts" -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$PROXY_DATA")
fi

echo "$RESULT" | python3 -c "
import sys,json
r = json.load(sys.stdin)
if 'id' in r:
    print(f'SUCCESS: Proxy host ID={r[\"id\"]} created/updated')
    print(f'  Domains: {\",\".join(r.get(\"domain_names\",[]))}')
    print(f'  Forward: {r.get(\"forward_host\")}:{r.get(\"forward_port\")}')
else:
    print(f'ERROR: {json.dumps(r, indent=2)}')
"

echo ""
echo "=== Proxy host configured ==="
echo "Next: Configure SSL via NPM UI or API"
