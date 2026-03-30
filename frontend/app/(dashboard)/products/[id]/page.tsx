"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "@/lib/api/products";
import { inventoryApi } from "@/lib/api/inventory";
import { stockMovementsApi } from "@/lib/api/stock-movements";
import { ProductRelations } from "@/app/(dashboard)/products/_components/product-relations";
import { ProductRelationsTree } from "@/app/(dashboard)/products/_components/product-relations-tree";
import { ProductPriceCalculator } from "@/app/(dashboard)/products/_components/product-price-calculator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/shared/data-table/data-table";
import { createInventoryColumns } from "@/components/inventory-columns";
import { createStockMovementsColumns } from "@/components/stock-movements-columns";
import {
  ArrowLeft,
  Edit,
  Warehouse as WarehouseIcon,
  FileText,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { ProductListsPreview } from "@/app/(dashboard)/products/_components/product-lists-preview";
import { ProductMediaSection } from "@/components/products/product-media-section";
import { SubrentalTab } from "@/app/(dashboard)/products/_components/subrental-tab";
import { CompositeBreakdownSection } from "@/app/(dashboard)/products/_components/composite-breakdown-section";
import { KitAssembliesSection } from "@/app/(dashboard)/products/_components/kit-assemblies-section";
import type { ProductType } from "@/lib/types";
import { formatCurrency as formatCurrencyUtil } from "@/components/ui/currency-input";

// ─────────────────────────────────────────────────────────────────────────────
// Field visibility — SINGLE SOURCE OF TRUTH (same logic as product-form.tsx)
// ─────────────────────────────────────────────────────────────────────────────
function getFieldVisibility(type: ProductType) {
  const isArticle = type === "article";
  const isComposite = type === "composite";
  const isService = type === "service";
  const isKit = type === "kit";
  const isPhysical = isArticle || isComposite || isKit;

  return {
    showEan: isPhysical,
    showEtimCode: isArticle,
    showBarcode: isPhysical,
    showQrCode: isPhysical,
    showBrand: isPhysical,
    showPackage: isArticle,
    showRental: isPhysical,
    showManufacturerPrices: isArticle,
    showMarkup: isPhysical,
    showSupplier: isArticle,
    showInventory: isArticle,
    showLeadTime: isPhysical,
    showLocation: isPhysical,
    isArticle,
    isComposite,
    isService,
    isKit,
    isPhysical,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────────────
function EmDash() {
  return <span className="text-slate-400 dark:text-slate-600">—</span>;
}

function FieldValue({ value }: { value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") {
    return <EmDash />;
  }
  return <span>{value}</span>;
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return formatCurrencyUtil(value) || "—";
}

function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return "—";
  return Number(value).toFixed(decimals);
}

function BoolBadge({ value }: { value: boolean | null | undefined }) {
  if (value === null || value === undefined) return <EmDash />;
  return value ? (
    <Badge className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700 hover:bg-green-100">
      Sì
    </Badge>
  ) : (
    <Badge variant="secondary" className="text-slate-600 dark:text-slate-400">
      No
    </Badge>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <div className="mt-1 text-sm text-slate-900 dark:text-slate-100">
        {children}
      </div>
    </div>
  );
}

function MonoValue({ value }: { value: string | null | undefined }) {
  if (!value) return <EmDash />;
  return (
    <span className="font-mono text-slate-900 dark:text-slate-100">{value}</span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page component
// ─────────────────────────────────────────────────────────────────────────────
export default function ProductDetailPage() {
  const params = useParams();
  const productId = parseInt(params.id as string);

  const inventoryColumns = useMemo(() => createInventoryColumns(), []);
  const movementsColumns = useMemo(() => createStockMovementsColumns(), []);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => productsApi.getById(productId),
    enabled: !!productId,
  });

  const { data: inventoryData, isLoading: isLoadingInventory } = useQuery({
    queryKey: ["product-inventory", productId],
    queryFn: () =>
      inventoryApi.getAll({ product_id: productId, per_page: 100 }),
    enabled: !!productId,
  });

  const inventory = inventoryData?.data ?? [];

  const { data: movementsData, isLoading: isLoadingMovements } = useQuery({
    queryKey: ["product-movements", productId],
    queryFn: () =>
      stockMovementsApi.getAll({ product_id: productId, per_page: 50 }),
    enabled: !!productId,
  });

  const movements = movementsData?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            Caricamento prodotto...
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Prodotto non trovato
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Il prodotto richiesto non esiste
          </p>
          <Link href="/products">
            <Button className="mt-4">Torna al catalogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  const vis = getFieldVisibility(product.product_type);

  const productTypeLabel =
    product.product_type === "article"
      ? "Articolo"
      : product.product_type === "service"
        ? "Servizio"
        : product.product_type === "kit"
          ? "Kit"
          : "Composto";

  // Determine standard_cost label
  const standardCostNote = (() => {
    if (product.standard_cost === null || product.standard_cost === undefined) {
      return null;
    }
    if (
      vis.isComposite &&
      product.composite_total_cost !== undefined &&
      product.composite_total_cost !== null &&
      Number(product.composite_total_cost) === Number(product.standard_cost)
    ) {
      return "(calcolato automaticamente)";
    }
    if (vis.isComposite && product.composite_total_cost !== undefined) {
      return "(valore manuale)";
    }
    return null;
  })();

  const ownershipTypeLabel = (v: string | null | undefined) => {
    if (!v) return null;
    if (v === "owned") return "Di proprietà";
    if (v === "subrental") return "Sub-noleggio";
    if (v === "mixed") return "Misto";
    return v;
  };

  return (
    <div className="space-y-6">
      {/* ─── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {product.name}
              </h1>
              <Badge
                variant={product.is_active ? "default" : "secondary"}
                className={
                  product.is_active
                    ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700 hover:bg-green-100"
                    : ""
                }
              >
                {product.is_active ? "Attivo" : "Inattivo"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {productTypeLabel}
              </Badge>
              {product.category && (
                <Badge variant="outline" className="text-xs">
                  {product.category.name}
                </Badge>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-mono text-sm">
              {product.code}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/products/${productId}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Modifica
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── TABS ───────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Dettagli</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="relations">Relazioni</TabsTrigger>
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
          <TabsTrigger value="movements">Movimenti</TabsTrigger>
          <TabsTrigger value="usage">Utilizzo</TabsTrigger>
          {vis.isKit && (
            <TabsTrigger value="kit-assemblies">Assemblies</TabsTrigger>
          )}
          {product.is_rentable && (
            <TabsTrigger value="subrental">Sub-Noleggio</TabsTrigger>
          )}
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB: DETTAGLI
            ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="details" className="space-y-6">

          {/* ── 1. INFORMAZIONI BASE ──────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Informazioni Base</CardTitle>
              <CardDescription>Dati principali del prodotto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <InfoRow label="Codice">
                  <MonoValue value={product.code} />
                </InfoRow>

                <InfoRow label="Codice Interno">
                  <MonoValue value={product.internal_code} />
                </InfoRow>

                <InfoRow label="Tipo Prodotto">
                  <Badge variant="secondary">{productTypeLabel}</Badge>
                </InfoRow>

                <InfoRow label="Categoria">
                  {product.category ? (
                    <Badge variant="outline">{product.category.name}</Badge>
                  ) : (
                    <EmDash />
                  )}
                </InfoRow>

                {vis.showBrand && (
                  <InfoRow label="Brand">
                    {product.brand ? (
                      <Badge variant="outline">{product.brand.name}</Badge>
                    ) : (
                      <EmDash />
                    )}
                  </InfoRow>
                )}

                <InfoRow label="Unità di Misura">
                  <FieldValue value={product.unit ?? "pz"} />
                </InfoRow>
              </div>

              {product.description && (
                <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Descrizione
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── 2. CODICI AGGIUNTIVI (non per service) ───────────────────── */}
          {(vis.showEan || vis.showBarcode || vis.showQrCode || vis.showEtimCode) && (
            <Card>
              <CardHeader>
                <CardTitle>Codici Aggiuntivi</CardTitle>
                <CardDescription>
                  Barcode, EAN e altri codici di tracciamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {vis.showEan && (
                    <InfoRow label="EAN / GTIN">
                      <MonoValue value={product.ean} />
                    </InfoRow>
                  )}
                  {vis.showBarcode && (
                    <InfoRow label="Barcode">
                      <MonoValue value={product.barcode} />
                    </InfoRow>
                  )}
                  {vis.showQrCode && (
                    <InfoRow label="QR Code">
                      <MonoValue value={product.qr_code} />
                    </InfoRow>
                  )}
                  {vis.showEtimCode && (
                    <InfoRow label="Codice ETIM">
                      <MonoValue value={product.etim_code} />
                    </InfoRow>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── 3. PACKAGING (solo article) ──────────────────────────────── */}
          {vis.showPackage && (
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="text-blue-900 dark:text-blue-100">
                  Packaging
                </CardTitle>
                <CardDescription>
                  Caratteristiche fisiche del contenitore
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoRow label="È un package/contenitore">
                    <BoolBadge value={product.is_package} />
                  </InfoRow>
                  {product.is_package && (
                    <>
                      <InfoRow label="Peso">
                        {product.package_weight != null ? (
                          <span>{product.package_weight} kg</span>
                        ) : (
                          <EmDash />
                        )}
                      </InfoRow>
                      <InfoRow label="Volume">
                        {product.package_volume != null ? (
                          <span>{product.package_volume} m³</span>
                        ) : (
                          <EmDash />
                        )}
                      </InfoRow>
                      <InfoRow label="Dimensioni">
                        {product.package_dimensions ? (
                          <span>{product.package_dimensions} cm</span>
                        ) : (
                          <EmDash />
                        )}
                      </InfoRow>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── 4. PREZZI & COSTI ─────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Prezzi e Costi</CardTitle>
              <CardDescription>
                Costi, prezzi di vendita e marginalità
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {/* standard_cost — tutti i tipi */}
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    Costo Standard
                  </p>
                  <p className="mt-1 text-xl font-bold text-amber-900 dark:text-amber-100">
                    {product.standard_cost != null
                      ? `€ ${formatCurrency(product.standard_cost)}`
                      : "—"}
                  </p>
                  {standardCostNote && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      {standardCostNote}
                    </p>
                  )}
                </div>

                {/* composite_total_cost — solo composite */}
                {vis.isComposite && product.composite_total_cost !== undefined && (
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                      Costo Componenti Calcolato
                    </p>
                    <p className="mt-1 text-xl font-bold text-indigo-900 dark:text-indigo-100">
                      € {formatCurrency(product.composite_total_cost)}
                    </p>
                    <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-1">
                      Vedi tab &quot;Relazioni&quot; per i dettagli
                    </p>
                  </div>
                )}

                {/* manufacturer prices — solo article */}
                {vis.showManufacturerPrices && (
                  <>
                    <InfoRow label="Costo Produttore">
                      {product.manufacturer_cost_price != null ? (
                        <span className="font-semibold">
                          € {formatCurrency(product.manufacturer_cost_price)}
                        </span>
                      ) : (
                        <EmDash />
                      )}
                    </InfoRow>
                    <InfoRow label="Prezzo Retail Produttore">
                      {product.manufacturer_retail_price != null ? (
                        <span className="font-semibold">
                          € {formatCurrency(product.manufacturer_retail_price)}
                        </span>
                      ) : (
                        <EmDash />
                      )}
                    </InfoRow>
                  </>
                )}

                {/* markup — article + composite */}
                {vis.showMarkup && (
                  <InfoRow label="Margine Vendita">
                    {product.sale_markup_percent != null ? (
                      <span className="font-semibold">
                        {formatNumber(product.sale_markup_percent)} %
                      </span>
                    ) : (
                      <EmDash />
                    )}
                  </InfoRow>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── 5. FORNITORI & SCORTE (solo article) ─────────────────────── */}
          {vis.showSupplier && (
            <Card>
              <CardHeader>
                <CardTitle>Fornitori e Scorte</CardTitle>
                <CardDescription>
                  Fornitore predefinito e parametri di riordino
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <InfoRow label="Fornitore Predefinito">
                  {product.defaultSupplier ? (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 inline-block">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                        {product.defaultSupplier.company_name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {product.defaultSupplier.code}
                      </p>
                    </div>
                  ) : (
                    <EmDash />
                  )}
                </InfoRow>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoRow label="Scorta Minima">
                    {product.reorder_level != null ? (
                      <span className="font-semibold">
                        {formatNumber(product.reorder_level)}{" "}
                        <span className="font-normal text-slate-500 dark:text-slate-400 text-xs">
                          {product.unit ?? "pz"}
                        </span>
                      </span>
                    ) : (
                      <EmDash />
                    )}
                  </InfoRow>
                  <InfoRow label="Quantità Riordino">
                    {product.reorder_quantity != null ? (
                      <span className="font-semibold">
                        {formatNumber(product.reorder_quantity)}{" "}
                        <span className="font-normal text-slate-500 dark:text-slate-400 text-xs">
                          {product.unit ?? "pz"}
                        </span>
                      </span>
                    ) : (
                      <EmDash />
                    )}
                  </InfoRow>
                  <InfoRow label="Tempo Consegna">
                    {product.lead_time_days != null ? (
                      <span className="font-semibold">
                        {product.lead_time_days}{" "}
                        <span className="font-normal text-slate-500 dark:text-slate-400 text-xs">
                          giorni
                        </span>
                      </span>
                    ) : (
                      <EmDash />
                    )}
                  </InfoRow>
                  <InfoRow label="Ubicazione Magazzino">
                    {product.location ? (
                      <span>{product.location}</span>
                    ) : (
                      <EmDash />
                    )}
                  </InfoRow>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── 6. NOLEGGIO (article + composite) ────────────────────────── */}
          {vis.showRental && (
            <Card>
              <CardHeader>
                <CardTitle>Noleggio</CardTitle>
                <CardDescription>
                  Configurazione noleggio e disponibilità
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoRow label="Noleggiabile">
                    <BoolBadge value={product.is_rentable} />
                  </InfoRow>

                  <InfoRow label="Tipo Proprietà">
                    {ownershipTypeLabel(product.ownership_type) ? (
                      <Badge variant="outline">
                        {ownershipTypeLabel(product.ownership_type)}
                      </Badge>
                    ) : (
                      <EmDash />
                    )}
                  </InfoRow>

                  <InfoRow label="Premium">
                    <BoolBadge value={product.is_premium} />
                  </InfoRow>

                  <InfoRow label="Markup Sub-noleggio">
                    {product.subrental_markup != null ? (
                      <span className="font-semibold">
                        {formatNumber(product.subrental_markup, 1)} %
                      </span>
                    ) : (
                      <EmDash />
                    )}
                  </InfoRow>

                  <InfoRow label="Prezzo Giornaliero Base Stimato">
                    <div className="flex items-center gap-2">
                      {product.estimated_base_day != null ? (
                        <span className="font-semibold">
                          € {formatCurrency(product.estimated_base_day)}
                        </span>
                      ) : (
                        <EmDash />
                      )}
                      {product.rental_price_estimated && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700">
                          <AlertTriangle className="h-3 w-3" />
                          Stimato
                        </span>
                      )}
                    </div>
                  </InfoRow>

                  <InfoRow label="Quantità in Noleggio">
                    {product.quantity_out_on_rental != null &&
                    product.quantity_out_on_rental > 0 ? (
                      <span className="font-semibold text-purple-700 dark:text-purple-300">
                        {formatNumber(product.quantity_out_on_rental)}{" "}
                        <span className="font-normal text-xs text-slate-500 dark:text-slate-400">
                          {product.unit ?? "pz"}
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400">0</span>
                    )}
                  </InfoRow>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── 7. UBICAZIONE & TEMPI (article + composite) ──────────────── */}
          {(vis.showLocation || vis.showLeadTime) && !vis.showSupplier && (
            // showSupplier già include lead_time_days, quindi mostriamo questa
            // card solo per composite (dove non c'è la card Fornitori & Scorte)
            <Card>
              <CardHeader>
                <CardTitle>Ubicazione e Tempi</CardTitle>
                <CardDescription>
                  Posizione in magazzino e tempi operativi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-5 sm:grid-cols-2">
                  {vis.showLocation && (
                    <InfoRow label="Ubicazione Magazzino">
                      {product.location ? (
                        <span>{product.location}</span>
                      ) : (
                        <EmDash />
                      )}
                    </InfoRow>
                  )}
                  {vis.showLeadTime && (
                    <InfoRow label="Tempo Consegna">
                      {product.lead_time_days != null ? (
                        <span className="font-semibold">
                          {product.lead_time_days}{" "}
                          <span className="font-normal text-slate-500 dark:text-slate-400 text-xs">
                            giorni
                          </span>
                        </span>
                      ) : (
                        <EmDash />
                      )}
                    </InfoRow>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── 8. STOCK E DISPONIBILITÀ ──────────────────────────────────── */}
          {(product.total_stock !== undefined ||
            product.available_stock !== undefined) && (
            <Card>
              <CardHeader>
                <CardTitle>Stock e Disponibilità</CardTitle>
                <CardDescription>Giacenze attuali nei magazzini</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-5 sm:grid-cols-3">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Stock Totale
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {formatNumber(product.total_stock)}{" "}
                      <span className="text-lg font-normal text-slate-500 dark:text-slate-400">
                        {product.unit ?? "pz"}
                      </span>
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                      Stock Disponibile
                    </p>
                    <p className="mt-1 text-2xl font-bold text-green-900 dark:text-green-100">
                      {formatNumber(product.available_stock)}{" "}
                      <span className="text-lg font-normal text-green-600 dark:text-green-400">
                        {product.unit ?? "pz"}
                      </span>
                    </p>
                  </div>
                  {product.quantity_out_on_rental !== undefined &&
                    product.quantity_out_on_rental > 0 && (
                      <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                        <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                          In Noleggio
                        </p>
                        <p className="mt-1 text-2xl font-bold text-purple-900 dark:text-purple-100">
                          {formatNumber(product.quantity_out_on_rental)}{" "}
                          <span className="text-lg font-normal text-purple-600 dark:text-purple-400">
                            {product.unit ?? "pz"}
                          </span>
                        </p>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── 9. NOTE ───────────────────────────────────────────────────── */}
          {product.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Note</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {product.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB: MEDIA
            ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Allegati e Media</CardTitle>
              <CardDescription>
                Immagini, schede tecniche, certificazioni e altri documenti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductMediaSection
                productId={productId}
                media={{
                  images:
                    product.media?.filter(
                      (m: App.Data.ProductMediaData) =>
                        m.collection_name === "images" && !m.is_pdf_conversion,
                    ) || [],
                  technical_sheets:
                    product.media?.filter(
                      (m: App.Data.ProductMediaData) =>
                        m.collection_name === "technical_sheets" &&
                        !m.is_pdf_conversion,
                    ) || [],
                  certifications:
                    product.media?.filter(
                      (m: App.Data.ProductMediaData) =>
                        m.collection_name === "certifications" &&
                        !m.is_pdf_conversion,
                    ) || [],
                  manuals:
                    product.media?.filter(
                      (m: App.Data.ProductMediaData) =>
                        m.collection_name === "manuals" && !m.is_pdf_conversion,
                    ) || [],
                  drawings:
                    product.media?.filter(
                      (m: App.Data.ProductMediaData) =>
                        m.collection_name === "drawings" &&
                        !m.is_pdf_conversion,
                    ) || [],
                  documents:
                    product.media?.filter(
                      (m: App.Data.ProductMediaData) =>
                        m.collection_name === "documents" &&
                        !m.is_pdf_conversion,
                    ) || [],
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB: RELAZIONI
            ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="relations" className="space-y-6">
          {vis.isComposite && (
            <CompositeBreakdownSection product={product} />
          )}
          <ProductRelations product={product} />
          <ProductRelationsTree product={product} />
          <ProductPriceCalculator product={product} />
          <ProductListsPreview product={product} />
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB: INVENTARIO
            ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Inventario per Magazzino</CardTitle>
              <CardDescription>
                Stock disponibile nei vari magazzini ({inventory.length}{" "}
                magazzini)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={inventoryColumns}
                data={inventory}
                isLoading={isLoadingInventory}
                storageKey={`material-${productId}-inventory-table`}
                emptyState={
                  <div className="text-center py-12">
                    <WarehouseIcon className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
                    <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Nessuno stock
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      Questo prodotto non è presente in nessun magazzino
                    </p>
                  </div>
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB: MOVIMENTI
            ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>Storico Movimenti</CardTitle>
              <CardDescription>
                Movimentazioni di carico e scarico ({movements.length}{" "}
                movimenti)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={movementsColumns}
                data={movements}
                isLoading={isLoadingMovements}
                storageKey={`material-${productId}-movements-table`}
                emptyState={
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
                    <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Nessun movimento
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      Non ci sono ancora movimenti per questo prodotto
                    </p>
                  </div>
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB: UTILIZZO
            ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Utilizzo nei Progetti</CardTitle>
              <CardDescription>
                Progetti che utilizzano questo prodotto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Funzionalità in sviluppo
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  La visualizzazione dell&apos;utilizzo del prodotto nei progetti
                  sarà disponibile a breve
                </p>
                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 max-w-md mx-auto">
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mb-2">
                    Features in arrivo:
                  </p>
                  <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 text-left space-y-1">
                    <li>Progetti che usano questo prodotto</li>
                    <li>Quantità pianificate vs utilizzate</li>
                    <li>Varianze di costo per progetto</li>
                    <li>Trend di consumo nel tempo</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB: KIT ASSEMBLIES
            ═══════════════════════════════════════════════════════════════════ */}
        {vis.isKit && (
          <TabsContent value="kit-assemblies" className="space-y-6">
            <KitAssembliesSection product={product} />
          </TabsContent>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB: SUB-NOLEGGIO
            ═══════════════════════════════════════════════════════════════════ */}
        {product.is_rentable && (
          <TabsContent value="subrental" className="space-y-6">
            <SubrentalTab product={product} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
