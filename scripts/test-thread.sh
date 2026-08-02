#!/usr/bin/env bash
# Test manual endpoint diskusi (thread) di environment yang ditentukan.
# Pakai: ./scripts/test-thread.sh           # pakai https://unikaiverse.vercel.app
#      BASE_URL=https://unikaiverse.vercel.app ./scripts/test-thread.sh
set -euo pipefail

BASE_URL="${BASE_URL:-https://unikaiverse.vercel.app}"
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

EMAIL="manual-test-$(date +%s)@example.com"
PASSWORD="Rahasia123!"
TITLE="Diskusi uji coba $RANDOM"
CONTENT="Ini adalah konten uji coba thread manual untuk verifikasi endpoint /api/discussions/threads. Harus >= 10 karakter."
CATEGORY=""   # kosongkan pakai category default (general), atau set misal: programming

echo "BASE_URL=$BASE_URL"
echo "==> 1. Email sign-up: $EMAIL"
curl -s -m 15 -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/sign-up/email" \
  -H 'content-type: application/json' \
  -d "{\"name\":\"Manual Tester\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"callbackURL\":\"$BASE_URL\"}" \
  | sed 's/.*"id":"\([^"]*\)".*/signup ok uid=\1/' || true
echo

echo "==> 2. Verify (email belum diverifikasi; get-session tetap kirim cookie)"
curl -s -m 15 -b "$COOKIE_JAR" -c "$COOKIE_JAR" "$BASE_URL/api/auth/get-session"
echo

echo "==> 3. POST /api/discussions/threads"
BODY="{\"title\":\"$TITLE\",\"content\":\"$CONTENT\"$( [ -n "$CATEGORY" ] && echo ",\"categorySlug\":\"$CATEGORY\"" )}"
curl -s -m 15 -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X POST "$BASE_URL/api/discussions/threads" \
  -H 'content-type: application/json' \
  -d "$BODY" -w "\nHTTP %{http_code}\n"
echo

echo "==> 4. GET /api/discussions/threads"
curl -s -m 15 -b "$COOKIE_JAR" "$BASE_URL/api/discussions/threads" | head -c 600
echo

echo "==> 5. GET /api/health"
curl -s -m 10 -w "\nHTTP %{http_code}\n" "$BASE_URL/api/health"
