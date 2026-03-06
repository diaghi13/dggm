import { QuoteItem, ItemFormData } from "./types";
import { calculateDurationMultiplier } from "./utils";

/**
 * Appiattisce gli items in un array piatto (per il drag and drop)
 */
export const flattenItems = (items: QuoteItem[]): QuoteItem[] => {
  const result: QuoteItem[] = [];
  items.forEach((item) => {
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

export { calculateDurationMultiplier } from "@/lib/utils/rental-engine";

/**
 * Calcola i totali per un item del form
 */
export const calculateTotals = (item: ItemFormData) => {
  if (item.type === "section") {
    return {
      subtotal: 0,
      discount_amount: 0,
      total: 0,
      vat_amount: 0,
      total_with_vat: 0,
    };
  }
  const quantity = Number(item.quantity) || 0;
  const unitPrice = Number(item.unit_price) || 0;
  const discountPercentage = Number(item.discount_percentage) || 0;
  const vatRate = Number(item.vat_rate) || 0;
  const billingUnit = item.billing_unit ?? "unit";
  const duration = Number(item.duration) || 1;

  let subtotal: number;
  if (billingUnit === "flat") {
    subtotal = unitPrice;
  } else if (billingUnit === "unit") {
    subtotal = quantity * unitPrice;
  } else if (billingUnit === "day") {
    subtotal = quantity * unitPrice * calculateDurationMultiplier(duration);
  } else {
    // hour, week, month — lineare
    subtotal = quantity * unitPrice * duration;
  }

  const discount_amount = (subtotal * discountPercentage) / 100;
  const total = subtotal - discount_amount;
  const vat_amount = (total * vatRate) / 100;
  const total_with_vat = total + vat_amount;

  return { subtotal, discount_amount, total, vat_amount, total_with_vat };
};

/**
 * Calcola il totale di un item (ricorsivo per sezioni)
 */
export const calculateItemTotal = (item: QuoteItem): number => {
  if (item.type === "section" && item.children) {
    return item.children.reduce(
      (sum, child) => sum + calculateItemTotal(child),
      0,
    );
  }
  return Number(item.total || 0);
};

/**
 * Estrae gli items selezionati dall'albero e li rimuove dalla posizione attuale.
 * Usato dal bulk move-to-section.
 */
export const extractSelectedItems = (
  items: QuoteItem[],
  selectedIds: number[],
  targetParentId: number,
): { trimmedTree: QuoteItem[]; extractedItems: QuoteItem[] } => {
  const extracted: QuoteItem[] = [];

  const walk = (nodes: QuoteItem[]): QuoteItem[] => {
    return nodes.reduce((acc, node) => {
      // Non selezionare sezioni
      if (node.type !== "section" && selectedIds.includes(node.id!)) {
        // Salta se già appartiene alla sezione target
        if (node.parent_id !== targetParentId) {
          extracted.push(node);
        }
        return acc;
      }
      if (node.children) {
        return [...acc, { ...node, children: walk(node.children) }];
      }
      return [...acc, node];
    }, [] as QuoteItem[]);
  };

  const trimmedTree = walk(items);
  return { trimmedTree, extractedItems: extracted };
};

/**
 * Calcola il subtotale di una sezione
 */
export const calculateSectionTotal = (item: QuoteItem): number => {
  if (!item.children) return 0;
  return item.children.reduce((sum, child) => {
    if (child.type === "section" && child.children) {
      return sum + calculateSectionTotal(child);
    }
    return sum + Number(child.total || 0);
  }, 0);
};
