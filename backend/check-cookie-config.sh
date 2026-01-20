#!/bin/bash

# Script di verifica configurazione cookie di autenticazione
# Uso: ./check-cookie-config.sh

echo "=========================================="
echo "Verifica Configurazione Cookie Auth"
echo "=========================================="
echo ""

# Colori
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funzione per controllare se una variabile è impostata
check_env_var() {
    local var_name=$1
    local expected=$2
    local actual=$(php -r "echo env('$var_name') ?? 'NOT_SET';")

    echo -n "Checking $var_name... "

    if [ "$actual" = "NOT_SET" ]; then
        echo -e "${RED}✗ NON IMPOSTATA${NC}"
        return 1
    elif [ -n "$expected" ] && [ "$actual" != "$expected" ]; then
        echo -e "${YELLOW}⚠ Valore: $actual (raccomandato: $expected)${NC}"
        return 2
    else
        echo -e "${GREEN}✓ $actual${NC}"
        return 0
    fi
}

echo "1. Verifica variabili d'ambiente"
echo "-----------------------------------"

check_env_var "APP_ENV"
check_env_var "APP_URL"
check_env_var "FRONTEND_URL"

echo ""
echo "2. Verifica configurazione sessione"
echo "-----------------------------------"

check_env_var "SESSION_DRIVER" "database"
check_env_var "SESSION_DOMAIN"
check_env_var "SESSION_SECURE_COOKIE"
check_env_var "SESSION_SAME_SITE" "lax"
check_env_var "SESSION_PATH" "/"

echo ""
echo "3. Verifica configurazione Sanctum"
echo "-----------------------------------"

check_env_var "SANCTUM_STATEFUL_DOMAINS"

echo ""
echo "4. Verifica configurazione CORS"
echo "-----------------------------------"

# Controlla il file config/cors.php
if grep -q "supports_credentials.*true" config/cors.php 2>/dev/null; then
    echo -e "${GREEN}✓ CORS credentials abilitati${NC}"
else
    echo -e "${RED}✗ CORS credentials NON abilitati${NC}"
fi

echo ""
echo "5. Verifica middleware"
echo "-----------------------------------"

# Controlla se AddBearerTokenFromCookie è registrato
if grep -q "AddBearerTokenFromCookie" bootstrap/app.php 2>/dev/null; then
    echo -e "${GREEN}✓ Middleware AddBearerTokenFromCookie registrato${NC}"
else
    echo -e "${RED}✗ Middleware AddBearerTokenFromCookie NON registrato${NC}"
fi

echo ""
echo "6. Suggerimenti configurazione"
echo "-----------------------------------"

APP_ENV=$(php -r "echo env('APP_ENV') ?? 'local';")

if [ "$APP_ENV" = "production" ]; then
    echo "Configurazione raccomandata per PRODUZIONE:"
    echo ""
    echo "SESSION_DOMAIN=.your-domain.com  # Con punto iniziale per sottodomini"
    echo "SESSION_SECURE_COOKIE=true       # Solo HTTPS"
    echo "SESSION_SAME_SITE=lax            # Buon compromesso sicurezza/usabilità"
    echo "SANCTUM_STATEFUL_DOMAINS=your-domain.com"
    echo ""

    # Controlla se SESSION_SECURE_COOKIE è true
    SECURE=$(php -r "echo env('SESSION_SECURE_COOKIE') ?? 'false';")
    if [ "$SECURE" != "true" ]; then
        echo -e "${RED}⚠ ATTENZIONE: SESSION_SECURE_COOKIE dovrebbe essere true in produzione!${NC}"
    fi

else
    echo "Configurazione raccomandata per SVILUPPO:"
    echo ""
    echo "SESSION_DOMAIN=null              # Solo dominio esatto"
    echo "SESSION_SECURE_COOKIE=false      # Permetti HTTP"
    echo "SESSION_SAME_SITE=lax            # Buon compromesso"
    echo "SANCTUM_STATEFUL_DOMAINS=localhost,localhost:3000,127.0.0.1,127.0.0.1:8000"
fi

echo ""
echo "7. Test configurazione"
echo "-----------------------------------"

echo "Per testare la configurazione:"
echo "1. Pulisci la cache: php artisan config:cache"
echo "2. Fai login dall'applicazione frontend"
echo "3. Apri DevTools > Application > Cookies"
echo "4. Verifica che il cookie 'auth_token' sia presente con:"
echo "   - Domain: il valore di SESSION_DOMAIN"
echo "   - Secure: true (in produzione)"
echo "   - HttpOnly: true"
echo "   - SameSite: Lax"

echo ""
echo "=========================================="
echo "Verifica completata"
echo "=========================================="
