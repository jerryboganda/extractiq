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

# Delete hosts 22 and 23
print("Cleaning up broken hosts...")
api("DELETE", "/nginx/proxy-hosts/22", token=token)
api("DELETE", "/nginx/proxy-hosts/23", token=token)

# Create minimal proxy host - NO SSL, NO locations, just basic forward
print("Creating minimal proxy host (no SSL, no locations)...")
r = api("POST", "/nginx/proxy-hosts", token=token, data={
    "domain_names": ["extractiq.polytronx.com"],
    "forward_scheme": "http",
    "forward_host": "172.18.0.15",
    "forward_port": 80,
    "allow_websocket_upgrade": False,
    "block_exploits": False,
    "access_list_id": 0,
    "certificate_id": 0,
    "ssl_forced": False,
    "http2_support": False,
    "hsts_enabled": False,
    "hsts_subdomains": False,
    "meta": {"letsencrypt_agree": False, "dns_challenge": False},
    "advanced_config": "",
    "locations": []
})

if r and "id" in r:
    host_id = r["id"]
    print(f"Created host ID={host_id}")
    
    # Check if config was generated
    import subprocess, time
    time.sleep(2)
    result = subprocess.run(["docker", "exec", "nginx-proxy-manager-app-1", "ls", "-la", f"/data/nginx/proxy_host/{host_id}.conf"], capture_output=True, text=True)
    if result.returncode == 0:
        print(f"Config file EXISTS: {result.stdout.strip()}")
        # Show the config
        result2 = subprocess.run(["docker", "exec", "nginx-proxy-manager-app-1", "cat", f"/data/nginx/proxy_host/{host_id}.conf"], capture_output=True, text=True)
        print(f"Config:\n{result2.stdout[:500]}")
    else:
        print(f"Config NOT generated: {result.stderr.strip()}")
        # Check NPM logs for errors
        result3 = subprocess.run(["docker", "logs", "nginx-proxy-manager-app-1", "--tail", "5"], capture_output=True, text=True)
        print(f"NPM logs:\n{result3.stdout}{result3.stderr}")
else:
    print("FAILED")
