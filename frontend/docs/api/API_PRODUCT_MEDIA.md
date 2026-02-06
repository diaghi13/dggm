# Product Media API Documentation

Complete API documentation for product media/document management using Spatie Media Library.

## Overview

The Product Media API allows managing images, technical sheets, certifications, manuals, drawings, and documents for products. It supports:

- Multiple media collections (images, technical sheets, certifications, manuals, drawings, documents)
- Image conversions (thumb, medium, responsive)
- Custom properties (flags, descriptions, document metadata)
- Mobile-optimized responses (thumbnail URLs for fast loading)
- File type validation and size limits
- Sort ordering

## Authentication

All endpoints require authentication via Laravel Sanctum:

```
Authorization: Bearer {token}
```

## Authorization

Media operations use the existing ProductPolicy:
- `products.view` - View media
- `products.edit` - Upload, update, delete media

## Collections

### Available Collections

| Collection | Purpose | Max Files | Max Size | Allowed Types |
|-----------|---------|-----------|----------|---------------|
| `images` | Product photos | 20 | 10MB | jpg, jpeg, png, webp |
| `technical_sheets` | Technical data sheets | 10 | 20MB | pdf, doc, docx, xls, xlsx |
| `certifications` | Product certifications | 10 | 20MB | pdf, doc, docx, xls, xlsx |
| `manuals` | User manuals | 10 | 20MB | pdf, doc, docx, xls, xlsx |
| `drawings` | Technical drawings | 10 | 50MB | pdf, dwg, dxf |
| `documents` | Generic documents | 10 | 20MB | pdf, doc, docx, xls, xlsx |

### Image Conversions

Images automatically generate these conversions:
- **thumb**: 150x150px (cropped)
- **medium**: 800x600px (max size)
- **responsive**: Multiple sizes for responsive images

## Endpoints

### 1. Get All Media for Product

Get all media grouped by collection.

**Endpoint**: `GET /api/v1/products/{product}/media`

**Authorization**: `products.view`

**Response**:
```json
{
  "success": true,
  "data": {
    "images": [
      {
        "id": 123,
        "collection_name": "images",
        "file_name": "prodotto-foto.jpg",
        "mime_type": "image/jpeg",
        "size": 245678,
        "url": "https://example.com/media/123/prodotto-foto.jpg",
        "thumb_url": "https://example.com/media/123/conversions/prodotto-foto-thumb.jpg",
        "medium_url": "https://example.com/media/123/conversions/prodotto-foto-medium.jpg",
        "description": "Vista frontale prodotto",
        "is_primary": true,
        "use_in_quotes": true,
        "use_in_projects": false,
        "sort_order": 1,
        "created_at": "2026-02-06T10:30:00Z"
      }
    ],
    "technical_sheets": [
      {
        "id": 124,
        "collection_name": "technical_sheets",
        "file_name": "scheda-tecnica.pdf",
        "mime_type": "application/pdf",
        "size": 1245678,
        "url": "https://example.com/media/124/scheda-tecnica.pdf",
        "thumb_url": null,
        "medium_url": null,
        "description": "Scheda tecnica completa",
        "document_type": "technical",
        "valid_until": "2025-12-31",
        "sort_order": 1,
        "created_at": "2026-02-06T10:35:00Z"
      }
    ],
    "certifications": [],
    "manuals": [],
    "drawings": [],
    "documents": []
  }
}
```

---

### 2. Upload Media

Upload a new file to a product.

**Endpoint**: `POST /api/v1/products/{product}/media`

**Authorization**: `products.edit`

**Content-Type**: `multipart/form-data`

**Request**:
```
file: (binary)
collection_name: "images" (required)
description: "Vista frontale prodotto" (optional)

# Image-specific (only for collection_name=images)
is_primary: true (optional, default: false)
use_in_quotes: true (optional, default: false)
use_in_projects: false (optional, default: false)

# Document-specific (for other collections)
document_type: "certification" (optional)
valid_until: "2025-12-31" (optional)

# Common
sort_order: 1 (optional, default: 0)
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "File caricato con successo.",
  "data": {
    "id": 123,
    "collection_name": "images",
    "file_name": "prodotto-foto.jpg",
    "mime_type": "image/jpeg",
    "size": 245678,
    "url": "https://example.com/media/123/prodotto-foto.jpg",
    "thumb_url": "https://example.com/media/123/conversions/prodotto-foto-thumb.jpg",
    "medium_url": "https://example.com/media/123/conversions/prodotto-foto-medium.jpg",
    "description": "Vista frontale prodotto",
    "is_primary": true,
    "use_in_quotes": true,
    "use_in_projects": false,
    "sort_order": 1,
    "created_at": "2026-02-06T10:30:00Z"
  }
}
```

**Errors**:
- `422 Unprocessable Entity` - Validation errors
  - File too large
  - Invalid file type
  - Collection limit reached
  - Invalid collection name

---

### 3. Get Single Media

Get details for a specific media item.

**Endpoint**: `GET /api/v1/products/{product}/media/{media}`

**Authorization**: `products.view`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "collection_name": "images",
    "file_name": "prodotto-foto.jpg",
    "mime_type": "image/jpeg",
    "size": 245678,
    "url": "https://example.com/media/123/prodotto-foto.jpg",
    "thumb_url": "https://example.com/media/123/conversions/prodotto-foto-thumb.jpg",
    "medium_url": "https://example.com/media/123/conversions/prodotto-foto-medium.jpg",
    "description": "Vista frontale prodotto",
    "is_primary": true,
    "use_in_quotes": true,
    "use_in_projects": false,
    "sort_order": 1,
    "created_at": "2026-02-06T10:30:00Z"
  }
}
```

---

### 4. Update Media Properties

Update custom properties (description, flags, order) of a media item. Cannot change the file itself.

**Endpoint**: `PUT /api/v1/products/{product}/media/{media}`

**Authorization**: `products.edit`

**Request**:
```json
{
  "description": "Nuova descrizione",
  "is_primary": true,
  "use_in_quotes": false,
  "use_in_projects": true,
  "sort_order": 2
}
```

**Response**:
```json
{
  "success": true,
  "message": "Proprietà aggiornate con successo.",
  "data": {
    "id": 123,
    "collection_name": "images",
    "file_name": "prodotto-foto.jpg",
    "mime_type": "image/jpeg",
    "size": 245678,
    "url": "https://example.com/media/123/prodotto-foto.jpg",
    "thumb_url": "https://example.com/media/123/conversions/prodotto-foto-thumb.jpg",
    "medium_url": "https://example.com/media/123/conversions/prodotto-foto-medium.jpg",
    "description": "Nuova descrizione",
    "is_primary": true,
    "use_in_quotes": false,
    "use_in_projects": true,
    "sort_order": 2,
    "created_at": "2026-02-06T10:30:00Z"
  }
}
```

**Notes**:
- When marking an image as `is_primary: true`, all other images are automatically unmarked
- All fields are optional - only provided fields will be updated

---

### 5. Delete Media

Permanently delete a media file.

**Endpoint**: `DELETE /api/v1/products/{product}/media/{media}`

**Authorization**: `products.edit`

**Response**:
```json
{
  "success": true,
  "message": "File eliminato con successo."
}
```

**Note**: This is a permanent deletion. The file is removed from disk.

---

### 6. Reorder Media

Update the sort order of a media item.

**Endpoint**: `POST /api/v1/products/{product}/media/{media}/reorder`

**Authorization**: `products.edit`

**Request**:
```json
{
  "order": 3
}
```

**Response**:
```json
{
  "success": true,
  "message": "Ordine aggiornato con successo.",
  "data": {
    "id": 123,
    "collection_name": "images",
    "file_name": "prodotto-foto.jpg",
    "mime_type": "image/jpeg",
    "size": 245678,
    "url": "https://example.com/media/123/prodotto-foto.jpg",
    "thumb_url": "https://example.com/media/123/conversions/prodotto-foto-thumb.jpg",
    "medium_url": "https://example.com/media/123/conversions/prodotto-foto-medium.jpg",
    "description": "Vista frontale prodotto",
    "is_primary": true,
    "use_in_quotes": true,
    "use_in_projects": false,
    "sort_order": 3,
    "created_at": "2026-02-06T10:30:00Z"
  }
}
```

---

## Custom Properties Schema

### For Images (`collection_name: "images"`)

```typescript
{
  is_primary: boolean          // Only one image can be primary
  use_in_quotes: boolean        // Show in customer quotes
  use_in_projects: boolean      // Show in project documentation
  description: string | null    // Image description
  sort_order: number            // Display order (0-indexed)
}
```

### For Documents (all other collections)

```typescript
{
  description: string | null     // Document description
  document_type: string | null   // Type classification (e.g., "certification", "manual")
  valid_until: string | null     // ISO date format (e.g., "2025-12-31")
  sort_order: number             // Display order (0-indexed)
}
```

---

## Helper Methods on Product Model

Use these methods to access media in your backend code:

```php
// Get primary image
$primaryImage = $product->getPrimaryImage();

// Get images for quotes
$quoteImages = $product->getImagesForQuotes();

// Get images for projects
$projectImages = $product->getImagesForProjects();

// Get technical sheets
$technicalSheets = $product->getTechnicalSheets();

// Get certifications
$certifications = $product->getCertifications();

// Get all media from a collection
$images = $product->getMedia('images');
$documents = $product->getMedia('documents');
```

---

## Frontend Integration

### Uploading Files

```typescript
import { apiClient } from '@/lib/api/client'

const uploadProductMedia = async (
  productId: number,
  file: File,
  data: {
    collection_name: string
    description?: string
    is_primary?: boolean
    use_in_quotes?: boolean
    use_in_projects?: boolean
  }
) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('collection_name', data.collection_name)

  if (data.description) formData.append('description', data.description)
  if (data.is_primary !== undefined) formData.append('is_primary', String(data.is_primary))
  if (data.use_in_quotes !== undefined) formData.append('use_in_quotes', String(data.use_in_quotes))
  if (data.use_in_projects !== undefined) formData.append('use_in_projects', String(data.use_in_projects))

  return apiClient.post(`/products/${productId}/media`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}
```

### Display Images (Mobile-Optimized)

```tsx
import Image from 'next/image'

interface ProductImageProps {
  media: ProductMedia
}

export function ProductImage({ media }: ProductImageProps) {
  return (
    <Image
      src={media.thumb_url || media.url}  // Use thumb for fast loading
      alt={media.description || media.file_name}
      width={150}
      height={150}
      className="rounded-lg object-cover"
    />
  )
}
```

---

## Error Responses

### Validation Error (422)

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": {
      "file": [
        "Tipo di file non valido per questa collezione."
      ],
      "collection_name": [
        "La collezione deve essere una tra: images, technical_sheets, certifications, manuals, drawings, documents."
      ]
    }
  }
}
```

### Limit Reached (422)

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": {
      "file": [
        "Limite massimo di 20 file raggiunto per questa collezione."
      ]
    }
  }
}
```

### Not Found (404)

```json
{
  "success": false,
  "error": {
    "message": "Media non trovato per questo prodotto.",
    "code": "NOT_FOUND"
  }
}
```

### Unauthorized (403)

```json
{
  "success": false,
  "error": {
    "message": "Non autorizzato.",
    "code": "FORBIDDEN"
  }
}
```

---

## TypeScript Types

Generated TypeScript types are available in the frontend:

```typescript
import type { ProductMediaData } from '@/types/laravel'

interface ProductMediaData {
  id: number
  collection_name: 'images' | 'technical_sheets' | 'certifications' | 'manuals' | 'drawings' | 'documents'
  file_name: string
  mime_type: string
  size: number
  url: string
  thumb_url: string | null
  medium_url: string | null
  description: string | null
  is_primary?: boolean
  use_in_quotes?: boolean
  use_in_projects?: boolean
  document_type?: string | null
  valid_until?: string | null
  sort_order: number
  created_at: string
}
```

---

## Notes

- **Mobile-friendly**: Thumbnail URLs are provided for fast loading on construction sites
- **Dark mode compatible**: All URLs work in both light and dark themes
- **Automatic cleanup**: Deleting media removes files from disk automatically
- **Conversions**: Images are automatically converted on upload (non-queued for immediate availability)
- **Primary image logic**: Only one image can be marked as primary per product
- **No duplicates**: Use `sort_order` to control display order

---

**Last Updated**: February 2026
**Version**: 1.0.0
