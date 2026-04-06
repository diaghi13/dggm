// Use generated types from backend, extended with transient UI fields (never sent to API)
export type QuoteItem = Omit<App.Data.QuoteItemData, "children"> & {
  _price_explicit?: boolean;
  children?: QuoteItem[];
};

// Form data is a partial of QuoteItem with required fields
export type ItemFormData = Partial<QuoteItem> & {
  type: App.Enums.QuoteItemType;
  description: string;
};

export interface QuoteItemsBuilderProps {
  items: QuoteItem[];
  onChange: (items: QuoteItem[]) => void;
  priceListId?: number | null;
  showUnitPrices?: boolean;
  quoteType?: string | null;
  effectiveEventDays?: number | null;
  defaultVatRate?: number;
}
