#!/bin/bash
# Script per correggere la configurazione in produzione
# Eseguire sul server: bash fix-production-env.sh

echo "=========================================="
echo "Fix Configurazione Produzione"
echo "=========================================="
echo ""

# Colori
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Controlla se siamo nella directory backend
if [ ! -f "artisan" ]; then
    echo -e "${RED}Errore: Esegui questo script dalla directory backend${NC}"
    echo "cd /var/www/html/dggm/backend"
    exit 1
fi

# Backup del file .env
echo "1. Backup file .env..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}✓ Backup creato${NC}"
echo ""

# Mostra configurazione attuale
echo "2. Configurazione ATTUALE:"
echo "-----------------------------------"
echo "SESSION_DOMAIN: $(grep '^SESSION_DOMAIN=' .env | cut -d '=' -f2)"
echo "SESSION_SECURE_COOKIE: $(grep '^SESSION_SECURE_COOKIE=' .env | cut -d '=' -f2)"
echo "SESSION_SAME_SITE: $(grep '^SESSION_SAME_SITE=' .env | cut -d '=' -f2)"
echo ""

# Chiedi conferma
read -p "Vuoi applicare le correzioni? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Operazione annullata"
    exit 0
fi

echo ""
echo "3. Applicazione correzioni..."

# Rimuovi la riga SESSION_DOMAIN commentata se esiste
sed -i '/^# SESSION_DOMAIN=/d' .env

# Correggi SESSION_DOMAIN
if grep -q '^SESSION_DOMAIN=' .env; then
    sed -i 's/^SESSION_DOMAIN=.*/SESSION_DOMAIN=.dggm-erp.ddns.net/' .env
    echo -e "${GREEN}✓ SESSION_DOMAIN corretto${NC}"
else
    echo "SESSION_DOMAIN=.dggm-erp.ddns.net" >> .env
    echo -e "${GREEN}✓ SESSION_DOMAIN aggiunto${NC}"
fi

# Correggi SESSION_SECURE_COOKIE
if grep -q '^SESSION_SECURE_COOKIE=' .env; then
    sed -i 's/^SESSION_SECURE_COOKIE=.*/SESSION_SECURE_COOKIE=true/' .env
    echo -e "${GREEN}✓ SESSION_SECURE_COOKIE corretto${NC}"
else
    echo "SESSION_SECURE_COOKIE=true" >> .env
    echo -e "${GREEN}✓ SESSION_SECURE_COOKIE aggiunto${NC}"
fi

# Correggi SESSION_SAME_SITE
if grep -q '^SESSION_SAME_SITE=' .env; then
    sed -i 's/^SESSION_SAME_SITE=.*/SESSION_SAME_SITE=lax/' .env
    echo -e "${GREEN}✓ SESSION_SAME_SITE corretto${NC}"
else
    echo "SESSION_SAME_SITE=lax" >> .env
    echo -e "${GREEN}✓ SESSION_SAME_SITE aggiunto${NC}"
fi

echo ""
echo "4. Configurazione CORRETTA:"
echo "-----------------------------------"
echo "SESSION_DOMAIN: $(grep '^SESSION_DOMAIN=' .env | cut -d '=' -f2)"
echo "SESSION_SECURE_COOKIE: $(grep '^SESSION_SECURE_COOKIE=' .env | cut -d '=' -f2)"
echo "SESSION_SAME_SITE: $(grep '^SESSION_SAME_SITE=' .env | cut -d '=' -f2)"
echo ""

echo "5. Pulizia cache Laravel..."
php artisan config:clear
php artisan cache:clear
php artisan config:cache
echo -e "${GREEN}✓ Cache pulita${NC}"
echo ""

echo "6. Riavvio servizi..."
echo "Esegui manualmente (richiede sudo):"
echo "  sudo systemctl restart php8.2-fpm"
echo "  sudo systemctl restart nginx"
echo ""

echo -e "${GREEN}=========================================="
echo "Configurazione completata!"
echo "==========================================${NC}"
echo ""
echo "Prossimi passi:"
echo "1. Riavvia i servizi (vedi comandi sopra)"
echo "2. Apri browser in incognito"
echo "3. Fai login su https://dggm-erp.ddns.net"
echo "4. Verifica che la dashboard si carichi senza redirect"
echo ""
echo "Backup salvato in: .env.backup.*"
echo "Per ripristinare: cp .env.backup.* .env"
