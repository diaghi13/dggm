'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { rentalAnalyticsApi, BreakEvenItem, BuyVsRentItem, AssetRoiItem, UnderperformerItem, ScarcityItem } from '@/lib/api/rental-analytics';
import {
  TrendingUp,
  BarChart3,
  Euro,
  AlertTriangle,
  Package,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);

const formatNumber = (value: number, decimals = 1) =>
  new Intl.NumberFormat('it-IT', { maximumFractionDigits: decimals }).format(value);

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 space-y-4 animate-pulse">
      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
      <div className="space-y-3">
        <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded" />
        <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded" />
        <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded" />
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, iconClass }: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  iconClass?: string;
}) {
  return (
    <div className="p-5 border-b border-slate-200 dark:border-slate-800">
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${iconClass ?? 'text-slate-600 dark:text-slate-400'}`} />
        {title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 ml-6">{subtitle}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">{message}</p>
  );
}

// --- Break-Even Tracker Section ---
function BreakEvenSection({ items }: { items: BreakEvenItem[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
      <SectionHeader
        icon={TrendingUp}
        title="Break-Even Tracker"
        subtitle="Avanzamento ammortamento asset di proprietà"
        iconClass="text-blue-600 dark:text-blue-400"
      />
      <div className="p-5">
        {items.length === 0 ? (
          <EmptyState message="Nessun prodotto noleggiato trovato" />
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.product_id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {item.name}
                    </span>
                    <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                      {item.code}
                    </span>
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {formatNumber(item.total_rented_days, 0)}/{formatNumber(item.break_even_days, 0)} gg
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-1.5">
                  <div
                    className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(item.progress, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {formatNumber(item.progress, 1)}%
                  </span>
                  {item.remaining_days <= 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-950/30 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      Break-even raggiunto!
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Ancora {formatNumber(item.remaining_days, 0)} giorni al break-even
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Buy vs Rent Section ---
const trafficLightConfig = {
  green: {
    label: 'Conveniente',
    className: 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-950/30',
  },
  yellow: {
    label: 'Attenzione',
    className: 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/30',
  },
  red: {
    label: 'Critico',
    className: 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/30',
  },
};

function BuyVsRentSection({ items }: { items: BuyVsRentItem[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
      <SectionHeader
        icon={BarChart3}
        title="Acquisto vs Sub-Noleggio"
        subtitle="Convenienza acquisto rispetto al costo annuale sub-noleggio"
        iconClass="text-purple-600 dark:text-purple-400"
      />
      <div className="p-5">
        {items.length === 0 ? (
          <EmptyState message="Nessun dato sub-noleggio disponibile" />
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const config = trafficLightConfig[item.traffic_light];
              return (
                <div
                  key={item.product_id}
                  className="flex items-center gap-3 p-3 rounded-md border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.code}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Costo annuo: <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(item.annual_subrental_cost)}</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Acquisto: <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(item.estimated_purchase_price)}</span>
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${config.className}`}>
                      {config.label}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formatNumber(item.ratio * 100, 1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Asset ROI Section ---
function AssetRoiSection({ items }: { items: AssetRoiItem[] }) {
  const sorted = [...items].sort((a, b) => b.revenue_per_day - a.revenue_per_day).slice(0, 10);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
      <SectionHeader
        icon={Euro}
        title="ROI Asset"
        subtitle="Rendimento per prodotto noleggiabile (top 10 per €/giorno)"
        iconClass="text-green-600 dark:text-green-400"
      />
      <div className="p-5">
        {items.length === 0 ? (
          <EmptyState message="Nessun noleggio confermato trovato" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left py-2 pr-4 text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    Prodotto
                  </th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    Noleggi
                  </th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    Gg Totali
                  </th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    Durata Media
                  </th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    Revenue Totale
                  </th>
                  <th className="text-right py-2 pl-2 text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    €/Giorno
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {sorted.map((item) => (
                  <tr
                    key={item.product_id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <td className="py-2.5 pr-4">
                      <p className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[160px]">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.code}</p>
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-700 dark:text-slate-300">
                      {formatNumber(item.rental_count, 0)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-700 dark:text-slate-300">
                      {formatNumber(item.total_days, 0)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-700 dark:text-slate-300">
                      {formatNumber(item.avg_duration, 1)} gg
                    </td>
                    <td className="py-2.5 px-2 text-right font-medium text-slate-900 dark:text-slate-100">
                      {formatCurrency(item.total_revenue)}
                    </td>
                    <td className="py-2.5 pl-2 text-right">
                      <span className="inline-block font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded text-xs">
                        {formatCurrency(item.revenue_per_day)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Underperformers Section ---
function UnderperformersSection({ items }: { items: UnderperformerItem[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
      <SectionHeader
        icon={AlertTriangle}
        title="Asset Sottoperformanti"
        subtitle="Prodotti non noleggiati negli ultimi 30 giorni"
        iconClass="text-amber-500 dark:text-amber-400"
      />
      <div className="p-5">
        {items.length === 0 ? (
          <div className="flex items-center gap-2 justify-center py-4">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-700 dark:text-green-400">
              Tutti gli asset sono stati noleggiati di recente
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.product_id}
                className="flex items-center gap-3 p-3 rounded-md border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-amber-400 dark:bg-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.code}</p>
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap shrink-0">
                  {item.days_since_rental !== null
                    ? `Ultimo noleggio: ${formatNumber(item.days_since_rental, 0)} giorni fa`
                    : 'Mai noleggiato'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Scarcity Monitor Section ---
function ScarcitySection({ items }: { items: ScarcityItem[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
      <SectionHeader
        icon={Package}
        title="Scarcity Monitor"
        subtitle="Prodotti vicini alla soglia di disponibilità"
        iconClass="text-rose-600 dark:text-rose-400"
      />
      <div className="p-5">
        {items.length === 0 ? (
          <EmptyState message="Nessun prodotto vicino alla soglia" />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.product_id}
                className="p-3 rounded-md border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.code}</p>
                  </div>
                  <span
                    className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      item.is_scarce
                        ? 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/30'
                        : 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/30'
                    }`}
                  >
                    {item.is_scarce ? 'SCARSO' : 'Attenzione'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>
                    {formatNumber(item.available_stock, 0)} disp. / {formatNumber(item.total_stock, 0)} tot.
                    <span className="ml-2 text-slate-500 dark:text-slate-400">
                      ({formatNumber(item.availability_ratio * 100, 1)}%)
                    </span>
                  </span>
                  {item.scarcity_multiplier > 1 && (
                    <span className="text-amber-700 dark:text-amber-400 font-medium">
                      +{formatNumber((item.scarcity_multiplier - 1) * 100, 0)}% prezzo scarcity
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main Page ---
export default function RentalDashboardPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['rental-analytics'],
    queryFn: () => rentalAnalyticsApi.getKpi(),
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['rental-analytics'] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-1">
              Dashboard Noleggio
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              KPI e analisi asset noleggio
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            className="flex items-center gap-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-700 dark:text-red-400">
            Errore nel caricamento dei dati. Riprova più tardi.
          </p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonCard />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </>
      )}

      {/* Data sections */}
      {data && (
        <>
          {/* Row 1: Break-even + Buy vs Rent */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BreakEvenSection items={data.break_even_tracker} />
            <BuyVsRentSection items={data.buy_vs_rent} />
          </div>

          {/* Row 2: Asset ROI (full width) */}
          <AssetRoiSection items={data.asset_roi} />

          {/* Row 3: Underperformers + Scarcity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <UnderperformersSection items={data.underperformers} />
            <ScarcitySection items={data.scarcity_monitor} />
          </div>
        </>
      )}
    </div>
  );
}
