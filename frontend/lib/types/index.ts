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

export interface UserSettings {
  global: Record<string, string | number | boolean>;
  user: Array<any>;
}

export interface AuthMeResponse {
  user: User;
  settings: UserSettings;
  features: string[];
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
export type CustomerType = "individual" | "company";

// Usa il tipo generato ed estende con i campi calcolati/aggiuntivi
export type Customer = Omit<App.Data.CustomerData, "type"> & {
  id: number;
  type: CustomerType;
  display_name: string;
  payment_terms: string;
  discount_percentage: string;
  country: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

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

// Project Types
export type ProjectStatus =
  | "draft"
  | "planned"
  | "in_progress"
  | "on_hold"
  | "completed"
  | "cancelled";
export type ProjectPriority = "low" | "medium" | "high" | "urgent";

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

export interface Project {
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
  status: ProjectStatus;
  priority?: ProjectPriority;
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

export interface ProjectFormData {
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
  status?: ProjectStatus;
  priority?: ProjectPriority;
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

// Supplier Types - REMOVED: interface Supplier duplicated (see line ~1199 for type alias)
// Using App.Data.SupplierData as the source of truth

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

// Quote Attachment
export interface QuoteAttachment {
  id: number;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  file_size_human: string;
  url: string;
  type: string;
  description?: string;
  sort_order: number;
}

// Quote Types
export type QuoteStatus =
  | "draft"
  | "sent"
  | "approved"
  | "rejected"
  | "expired"
  | "converted";

export type QuoteItemType = "section" | "item" | "labor" | "material";

// Usa i tipi generati dal backend
export type Quote = Omit<App.Data.QuoteData, "customer"> & {
  customer?: Customer;
  attachments?: QuoteAttachment[];
};
export type QuoteItem = App.Data.QuoteItemData;

// Form data per la creazione/modifica (campi opzionali)
export type QuoteFormData = Partial<
  Omit<
    App.Data.QuoteData,
    | "customer"
    | "projectManager"
    | "priceList"
    | "paymentTerm"
    | "warrantyType"
    | "project"
    | "items"
    | "full_address"
  >
> & {
  title: string;
  customer_id: number;
  items?: App.Data.QuoteItemData[];
  payment_method_id?: number | null;
  attachments?: QuoteAttachment[];
};

// DDT (Documento Di Trasporto) Types
export type DdtType =
  | "incoming"
  | "outgoing"
  | "internal"
  | "rental_out"
  | "rental_return"
  | "return_from_customer"
  | "return_to_supplier";

export type DdtStatus =
  | "draft"
  | "issued"
  | "in_transit"
  | "delivered"
  | "cancelled";

export type ReturnReason =
  | "defective"
  | "wrong_item"
  | "excess"
  | "warranty"
  | "customer_dissatisfaction"
  | "other";

export interface DdtItem {
  id: number;
  ddt_id: number;
  product_id: number;
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
  project_id: number | null;
  project?: {
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
  project_id?: number | null;
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
    product_id: number;
    quantity: number;
    unit: string;
    unit_cost?: number;
    notes?: string | null;
  }>;
}

// Material Types
export type MaterialType = "physical" | "service" | "kit";
export type DependencyType =
  | "container"
  | "accessory"
  | "cable"
  | "consumable"
  | "tool";
export type QuantityCalculationType = "fixed" | "ratio" | "formula";

export interface MaterialComponent {
  id: number;
  kit_product_id: number;
  component_product_id: number;
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
  product_id: number;
  dependency_product_id: number;
  dependency_product?: {
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
    component_product_id: number;
    quantity: number;
    notes?: string | null;
  }>;
}

// Stock Movement Types
export type MovementType = "intake" | "output" | "transfer" | "adjustment";

export interface StockMovement {
  id: number;
  type: MovementType;
  product_id: number;
  product?: {
    id: number;
    code: string;
    name: string;
    unit: string;
    category: string;
  };
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
  project_id?: number;
  project?: {
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
  product_id: number;
  warehouse_id?: number;
  from_warehouse_id?: number;
  to_warehouse_id?: number;
  quantity: number;
  unit_cost?: number;
  supplier_id?: number;
  project_id?: number;
  supplier_document?: string;
  movement_date: string;
  notes?: string;
}

// Worker & Supplier Types
export type WorkerType = "employee" | "freelancer" | "external";
export type ContractType =
  | "permanent"
  | "fixed_term"
  | "seasonal"
  | "project_based"
  | "internship";
export type RateType =
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "fixed_project";
export type RateContext = "internal_cost" | "customer_billing" | "payroll";
export type PayrollFrequency = "monthly" | "biweekly" | "weekly";
export type SupplierType = "materials" | "personnel" | "both";
export type PersonnelType =
  | "cooperative"
  | "staffing_agency"
  | "rental_with_operator"
  | "subcontractor"
  | "technical_services";
export type LaborCostType = "internal_labor" | "subcontractor" | "contractor";

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

export interface ProjectLaborCost {
  id: number;
  project_id: number;
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
  project?: Project;
  created_at: string;
  updated_at: string;
}

// Project Worker Types
export type ProjectWorkerStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "active"
  | "completed"
  | "cancelled";

export interface ProjectRole {
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

export interface ProjectWorker {
  id: number;
  project_id: number;
  worker_id: number;
  status: ProjectWorkerStatus;
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
  project?: Project;
  roles?: ProjectRole[];
  created_at: string;
  updated_at: string;
}

export interface ProjectWorkerFormData {
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

export interface ProjectWorkerConflict {
  has_conflicts: boolean;
  conflict_count: number;
  conflicts: ProjectWorker[];
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
export type MaterialRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "delivered";
export type MaterialRequestPriority = "low" | "medium" | "high" | "urgent";

export interface MaterialRequest {
  id: number;
  project_id: number;
  project?: {
    id: number;
    name: string;
    code: string;
  };
  product_id: number;
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
  project_id: number;
  product_id: number;
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

// Notification Types
export interface Notification {
  id: string;
  type: string;
  notifiable_type: string;
  notifiable_id: number;
  data: Record<string, any>;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// ============================================
// PRODUCT TYPES - Re-export from generated.d.ts
// ============================================

// Type aliases for convenience (actual types are in generated.d.ts)
// ProductDetail extends the base generated type with subrental/ownership fields
// that will be added to the backend API response in Phase 3 of the Rental Engine.
export type Product = App.Data.ProductData & {
  ownership_type?: 'owned' | 'subrental' | 'mixed';
  is_premium?: boolean;
  subrental_markup?: number | null;
  rental_price_estimated?: boolean;
  estimated_base_day?: number | null;
};
export type ProductRelation = App.Data.ProductRelationData;
export type ProductRelationType = App.Data.ProductRelationTypeData;
export type ProductCategory = App.Data.ProductCategoryData;
export type ProductBrand = App.Data.ProductBrandData;
export type ProductComponent = App.Data.ProductComponentData;
export type Supplier = App.Data.SupplierData;

// Enum aliases
export type ProductType = App.Enums.ProductType;
export type ProductRelationQuantityType = App.Enums.ProductRelationQuantityType;

// Form data types (for create/update operations)
export interface ProductFormData {
  code: string;
  internal_code?: string | null;
  ean?: string | null;
  etim_code?: string | null;
  name: string;
  description?: string | null;
  category_id?: number | null;
  brand_id?: number | null;
  product_type: App.Enums.ProductType;
  is_package?: boolean;
  package_weight?: number | null;
  package_volume?: number | null;
  package_dimensions?: string | null;
  is_rentable?: boolean;
  unit?: string | null;
  standard_cost?: number | null;
  manufacturer_cost_price?: number | null;
  manufacturer_retail_price?: number | null;
  sale_markup_percent?: number | null;
  barcode?: string | null;
  qr_code?: string | null;
  default_supplier_id?: number | null;
  reorder_level?: number | null;
  reorder_quantity?: number | null;
  lead_time_days?: number | null;
  location?: string | null;
  notes?: string | null;
  is_active?: boolean;
  ownership_type?: 'owned' | 'subrental' | 'mixed';
  is_premium?: boolean;
  subrental_markup?: number | null;
  rental_price_estimated?: boolean;
  estimated_base_day?: number | null;
}

export interface ProductRelationFormData {
  related_product_id: number;
  relation_type_id: number;
  quantity_type: App.Enums.ProductRelationQuantityType;
  quantity_value: string;
  is_visible_in_quote: boolean;
  is_visible_in_material_list: boolean;
  is_required_for_stock: boolean;
  is_optional: boolean;
  min_quantity_trigger: number | null;
  max_quantity_trigger: number | null;
  sort_order: number;
  notes: string | null;
}

// ============================================
// PRICE LIST TYPES - Re-export from generated.d.ts
// ============================================

export type PriceList = App.Data.PriceListData;
export type PriceListItem = App.Data.PriceListItemData;

// Enum aliases
export type PriceListCalculationMode = App.Enums.PriceListCalculationMode;
export type PriceListAdjustmentType = App.Enums.PriceListAdjustmentType;
export type PriceListAppliesTo = App.Enums.PriceListAppliesTo;

// Form data types (for create/update operations)
export interface PriceListFormData {
  name: string;
  code: string;
  description?: string | null;
  calculation_mode: PriceListCalculationMode;
  adjustment_type: PriceListAdjustmentType;
  adjustment_value?: number | null;
  applies_to: PriceListAppliesTo;
  category_id?: number | null;
  department_filter?: string | null;
  valid_from?: string | null;
  valid_to?: string | null;
  is_active?: boolean;
  is_default?: boolean;
  priority?: number;
  generate_items?: boolean;
  rental_profile_id?: number | null;
}

export interface PriceListWithItems extends PriceList {
  items: PriceListItem[];
}

// ============================================
// PAYMENT TERM & WARRANTY TYPES - Re-export from generated.d.ts
// ============================================

export type PaymentTermData = App.Data.PaymentTermData;
export type WarrantyTypeData = App.Data.WarrantyTypeData;

// ============================================
// SUBRENTAL SUPPLIER TYPES
// ============================================

export interface ProductSubrentalSupplier {
  id: number;
  product_id: number;
  supplier_id: number;
  supplier?: Supplier;
  day_rate: number;
  reliability_score: number;
  is_preferred: boolean;
  last_updated?: string | null;
  notes?: string | null;
  computed_score?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SubrentalCostHistory {
  id: number;
  product_id: number;
  supplier_id: number;
  quote_id?: number | null;
  actual_cost: number;
  duration_days: number;
  margin_generated?: number | null;
  date: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// PRODUCT SUPPLIER PRICE TYPES
// ============================================

export interface ProductSupplierPrice {
  supplier_id: number;
  supplier_name: string;
  purchase_price: number;
  final_price: number | null;
  is_preferred_supplier: boolean | null;
  supplier_product_code: string | null;
}

// ============================================
// RENTAL PROFILE TYPES
// ============================================

export interface RentalProfile {
  id: number;
  name: string;
  sector: string;
  exponent_curve: number;
  decay_strength: number;
  max_duration_reference: number;
  duration_offset: number;
  max_period_cap_days: number;
  is_default: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
