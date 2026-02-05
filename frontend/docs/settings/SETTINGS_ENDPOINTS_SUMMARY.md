# Settings API - Endpoints Quick Reference

Quick reference guide for all Settings & Feature Flags endpoints.

**Base URL**: `/api/v1/settings`

---

## 📋 Complete Endpoints List

### Standard CRUD

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| **GET** | `/api/v1/settings` | List all settings (with filters) | ✅ |
| **POST** | `/api/v1/settings` | Create new setting | ✅ |
| **GET** | `/api/v1/settings/{id}` | Get single setting | ✅ |
| **PUT/PATCH** | `/api/v1/settings/{id}` | Update setting | ✅ |
| **DELETE** | `/api/v1/settings/{id}` | Delete setting | ✅ |

---

### Advanced Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| **GET** | `/api/v1/settings/types` | Get all setting types | ✅ |
| **GET** | `/api/v1/settings/grouped` | Get settings grouped by category | ✅ |
| **GET** | `/api/v1/settings/key/{key}` | Get value by key (simplified) | ✅ |
| **POST** | `/api/v1/settings/key/{key}` | Set value by key (simplified) | ✅ |
| **POST** | `/api/v1/settings/{id}/reset` | Reset to default value | ✅ |

---

### Feature Flags

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| **GET** | `/api/v1/settings/feature-flags` | Get all feature flags | ✅ |
| **GET** | `/api/v1/settings/feature-flags/enabled` | Get only enabled flags | ✅ |
| **POST** | `/api/v1/settings/feature-flags/{feature}/toggle` | Toggle feature on/off | ✅ |

---

## 🚀 Usage Examples (cURL)

### 1. Get All Settings

```bash
# Get all settings
curl -X GET "http://localhost:8000/api/v1/settings" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by group
curl -X GET "http://localhost:8000/api/v1/settings?group=features" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get user-specific settings
curl -X GET "http://localhost:8000/api/v1/settings?user_id=5" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get global settings only
curl -X GET "http://localhost:8000/api/v1/settings?user_id=null" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get public settings
curl -X GET "http://localhost:8000/api/v1/settings?is_public=true" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Search by key
curl -X GET "http://localhost:8000/api/v1/settings?search=email" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 2. Create Setting

```bash
# Create string setting
curl -X POST "http://localhost:8000/api/v1/settings" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "app.name",
    "value": "DGGM ERP",
    "type": "string",
    "group": "general",
    "is_public": true,
    "description": "Application name"
  }'

# Create color setting with validation
curl -X POST "http://localhost:8000/api/v1/settings" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "ui.primary_color",
    "value": "#3B82F6",
    "type": "color",
    "group": "ui",
    "validation_rules": ["regex:/^#[0-9A-Fa-f]{6}$/"],
    "default_value": "#3B82F6"
  }'

# Create ENUM setting
curl -X POST "http://localhost:8000/api/v1/settings" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "ui.theme",
    "value": "dark",
    "type": "enum",
    "group": "ui",
    "allowed_values": ["light", "dark", "auto"],
    "default_value": "auto"
  }'

# Create NUMBER setting with range
curl -X POST "http://localhost:8000/api/v1/settings" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "files.max_upload_size",
    "value": 10,
    "type": "number",
    "group": "files",
    "min_value": 1,
    "max_value": 100,
    "description": "Max upload size (MB)"
  }'
```

---

### 3. Update Setting

```bash
# Full update
curl -X PUT "http://localhost:8000/api/v1/settings/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "app.name",
    "value": "DGGM ERP Pro",
    "type": "string",
    "group": "general"
  }'

# Partial update
curl -X PATCH "http://localhost:8000/api/v1/settings/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "DGGM ERP 2.0"
  }'
```

---

### 4. Get Setting by Key (Simplified)

```bash
# Get global setting
curl -X GET "http://localhost:8000/api/v1/settings/key/app.name" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get user setting
curl -X GET "http://localhost:8000/api/v1/settings/key/ui.theme?user_id=5" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response
{
  "success": true,
  "data": {
    "key": "app.name",
    "value": "DGGM ERP"
  }
}
```

---

### 5. Set Setting by Key (Simplified)

```bash
# Set global setting
curl -X POST "http://localhost:8000/api/v1/settings/key/app.name" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "DGGM ERP 2.0",
    "group": "general",
    "is_public": true
  }'

# Set user-specific setting
curl -X POST "http://localhost:8000/api/v1/settings/key/ui.theme" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "dark",
    "user_id": 5
  }'
```

---

### 6. Get Setting Types

```bash
curl -X GET "http://localhost:8000/api/v1/settings/types" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response
{
  "success": true,
  "data": [
    {
      "value": "string",
      "label": "Text",
      "validation": ["string"]
    },
    {
      "value": "color",
      "label": "Color (Hex)",
      "validation": ["string", "regex:/^#[0-9A-Fa-f]{6}$/"]
    },
    ...
  ]
}
```

---

### 7. Get Grouped Settings

```bash
# Get all grouped
curl -X GET "http://localhost:8000/api/v1/settings/grouped" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get grouped for user
curl -X GET "http://localhost:8000/api/v1/settings/grouped?user_id=5" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response
{
  "success": true,
  "data": [
    {
      "group": "general",
      "count": 5,
      "settings": [...]
    },
    {
      "group": "features",
      "count": 10,
      "settings": [...]
    }
  ]
}
```

---

### 8. Feature Flags - Get All

```bash
# Get all feature flags
curl -X GET "http://localhost:8000/api/v1/settings/feature-flags" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get user-specific feature flags
curl -X GET "http://localhost:8000/api/v1/settings/feature-flags?user_id=5" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response
{
  "success": true,
  "data": [
    {
      "id": 10,
      "key": "features.enable_gps_tracking",
      "value": "1",
      "type": "boolean",
      "is_feature_flag": true,
      ...
    }
  ]
}
```

---

### 9. Feature Flags - Get Enabled Only

```bash
curl -X GET "http://localhost:8000/api/v1/settings/feature-flags/enabled" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 10. Feature Flags - Toggle

```bash
# Toggle global feature
curl -X POST "http://localhost:8000/api/v1/settings/feature-flags/enable_gps_tracking/toggle" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Toggle user-specific feature
curl -X POST "http://localhost:8000/api/v1/settings/feature-flags/beta_features/toggle?user_id=5" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response
{
  "success": true,
  "data": {
    "id": 10,
    "key": "features.enable_gps_tracking",
    "value": "0",
    ...
  },
  "message": "Feature flag toggled successfully"
}
```

---

### 11. Reset to Default

```bash
curl -X POST "http://localhost:8000/api/v1/settings/1/reset" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response
{
  "success": true,
  "data": {
    "id": 1,
    "key": "app.name",
    "value": "DGGM ERP",
    ...
  },
  "message": "Setting reset to default value"
}
```

---

### 12. Delete Setting

```bash
curl -X DELETE "http://localhost:8000/api/v1/settings/1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response (204)
{
  "success": true,
  "message": "Setting deleted successfully"
}
```

---

## 📊 Query Parameters Summary

### GET `/api/v1/settings`

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `group` | string | Filter by group | `?group=features` |
| `user_id` | int\|null | Filter by user (null=global) | `?user_id=5` or `?user_id=null` |
| `is_public` | boolean | Filter by public visibility | `?is_public=true` |
| `search` | string | Search in key field | `?search=email` |

### Feature Flags Endpoints

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `user_id` | int\|null | User filter | `?user_id=5` or `?user_id=null` |

---

## 🔐 Authorization

All endpoints require authentication via Sanctum Bearer token.

**Required Permissions**:
- `settings.view` - View settings
- `settings.create` - Create settings
- `settings.edit` - Update settings
- `settings.delete` - Delete settings
- `settings.view-global` - View global settings
- `settings.edit-global` - Edit global settings (SuperAdmin only)

---

## 📝 Response Format (Standard)

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response (422)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "key": ["The key field is required."]
  }
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Setting not found"
}
```

---

## 🎯 Common Use Cases

### 1. Settings Page UI

```typescript
// Get grouped settings for tabs
GET /api/v1/settings/grouped

// Update setting on save
PATCH /api/v1/settings/{id}

// Reset to default
POST /api/v1/settings/{id}/reset
```

### 2. Feature Flags Page

```typescript
// Get all flags
GET /api/v1/settings/feature-flags

// Toggle on user click
POST /api/v1/settings/feature-flags/{feature}/toggle
```

### 3. User Preferences

```typescript
// Get user theme
GET /api/v1/settings/key/ui.theme?user_id=5

// Set user theme
POST /api/v1/settings/key/ui.theme
Body: { "value": "dark", "user_id": 5 }
```

### 4. App Configuration

```typescript
// Get app name
GET /api/v1/settings/key/app.name

// Check feature enabled
GET /api/v1/settings/feature-flags/enabled
```

---

## 📚 Related Files

- **Full Documentation**: `SETTINGS_API_DOCUMENTATION.md`
- **Settings Catalog**: `SETTINGS_CATALOG.md`
- **Backend Controller**: `app/Http/Controllers/Api/V1/SettingController.php`
- **Frontend Hooks**: See `SETTINGS_API_DOCUMENTATION.md` for React examples

---

**Total Endpoints**: 13
**Authentication**: Required for all
**Rate Limiting**: 60 req/min per user

**Version**: 1.0
**Last Updated**: February 2026
