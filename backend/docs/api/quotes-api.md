# Quotes API Documentation

Complete API reference for the DGGM ERP Quotes module.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL & Response Format](#base-url--response-format)
4. [Endpoints](#endpoints)
   - [List Quotes](#get-apiv1quotes)
   - [Get Quote](#get-apiv1quotesid)
   - [Create Quote](#post-apiv1quotes)
   - [Update Quote](#put-apiv1quotesid)
   - [Delete Quote](#delete-apiv1quotesid)
   - [Change Status](#patch-apiv1quotesidstatus)
   - [Approve Quote](#post-apiv1quotesidapprove)
   - [Reject Quote](#post-apiv1quotesidreject)
   - [Send Quote](#post-apiv1quotesidsend)
   - [Convert to Site](#post-apiv1quotesidconvert-to-site)
   - [Generate & Save PDF](#post-apiv1quotesidsave-pdf)
   - [Download PDF](#get-apiv1quotesidpdfdownload)
   - [Preview PDF](#get-apiv1quotesidpdfpreview)
5. [Frontend Integration Examples](#frontend-integration-examples)
6. [Error Handling](#error-handling)
7. [TypeScript Types](#typescript-types)

---

## Overview

The Quotes API provides complete management of customer quotes (preventivi) in the DGGM ERP system.

**Features:**
- CRUD operations for quotes
- Status workflow management (draft → sent → approved/rejected)
- PDF generation (save, download, preview)
- Conversion to construction sites
- Advanced filtering and pagination
- Full relationship loading (customer, items, price lists, etc.)

**Technology:**
- Laravel 12 REST API
- Laravel Sanctum authentication
- Spatie Laravel Data for validation & responses
- Query/Action pattern for business logic

---

## Authentication

All Quote API endpoints require **Laravel Sanctum** token-based authentication.

### Get Authentication Token

```bash
POST /api/v1/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "token": "1|abc123defghijklmnopqrstuvwxyz",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com"
  }
}
```

### Using the Token

Include the token in the `Authorization` header for all subsequent requests:

```http
Authorization: Bearer 1|abc123defghijklmnopqrstuvwxyz
Accept: application/json
```

---

## Base URL & Response Format

### Base URL

```
http://localhost:8000/api/v1
```

**Production**: Replace with your production domain.

### Standard Response Format

#### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

#### Paginated Response

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 150,
    "last_page": 10,
    "from": 1,
    "to": 15
  },
  "links": {
    "first": "http://localhost:8000/api/v1/quotes?page=1",
    "last": "http://localhost:8000/api/v1/quotes?page=10",
    "prev": null,
    "next": "http://localhost:8000/api/v1/quotes?page=2"
  }
}
```

#### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field_name": ["Validation error message"]
  }
}
```

---

## Endpoints

### GET /api/v1/quotes

List all quotes with pagination and advanced filtering.

**Authorization:** Required (`quotes.viewAny` permission)

#### Query Parameters

| Parameter | Type | Required | Description | Default |
|-----------|------|----------|-------------|---------|
| `status` | string | No | Filter by status (`draft`, `sent`, `approved`, `rejected`, `expired`, `converted`) | - |
| `customer_id` | integer | No | Filter by customer ID | - |
| `project_manager_id` | integer | No | Filter by project manager user ID | - |
| `is_active` | boolean | No | Filter by active status | - |
| `search` | string | No | Search in code or title | - |
| `from_date` | date | No | Filter quotes from this date (YYYY-MM-DD) | - |
| `to_date` | date | No | Filter quotes to this date (YYYY-MM-DD) | - |
| `sort_by` | string | No | Sort field (`code`, `title`, `issue_date`, `total_amount`, `created_at`) | `created_at` |
| `sort_order` | string | No | Sort order (`asc`, `desc`) | `desc` |
| `per_page` | integer | No | Items per page (max 100) | 15 |

#### Example Request (cURL)

```bash
curl -X GET "http://localhost:8000/api/v1/quotes?status=draft&customer_id=5&per_page=20&sort_by=code" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

#### Example Request (JavaScript fetch)

```javascript
const response = await fetch('/api/v1/quotes?status=draft&per_page=20', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
  },
});
const data = await response.json();
```

#### Example Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "Q-2026-0001",
      "title": "Impianto elettrico completo",
      "description": "Rifacimento impianto elettrico appartamento 100mq",
      "status": "draft",
      "customer_id": 5,
      "project_manager_id": 2,
      "issue_date": "2026-02-10",
      "expiry_date": "2026-03-12",
      "sent_date": null,
      "approved_date": null,
      "subtotal": 1000.00,
      "discount_percentage": 10.00,
      "discount_amount": 100.00,
      "tax_percentage": 22.00,
      "tax_amount": 198.00,
      "total_amount": 1098.00,
      "address": "Via Roma 123",
      "city": "Milano",
      "province": "MI",
      "postal_code": "20100",
      "customer": {
        "id": 5,
        "name": "Rossi Impianti Srl",
        "email": "info@rossiimpianti.it"
      },
      "items": [
        {
          "id": 1,
          "quote_id": 1,
          "product_id": 10,
          "description": "Centralino quadro elettrico",
          "quantity": 1,
          "unit_price": 450.00,
          "total": 450.00
        },
        {
          "id": 2,
          "quote_id": 1,
          "product_id": 11,
          "description": "Punti luce",
          "quantity": 20,
          "unit_price": 27.50,
          "total": 550.00
        }
      ]
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 42,
    "last_page": 3,
    "from": 1,
    "to": 20
  },
  "links": {
    "first": "http://localhost:8000/api/v1/quotes?page=1",
    "last": "http://localhost:8000/api/v1/quotes?page=3",
    "prev": null,
    "next": "http://localhost:8000/api/v1/quotes?page=2"
  }
}
```

#### Error Responses

**401 Unauthorized** - Missing or invalid token
```json
{
  "message": "Unauthenticated."
}
```

**403 Forbidden** - Insufficient permissions
```json
{
  "success": false,
  "message": "This action is unauthorized."
}
```

---

### GET /api/v1/quotes/{id}

Get a single quote by ID with all related data.

**Authorization:** Required (`quotes.view` permission)

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Quote ID |

#### Example Request (cURL)

```bash
curl -X GET "http://localhost:8000/api/v1/quotes/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

#### Example Request (JavaScript fetch)

```javascript
const response = await fetch(`/api/v1/quotes/${quoteId}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
  },
});
const quote = await response.json();
```

#### Example Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "Q-2026-0001",
    "title": "Impianto elettrico completo",
    "description": "Rifacimento impianto elettrico appartamento 100mq",
    "status": "sent",
    "customer_id": 5,
    "project_manager_id": 2,
    "price_list_id": 1,
    "payment_term_id": 2,
    "warranty_type_id": 1,
    "issue_date": "2026-02-10",
    "expiry_date": "2026-03-12",
    "sent_date": "2026-02-11T10:30:00.000000Z",
    "approved_date": null,
    "subtotal": 1000.00,
    "discount_percentage": 10.00,
    "discount_amount": 100.00,
    "tax_percentage": 22.00,
    "tax_amount": 198.00,
    "total_amount": 1098.00,
    "deposit_percentage": 30.00,
    "deposit_amount": 329.40,
    "address": "Via Roma 123",
    "city": "Milano",
    "province": "MI",
    "postal_code": "20100",
    "work_start_date": "2026-03-01",
    "work_end_date": "2026-03-15",
    "work_start_description": "Inizio lavori previsto per marzo",
    "work_duration_description": "15 giorni lavorativi",
    "show_tax": true,
    "tax_included": false,
    "show_unit_prices": true,
    "show_product_codes": true,
    "notes": "Cliente richiede preavviso di 3 giorni",
    "terms_and_conditions": "Pagamento: 30% acconto, saldo a fine lavori",
    "footer_text": "Grazie per la preferenza",
    "customer": {
      "id": 5,
      "name": "Rossi Impianti Srl",
      "email": "info@rossiimpianti.it",
      "phone": "+39 02 12345678"
    },
    "projectManager": {
      "id": 2,
      "name": "Mario Bianchi",
      "email": "mario@example.com"
    },
    "priceList": {
      "id": 1,
      "name": "Listino Standard 2026"
    },
    "paymentTerm": {
      "id": 2,
      "name": "30% acconto + saldo",
      "days": 0
    },
    "warrantyType": {
      "id": 1,
      "name": "Garanzia 24 mesi"
    },
    "items": [
      {
        "id": 1,
        "quote_id": 1,
        "product_id": 10,
        "product_code": "CENTR-001",
        "description": "Centralino quadro elettrico",
        "quantity": 1,
        "unit": "pz",
        "unit_price": 450.00,
        "discount_percentage": 0,
        "discount_amount": 0,
        "tax_percentage": 22.00,
        "total": 450.00
      },
      {
        "id": 2,
        "quote_id": 1,
        "product_id": 11,
        "product_code": "LUCE-002",
        "description": "Punti luce",
        "quantity": 20,
        "unit": "pz",
        "unit_price": 27.50,
        "discount_percentage": 0,
        "discount_amount": 0,
        "tax_percentage": 22.00,
        "total": 550.00
      }
    ]
  }
}
```

#### Error Responses

**404 Not Found** - Quote not found
```json
{
  "success": false,
  "message": "Quote not found"
}
```

---

### POST /api/v1/quotes

Create a new quote.

**Authorization:** Required (`quotes.create` permission)

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Quote title (max 255 chars) |
| `customer_id` | integer | Yes | Customer ID (must exist) |
| `project_manager_id` | integer | No | User ID for project manager |
| `description` | string | No | Detailed description |
| `address` | string | No | Site address (max 255 chars) |
| `city` | string | No | City (max 100 chars) |
| `province` | string | No | Province code (2 chars, e.g., "MI") |
| `postal_code` | string | No | Postal code (max 20 chars) |
| `status` | string | No | Status (`draft`, `sent`, `approved`, `rejected`, `expired`, `converted`) - default: `draft` |
| `issue_date` | date | No | Issue date (YYYY-MM-DD) |
| `expiry_date` | date | No | Expiry date (must be after issue_date) |
| `price_list_id` | integer | No | Price list ID |
| `payment_term_id` | integer | No | Payment term ID |
| `warranty_type_id` | integer | No | Warranty type ID |
| `subtotal` | float | No | Subtotal amount (min 0) |
| `discount_percentage` | float | No | Discount percentage (0-100) |
| `discount_amount` | float | No | Discount amount (min 0) |
| `tax_percentage` | float | No | Tax percentage (0-100) - default: 22 |
| `tax_amount` | float | No | Tax amount (min 0) |
| `total_amount` | float | No | Total amount (min 0) |
| `deposit_percentage` | float | No | Deposit percentage (0-100) |
| `deposit_amount` | float | No | Deposit amount (min 0) |
| `work_start_date` | date | No | Work start date |
| `work_end_date` | date | No | Work end date (must be after work_start_date) |
| `work_start_description` | string | No | Description of work start (max 1000 chars) |
| `work_duration_description` | string | No | Duration description (max 500 chars) |
| `show_tax` | boolean | No | Show tax in PDF - default: true |
| `tax_included` | boolean | No | Tax included in prices - default: false |
| `show_unit_prices` | boolean | No | Show unit prices - default: true |
| `show_product_codes` | boolean | No | Show product codes - default: true |
| `notes` | string | No | Internal notes |
| `terms_and_conditions` | string | No | Terms and conditions text |
| `footer_text` | string | No | Footer text (max 1000 chars) |

#### Example Request (cURL)

```bash
curl -X POST "http://localhost:8000/api/v1/quotes" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "title": "Impianto elettrico villa",
    "customer_id": 5,
    "project_manager_id": 2,
    "description": "Rifacimento completo impianto elettrico villa 200mq",
    "address": "Via Roma 123",
    "city": "Milano",
    "province": "MI",
    "postal_code": "20100",
    "issue_date": "2026-02-10",
    "expiry_date": "2026-03-12",
    "subtotal": 2500.00,
    "discount_percentage": 10,
    "tax_percentage": 22,
    "deposit_percentage": 30,
    "work_start_date": "2026-03-01",
    "work_duration_description": "30 giorni lavorativi",
    "notes": "Cliente richiede preavviso 3 giorni"
  }'
```

#### Example Request (JavaScript fetch)

```javascript
const createQuote = async (data) => {
  const response = await fetch('/api/v1/quotes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return response.json();
};

// Usage
const newQuote = await createQuote({
  title: 'Impianto elettrico villa',
  customer_id: 5,
  project_manager_id: 2,
  subtotal: 2500.00,
  tax_percentage: 22,
});
```

#### Example Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": 42,
    "code": "Q-2026-0042",
    "title": "Impianto elettrico villa",
    "status": "draft",
    "customer_id": 5,
    "project_manager_id": 2,
    "subtotal": 2500.00,
    "discount_percentage": 10.00,
    "discount_amount": 250.00,
    "tax_percentage": 22.00,
    "tax_amount": 495.00,
    "total_amount": 2745.00,
    "deposit_percentage": 30.00,
    "deposit_amount": 823.50,
    "created_at": "2026-02-10T14:22:30.000000Z",
    "updated_at": "2026-02-10T14:22:30.000000Z"
  },
  "message": "Preventivo creato con successo"
}
```

#### Error Responses

**422 Unprocessable Entity** - Validation errors
```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {
    "title": ["The title field is required."],
    "customer_id": ["The selected customer id is invalid."],
    "expiry_date": ["The expiry date must be a date after or equal to issue date."]
  }
}
```

---

### PUT /api/v1/quotes/{id}

Update an existing quote.

**Authorization:** Required (`quotes.update` permission)

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Quote ID |

#### Request Body

Same as [Create Quote](#post-apiv1quotes), all fields optional except validation constraints.

#### Example Request (cURL)

```bash
curl -X PUT "http://localhost:8000/api/v1/quotes/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "title": "Impianto elettrico villa (aggiornato)",
    "discount_percentage": 15,
    "notes": "Cliente ha richiesto sconto maggiore"
  }'
```

#### Example Request (JavaScript fetch)

```javascript
const updateQuote = async (quoteId, updates) => {
  const response = await fetch(`/api/v1/quotes/${quoteId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  return response.json();
};

// Usage
await updateQuote(1, {
  discount_percentage: 15,
  notes: 'Cliente ha richiesto sconto maggiore'
});
```

#### Example Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "Q-2026-0001",
    "title": "Impianto elettrico villa (aggiornato)",
    "discount_percentage": 15.00,
    "discount_amount": 375.00,
    "notes": "Cliente ha richiesto sconto maggiore",
    "updated_at": "2026-02-10T15:10:45.000000Z"
  },
  "message": "Preventivo aggiornato con successo"
}
```

---

### DELETE /api/v1/quotes/{id}

Soft delete a quote (can be restored later).

**Authorization:** Required (`quotes.delete` permission)

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Quote ID |

#### Example Request (cURL)

```bash
curl -X DELETE "http://localhost:8000/api/v1/quotes/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

#### Example Request (JavaScript fetch)

```javascript
const deleteQuote = async (quoteId) => {
  const response = await fetch(`/api/v1/quotes/${quoteId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  return response.status === 204;
};

// Usage
const deleted = await deleteQuote(1);
```

#### Example Response (204 No Content)

```json
{
  "success": true,
  "message": "Preventivo eliminato con successo"
}
```

**Note:** Returns 204 status but includes JSON body for frontend convenience.

---

### PATCH /api/v1/quotes/{id}/status

Generic status change endpoint (delegates to specific actions).

**Authorization:** Required (`quotes.update` permission)

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Quote ID |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | Yes | New status (`draft`, `sent`, `approved`, `rejected`, `expired`, `converted`) |

**Note:** This endpoint delegates to specific actions:
- `sent` → `SendQuoteAction`
- `approved` → `ApproveQuoteAction`
- `rejected` → `RejectQuoteAction`
- Other statuses throw `InvalidArgumentException`

#### Example Request (cURL)

```bash
curl -X PATCH "http://localhost:8000/api/v1/quotes/1/status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"status": "sent"}'
```

#### Example Request (JavaScript fetch)

```javascript
const changeStatus = async (quoteId, newStatus) => {
  const response = await fetch(`/api/v1/quotes/${quoteId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ status: newStatus }),
  });

  return response.json();
};

// Usage
await changeStatus(1, 'sent');
```

#### Example Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "Q-2026-0001",
    "status": "sent",
    "sent_date": "2026-02-10T16:22:00.000000Z"
  },
  "message": "Stato preventivo aggiornato a 'sent'"
}
```

---

### POST /api/v1/quotes/{id}/approve

Approve the quote (sets status to `approved` and records approval date).

**Authorization:** Required (`quotes.approve` permission)

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Quote ID |

#### Example Request (cURL)

```bash
curl -X POST "http://localhost:8000/api/v1/quotes/1/approve" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

#### Example Request (JavaScript fetch)

```javascript
const approveQuote = async (quoteId) => {
  const response = await fetch(`/api/v1/quotes/${quoteId}/approve`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  return response.json();
};

// Usage
await approveQuote(1);
```

#### Example Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "Q-2026-0001",
    "status": "approved",
    "approved_date": "2026-02-10T17:05:22.000000Z"
  },
  "message": "Preventivo approvato con successo"
}
```

---

### POST /api/v1/quotes/{id}/reject

Reject the quote (sets status to `rejected`).

**Authorization:** Required (`quotes.reject` permission)

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Quote ID |

#### Example Request (cURL)

```bash
curl -X POST "http://localhost:8000/api/v1/quotes/1/reject" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

#### Example Request (JavaScript fetch)

```javascript
const rejectQuote = async (quoteId) => {
  const response = await fetch(`/api/v1/quotes/${quoteId}/reject`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  return response.json();
};

// Usage
await rejectQuote(1);
```

#### Example Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "Q-2026-0001",
    "status": "rejected"
  },
  "message": "Preventivo rifiutato"
}
```

---

### POST /api/v1/quotes/{id}/send

Send quote to customer (sets status to `sent` and records sent date).

**Authorization:** Required (`quotes.send` permission)

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Quote ID |

#### Example Request (cURL)

```bash
curl -X POST "http://localhost:8000/api/v1/quotes/1/send" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

#### Example Request (JavaScript fetch)

```javascript
const sendQuote = async (quoteId) => {
  const response = await fetch(`/api/v1/quotes/${quoteId}/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  return response.json();
};

// Usage
await sendQuote(1);
```

#### Example Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "Q-2026-0001",
    "status": "sent",
    "sent_date": "2026-02-10T18:30:15.000000Z"
  },
  "message": "Preventivo inviato al cliente"
}
```

---

### POST /api/v1/quotes/{id}/convert-to-site

Convert an approved quote to a construction site.

**Authorization:** Required (`quotes.convertToSite` permission)

**Requirements:**
- Quote must have status `approved`
- Quote cannot already be converted

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Quote ID |

#### Example Request (cURL)

```bash
curl -X POST "http://localhost:8000/api/v1/quotes/1/convert-to-site" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

#### Example Request (JavaScript fetch)

```javascript
const convertToSite = async (quoteId) => {
  const response = await fetch(`/api/v1/quotes/${quoteId}/convert-to-site`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  return response.json();
};

// Usage
const result = await convertToSite(1);
console.log('New site ID:', result.data.site_id);
```

#### Example Response (200 OK)

```json
{
  "success": true,
  "data": {
    "quote": {
      "id": 1,
      "code": "Q-2026-0001",
      "status": "converted",
      "site_id": 42
    },
    "site_id": 42
  },
  "message": "Preventivo convertito in cantiere con successo"
}
```

#### Error Response (400 Bad Request)

```json
{
  "success": false,
  "message": "Il preventivo deve essere approvato prima della conversione"
}
```

---

### POST /api/v1/quotes/{id}/save-pdf

Generate quote PDF and save it to media library.

**Authorization:** Required (`quotes.generatePdf` permission)

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Quote ID |

#### Example Request (cURL)

```bash
curl -X POST "http://localhost:8000/api/v1/quotes/1/save-pdf" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

#### Example Request (JavaScript fetch)

```javascript
const savePdf = async (quoteId) => {
  const response = await fetch(`/api/v1/quotes/${quoteId}/save-pdf`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  return response.json();
};

// Usage
const result = await savePdf(1);
console.log('PDF URL:', result.data.pdf_url);
```

#### Example Response (200 OK)

```json
{
  "success": true,
  "data": {
    "pdf_url": "http://localhost:8000/storage/1/quote-Q-2026-0001.pdf",
    "file_name": "quote-Q-2026-0001.pdf"
  },
  "message": "PDF generato con successo"
}
```

---

### GET /api/v1/quotes/{id}/pdf/download

Download quote PDF as file attachment.

**Authorization:** Required (`quotes.generatePdf` permission)

**Response Type:** `application/pdf` (binary stream)

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Quote ID |

#### Example Request (cURL)

```bash
curl -X GET "http://localhost:8000/api/v1/quotes/1/pdf/download" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o "quote-Q-2026-0001.pdf"
```

#### Example Request (JavaScript fetch)

```javascript
const downloadPdf = async (quoteId) => {
  const response = await fetch(`/api/v1/quotes/${quoteId}/pdf/download`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `quote-${quoteId}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

// Usage
await downloadPdf(1);
```

#### Response Headers

```http
Content-Type: application/pdf
Content-Disposition: attachment; filename="quote-Q-2026-0001.pdf"
```

---

### GET /api/v1/quotes/{id}/pdf/preview

Preview quote PDF inline in browser.

**Authorization:** Required (`quotes.generatePdf` permission)

**Response Type:** `application/pdf` (binary stream)

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Quote ID |

#### Example Request (Browser)

Simply navigate to the URL or use in an `<iframe>`:

```html
<iframe
  src="http://localhost:8000/api/v1/quotes/1/pdf/preview"
  width="100%"
  height="800px"
  title="Quote Preview"
></iframe>
```

#### Example Request (JavaScript fetch - open in new tab)

```javascript
const previewPdf = (quoteId) => {
  window.open(
    `/api/v1/quotes/${quoteId}/pdf/preview`,
    '_blank'
  );
};

// Usage
previewPdf(1);
```

#### Response Headers

```http
Content-Type: application/pdf
Content-Disposition: inline; filename="quote-Q-2026-0001.pdf"
```

---

## Frontend Integration Examples

### React Query Hooks

```typescript
// lib/api/quotes.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = '/api/v1';

// Type definitions
interface Quote {
  id: number;
  code: string;
  title: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired' | 'converted';
  customer_id: number;
  total_amount: number;
  // ... other fields
}

interface QuoteFilters {
  status?: string;
  customer_id?: number;
  search?: string;
  per_page?: number;
}

// API client
const quotesApi = {
  getAll: async (filters?: QuoteFilters) => {
    const params = new URLSearchParams(filters as any);
    const response = await fetch(`${API_BASE}/quotes?${params}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) throw new Error('Failed to fetch quotes');
    return response.json();
  },

  getById: async (id: number) => {
    const response = await fetch(`${API_BASE}/quotes/${id}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) throw new Error('Failed to fetch quote');
    return response.json();
  },

  create: async (data: Partial<Quote>) => {
    const response = await fetch(`${API_BASE}/quotes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return response.json();
  },

  update: async (id: number, data: Partial<Quote>) => {
    const response = await fetch(`${API_BASE}/quotes/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to update quote');
    return response.json();
  },

  delete: async (id: number) => {
    const response = await fetch(`${API_BASE}/quotes/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) throw new Error('Failed to delete quote');
    return response.json();
  },

  approve: async (id: number) => {
    const response = await fetch(`${API_BASE}/quotes/${id}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) throw new Error('Failed to approve quote');
    return response.json();
  },

  reject: async (id: number) => {
    const response = await fetch(`${API_BASE}/quotes/${id}/reject`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) throw new Error('Failed to reject quote');
    return response.json();
  },

  send: async (id: number) => {
    const response = await fetch(`${API_BASE}/quotes/${id}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) throw new Error('Failed to send quote');
    return response.json();
  },

  convertToSite: async (id: number) => {
    const response = await fetch(`${API_BASE}/quotes/${id}/convert-to-site`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) throw new Error('Failed to convert quote');
    return response.json();
  },

  savePdf: async (id: number) => {
    const response = await fetch(`${API_BASE}/quotes/${id}/save-pdf`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) throw new Error('Failed to generate PDF');
    return response.json();
  },
};

// React Query Hooks
export function useQuotes(filters?: QuoteFilters) {
  return useQuery({
    queryKey: ['quotes', filters],
    queryFn: () => quotesApi.getAll(filters),
  });
}

export function useQuote(id: number) {
  return useQuery({
    queryKey: ['quotes', id],
    queryFn: () => quotesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: quotesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export function useUpdateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Quote> }) =>
      quotesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quotes', variables.id] });
    },
  });
}

export function useDeleteQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: quotesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export function useApproveQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: quotesApi.approve,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quotes', id] });
    },
  });
}

export function useSendQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: quotesApi.send,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quotes', id] });
    },
  });
}

// Helper function to get token (implement based on your auth system)
function getToken(): string {
  // Example: retrieve from localStorage, Zustand store, etc.
  return localStorage.getItem('auth_token') || '';
}
```

### Usage in Components

```typescript
// components/quotes-list.tsx
'use client';

import { useQuotes, useDeleteQuote } from '@/lib/api/quotes';
import { Button } from '@/components/ui/button';

export function QuotesList() {
  const { data, isLoading, error } = useQuotes({ status: 'draft', per_page: 20 });
  const deleteQuote = useDeleteQuote();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading quotes</div>;

  const handleDelete = async (id: number) => {
    if (confirm('Delete this quote?')) {
      await deleteQuote.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-4">
      {data?.data.map((quote) => (
        <div key={quote.id} className="border p-4 rounded">
          <h3>{quote.title}</h3>
          <p>Code: {quote.code}</p>
          <p>Total: €{quote.total_amount.toFixed(2)}</p>
          <Button
            variant="destructive"
            onClick={() => handleDelete(quote.id)}
          >
            Delete
          </Button>
        </div>
      ))}
    </div>
  );
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| `200` | OK | Successful GET, PUT, POST (non-create) |
| `201` | Created | Successful POST (create) |
| `204` | No Content | Successful DELETE |
| `400` | Bad Request | Invalid request (e.g., can't convert non-approved quote) |
| `401` | Unauthorized | Missing or invalid authentication token |
| `403` | Forbidden | Authenticated but insufficient permissions |
| `404` | Not Found | Resource not found |
| `422` | Unprocessable Entity | Validation errors |
| `500` | Internal Server Error | Server-side error |

### Error Response Format

#### Validation Errors (422)

```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {
    "title": ["The title field is required."],
    "customer_id": ["The selected customer id is invalid."],
    "expiry_date": ["The expiry date must be a date after or equal to issue date."]
  }
}
```

#### Authorization Error (403)

```json
{
  "success": false,
  "message": "This action is unauthorized."
}
```

#### Authentication Error (401)

```json
{
  "message": "Unauthenticated."
}
```

#### Not Found Error (404)

```json
{
  "success": false,
  "message": "Quote not found"
}
```

#### Business Logic Error (400)

```json
{
  "success": false,
  "message": "Il preventivo deve essere approvato prima della conversione"
}
```

### Error Handling in Frontend

```typescript
// lib/api/error-handler.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new ApiError(
      response.status,
      errorData.message || 'An error occurred',
      errorData.errors
    );
  }

  return response.json();
}

// Usage in component
import { ApiError } from '@/lib/api/error-handler';

try {
  await createQuote.mutateAsync(data);
} catch (error) {
  if (error instanceof ApiError) {
    if (error.status === 422 && error.errors) {
      // Handle validation errors
      Object.entries(error.errors).forEach(([field, messages]) => {
        form.setError(field, { message: messages[0] });
      });
    } else {
      // Handle other errors
      toast.error(error.message);
    }
  }
}
```

---

## TypeScript Types

Complete TypeScript type definitions for the Quotes API.

```typescript
// lib/types/quote.ts

export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'converted';

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface PriceList {
  id: number;
  name: string;
}

export interface PaymentTerm {
  id: number;
  name: string;
  days: number;
}

export interface WarrantyType {
  id: number;
  name: string;
}

export interface Site {
  id: number;
  code: string;
  name: string;
}

export interface QuoteItem {
  id: number;
  quote_id: number;
  product_id?: number;
  product_code?: string;
  description: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  discount_percentage: number;
  discount_amount: number;
  tax_percentage: number;
  total: number;
}

export interface Quote {
  // Core fields
  id: number;
  code: string;
  title: string;
  description?: string;
  status: QuoteStatus;

  // References
  customer_id: number;
  project_manager_id?: number;
  price_list_id?: number;
  payment_term_id?: number;
  warranty_type_id?: number;
  site_id?: number;

  // Dates
  issue_date?: string;
  expiry_date?: string;
  sent_date?: string;
  approved_date?: string;

  // Address
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  full_address?: string;

  // Amounts
  subtotal: number;
  discount_percentage: number;
  discount_amount: number;
  tax_percentage: number;
  tax_amount: number;
  total_amount: number;
  deposit_percentage?: number;
  deposit_amount?: number;

  // Work details
  work_start_date?: string;
  work_end_date?: string;
  work_start_description?: string;
  work_duration_description?: string;

  // Display flags
  show_tax: boolean;
  tax_included: boolean;
  show_unit_prices: boolean;
  show_product_codes: boolean;
  show_vat: boolean;
  vat_included_in_prices: boolean;
  include_terms_and_conditions: boolean;

  // Text fields
  notes?: string;
  terms_and_conditions?: string;
  footer_text?: string;

  // Relationships (optional - loaded on demand)
  customer?: Customer;
  projectManager?: User;
  priceList?: PriceList;
  paymentTerm?: PaymentTerm;
  warrantyType?: WarrantyType;
  site?: Site;
  items?: QuoteItem[];

  // Timestamps
  created_at?: string;
  updated_at?: string;
}

export interface QuoteInput {
  title: string;
  customer_id: number;
  project_manager_id?: number;
  description?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  status?: QuoteStatus;
  issue_date?: string;
  expiry_date?: string;
  price_list_id?: number;
  payment_term_id?: number;
  warranty_type_id?: number;
  subtotal?: number;
  discount_percentage?: number;
  discount_amount?: number;
  tax_percentage?: number;
  tax_amount?: number;
  total_amount?: number;
  deposit_percentage?: number;
  deposit_amount?: number;
  work_start_date?: string;
  work_end_date?: string;
  work_start_description?: string;
  work_duration_description?: string;
  show_tax?: boolean;
  tax_included?: boolean;
  show_unit_prices?: boolean;
  show_product_codes?: boolean;
  notes?: string;
  terms_and_conditions?: string;
  footer_text?: string;
}

export interface QuoteFilters {
  status?: QuoteStatus;
  customer_id?: number;
  project_manager_id?: number;
  is_active?: boolean;
  search?: string;
  from_date?: string;
  to_date?: string;
  sort_by?: 'code' | 'title' | 'issue_date' | 'total_amount' | 'created_at';
  sort_order?: 'asc' | 'desc';
  per_page?: number;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}
```

---

## Summary

This documentation covers all 13 endpoints of the Quotes API:

1. ✅ **GET** `/quotes` - List with filters & pagination
2. ✅ **GET** `/quotes/{id}` - Get single quote with relationships
3. ✅ **POST** `/quotes` - Create new quote
4. ✅ **PUT** `/quotes/{id}` - Update existing quote
5. ✅ **DELETE** `/quotes/{id}` - Soft delete quote
6. ✅ **PATCH** `/quotes/{id}/status` - Generic status change
7. ✅ **POST** `/quotes/{id}/approve` - Approve quote
8. ✅ **POST** `/quotes/{id}/reject` - Reject quote
9. ✅ **POST** `/quotes/{id}/send` - Send to customer
10. ✅ **POST** `/quotes/{id}/convert-to-site` - Convert to construction site
11. ✅ **POST** `/quotes/{id}/save-pdf` - Generate & save PDF
12. ✅ **GET** `/quotes/{id}/pdf/download` - Download PDF
13. ✅ **GET** `/quotes/{id}/pdf/preview` - Preview PDF inline

**Key Features:**
- Complete request/response examples (cURL + JavaScript)
- React Query integration with TypeScript
- Comprehensive error handling
- Full TypeScript type definitions
- Real-world usage examples

**Last Updated:** February 10, 2026
**API Version:** v1
**Laravel Version:** 12
