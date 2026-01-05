#!/usr/bin/env bash
set -euo pipefail

# -----------------------------
# Configuration
# -----------------------------
APP="twm-public"

# -----------------------------
# Verify argument
# -----------------------------
ENVIRONMENT="${1:-}"
if [[ -z "$ENVIRONMENT" ]]; then
    echo
    echo "USAGE: ./$(basename "$0") <dev|test|prod>"
    echo "EXAMPLE: ./$(basename "$0") dev"
    echo
    exit 1
fi

# Map environment to OpenShift project
case "$ENVIRONMENT" in
    "dev")
        PROJECT="80c8d5-dev"
        ;;
    "test")
        PROJECT="80c8d5-test"
        ;;
    "prod")
        PROJECT="80c8d5-prod"
        ;;
    *)
        echo "Invalid environment: $ENVIRONMENT"
        exit 1
        ;;
esac

# -----------------------------
# Switch to project
# -----------------------------
echo ">>> Switching to project: $PROJECT"
oc project "$PROJECT"

# -----------------------------
# Show status
# -----------------------------
echo
echo ">>> Pods"
oc get pods -l app="$APP" -o wide || echo "No pods found for $APP"

echo
echo ">>> Deployments"
oc get deployments -l app="$APP" || echo "No deployments found for $APP"

echo
echo ">>> Services"
oc get svc -l app="$APP" || echo "No services found for $APP"

echo
echo ">>> Routes"
oc get routes -l app="$APP" || echo "No routes found for $APP"

echo
echo ">>> Builds"
oc get builds -l app="$APP" || echo "No builds found for $APP"

echo
echo ">>> Status check complete for environment: $ENVIRONMENT"
