'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotesApi } from '@/lib/api/quotes';
import { customersApi } from '@/lib/api/customers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ComboboxSelect } from '@/components/combobox-select';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Save,
  FileText,
  User,
  Calendar,
  MapPin,
  CreditCard,
  FileDown,
  Upload,
  Plus,
  Eye,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { QuoteItemsBuilder } from '@/components/quote-items-builder';
import { QuoteAttachmentsUpload } from '@/components/quote-attachments-upload';
import { PdfViewer } from '@/components/pdf-viewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuoteStatusDropdown } from '@/components/quote-status-dropdown';

const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200',
  sent: 'bg-blue-100 text-blue-700 border-blue-200',
  approved: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  expired: 'bg-orange-100 text-orange-700 border-orange-200',
};

const statusLabels: Record<string, string> = {
  draft: 'Bozza',
  sent: 'Inviato',
  approved: 'Approvato',
  rejected: 'Rifiutato',
  expired: 'Scaduto',
};

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const quoteId = parseInt(params.id as string);

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote', quoteId],
    queryFn: () => quotesApi.getById(quoteId),
    enabled: !!quoteId,
  });

  // Lazy load customers only when editing and searching
  const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers', { is_active: true, search: customerSearch }],
    queryFn: () => customersApi.getAll({
      is_active: true,
      search: customerSearch,
      per_page: 50
    }),
    enabled: editMode, // Only load when in edit mode
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => quotesApi.update(quoteId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      setEditMode(false);
      toast.success('Preventivo aggiornato', {
        description: 'Le modifiche sono state salvate con successo',
      });
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile salvare le modifiche',
      });
    },
  });

  const changeStatusMutation = useMutation({
    mutationFn: (status: string) => quotesApi.changeStatus(quoteId, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });

      if (data.status === 'approved' && data.site_id) {
        toast.success('Preventivo approvato e cantiere creato', {
          description: `Il cantiere ${data.site?.code || ''} è stato creato con successo`,
        });
      } else {
        toast.success('Stato aggiornato', {
          description: 'Lo stato del preventivo è stato modificato con successo',
        });
      }
    },
    onError: (error: any) => {
      toast.error('Errore cambio stato', {
        description: error.response?.data?.message || 'Impossibile cambiare lo stato del preventivo',
      });
    },
  });

  const handleSave = useCallback(() => {
    updateMutation.mutate(formData);
  }, [formData, updateMutation]);

  const handleItemsChange = useCallback((items: any) => {
    setFormData((prev: any) => ({ ...prev, items }));
  }, []);

  const handleAttachmentsChange = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
  }, [queryClient, quoteId]);

  const handleLoadPdf = useCallback(async () => {
    if (pdfBlob || loadingPdf) return;

    setLoadingPdf(true);
    try {
      const blob = await quotesApi.downloadPdf(quoteId);
      setPdfBlob(blob);
    } catch (error: any) {
      toast.error('Errore caricamento PDF', {
        description: error.response?.data?.message || 'Impossibile caricare l\'anteprima PDF',
      });
    } finally {
      setLoadingPdf(false);
    }
  }, [quoteId, pdfBlob, loadingPdf]);

  const handleDownloadPdf = useCallback(async () => {
    if (!quote) return;

    try {
      const blob = await quotesApi.downloadPdf(quoteId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Preventivo-${quote.code}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF scaricato', {
        description: 'Il preventivo è stato scaricato con successo',
      });
    } catch (error: any) {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile scaricare il PDF',
      });
    }
  }, [quote, quoteId]);

  const handleStatusChange = useCallback((status: string) => {
    changeStatusMutation.mutate(status);
  }, [changeStatusMutation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-slate-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Caricamento preventivo...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Preventivo non trovato</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Il preventivo richiesto non esiste o è stato eliminato</p>
          <Button onClick={() => router.push('/dashboard/quotes')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna ai Preventivi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/quotes')}
            className="hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 truncate">{quote.code}</h1>
              <Badge className={`${statusColors[quote.status]} font-medium text-xs border`}>
                {statusLabels[quote.status]}
              </Badge>
              {quote.site_id && quote.site && (
                <Badge
                  className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-medium text-xs border cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors"
                  onClick={() => router.push(`/dashboard/sites/${quote.site_id}`)}
                >
                  🏗️ Cantiere: {quote.site.code}
                </Badge>
              )}
            </div>
            <p className="text-base text-slate-600 dark:text-slate-400">{quote.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {editMode ? (
            <>
              <Button variant="outline" onClick={() => setEditMode(false)}>
                Annulla
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Salva Modifiche
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setFormData({
                    customer_id: quote.customer_id,
                    issue_date: quote.issue_date,
                    valid_until: quote.valid_until,
                    title: quote.title,
                    description: quote.description,
                    address: quote.address,
                    city: quote.city,
                    province: quote.province,
                    postal_code: quote.postal_code,
                    payment_terms: quote.payment_terms,
                    notes: quote.notes,
                    items: quote.items || [],
                  });
                  setEditMode(true);
                }}
              >
                Modifica
              </Button>
              <QuoteStatusDropdown
                currentStatus={quote.status}
                onStatusChange={handleStatusChange}
                disabled={changeStatusMutation.isPending}
              />
              <Button onClick={handleDownloadPdf}>
                <FileDown className="mr-2 h-4 w-4" />
                Esporta PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs: Dettagli / Anteprima PDF */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1">
          <TabsTrigger value="details" className="data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800">
            <FileText className="mr-2 h-4 w-4" />
            Dettagli Preventivo
          </TabsTrigger>
          <TabsTrigger value="preview" className="data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800">
            <Eye className="mr-2 h-4 w-4" />
            Anteprima PDF
          </TabsTrigger>
        </TabsList>

        {/* Tab Content: Dettagli */}
        <TabsContent value="details" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Intestazione */}
          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">Intestazione</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 font-medium text-xs uppercase tracking-wide">
                    Cliente <span className="text-red-500">*</span>
                  </Label>
                  {editMode ? (
                    <div className="relative">
                      <ComboboxSelect
                        options={
                          customersData?.data.map((customer) => ({
                            value: customer.id.toString(),
                            label: customer.display_name,
                            description: customer.email || undefined,
                          })) ?? []
                        }
                        value={formData.customer_id?.toString() ?? quote.customer_id?.toString()}
                        onValueChange={(value) => setFormData({ ...formData, customer_id: parseInt(value) })}
                        onSearchChange={setCustomerSearch}
                        placeholder="Seleziona un cliente"
                        searchPlaceholder="Cerca cliente..."
                        emptyText="Nessun cliente trovato"
                        loading={isLoadingCustomers}
                        icon={<User className="h-4 w-4 text-slate-400 dark:text-slate-500" />}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                      <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {quote.customer?.display_name || 'Non specificato'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 font-medium text-xs uppercase tracking-wide">Progressivo</Label>
                  <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                    <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-100">{quote.code}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 font-medium text-xs uppercase tracking-wide">Data Emissione</Label>
                  {editMode ? (
                    <Input
                      type="date"
                      value={formData.issue_date || quote.issue_date}
                      onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                      className="h-11 "
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                      <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span className="text-sm text-slate-900 dark:text-slate-100">
                        {new Date(quote.issue_date).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 font-medium text-xs uppercase tracking-wide">Scadenza Preventivo</Label>
                  {editMode ? (
                    <Input
                      type="date"
                      value={formData.valid_until || quote.valid_until || ''}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                      className="h-11 "
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                      <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span className="text-sm text-slate-900 dark:text-slate-100">
                        {quote.valid_until
                          ? new Date(quote.valid_until).toLocaleDateString('it-IT')
                          : 'Non specificata'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300 font-medium text-xs uppercase tracking-wide">Oggetto</Label>
                {editMode ? (
                  <Input
                    value={formData.title || quote.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="h-11 "
                  />
                ) : (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                    <span className="text-sm text-slate-900 dark:text-slate-100">{quote.title}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300 font-medium text-xs uppercase tracking-wide">Descrizione</Label>
                {editMode ? (
                  <Textarea
                    value={formData.description ?? quote.description ?? ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrizione del lavoro (opzionale)"
                    rows={3}
                    className="resize-none"
                  />
                ) : (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {quote.description || 'Nessuna descrizione'}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Indirizzo Lavoro */}
          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">Indirizzo Lavoro</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300 font-medium text-xs uppercase tracking-wide">
                  Indirizzo <span className="text-slate-400 dark:text-slate-500 font-normal normal-case">(opzionale)</span>
                </Label>
                {editMode ? (
                  <Input
                    value={formData.address ?? quote.address ?? ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Via, piazza, località..."
                    className="h-11"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                    <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span className="text-sm text-slate-900 dark:text-slate-100">
                      {quote.address || 'Indirizzo non specificato'}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 font-medium text-xs uppercase tracking-wide">
                    Città <span className="text-slate-400 dark:text-slate-500 font-normal normal-case">(opzionale)</span>
                  </Label>
                  {editMode ? (
                    <Input
                      value={formData.city ?? quote.city ?? ''}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Città"
                      className="h-11"
                    />
                  ) : (
                    <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                      <span className="text-sm text-slate-900 dark:text-slate-100">
                        {quote.city || 'N/D'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 font-medium text-xs uppercase tracking-wide">
                    Prov. <span className="text-slate-400 dark:text-slate-500 font-normal normal-case">(opzionale)</span>
                  </Label>
                  {editMode ? (
                    <Input
                      value={formData.province ?? quote.province ?? ''}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value.toUpperCase() })}
                      placeholder="PR"
                      maxLength={2}
                      className="h-11 uppercase"
                    />
                  ) : (
                    <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                      <span className="text-sm text-slate-900 dark:text-slate-100">
                        {quote.province || 'N/D'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300 font-medium text-xs uppercase tracking-wide">
                  CAP <span className="text-slate-400 dark:text-slate-500 font-normal normal-case">(opzionale)</span>
                </Label>
                {editMode ? (
                  <Input
                    value={formData.postal_code ?? quote.postal_code ?? ''}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="00000"
                    maxLength={10}
                    className="h-11"
                  />
                ) : (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                    <span className="text-sm text-slate-900 dark:text-slate-100">
                      {quote.postal_code || 'N/D'}
                    </span>
                  </div>
                )}
              </div>

              {!editMode && !quote.address && !quote.city && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg">
                  <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Indirizzo non specificato</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      L'indirizzo del lavoro può essere aggiunto successivamente. Utile per eventi futuri o location da definire.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Voci del Preventivo */}
          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">Voci del Preventivo</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {editMode ? (
                <QuoteItemsBuilder
                  items={quote.items || []}
                  onChange={handleItemsChange}
                  showUnitPrices={quote.show_unit_prices}
                />
              ) : (
                <>
                  {quote.items && quote.items.length > 0 ? (
                    <div className="space-y-2">
                      {quote.items.map((item: any) => (
                        <div key={item.id} className="p-4 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {item.code && (
                                  <span className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                    {item.code}
                                  </span>
                                )}
                                {item.type === 'section' && (
                                  <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded">
                                    Sezione
                                  </span>
                                )}
                              </div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">{item.description}</p>
                              {item.notes && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{item.notes}</p>}
                              {item.type !== 'section' && (
                                <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                                  <span>
                                    Q.tà: <span className="font-medium">{item.quantity}</span>
                                  </span>
                                  {!item.hide_unit_price && quote.show_unit_prices && (
                                    <span>
                                      Prezzo: <span className="font-medium">€ {parseFloat(item.unit_price).toFixed(2)}</span>
                                    </span>
                                  )}
                                  {item.unit && (
                                    <span>
                                      Unità: <span className="font-medium">{item.unit}</span>
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            {item.type !== 'section' && (
                              <div className="text-right">
                                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                  € {parseFloat(item.total).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-600 dark:text-slate-400">Nessuna voce presente</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Note e Termini */}
          {(quote.notes || quote.terms_and_conditions || quote.footer_text) && (
            <Card className="shadow-sm">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200">
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">Note e Termini</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {quote.notes && (
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium text-xs uppercase tracking-wide">Note</Label>
                    <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{quote.notes}</p>
                    </div>
                  </div>
                )}
                {quote.terms_and_conditions && (
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium text-xs uppercase tracking-wide">Termini e Condizioni</Label>
                    <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{quote.terms_and_conditions}</p>
                    </div>
                  </div>
                )}
                {quote.footer_text && (
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium text-xs uppercase tracking-wide">Testo a Piè di Pagina</Label>
                    <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{quote.footer_text}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Totali */}
          <Card className="shadow-sm border-2">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200">
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">Riepilogo Importi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Subtotale</span>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  € {parseFloat(String(quote.subtotal || '0')).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {quote.discount_percentage > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Sconto ({quote.discount_percentage}%)</span>
                  <span className="text-sm font-medium text-red-600">
                    - € {parseFloat(String(quote.discount_amount || '0')).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {quote.show_tax && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      IVA ({quote.tax_percentage}%)
                      {quote.tax_included && <span className="text-xs ml-1">(inclusa)</span>}
                    </span>
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      € {parseFloat(String(quote.tax_amount || '0')).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex justify-between items-center pt-3 pb-2 px-3 -mx-3 bg-slate-50 rounded mt-4">
                <span className="text-base font-semibold text-slate-900 dark:text-slate-100">Totale</span>
                <span className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  € {parseFloat(String(quote.total_amount || '0')).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Pagamento */}
          {(quote.payment_method || quote.payment_terms) && (
            <Card className="shadow-sm">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">Pagamento</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                {quote.payment_method && (
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600 dark:text-slate-400">Metodo di Pagamento</Label>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{quote.payment_method}</p>
                  </div>
                )}
                {quote.payment_terms && (
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600 dark:text-slate-400">Termini di Pagamento</Label>
                    <p className="text-sm text-slate-700">{quote.payment_terms}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Allegati */}
          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">Allegati</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <QuoteAttachmentsUpload
                quoteId={quoteId}
                attachments={quote.attachments || []}
                onAttachmentsChange={handleAttachmentsChange}
                readOnly={!editMode}
              />
            </CardContent>
          </Card>
        </div>
      </div>
        </TabsContent>

        {/* Tab Content: Anteprima PDF */}
        <TabsContent value="preview" className="mt-6" onFocus={handleLoadPdf}>
          {pdfBlob ? (
            <PdfViewer
              file={pdfBlob}
              onDownload={handleDownloadPdf}
            />
          ) : (
            <Card className="p-12">
              <div className="flex flex-col items-center gap-4">
                {loadingPdf ? (
                  <>
                    <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-slate-600 rounded-full animate-spin" />
                    <p className="text-sm text-slate-500">Caricamento anteprima PDF...</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Eye className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500">Clicca sul tab "Anteprima PDF" per caricare l'anteprima</p>
                    <Button onClick={handleLoadPdf} variant="outline">
                      <Eye className="mr-2 h-4 w-4" />
                      Carica Anteprima
                    </Button>
                  </>
                )}
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
