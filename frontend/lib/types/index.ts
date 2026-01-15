// User & Auth Types
export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  roles: string[];
  permissions: string[];
  worker?: {
    id: number;
    code: string;
    first_name: string;
    last_name: string;
    full_name: string;
  } | null;
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
  code: string;
  company_name: string;
  supplier_type: SupplierType;
  personnel_type?: PersonnelType | null;
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
  specializations?: string[];
  notes: string | null;
  is_active: boolean;
  provides_materials: boolean;
  provides_personnel: boolean;
  active_workers_count: number;
  rates?: ContractorRate[];
  workers?: Worker[];
  created_at: string;
  updated_at: string;
}

export interface SupplierFormData {
  company_name: string;
  supplier_type: SupplierType;
  personnel_type?: PersonnelType | null;
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
  specializations?: string[];
  notes?: string;
  is_active?: boolean;
  rates?: Array<{
    service_type: string;
    rate_type: RateType;
    rate_amount: number;
    currency?: string;
    minimum_hours?: number | null;
    minimum_amount?: number | null;
    is_forfait?: boolean;
    valid_from: string;
    notes?: string | null;
  }>;
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

// Worker & Supplier Types
export type WorkerType = 'employee' | 'freelancer' | 'external';
export type ContractType = 'permanent' | 'fixed_term' | 'seasonal' | 'project_based' | 'internship';
export type RateType = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'fixed_project';
export type RateContext = 'internal_cost' | 'customer_billing' | 'payroll';
export type PayrollFrequency = 'monthly' | 'biweekly' | 'weekly';
export type SupplierType = 'materials' | 'personnel' | 'both';
export type PersonnelType = 'cooperative' | 'staffing_agency' | 'rental_with_operator' | 'subcontractor' | 'technical_services';
export type LaborCostType = 'internal_labor' | 'subcontractor' | 'contractor';

export interface WorkerRate {
  id: number;
  worker_id: number;
  rate_type: RateType;
  context: RateContext;
  rate_amount: number;
  currency: string;
  project_type?: string | null;
  overtime_multiplier: number;
  holiday_multiplier: number;
  overtime_starts_after_hours?: number | null;
  overtime_starts_after_time?: string | null;
  recognizes_overtime: boolean;
  is_forfait: boolean;
  valid_from: string;
  valid_to: string | null;
  is_current: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkerPayrollData {
  gross_monthly_salary: number;
  net_monthly_salary: number;
  contract_level: string;
  ccnl_type: string;
  payroll_frequency: PayrollFrequency;
  inps_percentage: number;
  inail_percentage: number;
  irpef_percentage: number;
  meal_voucher_amount: number;
  transport_allowance: number;
  iban?: string | null;
  bank_name?: string | null;
  notes?: string | null;
}

export interface Worker {
  id: number;
  code: string;
  worker_type: WorkerType;
  contract_type: ContractType;
  first_name: string;
  last_name: string;
  full_name: string;
  display_name: string;
  tax_code?: string | null;
  vat_number?: string | null;
  birth_date?: string | null;
  birth_place?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country: string;
  supplier_id?: number | null;
  supplier?: {
    id: number;
    code: string;
    company_name: string;
    supplier_type: SupplierType;
  };
  user_id?: number | null;
  hire_date: string;
  termination_date?: string | null;
  contract_end_date?: string | null;
  job_title?: string | null;
  job_level?: string | null;
  specializations?: string[];
  certifications?: string[];
  is_active: boolean;
  can_drive_company_vehicles: boolean;
  has_safety_training: boolean;
  safety_training_expires_at?: string | null;
  safety_training_valid: boolean;
  notes?: string | null;
  internal_notes?: string | null;
  payment_notes?: string | null;
  payroll_data?: WorkerPayrollData;
  rates?: WorkerRate[];
  created_at: string;
  updated_at: string;
}

export interface WorkerFormData {
  worker_type: WorkerType;
  contract_type: ContractType;
  first_name: string;
  last_name: string;
  tax_code?: string | null;
  vat_number?: string | null;
  birth_date?: string | null;
  birth_place?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country?: string;
  supplier_id?: number | null;
  user_id?: number | null;
  hire_date: string;
  termination_date?: string | null;
  contract_end_date?: string | null;
  job_title?: string | null;
  job_level?: string | null;
  specializations?: string[];
  certifications?: string[];
  is_active?: boolean;
  can_drive_company_vehicles?: boolean;
  has_safety_training?: boolean;
  safety_training_expires_at?: string | null;
  notes?: string | null;
  internal_notes?: string | null;
  payment_notes?: string | null;
  payroll_data?: Partial<WorkerPayrollData>;
  rates?: Array<{
    rate_type: RateType;
    context: RateContext;
    rate_amount: number;
    currency?: string;
    project_type?: string | null;
    overtime_multiplier?: number;
    holiday_multiplier?: number;
    overtime_starts_after_hours?: number | null;
    overtime_starts_after_time?: string | null;
    recognizes_overtime?: boolean;
    is_forfait?: boolean;
    valid_from: string;
    notes?: string | null;
  }>;
}

export interface ContractorRate {
  id: number;
  contractor_id: number;
  service_type: string;
  rate_type: RateType;
  rate_amount: number;
  currency: string;
  minimum_hours?: number | null;
  minimum_amount?: number | null;
  is_forfait: boolean;
  valid_from: string;
  valid_to: string | null;
  is_current: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteLaborCost {
  id: number;
  site_id: number;
  cost_type: LaborCostType;
  worker_id?: number | null;
  contractor_id?: number | null;
  description: string;
  work_date: string;
  hours_worked?: number | null;
  quantity?: number | null;
  unit_rate: number;
  total_cost: number;
  currency: string;
  is_overtime: boolean;
  is_holiday: boolean;
  cost_category?: string | null;
  invoice_number?: string | null;
  invoice_date?: string | null;
  is_invoiced: boolean;
  notes?: string | null;
  worker?: Worker;
  contractor?: Supplier;
  site?: Site;
  created_at: string;
  updated_at: string;
}

// Site Worker Types
export type SiteWorkerStatus = 'pending' | 'accepted' | 'rejected' | 'active' | 'completed' | 'cancelled';

export interface SiteRole {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteWorker {
  id: number;
  site_id: number;
  worker_id: number;
  status: SiteWorkerStatus;
  status_label: string;
  assigned_from: string;
  assigned_to?: string | null;
  assigned_by_user_id?: number | null;
  assigned_by?: {
    id: number;
    name: string;
    email: string;
  };
  responded_at?: string | null;
  response_due_at?: string | null;
  rejection_reason?: string | null;
  hourly_rate_override?: number | null;
  fixed_rate_override?: number | null;
  rate_override_notes?: string | null;
  estimated_hours?: number | null;
  is_active: boolean;
  notes?: string | null;
  is_pending: boolean;
  can_respond: boolean;
  worker?: Worker;
  site?: Site;
  roles?: SiteRole[];
  created_at: string;
  updated_at: string;
}

export interface SiteWorkerFormData {
  worker_id: number;
  assigned_from: string;
  assigned_to?: string | null;
  role_ids?: number[];
  hourly_rate_override?: number | null;
  fixed_rate_override?: number | null;
  rate_override_notes?: string | null;
  estimated_hours?: number | null;
  response_days?: number;
  notes?: string | null;
}

export interface SiteWorkerConflict {
  has_conflicts: boolean;
  conflict_count: number;
  conflicts: SiteWorker[];
}

// Legacy - manteniamo per compatibilità
export interface SiteWorkerAssignment {
  site_id: number;
  worker_id: number;
  site_role?: string | null;
  assigned_from: string;
  assigned_to?: string | null;
  hourly_rate_override?: number | null;
  estimated_hours?: number | null;
  is_active: boolean;
  notes?: string | null;
}

// Worker Invitation Types
export interface WorkerInvitation {
  id: number;
  email: string;
  token: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  invited_by_user_id: number;
  invited_by?: {
    id: number;
    name: string;
    email: string;
  };
  supplier_id?: number | null;
  supplier?: {
    id: number;
    code: string;
    company_name: string;
  };
  worker_type: WorkerType;
  contract_type?: ContractType | null;
  job_title?: string | null;
  metadata?: Record<string, any> | null;
  expires_at: string;
  accepted_at?: string | null;
  created_user_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface WorkerInvitationFormData {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  supplier_id?: number | null;
  worker_type?: WorkerType;
  contract_type?: ContractType | null;
  job_title?: string | null;
  metadata?: Record<string, any> | null;
  expires_in_days?: number;
}

export interface AcceptInvitationData {
  password: string;
  password_confirmation: string;
}

// Material Request Types
export type MaterialRequestStatus = 'pending' | 'approved' | 'rejected' | 'delivered';
export type MaterialRequestPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface MaterialRequest {
  id: number;
  site_id: number;
  site?: {
    id: number;
    name: string;
    code: string;
  };
  material_id: number;
  material?: {
    id: number;
    name: string;
    code: string;
    unit_of_measure?: string | null;
  };
  requested_by_worker_id: number;
  requested_by_worker?: {
    id: number;
    full_name: string;
    user?: {
      id: number;
      name: string;
      email: string;
    };
  };
  requested_by_user_id: number;
  requested_by_user?: {
    id: number;
    name: string;
  };
  quantity_requested: number;
  unit_of_measure?: string | null;
  status: MaterialRequestStatus;
  status_label: string;
  priority: MaterialRequestPriority;
  priority_label: string;
  reason?: string | null;
  notes?: string | null;
  needed_by?: string | null;
  responded_by_user_id?: number | null;
  responded_by_user?: {
    id: number;
    name: string;
  };
  responded_at?: string | null;
  response_notes?: string | null;
  rejection_reason?: string | null;
  quantity_approved?: number | null;
  approved_by_user_id?: number | null;
  approved_by_user?: {
    id: number;
    name: string;
  };
  approved_at?: string | null;
  quantity_delivered?: number | null;
  delivered_at?: string | null;
  delivered_by_user_id?: number | null;
  delivered_by_user?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
  can_approve: boolean;
  can_reject: boolean;
  can_deliver: boolean;
}

export interface MaterialRequestFormData {
  site_id: number;
  material_id: number;
  quantity_requested: number;
  unit_of_measure?: string | null;
  priority?: MaterialRequestPriority;
  reason?: string | null;
  notes?: string | null;
  needed_by?: string | null;
}

export interface UpdateMaterialRequestData {
  quantity_requested?: number;
  priority?: MaterialRequestPriority;
  reason?: string | null;
  notes?: string | null;
  needed_by?: string | null;
}

export interface RespondToMaterialRequestData {
  quantity_approved?: number | null;
  response_notes?: string | null;
  rejection_reason?: string | null;
}

export interface MaterialRequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  delivered: number;
  urgent: number;
}
