#!/usr/bin/env python3
import json, urllib.request, sys

NPM_URL = "http://127.0.0.1:81/api"

def api(method, path, token=None, data=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(f"{NPM_URL}{path}", data=body, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(req)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"API Error {e.code}: {err}", file=sys.stderr)
        return None

# Login
r = api("POST", "/tokens", data={"identity": "mindreader420123@gmail.com", "secret": "EGcontabo420123"})
token = r["token"]
print(f"Token: {token[:20]}...")

# Delete old broken host 22
print("Deleting host 22...")
api("DELETE", "/nginx/proxy-hosts/22", token=token)

# Create new proxy host with IP addresses
print("Creating new proxy host with IPs...")
r = api("POST", "/nginx/proxy-hosts", token=token, data={
    "domain_names": ["extractiq.polytronx.com"],
    "forward_scheme": "http",
    "forward_host": "172.18.0.15",
    "forward_port": 80,
    "allow_websocket_upgrade": True,
    "block_exploits": True,
    "access_list_id": 0,
    "certificate_id": 21,
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
            "forward_host": "172.18.0.16",
            "forward_port": 4000,
            "advanced_config": ""
        }
    ]
})

if r and "id" in r:
    host_id = r["id"]
    print(f"SUCCESS: Created host ID={host_id}, cert_id={r.get('certificate_id')}")
    print(f"  Forward: {r.get('forward_host')}:{r.get('forward_port')}")
    for loc in r.get("locations", []):
        print(f"  Location {loc['path']} -> {loc['forward_host']}:{loc['forward_port']}")
else:
    print("FAILED to create host")
    sys.exit(1)

print("\nDone!")
