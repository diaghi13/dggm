# Supplier Catalog Excel Import - Column Mapping

This document describes the expected Excel column format for importing supplier product catalogs.

## Overview

The import system supports flexible column naming with aliases. It automatically maps manufacturer pricing fields and standardizes units of measure.

## Required Columns

| Column | Aliases | Required | Description | Example |
|--------|---------|----------|-------------|---------|
| `code` | - | ✅ Yes | Product code (manufacturer code) | `LV426426` |
| `name` | `description` | ✅ Yes | Product name | `Interruttore magnetotermico` |

## Product Information (Optional)

| Column | Aliases | Required | Description | Example |
|--------|---------|----------|-------------|---------|
| `brand` | `brand_code`, `brand_name` | ⚪ Optional | Brand identifier (code, name, or ID) | `BTicino`, `BTI` |
| `category` | `category_code`, `category_name` | ⚪ Optional | Category (code, name, or ID) | `Elettrico`, `ELETT` |
| `ean` | `barcode` | ⚪ Optional | EAN/barcode | `8012199503486` |
| `etim_code` | - | ⚪ Optional | ETIM classification code | `EC002549` |
| `unit` | - | ⚪ Optional | Unit of measure (IT or EN) | `pz`, `piece`, `kg`, `meter`, `m` |
| `description` | - | ⚪ Optional | Long description | `Interruttore magnetotermico 2P 16A curva C` |

## Manufacturer Pricing (NEW - Optional)

These fields represent **manufacturer suggested prices** and are stored in the `products` table as reference values.

| Column | Aliases | Required | Description | Example |
|--------|---------|----------|-------------|---------|
| `manufacturer_cost_price` | `manufacturer_cost`, `cost_price` | ⚪ Optional | Manufacturer suggested cost to suppliers | `12.50` |
| `manufacturer_retail_price` | `manufacturer_retail`, `msrp`, `rrp` | ⚪ Optional | Manufacturer suggested retail price (MSRP/RRP) | `25.00` |
| `sale_markup_percent` | - | ⚪ Optional | Default markup percentage | `100.00` |

### Pricing Field Aliases

The import system automatically maps these aliases:

**Manufacturer Cost:**
- `manufacturer_cost_price` (exact)
- `manufacturer_cost` (alias)
- `cost_price` (alias)

**Manufacturer Retail:**
- `manufacturer_retail_price` (exact)
- `manufacturer_retail` (alias)
- `msrp` (alias - Manufacturer Suggested Retail Price)
- `rrp` (alias - Recommended Retail Price)

## Supplier-Specific Pricing (Optional)

These prices are specific to the supplier-product relationship and stored in the `supplier_product` pivot table.

| Column | Aliases | Required | Description | Example |
|--------|---------|----------|-------------|---------|
| `supplier` | `supplier_code`, `supplier_name` | ⚪ Optional | Supplier identifier (code, name, or ID) | `BTicino`, `SUP-00001` |
| `supplier_product_code` | `supplier_code` | ⚪ Optional | Supplier's product code | `F80M216` |
| `purchase_price` | - | ⚪ Optional | Actual purchase price from this supplier | `10.50` |
| `wholesale_price` | - | ⚪ Optional | Wholesale price | `15.00` |
| `retail_price` | - | ⚪ Optional | Retail price | `22.00` |

## Unit of Measure Mapping

The system uses `ProductUnitType::findByAlias()` to map supplier units to standard codes.

**Supported Units:**

| IT (Italian) | EN (English) | Code | Category |
|--------------|--------------|------|----------|
| `pz`, `pezzo`, `pezzi` | `piece`, `pce`, `pc`, `unit` | `pz` | Quantity |
| `kg`, `chilogrammo`, `chilogrammi` | `kilogram`, `kilo` | `kg` | Weight |
| `mt`, `metro`, `metri` | `meter`, `m`, `metre` | `mt` | Length |
| `lt`, `litro`, `litri` | `liter`, `l`, `litre` | `lt` | Volume |
| `mq`, `metro quadro` | `square meter`, `sqm`, `m2` | `mq` | Area |
| `mc`, `metro cubo` | `cubic meter`, `cbm`, `m3` | `mc` | Volume |

### Default Unit

If the unit cannot be mapped, the system defaults to **`pz`** (piece).

## Packaging & Ordering (Optional)

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| `package_quantity` | ⚪ Optional | Items per package | `10` |
| `minimum_order_quantity` | ⚪ Optional | Minimum order quantity | `1` |
| `maximum_order_quantity` | ⚪ Optional | Maximum order quantity | `100` |
| `multiple_order_quantity` | ⚪ Optional | Order quantity must be multiple of | `5` |
| `lead_time_days` | ⚪ Optional | Delivery lead time in days | `7` |

## Discounts (Optional)

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| `discount_family` | ⚪ Optional | Discount family code | `COM1` |
| `manual_discount_1` | ⚪ Optional | First discount percentage | `10.00` |
| `manual_discount_2` | ⚪ Optional | Second discount percentage | `5.00` |
| `manual_discount_3` | ⚪ Optional | Third discount percentage | `2.00` |

## Example Excel Rows

### Minimal Import (Required Fields Only)

| code | name |
|------|------|
| `LV426426` | `Interruttore magnetotermico 2P 16A` |

### Full Import (All Fields)

| code | name | brand | category | ean | unit | manufacturer_cost | msrp | supplier | purchase_price | wholesale_price | retail_price |
|------|------|-------|----------|-----|------|-------------------|------|----------|----------------|-----------------|--------------|
| `LV426426` | `Interruttore magnetotermico 2P 16A` | `BTicino` | `Elettrico` | `8012199503486` | `pz` | `12.50` | `25.00` | `BTicino` | `10.50` | `15.00` | `22.00` |

## How Pricing Works

### Manufacturer Prices (Reference)

Stored in the `products` table:

- **`manufacturer_cost_price`**: What the manufacturer suggests suppliers should pay
- **`manufacturer_retail_price`**: What the manufacturer suggests for retail (MSRP/RRP)
- **`sale_markup_percent`**: Default markup percentage

These are **reference values** used for guidance. They don't affect actual calculations.

### Supplier Prices (Actual)

Stored in the `supplier_product` pivot table:

- **`purchase_price`**: Actual price you pay this supplier (used for cost calculations)
- **`wholesale_price`**: Wholesale price (optional)
- **`retail_price`**: Retail price (optional)

### Price Priority

When both are provided:

1. **Supplier prices** take precedence for actual transactions
2. **Manufacturer prices** serve as reference for comparison/analysis

## Notes

- **Brand Auto-Creation**: If a brand doesn't exist, it will be automatically created
- **Category**: Must exist in the database (not auto-created)
- **Unit Normalization**: All unit variations are normalized to standard codes (`pz`, `kg`, `mt`, etc.)
- **Price Format**: Use decimal numbers (e.g., `12.50`, not currency symbols)
- **Boolean Values**: Use `1`/`0`, `true`/`false`, or `yes`/`no`

## Import Process

1. **Transform Virtual Fields**: Map brand/category names to IDs
2. **Extract Product Data**: Separate product fields from supplier fields
3. **Map Units**: Convert supplier unit strings to standard codes using `ProductUnitType::findByAlias()`
4. **Map Manufacturer Prices**: Apply aliases (`manufacturer_cost` → `manufacturer_cost_price`, `msrp` → `manufacturer_retail_price`)
5. **Find or Create Product**: Search by code, create if new
6. **Upsert Supplier Relationship**: Update supplier-specific pricing in pivot table

## Technical Implementation

### Files

- **Action**: `/app/Actions/SupplierProduct/ImportSupplierCatalogAction.php`
- **Product Model**: `/app/Models/Product.php` (`createOrUpdateFromSupplierData()`)
- **Unit Mapping**: `/app/Models/ProductUnitType.php` (`findByAlias()`)
- **Field Transformer**: `/app/Services/ImportFieldTransformer.php`

### Key Methods

```php
// Map unit aliases to standard codes
ProductUnitType::findByAlias('kg') // Returns ProductUnitType with code 'kg'
ProductUnitType::findByAlias('kilogram') // Same result
ProductUnitType::findByAlias('kilo') // Same result

// Extract and map manufacturer prices
$productData['manufacturer_cost_price'] = $row['manufacturer_cost'] ?? $row['cost_price'] ?? null;
$productData['manufacturer_retail_price'] = $row['manufacturer_retail'] ?? $row['msrp'] ?? $row['rrp'] ?? null;
```

---

**Last Updated**: February 2025
**Version**: 2.0 (New Pricing Architecture)
