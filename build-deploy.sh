#!/bin/bash
export CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN env var}"
export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:?Set CLOUDFLARE_ACCOUNT_ID env var}"
cd /root/hotel-checkin-app
npx opennextjs-cloudflare build 2>&1
npx wrangler deploy 2>&1
