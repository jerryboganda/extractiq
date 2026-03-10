#!/bin/bash
set -e

NPM_URL="http://127.0.0.1:81/api"
NPM_EMAIL="mindreader420123@gmail.com"
NPM_PASS="EGcontabo420123"

# Login
TOKEN=$(curl -s "$NPM_URL/tokens" -X POST \
  -H "Content-Type: application/json" \
  -d "{\"identity\":\"$NPM_EMAIL\",\"secret\":\"$NPM_PASS\"}" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

echo "Token: ${TOKEN:0:20}..."

# Request Let's Encrypt SSL certificate
echo "=== Requesting SSL certificate ==="
SSL_RESULT=$(curl -s "$NPM_URL/nginx/certificates" -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domain_names": ["extractiq.polytronx.com"],
    "meta": {
      "letsencrypt_email": "jerryboganda@gmail.com",
      "letsencrypt_agree": true,
      "dns_challenge": false
    },
    "provider": "letsencrypt"
  }')

CERT_ID=$(echo "$SSL_RESULT" | python3 -c "
import sys,json
r = json.load(sys.stdin)
if 'id' in r:
    print(r['id'])
else:
    print('ERROR')
    print(json.dumps(r, indent=2))
" 2>/dev/null)

echo "Certificate ID: $CERT_ID"

if [ "$CERT_ID" = "ERROR" ]; then
  echo "SSL certificate request failed. Cloudflare may be proxying (orange cloud)."
  echo "Try setting Cloudflare to DNS-only (grey cloud) temporarily, or use Cloudflare Origin Certificate."
  echo ""
  echo "Alternatively, since Cloudflare provides SSL termination,"
  echo "the current setup (HTTP behind Cloudflare) works fine with Cloudflare SSL mode 'Flexible'."
  echo ""
  echo "For now, the proxy host works. Let's test it."
  exit 0
fi

# Update proxy host with SSL
echo "=== Updating proxy host with SSL ==="
UPDATE_RESULT=$(curl -s "$NPM_URL/nginx/proxy-hosts/22" -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"domain_names\": [\"extractiq.polytronx.com\"],
    \"forward_scheme\": \"http\",
    \"forward_host\": \"127.0.0.1\",
    \"forward_port\": 4101,
    \"allow_websocket_upgrade\": true,
    \"block_exploits\": true,
    \"access_list_id\": 0,
    \"certificate_id\": $CERT_ID,
    \"ssl_forced\": true,
    \"http2_support\": true,
    \"hsts_enabled\": true,
    \"hsts_subdomains\": false,
    \"meta\": {\"letsencrypt_agree\": true, \"dns_challenge\": false},
    \"advanced_config\": \"\",
    \"locations\": [
      {
        \"path\": \"/api\",
        \"forward_scheme\": \"http\",
        \"forward_host\": \"127.0.0.1\",
        \"forward_port\": 4100,
        \"advanced_config\": \"\"
      },
      {
        \"path\": \"/app\",
        \"forward_scheme\": \"http\",
        \"forward_host\": \"127.0.0.1\",
        \"forward_port\": 4101,
        \"advanced_config\": \"\"
      }
    ]
  }")

echo "$UPDATE_RESULT" | python3 -c "
import sys,json
r = json.load(sys.stdin)
if 'id' in r:
    print(f'SUCCESS: SSL configured, cert_id={r.get(\"certificate_id\")}')
else:
    print(f'ERROR: {json.dumps(r, indent=2)}')
"

echo "=== SSL Setup Complete ==="
