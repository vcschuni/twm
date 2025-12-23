#!/usr/bin/env bash
set -euo pipefail

APP="twm-public"
PROJ="80c8d5-dev"
REPO="https://github.com/vcschuni/twm.git"

APACHE_CTX="compose/apache-php"
NGINX_CTX="compose/nginx"

echo "🔷 Switching to project $PROJ"
oc project "$PROJ"

echo "🔷 Cleaning ALL old resources..."

# ----------------------------
# Delete deployments
# ----------------------------
oc delete deployment "${APP}-apache" --ignore-not-found
oc delete deployment "${APP}-nginx" --ignore-not-found

# ----------------------------
# Delete services
# ----------------------------
oc delete svc "${APP}-apache" --ignore-not-found
oc delete svc "${APP}-nginx" --ignore-not-found
oc delete svc "${APP}-internal" --ignore-not-found

# ----------------------------
# Delete routes
# ----------------------------
oc delete route "$APP" --ignore-not-found

# ----------------------------
# Delete BuildConfigs
# ----------------------------
oc delete bc "${APP}-apache" --ignore-not-found
oc delete bc "${APP}-nginx" --ignore-not-found

# ----------------------------
# Delete builds + pods
# ----------------------------
oc delete builds -l build="${APP}-apache" --ignore-not-found
oc delete builds -l build="${APP}-nginx" --ignore-not-found
oc delete pod -l build="${APP}-apache" --ignore-not-found || true
oc delete pod -l build="${APP}-nginx" --ignore-not-found || true

# ----------------------------
# Delete ImageStreams
# ----------------------------
oc delete is "${APP}-apache" --ignore-not-found
oc delete is "${APP}-nginx" --ignore-not-found

# ----------------------------
# Deploy Apache
# ----------------------------
echo "🔷 Deploying Apache (internal, port 8081)…"
oc new-app "$REPO" \
  --name="${APP}-apache" \
  --context-dir="$APACHE_CTX" \
  --strategy=docker

echo "🔷 Building Apache image…"
oc start-build "${APP}-apache" --follow

echo "🔷 Waiting for Apache deployment rollout…"
oc rollout status deployment/"${APP}-apache" --timeout=300s

echo "🔷 Exposing Apache internally on port 8081…"
oc expose deployment "${APP}-apache" \
  --name="${APP}-internal" \
  --port=8081 \
  --dry-run=client -o yaml | oc apply -f -

# ----------------------------
# Clean Nginx service before deploying
# ----------------------------
oc delete svc "${APP}-nginx" --ignore-not-found

# ----------------------------
# Deploy Nginx
# ----------------------------
echo "🔷 Deploying Nginx (external, port 8080)…"
oc new-app "$REPO" \
  --name="${APP}-nginx" \
  --context-dir="$NGINX_CTX" \
  --strategy=docker

echo "🔷 Building Nginx image…"
oc start-build "${APP}-nginx" --follow

echo "🔷 Waiting for Nginx deployment rollout…"
oc rollout status deployment/"${APP}-nginx" --timeout=300s

echo "🔷 Exposing Nginx externally on port 8080…"
oc expose deployment "${APP}-nginx" \
  --name="${APP}" \
  --port=8080 \
  --dry-run=client -o yaml | oc apply -f -

# ----------------------------
# Final status
# ----------------------------
echo "🔷 Current Resources:"
oc get pods -o wide
oc get svc
oc get routes
oc get builds

echo "✅ COMPLETE — Nginx → Apache (8081) deployed!"
