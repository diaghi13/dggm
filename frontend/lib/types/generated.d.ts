declare namespace App.Data {
  export type CustomerData = {
    type: string | null;
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    vat_number: string | null;
    tax_code: string | null;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    postal_code: string | null;
    country: string | null;
    payment_terms: string | null;
    discount_percentage: number | null;
    notes: string | null;
    is_active: boolean | null;
  };
  export type DdtData = {
    id?: number;
    code?: string;
    type: App.Enums.DdtType;
    supplier_id: number | null;
    customer_id: number | null;
    site_id: number | null;
    from_warehouse_id: number;
    to_warehouse_id: number | null;
    ddt_number: string;
    ddt_date: string;
    transport_date: string | null;
    delivered_at: string | null;
    carrier_name: string | null;
    tracking_number: string | null;
    rental_start_date: string | null;
    rental_end_date: string | null;
    rental_actual_return_date: string | null;
    parent_ddt_id: number | null;
    return_reason: App.Enums.ReturnReason | null;
    return_notes: string | null;
    status: App.Enums.DdtStatus | null;
    notes: string | null;
    created_by: number | null;
    created_at?: string;
    updated_at?: string;
    deleted_at: string | null;
    supplier?: App.Data.SupplierData | null;
    customer?: App.Data.CustomerData | null;
    site?: any | null;
    from_warehouse?: App.Data.WarehouseData | null;
    to_warehouse?: App.Data.WarehouseData | null;
    created_by_user?: App.Data.UserData | null;
    parent_ddt?: App.Data.DdtData | null;
    items?: Array<App.Data.DdtItemData>;
    stock_movements?: Array<App.Data.StockMovementData> | null;
    total_items: number;
    total_quantity: number;
    can_be_confirmed: boolean;
    can_be_cancelled: boolean;
    is_delivered: boolean;
  };
  export type DdtItemData = {
    id?: number;
    ddt_id?: number | null;
    product_id: number;
    quantity: number;
    unit: string;
    unit_cost: number | null;
    notes: string | null;
    created_at?: string;
    updated_at?: string;
    product?: App.Data.ProductData | null;
    total_cost: number;
  };
  export type InventoryData = {
    id?: number;
    product_id: number;
    warehouse_id: number;
    quantity_available: number | null;
    quantity_reserved: number | null;
    quantity_in_transit: number | null;
    quantity_quarantine: number | null;
    minimum_stock: number | null;
    maximum_stock: number | null;
    last_count_date: string | null;
    created_at?: string;
    updated_at?: string;
    product?: App.Data.ProductData | null;
    warehouse?: App.Data.WarehouseData | null;
    quantity_free: number;
    is_low_stock: boolean;
    stock_value: number;
  };
  export type ProductCategoryData = {
    id: number | null;
    code: string;
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
    sort_order: number;
    is_active: boolean;
  };
  export type ProductComponentData = {
    id?: number;
    kit_product_id: number;
    component_product_id: number;
    quantity: number;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  export type ProductData = {
    id?: number;
    code: string;
    name: string;
    description: string | null;
    category_id: number | null;
    product_type: App.Enums.ProductType;
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
    reorder_level: number;
    reorder_quantity: number;
    lead_time_days: number;
    location: string | null;
    notes: string | null;
    is_rentable: boolean;
    quantity_out_on_rental: number;
    is_active: boolean;
    is_package: boolean;
    package_weight: number | null;
    package_volume: number | null;
    package_dimensions: string | null;
    created_at?: string;
    updated_at?: string;
    deleted_at: string | null;
    relations?: Array<App.Data.ProductRelationData>;
    defaultSupplier?: App.Data.SupplierData | null;
    category?: App.Data.ProductCategoryData | null;
    calculated_sale_price: number;
    composite_total_cost: number;
    total_stock: number;
    available_stock: number;
    calculate_sale_price: number;
  };
  export type ProductRelationData = {
    id: number | null;
    product_id: number;
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
    sort_order: number | null;
    notes: string | null;
    relatedProduct?: App.Data.ProductData | null;
    relationType?: App.Data.ProductRelationTypeData | null;
  };
  export type ProductRelationTypeData = {
    id: number | null;
    code: string;
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
    sort_order: number;
    is_active: boolean;
  };
  export type SiteData = {
    id: number | null;
    code: string;
    name: string;
    description: string | null;
    customer_id: number;
    quote_id: number | null;
    address: string | null;
    city: string | null;
    province: string | null;
    postal_code: string | null;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
    gps_radius: number | null;
    project_manager_id: number | null;
    estimated_amount: number | null;
    actual_cost: number | null;
    invoiced_amount: number | null;
    start_date: string | null;
    estimated_end_date: string | null;
    actual_end_date: string | null;
    status: string | null;
    priority: string | null;
    notes: string | null;
    internal_notes: string | null;
    is_active: boolean;
  };
  export type StockMovementData = {
    id?: number;
    code?: string;
    ddt_id: number | null;
    product_id: number;
    warehouse_id: number;
    type: App.Enums.StockMovementType;
    quantity: number;
    unit_cost: number | null;
    movement_date: string;
    from_warehouse_id: number | null;
    to_warehouse_id: number | null;
    site_id: number | null;
    supplier_id: number | null;
    supplier_document: string | null;
    user_id: number | null;
    notes: string | null;
    reference_document: string | null;
    created_at?: string;
    updated_at?: string;
    product?: App.Data.ProductData | null;
    warehouse?: App.Data.WarehouseData | null;
    from_warehouse?: App.Data.WarehouseData | null;
    to_warehouse?: App.Data.WarehouseData | null;
    site: any | null;
    supplier?: App.Data.SupplierData | null;
    user?: App.Data.UserData | null;
    ddt: any | null;
    total_value: number;
    type_label: string;
    type_color: string;
    is_outgoing: boolean;
    is_incoming: boolean;
  };
  export type SupplierData = {
    id?: number;
    code: string;
    company_name: string;
    supplier_type: App.Enums.SupplierType;
    personnel_type?: App.Enums.PersonnelType | null;
    vat_number?: string | null;
    tax_code?: string | null;
    email?: string | null;
    phone?: string | null;
    mobile?: string | null;
    website?: string | null;
    address?: string | null;
    city?: string | null;
    province?: string | null;
    postal_code?: string | null;
    country?: string | null;
    payment_terms?: string | null;
    delivery_terms?: string | null;
    discount_percentage?: number | null;
    iban?: string | null;
    bank_name?: string | null;
    contact_person?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    notes?: string | null;
    specializations?: Array<any> | null;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
  };
  export type UserData = {
    id: number | null;
    name: string;
    email: string;
  };
  export type WarehouseData = {
    id: number | null;
    code: string;
    name: string;
    type: App.Enums.WarehouseType;
    address: string | null;
    city: string | null;
    province: string | null;
    postal_code: string | null;
    manager_id: number | null;
    notes: string | null;
    is_active: boolean;
    full_address: string | null;
    total_value: number | null;
    manager?: App.Data.UserData | null;
  };
}
declare namespace App.Enums {
  export type ContractType = 'permanent' | 'fixed_term' | 'seasonal' | 'project_based' | 'internship';
  export type ContractorType = 'cooperative' | 'subcontractor' | 'temporary_agency';
  export type DdtStatus = 'draft' | 'issued' | 'in_transit' | 'delivered' | 'cancelled';
  export type DdtType =
    'incoming'
    | 'outgoing'
    | 'internal'
    | 'rental_out'
    | 'rental_return'
    | 'return_from_customer'
    | 'return_to_supplier';
  export type DependencyType = 'container' | 'accessory' | 'cable' | 'consumable' | 'tool';
  export type LaborCostType = 'internal_labor' | 'subcontractor' | 'contractor';
  export type MaterialRequestPriority = 'low' | 'medium' | 'high' | 'urgent';
  export type MaterialRequestStatus = 'pending' | 'approved' | 'rejected' | 'delivered';
  export type PayrollFrequency = 'monthly' | 'biweekly' | 'weekly';
  export type PersonnelType =
    'cooperative'
    | 'staffing_agency'
    | 'rental_with_operator'
    | 'subcontractor'
    | 'technical_services';
  export type ProductRelationQuantityType = 'fixed' | 'multiplied' | 'formula';
  export type ProductType = 'article' | 'service' | 'composite';
  export type QuantityCalculationType = 'fixed' | 'ratio' | 'formula';
  export type QuoteItemType = 'section' | 'item' | 'labor' | 'material';
  export type RateContext = 'internal_cost' | 'customer_billing' | 'payroll';
  export type RateType = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'fixed_project';
  export type ReturnReason = 'defective' | 'wrong_item' | 'excess' | 'warranty' | 'customer_dissatisfaction' | 'other';
  export type SiteMaterialStatus = 'planned' | 'reserved' | 'delivered' | 'in_use' | 'completed' | 'returned';
  export type SiteWorkerStatus = 'pending' | 'accepted' | 'rejected' | 'active' | 'completed' | 'cancelled';
  export type StockMovementType =
    'intake'
    | 'output'
    | 'transfer'
    | 'adjustment'
    | 'return'
    | 'waste'
    | 'rental_out'
    | 'rental_return'
    | 'site_allocation'
    | 'site_return';
  export type SupplierType = 'materials' | 'personnel' | 'both';
  export type WarehouseType = 'central' | 'site_storage' | 'mobile_truck';
  export type WorkerType = 'employee' | 'freelancer' | 'external';
}
