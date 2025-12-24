#!/bin/bash
set -euo pipefail

# -----------------------------
# Configuration
# -----------------------------
APP="twm-public"

# -----------------------------
# Verify arguments and setup promotion parameters
# -----------------------------
VERSION="${1:-}"
DST_ENVIRONMENT="${2:-}"
if [[ -z "$VERSION" || -z "$DST_ENVIRONMENT" ]]; then
    echo
    echo "    USAGE: ./$(basename "$0") <VERSION> <test | prod>"
    echo "EXAMPLE 1: ./$(basename "$0") 1.2.3 test"
    echo
    exit 1
fi
case "$DST_ENVIRONMENT" in
  "test")
	SRC_PROJ="80c8d5-dev"
	SRC_VERSION="latest"
	DST_PROJ="80c8d5-test"
	DST_VERSION=$VERSION
    ;;
  "prod")
    SRC_PROJ="80c8d5-test"
	SRC_VERSION=$VERSION
	DST_PROJ="80c8d5-prod"
	DST_VERSION=$VERSION
    ;;
  *)
    echo
	echo "Invalid destination environment: $DST_ENVIRONMENT"
	echo
    echo "    USAGE: ./$(basename "$0") <VERSION> <test | prod>"
    echo "EXAMPLE 1: ./$(basename "$0") 1.2.3 test"
    echo
    exit 1
    exit 1
    ;;
esac
echo ">>> Version: $SRC_VERSION"
echo ">>> Version: $DST_VERSION"
echo ">>> Source project: $SRC_PROJ"
echo ">>> Destination project: $DST_PROJ"

# -----------------------------
# Switch to destination project
# -----------------------------
echo ">>> Switching to project: $DST_PROJ"
oc project "$DST_PROJ"

# -----------------------------
# Clean up old destination resources
# -----------------------------
echo "Cleaning old resources in $DST_PROJ..."

oc delete deployment "${APP}-apache" --ignore-not-found
oc delete deployment "${APP}-nginx" --ignore-not-found

oc delete svc "${APP}-apache" --ignore-not-found
oc delete svc "${APP}-nginx" --ignore-not-found
oc delete svc "${APP}" --ignore-not-found

oc delete route "$APP" --ignore-not-found

# -----------------------------
# Tag source images into destination
# -----------------------------
echo ">>> Tagging $SRC_PROJ images into $DST_PROJ..."
oc tag "${SRC_PROJ}/${APP}-apache:${SRC_VERSION}" "${DST_PROJ}/${APP}-apache:${DST_VERSION}"
oc tag "${SRC_PROJ}/${APP}-nginx:${SRC_VERSION}" "${DST_PROJ}/${APP}-nginx:${DST_VERSION}"

# -----------------------------
# Deploy Apache in destination
# -----------------------------
echo ">>> Deploying Apache (port 8081)..."
oc new-app "${APP}-apache:${DST_VERSION}" --name="${APP}-apache" --allow-missing-images
oc rollout status deployment/"${APP}-apache" --timeout=300s

echo ">>> Exposing Apache internally on port 8081..."
oc expose deployment "${APP}-apache" \
  --name="${APP}-apache" \
  --port=8081 \
  --dry-run=client -o yaml | oc apply -f -

# -----------------------------
# Deploy Nginx in destination
# -----------------------------
echo ">>> Deploying Nginx (port 8080)..."
oc new-app "${APP}-nginx:${DST_VERSION}" --name="${APP}-nginx" --allow-missing-images
oc rollout status deployment/"${APP}-nginx" --timeout=300s

echo ">>> Exposing Nginx externally on port 8080..."
oc expose deployment "${APP}-nginx" \
  --name="${APP}" \
  --port=8080 \
  --dry-run=client -o yaml | oc apply -f -

# -----------------------------
# Expose public route
# -----------------------------
echo ">>> Creating public route..."
oc expose service "${APP}" --port=8080

# -----------------------------
# Show destination resources
# -----------------------------
echo ">>> Current resources in $DST_PROJ:"
oc get pods -o wide
oc get svc
oc get routes
oc get is

echo ">>> COMPLETE — $SRC_PROJ images promoted and deployed to $DST_PROJ!"
