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

# ----------------------------
# Verify passed arg and show help if required
# ----------------------------
OPTIONS=("deploy" "remove")
ACTION="${1:-}"
if [[ ! " ${OPTIONS[*]} " =~ " ${ACTION} " ]]; then
    echo
    echo "USAGE: $(basename "$0") <${OPTIONS[*]// /|}>"
    echo "EXAMPLE: $(basename "$0") ${OPTIONS[0]}"
    echo
    exit 1
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
oc delete all -l app="${APP}" --ignore-not-found --wait=true
oc delete builds -l app="${APP}" --ignore-not-found --wait=true
oc delete is -l app="${APP}" --ignore-not-found --wait=true

# ----------------------------
# Stop here if remove was requested
# ----------------------------
if [[ "${ACTION}" == "remove" ]]; then
	oc get pods -o wide
	oc get svc
	oc get routes
	oc get builds
	echo ""
	echo ">>> Remove completed successfully"
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
  --strategy=docker \
  --labels=app="${APP}"

echo ">>> Waiting for Apache deployment rollout..."
oc rollout status deployment/"${APP}-apache" --timeout=300s

echo ">>> Exposing Apache internally on port 8081..."
oc expose deployment "${APP}-apache" \
  --name="${APP}-apache" \
  --port=8081 \
  --dry-run=client -o yaml \
  --labels=app="${APP}" | oc apply -f -

# ----------------------------
# Deploy Nginx
# ----------------------------
echo ">>> Deploying Nginx (external, port 8080)..."
oc new-app "$REPO" \
  --name="${APP}-nginx" \
  --context-dir="$NGINX_CTX" \
  --strategy=docker \
  --labels=app="${APP}"

echo ">>> Waiting for Nginx deployment rollout..."
oc rollout status deployment/"${APP}-nginx" --timeout=300s

echo ">>> Exposing Nginx externally on port 8080..."
oc expose deployment "${APP}-nginx" \
  --name="${APP}-nginx" \
  --port=8080 \
  --dry-run=client -o yaml \
  --labels=app="${APP}" | oc apply -f -

# ----------------------------
# Expose Service
# ----------------------------
echo ">>> Creating external route..."
oc expose service "${APP}-nginx" --name="${APP}" --labels=app="${APP}"

# ----------------------------
# Final status
# ----------------------------
echo ">>> Current Resources:"
oc get pods -o wide
oc get svc
oc get routes
oc get builds

echo ">>> COMPLETE — Nginx → Apache (8081) deployed!"
