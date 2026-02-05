# Struttura Navigazione Settings

## Pagine Principali

### `/settings-index` - Dashboard Settings

Dashboard centrale con cards per accedere a tutte le sezioni settings.

**Cards disponibili:**

1. **Impostazioni Generali** → `/admin/settings?tab=general`
2. **Informazioni Azienda** → `/admin/settings?tab=company`
3. **Materiali & Prodotti** → `/settings`
4. **Ruoli Cantiere** → `/settings/site-roles`
5. **Utenti & Permessi** → `/settings?tab=users`
6. **Sicurezza** → `/admin/settings?tab=security`

---

## Pagine Settings Dettagliate

### `/admin/settings` - Impostazioni Sistema

Pagina principale per settings globali del sistema con tabs.

**Tabs disponibili:**

- `?tab=general` - Impostazioni generali
- `?tab=company` - Informazioni azienda
- `?tab=notifications` - Notifiche
- `?tab=inventory` - Magazzino
- `?tab=quotes` - Preventivi
- `?tab=labor` - Manodopera
- `?tab=security` - Sicurezza
- `?tab=integrations` - Integrazioni

**Accesso diretto con parametro URL:**

```
/admin/settings?tab=company  → Apre direttamente tab Azienda
/admin/settings?tab=security → Apre direttamente tab Sicurezza
```

---

### `/settings` - Gestione Materiali

Pagina per gestire categorie materiali, tipi dipendenza, utenti e ruoli.

**Tabs disponibili:**

- `categories` - Categorie materiali
- `dependency-types` - Tipi dipendenza
- `users` - Gestione utenti
- `company` - Info azienda (duplicato con /admin/settings)
- `roles` - Ruoli e permessi

**Accesso diretto con hash:**

```
/settings#users   → Tab utenti
/settings#company → Tab azienda
```

---

### `/settings/site-roles` - Ruoli Cantiere

Gestione ruoli specifici dei lavoratori nei cantieri.

---

## Mappa Completa Navigazione

```
/settings-index (Dashboard)
├── /admin/settings?tab=general (Impostazioni Generali)
├── /admin/settings?tab=company (Azienda)
├── /admin/settings?tab=security (Sicurezza)
├── /admin/settings?tab=notifications (Notifiche)
├── /admin/settings?tab=inventory (Magazzino)
├── /admin/settings?tab=quotes (Preventivi)
├── /admin/settings?tab=labor (Manodopera)
├── /admin/settings?tab=integrations (Integrazioni)
├── /settings (Materiali, Utenti, Ruoli)
│   ├── #categories
│   ├── #dependency-types
│   ├── #users
│   ├── #company
│   └── #roles
└── /settings/site-roles (Ruoli Cantiere)
```

---

## Note Implementazione

### Parametri URL

La pagina `/admin/settings` utilizza query parameters (`?tab=nome`) per aprire direttamente una tab specifica. Questo è gestito tramite:

```typescript
const searchParams = useSearchParams();
const tabParam = searchParams.get("tab");
const [activeTab, setActiveTab] = useState(tabParam || "general");
```

### Link da Settings Index

Le cards nella dashboard `/settings-index` utilizzano questi href:

```typescript
{
  title: "Impostazioni Generali",
  href: "/admin/settings?tab=general",
  // ...
}
```

### Retrocompatibilità

- I link con hash (`/settings#users`) continuano a funzionare nella vecchia pagina `/settings`
- La nuova struttura con `/admin/settings` è additiva e non rompe i link esistenti

---

## Best Practices

1. **Link esterni**: Usa sempre i link completi con parametri

   ```tsx
   <Link href="/admin/settings?tab=company">Azienda</Link>
   ```

2. **Navigazione programmatica**:

   ```typescript
   router.push("/admin/settings?tab=security");
   ```

3. **Default tab**: Se nessun parametro è fornito, si apre `general`

4. **Deep linking**: Gli utenti possono salvare/condividere link a tab specifiche
