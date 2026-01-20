# COMANDI RAPIDI - Copia e Incolla sul Server

## ⚡ Fix Automatico (RACCOMANDATO)

Copia e incolla TUTTO questo blocco sul server:

```bash
cd /var/www/html/dggm/backend && \
cp .env .env.backup.$(date +%Y%m%d_%H%M%S) && \
sed -i '/^# SESSION_DOMAIN=/d' .env && \
sed -i 's/^SESSION_DOMAIN=.*/SESSION_DOMAIN=.dggm-erp.ddns.net/' .env && \
sed -i 's/^SESSION_SECURE_COOKIE=.*/SESSION_SECURE_COOKIE=true/' .env && \
sed -i 's/^SESSION_SAME_SITE=.*/SESSION_SAME_SITE=lax/' .env && \
echo "" && \
echo "Configurazione aggiornata:" && \
grep "^SESSION_DOMAIN=" .env && \
grep "^SESSION_SECURE_COOKIE=" .env && \
grep "^SESSION_SAME_SITE=" .env && \
echo "" && \
echo "Pulizia cache..." && \
php artisan config:clear && \
php artisan cache:clear && \
php artisan config:cache && \
echo "" && \
echo "✓ Configurazione completata!" && \
echo "" && \
echo "Ora esegui (richiede sudo):" && \
echo "sudo systemctl restart php8.2-fpm nginx"
```

Poi esegui:

```bash
sudo systemctl restart php8.2-fpm nginx
```

## 🔍 Verifica Rapida

Copia e incolla per verificare:

```bash
cd /var/www/html/dggm/backend && \
echo "Configurazione Cookie:" && \
echo "=====================" && \
grep "^SESSION_DOMAIN=" .env && \
grep "^SESSION_SECURE_COOKIE=" .env && \
grep "^SESSION_SAME_SITE=" .env && \
grep "^SANCTUM_STATEFUL_DOMAINS=" .env
```

**Output atteso:**
```
SESSION_DOMAIN=.dggm-erp.ddns.net
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
SANCTUM_STATEFUL_DOMAINS=dggm-erp.ddns.net
```

## 📝 Verifica Alternativa (se il comando sopra non funziona)

### Metodo Manuale - Modifica diretta

```bash
cd /var/www/html/dggm/backend
nano .env
```

**Trova queste righe e modificale:**

```bash
# Trova (circa riga 32-40)
SESSION_DOMAIN=.ddns.net              # ← CAMBIA QUESTA
SESSION_SECURE_COOKIE=false           # ← CAMBIA QUESTA

# Modifica in:
SESSION_DOMAIN=.dggm-erp.ddns.net     # ← CON IL TUO DOMINIO
SESSION_SECURE_COOKIE=true            # ← METTI true
```

Salva con `Ctrl+O`, `Invio`, `Ctrl+X`

Poi:
```bash
php artisan config:cache && sudo systemctl restart php8.2-fpm nginx
```

## 🧪 Test Finale

1. **Browser incognito** → `https://dggm-erp.ddns.net`
2. **Login**
3. **Verifica** che la dashboard si carichi senza redirect

Se funziona: ✅ **PROBLEMA RISOLTO!**

Se non funziona:
- Controlla log: `tail -f storage/logs/laravel.log`
- Verifica HTTPS: `curl -I https://dggm-erp.ddns.net`
- Apri issue con i log
