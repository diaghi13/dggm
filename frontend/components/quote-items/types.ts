export interface QuoteItem {
  id: number;
  quote_id: number;
  parent_id: number | null;
  material_id?: number | null;
  type: 'section' | 'item' | 'labor' | 'material';
  code?: string | null;
  description: string;
  notes?: string | null;
  sort_order: number;
  unit?: string | null;
  quantity: number | null;
  unit_price: number | null;
  discount_percentage: number;
  hide_unit_price?: boolean;
  show_subtotal?: boolean;
  subtotal: number;
  discount_amount: number;
  total: number;
  children?: QuoteItem[];
  material?: {
    id: number;
    code: string;
    name: string;
    unit: string;
    standard_cost: number;
    category: string;
  };
}

export interface ItemFormData {
  type: 'section' | 'item' | 'labor' | 'material';
  parent_id?: number | null;
  material_id?: number | null;
  code?: string;
  description: string;
  notes?: string;
  unit?: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  hide_unit_price: boolean;
  show_subtotal?: boolean;
}

export interface QuoteItemsBuilderProps {
  items: QuoteItem[];
  onChange: (items: QuoteItem[]) => void;
  showUnitPrices?: boolean;
}

