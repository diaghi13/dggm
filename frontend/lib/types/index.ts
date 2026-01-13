// User & Auth Types
export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  roles: string[];
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

// Customer Types
export type CustomerType = 'individual' | 'company';

export interface Customer {
  id: number;
  type: CustomerType;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  display_name: string;
  vat_number: string | null;
  tax_code: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string;
  payment_terms: string;
  discount_percentage: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerFormData {
  type: CustomerType;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  vat_number?: string | null;
  tax_code?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  payment_terms?: string | null;
  discount_percentage?: number | null;
  notes?: string | null;
  is_active?: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// Site Types
export type SiteStatus = 'draft' | 'planned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
export type SitePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Media {
  id: number;
  collection_name: string;
  name: string;
  file_name: string;
  mime_type: string;
  size: number;
  human_readable_size: string;
  url: string;
  type: string;
  description?: string;
  created_at: string;
}

export interface Site {
  id: number;
  code: string;
  name: string;
  customer_id: number;
  customer?: {
    id: number;
    display_name: string;
    type: CustomerType;
  };
  description: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  gps_radius: number;
  project_manager_id: number | null;
  project_manager?: {
    id: number;
    name: string;
    email: string;
  };
  quote_id: number | null;
  quote?: {
    id: number;
    code: string;
    title: string;
    total_amount: string;
    status: string;
  };
  status: SiteStatus;
  priority?: SitePriority;
  start_date: string | null;
  estimated_end_date: string | null;
  actual_end_date: string | null;
  estimated_amount: string;
  actual_cost: string;
  invoiced_amount: string;
  margin: string;
  margin_percentage: string;
  full_address: string;
  notes: string | null;
  internal_notes?: string | null;
  media?: Media[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteFormData {
  code?: string;
  name: string;
  customer_id: number;
  description?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  gps_radius?: number;
  project_manager_id?: number;
  quote_id?: number;
  status?: SiteStatus;
  priority?: SitePriority;
  start_date?: string;
  estimated_end_date?: string;
  actual_end_date?: string;
  estimated_amount?: number;
  actual_cost?: number;
  invoiced_amount?: number;
  notes?: string;
  internal_notes?: string;
  is_active?: boolean;
}

// Supplier Types
export interface Supplier {
  id: number;
  company_name: string;
  vat_number: string | null;
  tax_code: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string;
  full_address: string;
  payment_terms: string | null;
  delivery_terms: string | null;
  discount_percentage: string;
  iban: string | null;
  bank_name: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierFormData {
  company_name: string;
  vat_number?: string;
  tax_code?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  payment_terms?: string;
  delivery_terms?: string;
  discount_percentage?: number;
  iban?: string;
  bank_name?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
  is_active?: boolean;
}

// Quote Types
export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired' | 'converted';
export type QuoteItemType = 'section' | 'item' | 'labor' | 'material';

export interface QuoteItem {
  id: number;
  quote_id: number;
  parent_id: number | null;
  type: QuoteItemType;
  code: string | null;
  sort_order: number;
  description: string;
  unit: string | null;
  quantity: number | null;
  unit_price: number | null;
  hide_unit_price?: boolean;
  subtotal: number;
  discount_percentage: number;
  discount_amount: number;
  total: number;
  notes: string | null;
  children?: QuoteItem[];
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: number;
  code: string;
  title: string;
  description?: string | null;
  customer_id: number;
  customer?: {
    id: number;
    display_name: string;
    type: CustomerType;
  };
  project_manager_id: number | null;
  project_manager?: {
    id: number;
    name: string;
    email: string;
  };
  status: QuoteStatus;
  issue_date: string;
  valid_until?: string | null;
  expiry_date: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  subtotal: number | string;
  discount_percentage: number;
  discount_amount: number | string;
  tax_percentage: number;
  tax_amount: number | string;
  tax_included?: boolean;
  show_tax?: boolean;
  show_unit_prices?: boolean;
  total_amount: number | string;
  notes: string | null;
  terms_and_conditions?: string | null;
  footer_text?: string | null;
  full_address?: string | null;
  payment_method?: string | null;
  payment_terms?: string | null;
  is_active: boolean;
  items?: QuoteItem[];
  attachments?: any[];
  site_id?: number | null;
  site?: {
    id: number;
    code: string;
    name: string;
    status: SiteStatus;
  };
  created_at: string;
  updated_at: string;
}

export interface QuoteFormData {
  title: string;
  customer_id: number;
  project_manager_id?: number;
  status?: QuoteStatus;
  issue_date: string;
  expiry_date?: string;
  discount_percentage?: number;
  tax_percentage?: number;
  notes?: string;
  is_active?: boolean;
}

// DDT (Documento Di Trasporto) Types
export type DdtType =
  | 'incoming'
  | 'outgoing'
  | 'internal'
  | 'rental_out'
  | 'rental_return'
  | 'return_from_customer'
  | 'return_to_supplier';

export type DdtStatus = 'draft' | 'issued' | 'in_transit' | 'delivered' | 'cancelled';

export type ReturnReason =
  | 'defective'
  | 'wrong_item'
  | 'excess'
  | 'warranty'
  | 'customer_dissatisfaction'
  | 'other';

export interface DdtItem {
  id: number;
  ddt_id: number;
  material_id: number;
  material?: {
    id: number;
    code: string;
    name: string;
    unit: string;
    category: string;
  };
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ddt {
  id: number;
  code: string;
  type: DdtType;
  status: DdtStatus;

  // Relationships
  supplier_id: number | null;
  supplier?: {
    id: number;
    name: string;
    code: string;
  };
  customer_id: number | null;
  customer?: {
    id: number;
    name: string;
    code: string;
  };
  site_id: number | null;
  site?: {
    id: number;
    code: string;
    name: string;
  };
  from_warehouse_id: number;
  from_warehouse?: {
    id: number;
    code: string;
    name: string;
  };
  to_warehouse_id: number | null;
  to_warehouse?: {
    id: number;
    code: string;
    name: string;
  };

  // DDT Data
  ddt_number: string;
  ddt_date: string;
  transport_date: string | null;
  delivered_at: string | null;
  carrier_name: string | null;
  tracking_number: string | null;

  // Rental
  rental_start_date: string | null;
  rental_end_date: string | null;
  rental_actual_return_date: string | null;
  parent_ddt_id: number | null;

  // Returns
  return_reason: ReturnReason | null;
  return_notes: string | null;

  notes: string | null;

  // Items
  items?: DdtItem[];

  // Stock Movements
  stock_movements_count?: number;

  // User
  created_by: number;
  created_by_user?: {
    id: number;
    name: string;
  };

  // Computed
  total_items: number;
  total_quantity: number;
  can_be_confirmed: boolean;
  can_be_cancelled: boolean;
  is_delivered: boolean;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DdtFormData {
  code?: string;
  type: DdtType;
  supplier_id?: number | null;
  customer_id?: number | null;
  site_id?: number | null;
  from_warehouse_id: number;
  to_warehouse_id?: number | null;
  ddt_number: string;
  ddt_date: string;
  transport_date?: string | null;
  carrier_name?: string | null;
  tracking_number?: string | null;
  rental_start_date?: string | null;
  rental_end_date?: string | null;
  parent_ddt_id?: number | null;
  return_reason?: ReturnReason | null;
  return_notes?: string | null;
  notes?: string | null;
  items: Array<{
    id?: number;
    material_id: number;
    quantity: number;
    unit: string;
    unit_cost?: number;
    notes?: string | null;
  }>;
}

// Material Types
export type MaterialType = 'physical' | 'service' | 'kit';
export type DependencyType = 'container' | 'accessory' | 'cable' | 'consumable' | 'tool';
export type QuantityCalculationType = 'fixed' | 'ratio' | 'formula';

export interface MaterialComponent {
  id: number;
  kit_material_id: number;
  component_material_id: number;
  component_material?: {
    id: number;
    code: string;
    name: string;
    unit: string;
    purchase_price: number;
  };
  quantity: number;
  notes: string | null;
  total_cost: number;
  created_at: string;
  updated_at: string;
}

export interface MaterialDependency {
  id: number;
  material_id: number;
  dependency_material_id: number;
  dependency_material?: {
    id: number;
    code: string;
    name: string;
    unit: string;
    purchase_price: number;
  };
  dependency_type: DependencyType;
  quantity_type: QuantityCalculationType;
  quantity_value: string;
  is_visible_in_quote: boolean;
  is_required_for_stock: boolean;
  is_optional: boolean;
  min_quantity_trigger: number | null;
  max_quantity_trigger: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: number;
  code: string;
  name: string;
  description: string | null;
  category: string;
  product_type: MaterialType;
  is_kit: boolean;
  is_rentable: boolean;
  quantity_out_on_rental: number;
  unit: string;
  standard_cost: number;
  purchase_price: number;
  markup_percentage: number;
  sale_price: number;
  rental_price_daily: number;
  rental_price_weekly: number;
  rental_price_monthly: number;
  barcode: string | null;
  qr_code: string | null;
  default_supplier_id: number | null;
  default_supplier?: {
    id: number;
    company_name: string;
  };
  reorder_level: number;
  reorder_quantity: number;
  lead_time_days: number;
  location: string | null;
  notes: string | null;
  is_active: boolean;

  // Relationships
  components?: MaterialComponent[];
  dependencies?: MaterialDependency[];

  // Computed
  total_stock?: number;
  total_reserved?: number;
  available_stock?: number;
  kit_total_cost?: number;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MaterialFormData {
  code?: string;
  name: string;
  description?: string | null;
  category?: string;
  product_type?: MaterialType;
  is_kit?: boolean;
  is_rentable?: boolean;
  unit?: string;
  standard_cost?: number;
  purchase_price?: number;
  markup_percentage?: number;
  sale_price?: number;
  rental_price_daily?: number;
  rental_price_weekly?: number;
  rental_price_monthly?: number;
  barcode?: string | null;
  qr_code?: string | null;
  default_supplier_id?: number | null;
  reorder_level?: number;
  reorder_quantity?: number;
  lead_time_days?: number;
  location?: string | null;
  notes?: string | null;
  is_active?: boolean;

  // Components for kit creation
  components?: Array<{
    component_material_id: number;
    quantity: number;
    notes?: string | null;
  }>;
}

// Stock Movement Types
export type MovementType = 'intake' | 'output' | 'transfer' | 'adjustment';

export interface StockMovement {
  id: number;
  type: MovementType;
  material_id: number;
  material?: {
    id: number;
    code: string;
    name: string;
    unit: string;
    category: string;
  };
  warehouse_id: number;
  warehouse?: {
    id: number;
    code: string;
    name: string;
  };
  from_warehouse_id?: number;
  from_warehouse?: {
    id: number;
    code: string;
    name: string;
  };
  to_warehouse_id?: number;
  to_warehouse?: {
    id: number;
    code: string;
    name: string;
  };
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  supplier_id?: number;
  supplier?: {
    id: number;
    company_name: string;
  };
  site_id?: number;
  site?: {
    id: number;
    code: string;
    name: string;
  };
  ddt_id?: number;
  supplier_document?: string;
  movement_date: string;
  notes?: string;
  created_by: number;
  created_by_user?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface StockMovementFormData {
  type: MovementType;
  material_id: number;
  warehouse_id?: number;
  from_warehouse_id?: number;
  to_warehouse_id?: number;
  quantity: number;
  unit_cost?: number;
  supplier_id?: number;
  site_id?: number;
  supplier_document?: string;
  movement_date: string;
  notes?: string;
}
