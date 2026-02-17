// Use generated types from backend
export type QuoteItem = App.Data.QuoteItemData;

// Form data is a partial of QuoteItemData with required fields
export type ItemFormData = Partial<App.Data.QuoteItemData> & {
  type: App.Enums.QuoteItemType;
  description: string;
};

export interface QuoteItemsBuilderProps {
  items: QuoteItem[];
  onChange: (items: QuoteItem[]) => void;
  priceListId?: number | null;
  showUnitPrices?: boolean;
}
