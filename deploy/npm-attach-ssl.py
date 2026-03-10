#!/usr/bin/env python3
import json, urllib.request

npm_url = "http://127.0.0.1:81/api"

# Login
login_data = json.dumps({"identity": "mindreader420123@gmail.com", "secret": "EGcontabo420123"}).encode()
req = urllib.request.Request(f"{npm_url}/tokens", data=login_data, headers={"Content-Type": "application/json"})
resp = urllib.request.urlopen(req)
token = json.loads(resp.read())["token"]

# Update proxy host 22 with cert_id 21
update_data = json.dumps({
    "domain_names": ["extractiq.polytronx.com"],
    "forward_scheme": "http",
    "forward_host": "extractiq-frontend",
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
            "forward_host": "extractiq-api",
            "forward_port": 4000,
            "advanced_config": ""
        }
    ]
}).encode()

req = urllib.request.Request(
    f"{npm_url}/nginx/proxy-hosts/22",
    data=update_data,
    headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
    method="PUT"
)
try:
    resp = urllib.request.urlopen(req)
    r = json.loads(resp.read())
    print(f"SUCCESS: cert_id={r.get('certificate_id')}, forward={r.get('forward_host')}:{r.get('forward_port')}")
except urllib.error.HTTPError as e:
    print(f"Error: {e.code} {e.read().decode()}")
