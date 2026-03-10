#!/bin/bash
echo "=== Frontend IPs ==="
docker inspect extractiq-frontend --format '{{json .NetworkSettings.Networks}}' | python3 -c "
import sys,json
d = json.loads(sys.stdin.read())
for k,v in d.items():
    print(f'  {k}: {v[\"IPAddress\"]}')" 

echo "=== API IPs ==="
docker inspect extractiq-api --format '{{json .NetworkSettings.Networks}}' | python3 -c "
import sys,json
d = json.loads(sys.stdin.read())
for k,v in d.items():
    print(f'  {k}: {v[\"IPAddress\"]}')"

echo "=== NPM can ping? ==="
docker exec nginx-proxy-manager-app-1 ping -c 1 -W 2 extractiq-frontend 2>&1 | head -3 || true
docker exec nginx-proxy-manager-app-1 ping -c 1 -W 2 extractiq-api 2>&1 | head -3 || true
