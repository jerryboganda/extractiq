#!/usr/bin/env python3
import json, urllib.request, subprocess, sys

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
print("Logging in...")
r = api("POST", "/tokens", data={"identity": "mindreader420123@gmail.com", "secret": "EGcontabo420123"})
token = r["token"]
print(f"Token: {token[:20]}...")

# List existing certs
print("\n=== Existing certificates ===")
certs = api("GET", "/nginx/certificates", token=token)
for c in certs:
    dn = c.get("domain_names", [])
    print(f"  id={c['id']} provider={c.get('provider')} nice_name={c.get('nice_name')} domains={dn}")

# Generate self-signed cert
print("\n=== Generating self-signed certificate ===")
subprocess.run([
    "openssl", "req", "-x509", "-nodes", "-days", "3650",
    "-newkey", "rsa:2048",
    "-keyout", "/tmp/ek.pem", "-out", "/tmp/ec.pem",
    "-subj", "/CN=extractiq.polytronx.com",
    "-addext", "subjectAltName=DNS:extractiq.polytronx.com"
], capture_output=True, check=True)

with open("/tmp/ec.pem") as f:
    cert = f.read()
with open("/tmp/ek.pem") as f:
    key = f.read()

# Try different API formats for custom cert
formats = [
    {"nice_name": "ExtractIQ", "certificate": cert, "certificate_key": key, "provider": "other"},
    {"nice_name": "ExtractIQ", "certificate": cert, "certificate_key": key},
    {"certificate": cert, "certificate_key": key, "provider": "other"},
    {"certificate": cert, "certificate_key": key},
]

cert_id = None
for i, fmt in enumerate(formats):
    print(f"\nTrying format {i+1}: keys={list(fmt.keys())}")
    r = api("POST", "/nginx/certificates", token=token, data=fmt)
    if r and "id" in r:
        cert_id = r["id"]
        print(f"SUCCESS! Certificate ID: {cert_id}")
        break
    print("Failed.")

if not cert_id:
    # Try uploading via file-based approach - check NPM data directory
    print("\n=== API upload failed. Trying direct file approach ===")
    # Copy cert files directly to NPM's cert directory
    import os
    npm_data = "/root/nginx-proxy-manager/data" if os.path.exists("/root/nginx-proxy-manager/data") else None
    if not npm_data:
        # Find where NPM stores data
        result = subprocess.run(["docker", "inspect", "nginx-proxy-manager-app-1", "--format", "{{json .Mounts}}"], capture_output=True, text=True)
        mounts = json.loads(result.stdout)
        for m in mounts:
            if "/data" in m.get("Destination", ""):
                npm_data = m.get("Source", "")
                break
    
    if npm_data:
        print(f"NPM data dir: {npm_data}")
        # Copy cert files into NPM
        cert_dir = f"{npm_data}/custom_ssl/npm-99"
        os.makedirs(cert_dir, exist_ok=True)
        with open(f"{cert_dir}/fullchain.pem", "w") as f:
            f.write(cert)
        with open(f"{cert_dir}/privkey.pem", "w") as f:
            f.write(key)
        print(f"Cert files placed in {cert_dir}")
        print("NOTE: You may need to manually attach this cert in NPM UI")
    else:
        print("Could not find NPM data directory")
    
    sys.exit(1)

# Update proxy host with the certificate
print(f"\n=== Updating proxy host 22 with cert_id={cert_id} ===")
r = api("PUT", "/nginx/proxy-hosts/22", token=token, data={
    "domain_names": ["extractiq.polytronx.com"],
    "forward_scheme": "http",
    "forward_host": "extractiq-frontend",
    "forward_port": 80,
    "allow_websocket_upgrade": True,
    "block_exploits": True,
    "access_list_id": 0,
    "certificate_id": cert_id,
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
})

if r and "id" in r:
    print(f"SUCCESS: Proxy host updated with SSL, cert_id={r.get('certificate_id')}")
else:
    print("Failed to update proxy host")

# Cleanup
subprocess.run(["rm", "-f", "/tmp/ec.pem", "/tmp/ek.pem"])
print("\nDone!")
