import { apiClient } from "./client";

export interface SupplierCatalogRow {
  code: string;
  name: string;
  purchase_price: number;
  unit?: string | null;
  brand?: string | null;
  category?: string | null;
  description?: string | null;
  ean?: string | null;
  etim_code?: string | null;
  barcode?: string | null;
  supplier_product_code?: string | null;
  supplier_ean?: string | null;
  wholesale_price?: number | null;
  retail_price?: number | null;
  discount_family?: string | null;
  manual_discount_1?: number | null;
  manual_discount_2?: number | null;
  manual_discount_3?: number | null;
  package_quantity?: number | null;
  minimum_order_quantity?: number | null;
  maximum_order_quantity?: number | null;
  multiple_order_quantity?: number | null;
  lead_time_days?: number | null;
  payment_term?: string | null;
  price_multiplier?: number | null;
  currency?: string | null;
  is_active?: boolean;
}

export interface SupplierCatalogImportData {
  supplier_id: number;
  rows: SupplierCatalogRow[];
}

export interface SupplierCatalogImportResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export const supplierCatalogApi = {
  /**
   * Importa catalogo fornitore con prezzi e condizioni
   * Crea prodotti + relazioni fornitore
   * POST /import/supplier-catalog
   */
  importCatalog: async (
    data: SupplierCatalogImportData,
  ): Promise<SupplierCatalogImportResult> => {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: SupplierCatalogImportResult;
    }>("/import/supplier-catalog", data);
    return response.data.data;
  },
};
