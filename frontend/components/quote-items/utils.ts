import { QuoteItem, ItemFormData } from './types';

/**
 * Appiattisce gli items in un array piatto (per il drag and drop)
 */
export const flattenItems = (items: QuoteItem[]): QuoteItem[] => {
  const result: QuoteItem[] = [];
  items.forEach(item => {
    result.push(item);
    if (item.children && item.children.length > 0) {
      result.push(...item.children);
    }
  });
  return result;
};

/**
 * Trova un item per ID nella struttura annidata
 */
export const findItem = (items: QuoteItem[], id: number): QuoteItem | null => {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findItem(item.children, id);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Rimuove un item dalla struttura annidata
 */
export const removeItem = (items: QuoteItem[], id: number): QuoteItem[] => {
  return items.reduce((acc, item) => {
    if (item.id === id) return acc;
    if (item.children) {
      return [...acc, { ...item, children: removeItem(item.children, id) }];
    }
    return [...acc, item];
  }, [] as QuoteItem[]);
};

/**
 * Calcola i totali per un item del form
 */
export const calculateTotals = (item: ItemFormData): Pick<QuoteItem, 'subtotal' | 'discount_amount' | 'total'> => {
  if (item.type === 'section') {
    return { subtotal: 0, discount_amount: 0, total: 0 };
  }
  const quantity = Number(item.quantity) || 0;
  const unitPrice = Number(item.unit_price) || 0;
  const discountPercentage = Number(item.discount_percentage) || 0;

  const subtotal = quantity * unitPrice;
  const discount_amount = (subtotal * discountPercentage) / 100;
  const total = subtotal - discount_amount;
  return { subtotal, discount_amount, total };
};

/**
 * Calcola il totale di un item (ricorsivo per sezioni)
 */
export const calculateItemTotal = (item: QuoteItem): number => {
  if (item.type === 'section' && item.children) {
    return item.children.reduce((sum, child) => sum + calculateItemTotal(child), 0);
  }
  return Number(item.total || 0);
};

/**
 * Calcola il subtotale di una sezione
 */
export const calculateSectionTotal = (item: QuoteItem): number => {
  if (!item.children) return 0;
  return item.children.reduce((sum, child) => {
    if (child.type === 'section' && child.children) {
      return sum + calculateSectionTotal(child);
    }
    return sum + Number(child.total || 0);
  }, 0);
};

