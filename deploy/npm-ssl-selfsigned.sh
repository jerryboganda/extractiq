#!/bin/bash
set -e

NPM_URL="http://127.0.0.1:81/api"

# Login
TOKEN=$(curl -s "$NPM_URL/tokens" -X POST \
  -H "Content-Type: application/json" \
  -d '{"identity":"mindreader420123@gmail.com","secret":"EGcontabo420123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

echo "Token: ${TOKEN:0:20}..."

# Generate self-signed certificate
echo "=== Generating self-signed certificate ==="
mkdir -p /tmp/extractiq-ssl
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /tmp/extractiq-ssl/key.pem \
  -out /tmp/extractiq-ssl/cert.pem \
  -subj "/CN=extractiq.polytronx.com" \
  -addext "subjectAltName=DNS:extractiq.polytronx.com" 2>/dev/null

echo "Certificate generated"

# Read cert and key
CERT=$(cat /tmp/extractiq-ssl/cert.pem)
KEY=$(cat /tmp/extractiq-ssl/key.pem)

# Create custom certificate in NPM
echo "=== Uploading certificate to NPM ==="
# Use python to build and send the request to avoid JSON escaping issues
CERT_ID=$(python3 << 'PYEOF'
import json, urllib.request, ssl

npm_url = "http://127.0.0.1:81/api"
with open("/tmp/extractiq-ssl/cert.pem") as f:
    cert = f.read()
with open("/tmp/extractiq-ssl/key.pem") as f:
    key = f.read()

# Get token
login_data = json.dumps({"identity": "mindreader420123@gmail.com", "secret": "EGcontabo420123"}).encode()
req = urllib.request.Request(f"{npm_url}/tokens", data=login_data, headers={"Content-Type": "application/json"})
resp = urllib.request.urlopen(req)
token = json.loads(resp.read())["token"]

# Upload custom certificate
cert_data = json.dumps({
    "nice_name": "ExtractIQ Self-Signed",
    "domain_names": ["extractiq.polytronx.com"],
    "certificate": cert,
    "certificate_key": key,
    "provider": "other"
}).encode()

req = urllib.request.Request(
    f"{npm_url}/nginx/certificates",
    data=cert_data,
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
)
resp = urllib.request.urlopen(req)
result = json.loads(resp.read())
print(result["id"])
PYEOF
)

echo "Certificate ID: $CERT_ID"

if [ -z "$CERT_ID" ] || [ "$CERT_ID" = "" ]; then
  echo "Failed to create certificate"
  exit 1
fi

# Update proxy host with SSL certificate
echo "=== Updating proxy host with SSL ==="
python3 << PYEOF
import json, urllib.request

npm_url = "http://127.0.0.1:81/api"

# Get token
login_data = json.dumps({"identity": "mindreader420123@gmail.com", "secret": "EGcontabo420123"}).encode()
req = urllib.request.Request(f"{npm_url}/tokens", data=login_data, headers={"Content-Type": "application/json"})
resp = urllib.request.urlopen(req)
token = json.loads(resp.read())["token"]

# Update host 22
update_data = json.dumps({
    "domain_names": ["extractiq.polytronx.com"],
    "forward_scheme": "http",
    "forward_host": "extractiq-frontend",
    "forward_port": 80,
    "allow_websocket_upgrade": True,
    "block_exploits": True,
    "access_list_id": 0,
    "certificate_id": $CERT_ID,
    "ssl_forced": False,
    "http2_support": True,
    "hsts_enabled": False,
    "hsts_subdomains": False,
    "meta": {"letsencrypt_agree": False, "dns_challenge": False},
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
}).encode()

req = urllib.request.Request(
    f"{npm_url}/nginx/proxy-hosts/22",
    data=update_data,
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    },
    method="PUT"
)
resp = urllib.request.urlopen(req)
result = json.loads(resp.read())
print(f"SUCCESS: Proxy host updated, cert_id={result.get('certificate_id')}")
PYEOF

echo ""
echo "=== SSL Setup Complete ==="
# Cleanup
rm -rf /tmp/extractiq-ssl
