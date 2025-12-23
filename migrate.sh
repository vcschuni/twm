#!/usr/bin/env bash
set -euo pipefail

# -----------------------------
# Configuration
# -----------------------------
APP="twm-public"

# DEV namespace
DEV_PROJ="80c8d5-dev"

# TEST namespace
TEST_PROJ="80c8d5-test"

# -----------------------------
# Switch to TEST project
# -----------------------------
echo ">>> Switching to TEST project: $TEST_PROJ"
oc project "$TEST_PROJ"

# -----------------------------
# Clean up old TEST resources
# -----------------------------
echo "Cleaning old resources in TEST..."

oc delete deployment "${APP}-apache" --ignore-not-found
oc delete deployment "${APP}-nginx" --ignore-not-found

oc delete svc "${APP}-apache" --ignore-not-found
oc delete svc "${APP}-nginx" --ignore-not-found

oc delete route "$APP" --ignore-not-found

oc delete is "${APP}-apache" --ignore-not-found
oc delete is "${APP}-nginx" --ignore-not-found

# -----------------------------
# Tag DEV images into TEST
# -----------------------------
echo ">>> Tagging DEV images into TEST..."
oc tag "${DEV_PROJ}/${APP}-apache:latest" "${TEST_PROJ}/${APP}-apache:latest"
oc tag "${DEV_PROJ}/${APP}-nginx:latest" "${TEST_PROJ}/${APP}-nginx:latest"

# -----------------------------
# Deploy Apache in TEST (internal)
# -----------------------------
echo ">>> Deploying Apache (internal, port 8081)..."
oc new-app "${APP}-apache:latest" --name="${APP}-apache" --allow-missing-images
oc rollout status deployment/"${APP}-apache" --timeout=300s

echo ">>> Exposing Apache internally on port 8081..."
oc expose deployment "${APP}-apache" \
  --name="${APP}-apache" \
  --port=8081 \
  --dry-run=client -o yaml | oc apply -f -

# -----------------------------
# Deploy Nginx in TEST (external)
# -----------------------------
echo ">>> Deploying Nginx (external, port 8080)..."
oc new-app "${APP}-nginx:latest" --name="${APP}-nginx" --allow-missing-images
oc rollout status deployment/"${APP}-nginx" --timeout=300s

echo ">>> Exposing Nginx externally on port 8080..."
oc expose deployment "${APP}-nginx" \
  --name="${APP}" \
  --port=8080 \
  --dry-run=client -o yaml | oc apply -f -

# -----------------------------
# Expose public route
# -----------------------------
echo ">>> Creating public route for TEST..."
oc expose service "${APP}" --port=8080

# -----------------------------
# Show TEST resources
# -----------------------------
echo ">>> Current resources in TEST:"
oc get pods -o wide
oc get svc
oc get routes
oc get is

echo ">>> COMPLETE — DEV images promoted and deployed to TEST!"
