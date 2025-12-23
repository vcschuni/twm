#!/usr/bin/env bash
set -euo pipefail

# ----------------------------
# Config
# ----------------------------
APP="twm-public"
PROJ="80c8d5-dev"
REPO="https://github.com/vcschuni/twm.git"
APACHE_CTX="compose/apache-php"
NGINX_CTX="compose/nginx"

# Verify passed arg and show help if required
OPTIONS=("deploy" "remove")
if [[ ! " ${OPTIONS[*]} " == *" $1 "* ]]; then
	echo ""
	echo "  USAGE: build.sh <deploy|remove>"
	echo "EXAMPLE: build.sh deploy"
	echo ""
	exit
fi

# ----------------------------
# Switch to DEV project
# ----------------------------
echo ">>> Switching to project $PROJ"
oc project "$PROJ"

# ----------------------------
# Cleanup
# ----------------------------
echo ">>> Cleaning ALL old resources..."
oc delete deployment "${APP}-apache" --ignore-not-found
oc delete deployment "${APP}-nginx" --ignore-not-found

oc delete svc "${APP}-apache" --ignore-not-found
oc delete svc "${APP}-nginx" --ignore-not-found

oc delete route "$APP" --ignore-not-found

oc delete bc "${APP}-apache" --ignore-not-found
oc delete bc "${APP}-nginx" --ignore-not-found

oc delete builds -l build="${APP}-apache" --ignore-not-found
oc delete builds -l build="${APP}-nginx" --ignore-not-found
oc delete pod -l build="${APP}-apache" --ignore-not-found || true
oc delete pod -l build="${APP}-nginx" --ignore-not-found || true

oc delete is "${APP}-apache" --ignore-not-found
oc delete is "${APP}-nginx" --ignore-not-found

# ----------------------------
# Stop here if remove was requested
# ----------------------------
if [[ "$1" == "remove" ]]; then
	echo ""
	echo "Remove completed successfully"
	echo ""
	exit
fi

# ----------------------------
# Deploy Apache
# ----------------------------
echo ">>> Deploying Apache (internal, port 8081)..."
oc new-app "$REPO" \
  --name="${APP}-apache" \
  --context-dir="$APACHE_CTX" \
  --strategy=docker

echo ">>> Building Apache image..."
oc start-build "${APP}-apache" --follow

echo ">>> Waiting for Apache deployment rollout..."
oc rollout status deployment/"${APP}-apache" --timeout=300s

echo ">>> Exposing Apache internally on port 8081..."
oc expose deployment "${APP}-apache" \
  --name="${APP}-apache" \
  --port=8081 \
  --dry-run=client -o yaml | oc apply -f -

# ----------------------------
# Deploy Nginx
# ----------------------------
echo ">>> Deploying Nginx (external, port 8080)..."
oc new-app "$REPO" \
  --name="${APP}-nginx" \
  --context-dir="$NGINX_CTX" \
  --strategy=docker

echo ">>> Building Nginx image..."
oc start-build "${APP}-nginx" --follow

echo ">>> Waiting for Nginx deployment rollout..."
oc rollout status deployment/"${APP}-nginx" --timeout=300s

echo ">>> Exposing Nginx externally on port 8080..."
oc expose deployment "${APP}-nginx" \
  --name="${APP}" \
  --port=8080 \
  --dry-run=client -o yaml | oc apply -f -

# ----------------------------
# Expose Service
# ----------------------------
echo "Exposing Service"
oc expose service "${APP}-nginx" --name=twm-public --port=8080

# ----------------------------
# Final status
# ----------------------------
echo ">>> Current Resources:"
oc get pods -o wide
oc get svc
oc get routes
oc get builds

echo ">>> COMPLETE — Nginx → Apache (8081) deployed!"
