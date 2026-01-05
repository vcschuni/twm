#!/usr/bin/env bash
set -euo pipefail

# ----------------------------
# Config
# ----------------------------
APP="geoserver"
PROJ="80c8d5-dev"           # fixed project
PVC_SIZE="10Gi"             # persistent storage
GEOSERVER_IMAGE="docker.osgeo.org/geoserver:2.28.0"

# ----------------------------
# Verify passed arg and show help if required
# ----------------------------
OPTIONS=("deploy" "remove")
ACTION="${1:-}"
ADMIN_PASSWORD="${2:-}"
if [[ ! " ${OPTIONS[*]} " =~ " ${ACTION} " ]] || ([[ "${ACTION}" == "deploy" ]] && [[ -z "$ADMIN_PASSWORD" ]]); then
    echo
    echo "USAGE: $(basename "$0") <${OPTIONS[*]// /|}> [admin-password-for-deploy]"
    echo "EXAMPLE: $(basename "$0") deploy MySecretPassword"
    echo "EXAMPLE: $(basename "$0") remove"
    echo
    exit 1
fi

# ----------------------------
# Switch to project
# ----------------------------
echo ">>> Switching to project $PROJ"
oc project "$PROJ"

# ----------------------------
# Cleanup old resources
# ----------------------------
echo ">>> Cleaning ALL old GeoServer resources..."
oc delete all -l app="${APP}" --ignore-not-found --wait=true

# ----------------------------
# Stop here if remove was requested
# ----------------------------
if [[ "${ACTION}" == "remove" ]]; then
    oc get pods -o wide
    oc get svc
    oc get routes
    oc get pvc
    echo ""
    echo ">>> Remove completed successfully"
    echo ""
    exit
fi

# ----------------------------
# Create PVC if it doesn't exist
# ----------------------------
if ! oc get pvc "${APP}-data" &>/dev/null; then
    echo ">>> Creating PVC for GeoServer data..."
    oc apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ${APP}-data
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: ${PVC_SIZE}
EOF
else
    echo ">>> PVC ${APP}-data already exists, skipping creation"
fi

# ----------------------------
# Deploy GeoServer
# ----------------------------
echo ">>> Deploying GeoServer..."
oc new-app --docker-image="$GEOSERVER_IMAGE" \
    --name="${APP}" \
    -e GEOSERVER_ADMIN_PASSWORD="$ADMIN_PASSWORD" \
    -e GEOSERVER_DATA_DIR="/opt/geoserver/data_dir" \
    --labels app="${APP}" \
    --allow-missing-images

# ----------------------------
# Attach PVC
# ----------------------------
echo ">>> Attaching PVC..."
oc set volume deployment/"$APP" \
    --add \
    --type=pvc \
    --claim-name="${APP}-data" \
    --mount-path=/opt/geoserver/data_dir

# ----------------------------
# Expose route
# ----------------------------
echo ">>> Creating external route..."
oc expose service "$APP"

# ----------------------------
# Wait for deployment
# ----------------------------
echo ">>> Waiting for rollout..."
oc rollout status deployment/"$APP" --timeout=300s

# ----------------------------
# Show final status
# ----------------------------
echo ">>> Current resources in $PROJ:"
oc get pods -o wide
oc get svc
oc get routes
oc get pvc

echo ">>> COMPLETE — GeoServer deployed!"
