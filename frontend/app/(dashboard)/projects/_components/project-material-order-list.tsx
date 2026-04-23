'use client';

import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, Package, ChevronDown, Filter, Layers } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface BomComponent {
  component_product_id: number;
  component_code: string;
  component_name: string;
  component_unit: string;
  quantity: number;
}

interface BomBreakdown {
  components: BomComponent[];
}

/** A row in the hierarchical view */
interface HierarchyRow {
  level: 0 | 1;
  product_id: number;
  code: string;
  name: string;
  unit: string;
  quantity: number;
  product_type: string;
  category_id: number | null;
  category_name: string;
  /** Only present on level-0 composite rows: number of child components */
  component_count?: number;
}

/** A row in the aggregated order list */
interface AggregatedItem {
  product_id: number;
  code: string;
  name: string;
  unit: string;
  total_quantity: number;
  category_id: number | null;
  category_name: string;
  sources: Array<{ label: string; quantity: number }>;
}

interface ProjectMaterialOrderListProps {
  materials: App.Data.ProjectMaterialData[];
}

const UNCATEGORIZED_ID = -1;
const UNCATEGORIZED_LABEL = 'Senza categoria';

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function ProjectMaterialOrderList({ materials }: ProjectMaterialOrderListProps) {
  const [aggregatedOpen, setAggregatedOpen] = useState(false);
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set());

  // Exclude services and package (logistica/peso/volume only) — keep article, composite, kit
  const physicalMaterials = useMemo(
    () => materials.filter((m) => m.product?.product_type !== 'service' && !m.product?.is_package),
    [materials],
  );

  const composites = useMemo(
    () => physicalMaterials.filter((m) => m.product?.product_type === 'composite'),
    [physicalMaterials],
  );

  const kits = useMemo(
    () => physicalMaterials.filter((m) => m.product?.product_type === 'kit'),
    [physicalMaterials],
  );

  // Fetch composite breakdowns in parallel
  const compositeBreakdownQueries = useQueries({
    queries: composites.map((m) => ({
      queryKey: ['composite-breakdown', m.product_id],
      queryFn: (): Promise<BomBreakdown> =>
        productsApi.getCompositeBreakdown(m.product_id!),
      enabled: !!m.product_id,
      staleTime: 5 * 60 * 1000,
    })),
  });

  // Fetch kit breakdowns in parallel
  const kitBreakdownQueries = useQueries({
    queries: kits.map((m) => ({
      queryKey: ['kit-breakdown', m.product_id],
      queryFn: (): Promise<BomBreakdown> =>
        productsApi.getKitBreakdown(m.product_id!),
      enabled: !!m.product_id,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const isLoading =
    compositeBreakdownQueries.some((q) => q.isLoading) ||
    kitBreakdownQueries.some((q) => q.isLoading);

  // Build hierarchical rows (all, unfiltered)
  const allHierarchyRows = useMemo<HierarchyRow[]>(() => {
    if (isLoading) return [];

    const rows: HierarchyRow[] = [];

    physicalMaterials.forEach((m) => {
      const plannedQty = Number(m.planned_quantity ?? 0);
      const type = m.product?.product_type ?? 'article';
      const code = m.product?.code ?? m.product_code ?? '—';
      const name = m.product?.name ?? m.product_name ?? '—';
      const unit = m.product?.unit ?? 'pz';
      const catId = m.product?.category?.id ?? UNCATEGORIZED_ID;
      const catName = m.product?.category?.name ?? UNCATEGORIZED_LABEL;

      if (type === 'article') {
        rows.push({
          level: 0,
          product_id: m.product_id!,
          code,
          name,
          unit,
          quantity: plannedQty,
          product_type: 'article',
          category_id: catId,
          category_name: catName,
        });
      } else if (type === 'composite') {
        const compositeIndex = composites.findIndex((c) => c.id === m.id);
        const breakdown = compositeBreakdownQueries[compositeIndex]?.data as BomBreakdown | undefined;
        const components = breakdown?.components ?? [];

        rows.push({
          level: 0,
          product_id: m.product_id!,
          code,
          name,
          unit,
          quantity: plannedQty,
          product_type: 'composite',
          category_id: catId,
          category_name: catName,
          component_count: components.length,
        });

        components.forEach((comp) => {
          const realQty = Math.round(Number(comp.quantity) * plannedQty * 10000) / 10000;
          rows.push({
            level: 1,
            product_id: comp.component_product_id,
            code: comp.component_code,
            name: comp.component_name,
            unit: comp.component_unit,
            quantity: realQty,
            product_type: 'article',
            category_id: catId,
            category_name: catName,
          });
        });
      } else if (type === 'kit') {
        const kitIndex = kits.findIndex((k) => k.id === m.id);
        const breakdown = kitBreakdownQueries[kitIndex]?.data as BomBreakdown | undefined;
        const components = breakdown?.components ?? [];

        rows.push({
          level: 0,
          product_id: m.product_id!,
          code,
          name,
          unit,
          quantity: plannedQty,
          product_type: 'kit',
          category_id: catId,
          category_name: catName,
          component_count: components.length,
        });

        components.forEach((comp) => {
          const realQty = Math.round(Number(comp.quantity) * plannedQty * 10000) / 10000;
          rows.push({
            level: 1,
            product_id: comp.component_product_id,
            code: comp.component_code,
            name: comp.component_name,
            unit: comp.component_unit,
            quantity: realQty,
            product_type: 'article',
            category_id: catId,
            category_name: catName,
          });
        });
      }
    });

    return rows;
  }, [physicalMaterials, composites, kits, compositeBreakdownQueries, kitBreakdownQueries, isLoading]);

  // Build aggregated list (all, unfiltered)
  const allAggregatedItems = useMemo<AggregatedItem[]>(() => {
    if (isLoading) return [];

    const map = new Map<number, AggregatedItem>();

    const addItem = (
      productId: number,
      code: string,
      name: string,
      unit: string,
      qty: number,
      sourceLabel: string,
      catId: number | null,
      catName: string,
    ) => {
      if (map.has(productId)) {
        const existing = map.get(productId)!;
        existing.total_quantity = Math.round((existing.total_quantity + qty) * 10000) / 10000;
        existing.sources.push({ label: sourceLabel, quantity: qty });
      } else {
        map.set(productId, {
          product_id: productId,
          code,
          name,
          unit,
          total_quantity: qty,
          category_id: catId,
          category_name: catName,
          sources: [{ label: sourceLabel, quantity: qty }],
        });
      }
    };

    physicalMaterials.forEach((m) => {
      const plannedQty = Number(m.planned_quantity ?? 0);
      if (plannedQty <= 0) return;

      const type = m.product?.product_type ?? 'article';
      const productName = m.product?.name ?? m.product_name ?? '—';
      const catId = m.product?.category?.id ?? UNCATEGORIZED_ID;
      const catName = m.product?.category?.name ?? UNCATEGORIZED_LABEL;

      if (type === 'article') {
        addItem(
          m.product_id!,
          m.product?.code ?? m.product_code ?? '—',
          productName,
          m.product?.unit ?? 'pz',
          plannedQty,
          productName,
          catId,
          catName,
        );
      } else if (type === 'composite') {
        const compositeIndex = composites.findIndex((c) => c.id === m.id);
        const breakdown = compositeBreakdownQueries[compositeIndex]?.data as BomBreakdown | undefined;

        if (breakdown?.components?.length) {
          breakdown.components.forEach((comp) => {
            const compQty = Math.round(Number(comp.quantity) * plannedQty * 10000) / 10000;
            addItem(
              comp.component_product_id,
              comp.component_code,
              comp.component_name,
              comp.component_unit,
              compQty,
              `${productName} × ${plannedQty}`,
              catId,
              catName,
            );
          });
        }
      } else if (type === 'kit') {
        const kitIndex = kits.findIndex((k) => k.id === m.id);
        const breakdown = kitBreakdownQueries[kitIndex]?.data as BomBreakdown | undefined;

        if (breakdown?.components?.length) {
          breakdown.components.forEach((comp) => {
            const compQty = Math.round(Number(comp.quantity) * plannedQty * 10000) / 10000;
            addItem(
              comp.component_product_id,
              comp.component_code,
              comp.component_name,
              comp.component_unit,
              compQty,
              `${productName} × ${plannedQty}`,
              catId,
              catName,
            );
          });
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'it'));
  }, [physicalMaterials, composites, kits, compositeBreakdownQueries, kitBreakdownQueries, isLoading]);

  // All distinct categories (from level-0 rows only, to avoid duplicates)
  const allCategories = useMemo(() => {
    const map = new Map<number, string>();
    allHierarchyRows
      .filter((r) => r.level === 0)
      .forEach((r) => {
        if (!map.has(r.category_id ?? UNCATEGORIZED_ID)) {
          map.set(r.category_id ?? UNCATEGORIZED_ID, r.category_name);
        }
      });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [allHierarchyRows]);

  const isFiltered = selectedCategories.size > 0;

  // Apply category filter
  const hierarchyRows = useMemo(() => {
    if (!isFiltered) return allHierarchyRows;
    return allHierarchyRows.filter((r) =>
      selectedCategories.has(r.category_id ?? UNCATEGORIZED_ID),
    );
  }, [allHierarchyRows, selectedCategories, isFiltered]);

  const aggregatedItems = useMemo(() => {
    if (!isFiltered) return allAggregatedItems;
    return allAggregatedItems.filter((i) =>
      selectedCategories.has(i.category_id ?? UNCATEGORIZED_ID),
    );
  }, [allAggregatedItems, selectedCategories, isFiltered]);

  // Group rows by category for hierarchy view
  const groupedHierarchyRows = useMemo(() => {
    const groups = new Map<string, HierarchyRow[]>();
    hierarchyRows.forEach((row) => {
      const key = row.category_name;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, 'it'));
  }, [hierarchyRows]);

  // Group items by category for aggregated view
  const groupedAggregatedItems = useMemo(() => {
    const groups = new Map<string, AggregatedItem[]>();
    aggregatedItems.forEach((item) => {
      const key = item.category_name;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, 'it'));
  }, [aggregatedItems]);

  const toggleCategory = (id: number) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearFilter = () => setSelectedCategories(new Set());

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 gap-3 text-slate-500 dark:text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Scomposizione materiali composti e kit...</span>
      </div>
    );
  }

  // ── Empty state ──
  if (allHierarchyRows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 dark:text-slate-400">
        <Package className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">Nessun materiale fisico nel progetto</p>
        <p className="text-xs mt-1 opacity-70">
          Aggiungi articoli o prodotti composti nel tab Gestione
        </p>
      </div>
    );
  }

  const tableHeader = (
    <div className="bg-slate-50 dark:bg-slate-900/60 px-4 py-2.5 grid grid-cols-12 gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
      <div className="col-span-2">Codice</div>
      <div className="col-span-6">Nome</div>
      <div className="col-span-2 text-right">Quantità</div>
      <div className="col-span-2">Unità</div>
    </div>
  );

  const aggHeader = (
    <div className="bg-slate-50/60 dark:bg-slate-900/30 px-4 py-2 grid grid-cols-12 gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
      <div className="col-span-2">Codice</div>
      <div className="col-span-6">Descrizione</div>
      <div className="col-span-2 text-right">Qtà Totale</div>
      <div className="col-span-2">Unità</div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Category filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              Categorie
              {isFiltered && (
                <Badge
                  variant="secondary"
                  className="ml-0.5 h-4 px-1 text-[10px] leading-none"
                >
                  {selectedCategories.size}
                </Badge>
              )}
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-0.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="text-xs">Filtra per categoria</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allCategories.map(({ id, name }) => (
              <DropdownMenuCheckboxItem
                key={id}
                checked={selectedCategories.has(id)}
                onCheckedChange={() => toggleCategory(id)}
                className="text-sm"
              >
                {name}
              </DropdownMenuCheckboxItem>
            ))}
            {isFiltered && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={false}
                  onCheckedChange={clearFilter}
                  className="text-xs text-slate-500"
                >
                  Rimuovi filtri
                </DropdownMenuCheckboxItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Group by category toggle */}
        <Button
          variant={groupByCategory ? 'default' : 'outline'}
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => setGroupByCategory((v) => !v)}
        >
          <Layers className="h-3.5 w-3.5" />
          Raggruppa per categoria
        </Button>

        {/* Active filter chips */}
        {isFiltered && (
          <div className="flex items-center gap-1 flex-wrap">
            {Array.from(selectedCategories).map((id) => {
              const cat = allCategories.find((c) => c.id === id);
              if (!cat) return null;
              return (
                <Badge
                  key={id}
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
                  onClick={() => toggleCategory(id)}
                >
                  {cat.name} ×
                </Badge>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Hierarchical view ── */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        {groupByCategory ? (
          groupedHierarchyRows.map(([catName, rows]) => (
            <CategoryGroup key={catName} label={catName} count={rows.filter((r) => r.level === 0).length}>
              {tableHeader}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((row, i) => (
                  <HierarchyTableRow key={`${row.product_id}-${i}`} row={row} />
                ))}
              </div>
            </CategoryGroup>
          ))
        ) : (
          <>
            {tableHeader}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {hierarchyRows.map((row, index) => (
                <HierarchyTableRow key={`${row.product_id}-${index}`} row={row} />
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-900/60 px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
          {physicalMaterials.length} voce{physicalMaterials.length !== 1 ? 'i' : ''} •{' '}
          {composites.length > 0
            ? `${composites.length} composito${composites.length !== 1 ? 'i' : ''} espanso${composites.length !== 1 ? 'i' : ''}`
            : 'nessun composito'}
          {kits.length > 0 &&
            ` • ${kits.length} kit${kits.length !== 1 ? ' espansi' : ' espanso'}`}
          {isFiltered && ` • ${selectedCategories.size} categori${selectedCategories.size !== 1 ? 'e' : 'a'} filtrat${selectedCategories.size !== 1 ? 'e' : 'a'}`}
        </div>
      </div>

      {/* ── Aggregated order list (collapsible) ── */}
      {aggregatedItems.length > 0 && (
        <Collapsible open={aggregatedOpen} onOpenChange={setAggregatedOpen}>
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Lista aggregata per ordine
                  </span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {aggregatedItems.length} articol{aggregatedItems.length !== 1 ? 'i' : 'o'}
                  </Badge>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                    aggregatedOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="border-t border-slate-200 dark:border-slate-800">
                {groupByCategory ? (
                  groupedAggregatedItems.map(([catName, items]) => (
                    <CategoryGroup key={catName} label={catName} count={items.length}>
                      {aggHeader}
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {items.map((item) => (
                          <AggregatedRow key={item.product_id} item={item} />
                        ))}
                      </div>
                    </CategoryGroup>
                  ))
                ) : (
                  <>
                    {aggHeader}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {aggregatedItems.map((item) => (
                        <AggregatedRow key={item.product_id} item={item} />
                      ))}
                    </div>
                  </>
                )}

                <div className="px-4 py-2.5 bg-slate-50/60 dark:bg-slate-900/30 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
                  Da consegnare al fornitore / magazziniere
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Category group header (used when groupByCategory = true)
// ─────────────────────────────────────────────────────────────────────────────

function CategoryGroup({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-200 dark:border-slate-800 last:border-b-0">
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800/60">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
          {label}
        </span>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400">
          {count}
        </Badge>
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hierarchical row
// ─────────────────────────────────────────────────────────────────────────────

function HierarchyTableRow({ row }: { row: HierarchyRow }) {
  const isComposite = row.product_type === 'composite';
  const isKit = row.product_type === 'kit';
  const isChild = row.level === 1;

  return (
    <div
      className="px-4 py-3 grid grid-cols-12 gap-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      style={{ paddingLeft: isChild ? '32px' : '16px' }}
    >
      {/* Code */}
      <div className="col-span-2 flex items-center">
        {isChild && (
          <span className="text-xs text-slate-400 dark:text-slate-500 mr-1.5 shrink-0">└─</span>
        )}
        <span
          className={`font-mono text-xs truncate ${
            isChild
              ? 'text-slate-400 dark:text-slate-500'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {row.code}
        </span>
      </div>

      {/* Name + badge */}
      <div className="col-span-6 flex items-center gap-2 min-w-0">
        {isComposite && !isChild && (
          <div className="w-0.5 h-5 bg-blue-400 dark:bg-blue-500 rounded-full shrink-0" />
        )}
        {isKit && !isChild && (
          <div className="w-0.5 h-5 bg-purple-400 dark:bg-purple-500 rounded-full shrink-0" />
        )}
        <span
          className={`truncate ${
            isChild
              ? 'text-xs text-slate-600 dark:text-slate-400'
              : 'font-medium text-slate-900 dark:text-slate-100'
          }`}
        >
          {row.name}
        </span>
        {isComposite && !isChild && (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 shrink-0 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400"
          >
            composito
          </Badge>
        )}
        {isKit && !isChild && (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 shrink-0 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400"
          >
            kit
          </Badge>
        )}
      </div>

      {/* Quantity */}
      <div
        className={`col-span-2 text-right flex items-center justify-end ${
          isChild
            ? 'text-slate-500 dark:text-slate-400'
            : 'font-semibold text-slate-900 dark:text-slate-100'
        }`}
      >
        {formatQty(row.quantity)}
      </div>

      {/* Unit */}
      <div
        className={`col-span-2 flex items-center ${
          isChild
            ? 'text-xs text-slate-400 dark:text-slate-500'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        {row.unit}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Aggregated row (with collapsible sources)
// ─────────────────────────────────────────────────────────────────────────────

function AggregatedRow({ item }: { item: AggregatedItem }) {
  const [open, setOpen] = useState(false);
  const hasMultipleSources = item.sources.length > 1;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <div
          className={`px-4 py-3 grid grid-cols-12 gap-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
            hasMultipleSources ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <div className="col-span-2 font-mono text-xs text-slate-500 dark:text-slate-400 flex items-center truncate">
            {item.code}
          </div>

          <div className="col-span-6 flex items-center gap-2 min-w-0">
            <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
              {item.name}
            </span>
            {hasMultipleSources && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 shrink-0 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400"
              >
                {item.sources.length} sorgenti
              </Badge>
            )}
          </div>

          <div className="col-span-2 text-right font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-end">
            {formatQty(item.total_quantity)}
          </div>

          <div className="col-span-2 flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span>{item.unit}</span>
            {hasMultipleSources && (
              <ChevronDown
                className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-150 ${
                  open ? 'rotate-180' : ''
                }`}
              />
            )}
          </div>
        </div>
      </CollapsibleTrigger>

      {hasMultipleSources && (
        <CollapsibleContent>
          <div className="bg-slate-50/60 dark:bg-slate-900/30 border-t border-dashed border-slate-200 dark:border-slate-700 divide-y divide-dashed divide-slate-200 dark:divide-slate-700">
            {item.sources.map((src, i) => (
              <div
                key={i}
                className="px-4 py-2 grid grid-cols-12 gap-2 text-xs text-slate-500 dark:text-slate-400"
              >
                <div className="col-span-2" />
                <div className="col-span-6 pl-4 flex items-center gap-1">
                  <span className="text-slate-400 dark:text-slate-500">└─</span>
                  <span className="truncate">{src.label}</span>
                </div>
                <div className="col-span-2 text-right font-medium text-slate-600 dark:text-slate-300">
                  {formatQty(src.quantity)}
                </div>
                <div className="col-span-2" />
              </div>
            ))}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatQty(value: number): string {
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(2);
}
