#!/usr/bin/env bash
# Trigger a Coolify redeploy from .env.local credentials
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env.local not found" >&2
  exit 1
fi

source "$ENV_FILE"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "${COOLIFY_URL}/api/v1/applications/${COOLIFY_APP_UUID}/restart" \
  -H "Authorization: Bearer ${COOLIFY_API_TOKEN}" \
  -H "Accept: application/json")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "Deploy triggered successfully"
  echo "$BODY"
else
  echo "Deploy failed (HTTP $HTTP_CODE)" >&2
  echo "$BODY" >&2
  exit 1
fi
