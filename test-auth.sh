#!/bin/bash

# Script per testare l'autenticazione API in locale
# Uso: ./test-auth.sh

set -e

BASE_URL="http://localhost:8002/api/v1"

echo "=========================================="
echo "Test Autenticazione DGGM ERP API"
echo "=========================================="
echo ""

# Verifica che il server sia attivo
echo "🔍 Verifico che il server sia attivo..."
if ! lsof -ti:8002 > /dev/null 2>&1; then
    echo "❌ ERRORE: Server Laravel non attivo sulla porta 8002"
    echo ""
    echo "Avvia il server con:"
    echo "  cd backend && php artisan serve --port=8002"
    exit 1
fi
echo "✅ Server attivo"
echo ""

# Test 1: Login
echo "📝 Test 1: Login"
echo "=================="
LOGIN_RESPONSE=$(curl -s -c /tmp/dggm_cookies.txt -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email": "admin@dggm.com", "password": "password"}')

if echo "$LOGIN_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ Login riuscito"
    USER_EMAIL=$(echo "$LOGIN_RESPONSE" | jq -r '.data.user.email')
    USER_NAME=$(echo "$LOGIN_RESPONSE" | jq -r '.data.user.name')
    echo "   User: $USER_NAME ($USER_EMAIL)"
else
    echo "❌ Login fallito"
    echo "$LOGIN_RESPONSE" | jq .
    exit 1
fi
echo ""

# Estrai il token dal cookie
echo "🔑 Estrazione Token"
echo "=================="
if [ -f /tmp/dggm_cookies.txt ]; then
    TOKEN=$(cat /tmp/dggm_cookies.txt | grep auth_token | awk '{print $7}')

    if [ -n "$TOKEN" ]; then
        # Decodifica %7C in |
        TOKEN=$(echo "$TOKEN" | sed 's/%7C/|/g')
        echo "✅ Token estratto: ${TOKEN:0:30}..."
    else
        echo "❌ Token non trovato nel cookie"
        cat /tmp/dggm_cookies.txt
        exit 1
    fi
else
    echo "❌ File cookie non trovato"
    exit 1
fi
echo ""

# Test 2: /auth/me con Cookie
echo "📝 Test 2: /auth/me con Cookie"
echo "=============================="
ME_COOKIE_RESPONSE=$(curl -s -b /tmp/dggm_cookies.txt -X GET "$BASE_URL/auth/me" \
  -H "Accept: application/json")

if echo "$ME_COOKIE_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ Autenticazione con cookie riuscita"
    ME_EMAIL=$(echo "$ME_COOKIE_RESPONSE" | jq -r '.data.email')
    echo "   User: $ME_EMAIL"
else
    echo "❌ Autenticazione con cookie fallita"
    echo "$ME_COOKIE_RESPONSE" | jq .
fi
echo ""

# Test 3: /auth/me con Bearer Token
echo "📝 Test 3: /auth/me con Bearer Token"
echo "===================================="
ME_BEARER_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN")

if echo "$ME_BEARER_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ Autenticazione con Bearer token riuscita"
    ME_EMAIL=$(echo "$ME_BEARER_RESPONSE" | jq -r '.data.email')
    echo "   User: $ME_EMAIL"
else
    echo "❌ Autenticazione con Bearer token fallita"
    echo "$ME_BEARER_RESPONSE" | jq .
fi
echo ""

# Test 4: Richiesta senza autenticazione
echo "📝 Test 4: Richiesta senza autenticazione"
echo "=========================================="
UNAUTH_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "Accept: application/json")

if echo "$UNAUTH_RESPONSE" | jq -e '.message' | grep -qi "unauthenticated" > /dev/null 2>&1; then
    echo "✅ Richiesta non autenticata respinta correttamente"
else
    echo "⚠️  Risposta inaspettata per richiesta non autenticata"
    echo "$UNAUTH_RESPONSE" | jq .
fi
echo ""

# Riepilogo per Postman
echo "=========================================="
echo "📋 ISTRUZIONI PER POSTMAN"
echo "=========================================="
echo ""
echo "Il tuo token Bearer è:"
echo ""
echo "  $TOKEN"
echo ""
echo "Per usarlo in Postman:"
echo ""
echo "1. Fai il login a:"
echo "   POST $BASE_URL/auth/login"
echo "   Body: {\"email\": \"admin@dggm.com\", \"password\": \"password\"}"
echo ""
echo "2. Vai alla tab 'Cookies' nella risposta"
echo "   e copia il valore di 'auth_token'"
echo ""
echo "3. Per le altre richieste, aggiungi header:"
echo "   Authorization: Bearer {token_copiato}"
echo ""
echo "Oppure usa la collezione Postman già configurata:"
echo "   DGGM_ERP_API.postman_collection.json"
echo ""
echo "=========================================="

# Cleanup
rm -f /tmp/dggm_cookies.txt

echo ""
echo "✅ Test completati con successo!"
