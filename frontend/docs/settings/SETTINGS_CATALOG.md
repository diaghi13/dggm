# DGGM ERP - Complete Settings Catalog

Lista completa di tutte le impostazioni da implementare nel sistema.

---

## 📊 Settings Overview

**Total Settings**: 45
- General: 5
- Company: 10
- UI: 8
- Warehouse: 6
- Email: 5
- Notifications: 3
- Files: 3
- Feature Flags: 10

---

## 1. General Settings (`group: general`)

### 1.1 Application Name
```json
{
  "key": "app.name",
  "type": "string",
  "default_value": "DGGM ERP",
  "description": "Nome dell'applicazione visualizzato nell'UI",
  "is_public": true,
  "order": 10
}
```

### 1.2 Timezone
```json
{
  "key": "app.timezone",
  "type": "enum",
  "allowed_values": ["Europe/Rome", "Europe/London", "America/New_York", "UTC"],
  "default_value": "Europe/Rome",
  "description": "Timezone di default dell'applicazione",
  "is_public": true,
  "order": 20
}
```

### 1.3 Locale
```json
{
  "key": "app.locale",
  "type": "enum",
  "allowed_values": ["it", "en", "fr", "de", "es"],
  "default_value": "it",
  "description": "Lingua di default dell'applicazione",
  "is_public": true,
  "order": 30
}
```

### 1.4 Date Format
```json
{
  "key": "app.date_format",
  "type": "enum",
  "allowed_values": ["d/m/Y", "Y-m-d", "m/d/Y"],
  "default_value": "d/m/Y",
  "description": "Formato data di default",
  "is_public": true,
  "order": 40
}
```

### 1.5 Currency
```json
{
  "key": "app.currency",
  "type": "enum",
  "allowed_values": ["EUR", "USD", "GBP", "CHF"],
  "default_value": "EUR",
  "description": "Valuta di default",
  "is_public": true,
  "order": 50
}
```

---

## 2. Company Settings (`group: company`)

### 2.1 Company Name
```json
{
  "key": "company.name",
  "type": "string",
  "default_value": "DGGM S.r.l.",
  "description": "Ragione sociale",
  "is_public": false,
  "order": 10
}
```

### 2.2 VAT Number
```json
{
  "key": "company.vat",
  "type": "string",
  "default_value": "IT12345678901",
  "description": "Partita IVA",
  "validation_rules": ["regex:/^IT[0-9]{11}$/"],
  "is_public": false,
  "order": 20
}
```

### 2.3 Fiscal Code
```json
{
  "key": "company.fiscal_code",
  "type": "string",
  "default_value": "",
  "description": "Codice fiscale",
  "is_public": false,
  "order": 30
}
```

### 2.4 Email
```json
{
  "key": "company.email",
  "type": "email",
  "default_value": "info@dggm.it",
  "description": "Email principale aziendale",
  "is_public": false,
  "order": 40
}
```

### 2.5 PEC Email
```json
{
  "key": "company.pec",
  "type": "email",
  "default_value": "",
  "description": "Indirizzo PEC aziendale",
  "is_public": false,
  "order": 50
}
```

### 2.6 Phone
```json
{
  "key": "company.phone",
  "type": "string",
  "default_value": "+39 0123 456789",
  "description": "Telefono principale",
  "is_public": false,
  "order": 60
}
```

### 2.7 Address
```json
{
  "key": "company.address",
  "type": "string",
  "default_value": "Via Roma 1, 20100 Milano MI",
  "description": "Indirizzo sede legale",
  "is_public": false,
  "order": 70
}
```

### 2.8 Website
```json
{
  "key": "company.website",
  "type": "url",
  "default_value": "https://dggm.it",
  "description": "Sito web aziendale",
  "is_public": true,
  "order": 80
}
```

### 2.9 Logo
```json
{
  "key": "company.logo",
  "type": "file",
  "default_value": null,
  "description": "Logo aziendale (use Spatie Media Library)",
  "is_public": true,
  "order": 90
}
```

### 2.10 Bank IBAN
```json
{
  "key": "company.iban",
  "type": "string",
  "default_value": "",
  "description": "IBAN per bonifici",
  "validation_rules": ["regex:/^IT[0-9]{2}[A-Z][0-9]{22}$/"],
  "is_public": false,
  "order": 100
}
```

---

## 3. UI Settings (`group: ui`)

### 3.1 Primary Color
```json
{
  "key": "ui.primary_color",
  "type": "color",
  "default_value": "#3B82F6",
  "description": "Colore primario brand",
  "validation_rules": ["regex:/^#[0-9A-Fa-f]{6}$/"],
  "is_public": true,
  "order": 10
}
```

### 3.2 Secondary Color
```json
{
  "key": "ui.secondary_color",
  "type": "color",
  "default_value": "#8B5CF6",
  "description": "Colore secondario",
  "validation_rules": ["regex:/^#[0-9A-Fa-f]{6}$/"],
  "is_public": true,
  "order": 20
}
```

### 3.3 Default Theme
```json
{
  "key": "ui.theme",
  "type": "enum",
  "allowed_values": ["light", "dark", "auto"],
  "default_value": "auto",
  "description": "Tema di default (light/dark/auto)",
  "is_public": true,
  "order": 30
}
```

### 3.4 Items Per Page
```json
{
  "key": "ui.items_per_page",
  "type": "number",
  "default_value": 15,
  "min_value": 5,
  "max_value": 100,
  "description": "Numero elementi per pagina nelle tabelle",
  "is_public": true,
  "order": 40
}
```

### 3.5 Sidebar Collapsed
```json
{
  "key": "ui.sidebar_collapsed",
  "type": "boolean",
  "default_value": false,
  "description": "Sidebar collassata di default",
  "is_public": true,
  "order": 50
}
```

### 3.6 Show Breadcrumbs
```json
{
  "key": "ui.show_breadcrumbs",
  "type": "boolean",
  "default_value": true,
  "description": "Mostra breadcrumbs navigazione",
  "is_public": true,
  "order": 60
}
```

### 3.7 Dashboard Refresh Interval
```json
{
  "key": "ui.dashboard_refresh_interval",
  "type": "number",
  "default_value": 60,
  "min_value": 10,
  "max_value": 300,
  "description": "Intervallo refresh dashboard (secondi)",
  "is_public": false,
  "order": 70
}
```

### 3.8 Favicon
```json
{
  "key": "ui.favicon",
  "type": "file",
  "default_value": null,
  "description": "Favicon del sito",
  "is_public": true,
  "order": 80
}
```

---

## 4. Warehouse Settings (`group: warehouse`)

### 4.1 Low Stock Threshold
```json
{
  "key": "warehouse.low_stock_threshold",
  "type": "number",
  "default_value": 10,
  "min_value": 1,
  "max_value": 1000,
  "description": "Soglia di stock minimo per alert",
  "is_public": false,
  "order": 10
}
```

### 4.2 Enable Notifications
```json
{
  "key": "warehouse.enable_notifications",
  "type": "boolean",
  "default_value": true,
  "description": "Abilita notifiche magazzino",
  "is_public": false,
  "order": 20
}
```

### 4.3 Auto-Reorder
```json
{
  "key": "warehouse.auto_reorder",
  "type": "boolean",
  "default_value": false,
  "description": "Riordino automatico prodotti sotto soglia",
  "is_public": false,
  "order": 30
}
```

### 4.4 Default Warehouse
```json
{
  "key": "warehouse.default_warehouse_id",
  "type": "number",
  "default_value": null,
  "description": "Magazzino di default per nuovi movimenti",
  "is_public": false,
  "order": 40
}
```

### 4.5 Stock Valuation Method
```json
{
  "key": "warehouse.stock_valuation_method",
  "type": "enum",
  "allowed_values": ["FIFO", "LIFO", "Average Cost"],
  "default_value": "FIFO",
  "description": "Metodo valutazione scorte",
  "is_public": false,
  "order": 50
}
```

### 4.6 Allow Negative Stock
```json
{
  "key": "warehouse.allow_negative_stock",
  "type": "boolean",
  "default_value": false,
  "description": "Permetti stock negativo",
  "is_public": false,
  "order": 60
}
```

---

## 5. Email Settings (`group: email`)

### 5.1 Email Enabled
```json
{
  "key": "email.enabled",
  "type": "boolean",
  "default_value": true,
  "description": "Abilita invio email",
  "is_public": false,
  "order": 10
}
```

### 5.2 From Address
```json
{
  "key": "email.from_address",
  "type": "email",
  "default_value": "noreply@dggm.it",
  "description": "Indirizzo email mittente",
  "is_public": false,
  "order": 20
}
```

### 5.3 From Name
```json
{
  "key": "email.from_name",
  "type": "string",
  "default_value": "DGGM ERP",
  "description": "Nome mittente email",
  "is_public": false,
  "order": 30
}
```

### 5.4 Reply To
```json
{
  "key": "email.reply_to",
  "type": "email",
  "default_value": "info@dggm.it",
  "description": "Indirizzo reply-to",
  "is_public": false,
  "order": 40
}
```

### 5.5 Admin Email
```json
{
  "key": "email.admin_email",
  "type": "email",
  "default_value": "admin@dggm.it",
  "description": "Email amministratore sistema",
  "is_public": false,
  "order": 50
}
```

---

## 6. Notification Settings (`group: notifications`)

### 6.1 Enabled Channels
```json
{
  "key": "notifications.channels",
  "type": "json",
  "default_value": ["database", "mail"],
  "description": "Canali notifica abilitati",
  "is_public": false,
  "order": 10
}
```

### 6.2 Low Stock Alert
```json
{
  "key": "notifications.low_stock_alert",
  "type": "boolean",
  "default_value": true,
  "description": "Abilita alert stock basso",
  "is_public": false,
  "order": 20
}
```

### 6.3 DDT Confirmation Alert
```json
{
  "key": "notifications.ddt_confirmation",
  "type": "boolean",
  "default_value": true,
  "description": "Abilita notifica conferma DDT",
  "is_public": false,
  "order": 30
}
```

---

## 7. File Settings (`group: files`)

### 7.1 Max Upload Size
```json
{
  "key": "files.max_upload_size",
  "type": "number",
  "default_value": 10,
  "min_value": 1,
  "max_value": 100,
  "description": "Dimensione massima upload (MB)",
  "is_public": false,
  "order": 10
}
```

### 7.2 Allowed Extensions
```json
{
  "key": "files.allowed_extensions",
  "type": "json",
  "default_value": ["pdf", "jpg", "jpeg", "png", "xlsx", "docx"],
  "description": "Estensioni file consentite",
  "is_public": false,
  "order": 20
}
```

### 7.3 Storage Path
```json
{
  "key": "files.storage_path",
  "type": "string",
  "default_value": "uploads",
  "description": "Path storage file (relativo a storage/app)",
  "is_public": false,
  "order": 30
}
```

---

## 8. Feature Flags (`group: features`, `is_feature_flag: true`)

### 8.1 GPS Tracking
```json
{
  "key": "features.enable_gps_tracking",
  "type": "boolean",
  "default_value": true,
  "description": "Abilita tracciamento GPS per timbrature",
  "is_feature_flag": true,
  "order": 10
}
```

### 8.2 Material Requests
```json
{
  "key": "features.enable_material_requests",
  "type": "boolean",
  "default_value": true,
  "description": "Abilita sistema richieste materiali",
  "is_feature_flag": true,
  "order": 20
}
```

### 8.3 Semantic Search
```json
{
  "key": "features.enable_semantic_search",
  "type": "boolean",
  "default_value": true,
  "description": "Abilita ricerca semantica AI per prodotti",
  "is_feature_flag": true,
  "order": 30
}
```

### 8.4 PDF Generation
```json
{
  "key": "features.enable_pdf_generation",
  "type": "boolean",
  "default_value": true,
  "description": "Abilita generazione PDF preventivi/fatture",
  "is_feature_flag": true,
  "order": 40
}
```

### 8.5 Notifications
```json
{
  "key": "features.enable_notifications",
  "type": "boolean",
  "default_value": true,
  "description": "Abilita notifiche sistema",
  "is_feature_flag": true,
  "order": 50
}
```

### 8.6 Quotes Module
```json
{
  "key": "features.enable_quotes",
  "type": "boolean",
  "default_value": true,
  "description": "Abilita modulo preventivi",
  "is_feature_flag": true,
  "order": 60
}
```

### 8.7 Invoicing Module
```json
{
  "key": "features.enable_invoicing",
  "type": "boolean",
  "default_value": true,
  "description": "Abilita modulo fatturazione",
  "is_feature_flag": true,
  "order": 70
}
```

### 8.8 SAL Module
```json
{
  "key": "features.enable_sal",
  "type": "boolean",
  "default_value": true,
  "description": "Abilita modulo stati avanzamento lavori",
  "is_feature_flag": true,
  "order": 80
}
```

### 8.9 Vehicle Tracking
```json
{
  "key": "features.enable_vehicle_tracking",
  "type": "boolean",
  "default_value": false,
  "description": "Abilita tracciamento veicoli aziendali",
  "is_feature_flag": true,
  "order": 90
}
```

### 8.10 Customer Portal
```json
{
  "key": "features.enable_customer_portal",
  "type": "boolean",
  "default_value": false,
  "description": "Abilita portale clienti",
  "is_feature_flag": true,
  "order": 100
}
```

---

## 9. User-Specific Settings (Examples)

These settings are stored with `user_id` set to a specific user.

### 9.1 User Theme Preference
```json
{
  "key": "user.theme",
  "type": "enum",
  "allowed_values": ["light", "dark", "auto"],
  "default_value": "auto",
  "description": "Tema preferito utente",
  "user_id": 123,
  "is_public": false
}
```

### 9.2 User Language
```json
{
  "key": "user.locale",
  "type": "enum",
  "allowed_values": ["it", "en", "fr", "de"],
  "default_value": "it",
  "description": "Lingua preferita utente",
  "user_id": 123,
  "is_public": false
}
```

### 9.3 User Notifications
```json
{
  "key": "user.enable_notifications",
  "type": "boolean",
  "default_value": true,
  "description": "Abilita notifiche per questo utente",
  "user_id": 123,
  "is_public": false
}
```

### 9.4 User Items Per Page
```json
{
  "key": "user.items_per_page",
  "type": "number",
  "default_value": 20,
  "min_value": 5,
  "max_value": 100,
  "description": "Elementi per pagina preferiti",
  "user_id": 123,
  "is_public": false
}
```

---

## 📋 Implementation Checklist

### Phase 1: Core Settings (Priority 1)
- [x] app.name
- [x] app.timezone
- [x] app.locale
- [x] company.name
- [x] company.vat
- [x] company.email
- [x] warehouse.low_stock_threshold
- [x] email.enabled
- [x] email.from_address

### Phase 2: UI Settings (Priority 2)
- [ ] ui.primary_color
- [ ] ui.secondary_color
- [ ] ui.theme
- [ ] ui.items_per_page
- [ ] ui.sidebar_collapsed

### Phase 3: Feature Flags (Priority 1)
- [x] features.enable_gps_tracking
- [x] features.enable_material_requests
- [x] features.enable_semantic_search
- [x] features.enable_pdf_generation
- [x] features.enable_notifications
- [ ] features.enable_quotes
- [ ] features.enable_invoicing
- [ ] features.enable_sal
- [ ] features.enable_vehicle_tracking
- [ ] features.enable_customer_portal

### Phase 4: Advanced Settings (Priority 3)
- [ ] warehouse.auto_reorder
- [ ] warehouse.stock_valuation_method
- [ ] files.max_upload_size
- [ ] files.allowed_extensions
- [ ] company.logo (Spatie Media)
- [ ] ui.favicon (Spatie Media)

### Phase 5: User Settings (Priority 2)
- [ ] user.theme
- [ ] user.locale
- [ ] user.enable_notifications
- [ ] user.items_per_page

---

## 🎨 UI Grouping Suggestions

### Settings Page Tabs:

1. **General** (5 settings)
   - App name, timezone, locale, date format, currency

2. **Company** (10 settings)
   - Company info, logo, contact details, bank info

3. **Appearance** (8 settings)
   - Colors, theme, layout, favicon

4. **Warehouse** (6 settings)
   - Stock management, alerts, valuation

5. **Email & Notifications** (8 settings)
   - Email config, notification channels

6. **Files** (3 settings)
   - Upload limits, allowed types

7. **Feature Flags** (10 settings)
   - Toggle modules on/off

8. **User Preferences** (4 settings)
   - Personal settings (user-specific)

---

**Total Settings**: 45 global + unlimited user-specific
**Groups**: 8
**Types Used**: string, number, boolean, email, url, color, enum, json, file
**Feature Flags**: 10

**Version**: 1.0
**Last Updated**: February 2026
