'use client';

import { useState } from 'react';
import {
  Building2,
  User,
  MapPin,
  Calendar,
  Euro,
  FileText,
  AlertCircle,
  Target,
  Search,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ComboboxSelect } from '@/components/combobox-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CurrencyInput, CurrencyDisplay } from '@/components/ui/currency-input';
import { Button } from '@/components/ui/button';
import { ProjectMap } from '@/components/ui/project-map';
import { toast } from 'sonner';
import type { Project } from '@/lib/types';

// ─── type helpers ─────────────────────────────────────────────────────────────

/** Safely read a string field from the form state */
function fs(v: string | number | boolean | null | undefined, fallback = ''): string {
  if (v === null || v === undefined || v === false) return fallback;
  return String(v);
}

/** Safely read a numeric field from the form state */
function fn(v: string | number | boolean | null | undefined, fallback: number | null = null): number | null {
  if (v === null || v === undefined) return fallback;
  const n = Number(v);
  return isNaN(n) ? fallback : n;
}

// ─── constants ────────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200',
  planned: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-green-100 text-green-700 border-green-200',
  on_hold: 'bg-amber-100 text-amber-700 border-amber-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

const statusLabels: Record<string, string> = {
  draft: 'Bozza',
  planned: 'Pianificato',
  in_progress: 'In Corso',
  on_hold: 'In Pausa',
  completed: 'Completato',
  cancelled: 'Annullato',
};

const priorityColors: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600 border-slate-200',
  medium: 'bg-blue-100 text-blue-700 border-blue-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  urgent: 'bg-red-100 text-red-700 border-red-200',
};

const priorityLabels: Record<string, string> = {
  low: 'Bassa',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function InfoField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
        {label}
      </p>
      <div className="text-sm text-slate-900 dark:text-slate-100">{children}</div>
    </div>
  );
}

function InfoText({ value, fallback = '—' }: { value?: string | null; fallback?: string }) {
  return <span className="font-medium">{value || fallback}</span>;
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

// ─── Map component (OpenStreetMap, no API key) ────────────────────────────────
// (Replaced by <ProjectMap> Leaflet component)

// ─── Main component ───────────────────────────────────────────────────────────

interface CustomerOption {
  id: number;
  display_name: string;
  email?: string | null;
}

interface ProjectRiepilogoTabProps {
  project: Project;
  editMode: boolean;
  formData: Record<string, string | number | boolean | null | undefined>;
  setFormData: (data: Record<string, string | number | boolean | null | undefined>) => void;
  customersData?: { data: CustomerOption[] };
  isLoadingCustomers?: boolean;
  setCustomerSearch: (s: string) => void;
}

export function ProjectRiepilogoTab({
  project,
  editMode,
  formData,
  setFormData,
  customersData,
  isLoadingCustomers,
  setCustomerSearch,
}: ProjectRiepilogoTabProps) {
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Build address string from form (edit) or project (view) for geocoding
  const geocodeAddress = async () => {
    const address = [
      formData.address ?? project.address,
      formData.city ?? project.city,
      formData.province ?? project.province,
      formData.postal_code ?? project.postal_code,
      'Italia',
    ]
      .filter(Boolean)
      .join(', ');

    if (!address.trim()) {
      toast.error('Inserisci un indirizzo prima di cercare le coordinate');
      return;
    }

    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
        { headers: { 'Accept-Language': 'it', 'User-Agent': 'DGGM-ERP/1.0' } },
      );
      const data = await res.json();
      if (data.length === 0) {
        toast.error('Indirizzo non trovato. Prova a essere più specifico.');
        return;
      }
      const { lat, lon } = data[0];
      setFormData({ ...formData, latitude: parseFloat(lat), longitude: parseFloat(lon) });
      toast.success('Coordinate trovate', {
        description: `${parseFloat(lat).toFixed(6)}, ${parseFloat(lon).toFixed(6)}`,
      });
    } catch {
      toast.error('Errore durante la ricerca delle coordinate');
    } finally {
      setIsGeocoding(false);
    }
  };

  // In edit mode use form values as live preview; fall back to saved project values
  const rawLat = editMode ? (formData.latitude ?? project.latitude) : project.latitude;
  const rawLng = editMode ? (formData.longitude ?? project.longitude) : project.longitude;
  const lat = rawLat ? Number(rawLat) : null;
  const lng = rawLng ? Number(rawLng) : null;
  const hasCoords = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

  const fullAddress = [project.address, project.city, project.province, project.postal_code]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-6">
      {/* ── Top grid: info + finanziario ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: details */}
        <div className="lg:col-span-2 space-y-6">

          {/* Informazioni Generali */}
          <Card className="border-2">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                Informazioni Generali
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              {editMode ? (
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label>Codice Progetto</Label>
                    <Input value={project.code} disabled className="bg-slate-50 dark:bg-slate-900" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome Progetto *</Label>
                    <Input
                      value={fs(formData.name, project.name)}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nome del progetto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cliente *</Label>
                    <ComboboxSelect
                      options={customersData?.data.map((c: CustomerOption) => ({
                        value: c.id.toString(),
                        label: c.display_name,
                        description: c.email || undefined,
                      })) ?? []}
                      value={formData.customer_id != null ? String(formData.customer_id) : project.customer_id?.toString()}
                      onValueChange={(v) => setFormData({ ...formData, customer_id: parseInt(v) })}
                      onSearchChange={setCustomerSearch}
                      placeholder="Seleziona un cliente"
                      searchPlaceholder="Cerca cliente..."
                      emptyText="Nessun cliente trovato"
                      loading={isLoadingCustomers}
                      icon={<User className="h-4 w-4 text-slate-400 dark:text-slate-500" />}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stato *</Label>
                    <Select
                      value={fs(formData.status, project.status)}
                      onValueChange={(v) => setFormData({ ...formData, status: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Bozza</SelectItem>
                        <SelectItem value="planned">Pianificato</SelectItem>
                        <SelectItem value="in_progress">In Corso</SelectItem>
                        <SelectItem value="on_hold">In Pausa</SelectItem>
                        <SelectItem value="completed">Completato</SelectItem>
                        <SelectItem value="cancelled">Annullato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priorità</Label>
                    <Select
                      value={fs(formData.priority, project.priority ?? '')}
                      onValueChange={(v) => setFormData({ ...formData, priority: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Nessuna" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Bassa</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Descrizione</Label>
                    <Textarea
                      value={fs(formData.description, project.description ?? '')}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descrizione del progetto"
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <InfoField label="Codice">
                      <InfoText value={project.code} />
                    </InfoField>
                    <InfoField label="Cliente">
                      <span className="font-medium flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        {project.customer?.display_name || '—'}
                      </span>
                    </InfoField>
                  </div>
                  <InfoField label="Nome Progetto">
                    <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {project.name}
                    </p>
                  </InfoField>
                  <div className="flex items-center gap-2">
                    <Badge className={`${statusColors[project.status]} border text-xs font-medium`}>
                      {statusLabels[project.status]}
                    </Badge>
                    {project.priority && (
                      <Badge className={`${priorityColors[project.priority]} border text-xs font-medium`}>
                        {priorityLabels[project.priority]}
                      </Badge>
                    )}
                  </div>
                  {project.description && (
                    <>
                      <Separator />
                      <InfoField label="Descrizione">
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                          {project.description}
                        </p>
                      </InfoField>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Date e Timeline */}
          <Card className="border-0 bg-slate-50 dark:bg-slate-900/40">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editMode ? (
                <div className="grid grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <Label>Data Inizio</Label>
                    <Input type="date" value={fs(formData.start_date, project.start_date ?? '')} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fine Stimata</Label>
                    <Input type="date" value={fs(formData.estimated_end_date, project.estimated_end_date ?? '')} onChange={(e) => setFormData({ ...formData, estimated_end_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fine Effettiva</Label>
                    <Input type="date" value={fs(formData.actual_end_date, project.actual_end_date ?? '')} onChange={(e) => setFormData({ ...formData, actual_end_date: e.target.value })} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-5">
                  <InfoField label="Inizio">
                    <InfoText value={formatDate(project.start_date)} />
                  </InfoField>
                  <InfoField label="Fine Stimata">
                    <InfoText value={formatDate(project.estimated_end_date)} />
                  </InfoField>
                  <InfoField label="Fine Effettiva">
                    <InfoText value={formatDate(project.actual_end_date)} />
                  </InfoField>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Note */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Note
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {editMode ? (
                <>
                  <div className="space-y-2">
                    <Label>Note Pubbliche</Label>
                    <Textarea value={fs(formData.notes, project.notes ?? '')} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Note visibili al cliente" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Note Interne</Label>
                    <Textarea value={fs(formData.internal_notes, project.internal_notes ?? '')} onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })} placeholder="Note interne (non visibili al cliente)" rows={3} />
                  </div>
                </>
              ) : (
                <>
                  {project.notes ? (
                    <InfoField label="Note Pubbliche">
                      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{project.notes}</p>
                    </InfoField>
                  ) : null}
                  {project.internal_notes ? (
                    <InfoField label="Note Interne">
                      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{project.internal_notes}</p>
                    </InfoField>
                  ) : null}
                  {!project.notes && !project.internal_notes && (
                    <p className="text-sm text-slate-400 italic">Nessuna nota</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: financials */}
        <div className="space-y-4">

          {/* Dati Finanziari (edit mode only) */}
          {editMode && (
            <Card className="border-2">
              <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Euro className="h-4 w-4" />
                  Dati Finanziari
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="space-y-2">
                  <Label>Importo Stimato (€)</Label>
                  <CurrencyInput value={fn(formData.estimated_amount, Number(project.estimated_amount))} onChange={(v) => setFormData({ ...formData, estimated_amount: v })} />
                </div>
                <div className="space-y-2">
                  <Label>Costo Effettivo (€)</Label>
                  <CurrencyInput value={fn(formData.actual_cost, Number(project.actual_cost))} onChange={(v) => setFormData({ ...formData, actual_cost: v })} />
                </div>
                <div className="space-y-2">
                  <Label>Importo Fatturato (€)</Label>
                  <CurrencyInput value={fn(formData.invoiced_amount, Number(project.invoiced_amount))} onChange={(v) => setFormData({ ...formData, invoiced_amount: v })} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dati Finanziari (view mode) */}
          {!editMode && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Dati Finanziari
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Importo Stimato</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    <CurrencyDisplay value={Number(project.estimated_amount ?? 0)} />
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Costo Effettivo</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    <CurrencyDisplay value={Number(project.actual_cost ?? 0)} />
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Importo Fatturato</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    <CurrencyDisplay value={Number(project.invoiced_amount ?? 0)} />
                  </span>
                </div>
                <p className="pt-1 text-xs text-slate-400 dark:text-slate-500">
                  Per l&apos;analisi P&amp;L dettagliata vai al tab <span className="font-medium">Riepilogo P&L</span>.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Preventivo collegato */}
          {project.quote_id && project.quote && (
            <Card className="border-0 bg-slate-50 dark:bg-slate-900/40">
              <CardContent className="pt-4 space-y-3">
                <InfoField label="Preventivo Collegato">
                  <div className="flex items-center gap-2 mt-1">
                    <FileText className="h-4 w-4 text-sky-500" />
                    <span className="font-semibold text-sky-700 dark:text-sky-300">
                      {project.quote.code}
                    </span>
                    <Badge className="text-[10px] bg-sky-100 text-sky-700 border-sky-200 border">
                      {project.quote.status}
                    </Badge>
                  </div>
                  {project.quote.title && (
                    <p className="text-xs text-slate-500 mt-1">{project.quote.title}</p>
                  )}
                </InfoField>
              </CardContent>
            </Card>
          )}

          {/* Target GPS */}
          {!editMode && hasCoords && (
            <Card className="border-0 bg-slate-50 dark:bg-slate-900/40">
              <CardContent className="pt-4">
                <InfoField label="Raggio GPS">
                  <span className="font-medium flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-slate-400" />
                    {project.gps_radius || 100} m
                  </span>
                </InfoField>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── Localizzazione + Mappa ────────────────────────────────────────── */}
      <Card className="border-2">
        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            Localizzazione
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          {editMode ? (
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2 space-y-2">
                <Label>Indirizzo</Label>
                <Input value={fs(formData.address, project.address ?? '')} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Via, numero civico" />
              </div>
              <div className="space-y-2">
                <Label>Città</Label>
                <Input value={fs(formData.city, project.city ?? '')} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Città" />
              </div>
              <div className="space-y-2">
                <Label>Provincia</Label>
                <Input value={fs(formData.province, project.province ?? '')} onChange={(e) => setFormData({ ...formData, province: e.target.value })} placeholder="MI" maxLength={2} />
              </div>
              <div className="space-y-2">
                <Label>CAP</Label>
                <Input value={fs(formData.postal_code, project.postal_code ?? '')} onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })} placeholder="20100" />
              </div>
              <div className="space-y-2">
                <Label>Raggio GPS (m)</Label>
                <Input type="number" value={fn(formData.gps_radius, project.gps_radius ?? 100) ?? 100} onChange={(e) => setFormData({ ...formData, gps_radius: parseInt(e.target.value) })} />
                <p className="text-xs text-slate-500">Raggio di validazione timbrature GPS</p>
              </div>
              <div className="space-y-2">
                <Label>Latitudine</Label>
                <Input type="number" step="0.00000001" value={fn(formData.latitude, project.latitude ?? undefined) ?? ''} onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })} placeholder="45.4642" />
              </div>
              <div className="space-y-2">
                <Label>Longitudine</Label>
                <Input type="number" step="0.00000001" value={fn(formData.longitude, project.longitude ?? undefined) ?? ''} onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })} placeholder="9.1900" />
              </div>
              <div className="col-span-full flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={geocodeAddress}
                  disabled={isGeocoding}
                >
                  {isGeocoding
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <Search className="mr-2 h-4 w-4" />}
                  {isGeocoding ? 'Ricerca in corso…' : 'Rileva coordinate dall\'indirizzo'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Address info */}
              <div className="space-y-4">
                {!fullAddress ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Indirizzo non specificato.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <InfoField label="Indirizzo Cantiere">
                    <p className="text-sm font-medium leading-relaxed text-slate-900 dark:text-slate-100">
                      {project.address && <span className="block">{project.address}</span>}
                      {(project.city || project.province || project.postal_code) && (
                        <span className="block text-slate-600 dark:text-slate-400">
                          {[project.postal_code, project.city, project.province].filter(Boolean).join(' ')}
                        </span>
                      )}
                    </p>
                  </InfoField>
                )}
                {hasCoords && (
                  <InfoField label="Coordinate GPS">
                    <span className="font-medium font-mono text-xs text-slate-600 dark:text-slate-400">
                      {lat!.toFixed(6)}, {lng!.toFixed(6)}
                    </span>
                  </InfoField>
                )}
              </div>

              {/* Map — shows placeholder when coords are missing */}
              <ProjectMap
                lat={lat}
                lng={lng}
                radius={project.gps_radius}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
