<?php
/**
 * @var \App\Domains\Quote\Models\Quote $quote
 * @var array $colors
 * @var array $vatBreakdown
 * @var array $company
 */
?>

    <!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preventivo Template</title>
    <!-- Use Tailwind CDN for simplicity in this template. For production, inline the CSS. -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {sans: ['Inter', 'sans-serif']},
                    colors: {
                        primary: '{{ $colors['primary'] }}',
                        secondary: '{{ $colors['secondary'] }}',
                    }
                }
            }
        }
    </script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0;
        }

        @page {
            margin: 10mm 0mm 30mm 0mm; /* top, right, bottom (spazio per footer), left */
            size: A4 portrait;
        }

        .page-break {
            page-break-before: always;
        }

        .avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
        }

        /* Forza il blocco totali a non spezzarsi e a saltare pagina se necessario */
        .totals-wrapper {
            break-inside: avoid;
            page-break-inside: avoid;
        }

        /* Proteggi il footer da page break */
        footer {
            break-inside: avoid;
            page-break-inside: avoid;
            display: block;
        }
    </style>
</head>
<body class="bg-white text-slate-700">
<!-- Main Container A4 size approx in px at 96dpi is ~794x1123, but for print we use auto width -->
<div class="w-full max-w-4xl mx-auto pl-8 pr-8 pb-8 relative min-h-screen flex flex-col">

    <!-- Header -->
    <header class="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-5">
        <div class="w-1/2">
            @if($company['logo'])
                <img src="{{ $company['logo'] }}" alt="Logo" class="h-16 w-auto object-contain mb-4">
            @else
                <div class="h-16 w-40 bg-gray-200 flex items-center justify-center text-gray-400 text-xs mb-4">LOGO
                </div>
            @endif
            <div class="text-2xl font-bold text-slate-900 tracking-tight">PREVENTIVO</div>
            <div class="text-primary font-medium text-sm mt-0.5">Nr. {{ $quote->code }}</div>
            <div class="text-slate-500 text-xs mt-0.5">Data: {{ $quote->issue_date->translatedFormat('d F Y') }}</div>
            @if($quote->valid_until)
                <div class="text-[10px] text-slate-400 mt-0.5">Valido fino
                    al: {{ $quote->valid_until->translatedFormat('d F Y') }}</div>
            @endif
        </div>
        <div class="w-1/2 text-right">
            <h2 class="text-base font-bold text-slate-900">{{ $company['name'] }}</h2>
            <div class="text-slate-500 leading-snug mt-1 text-xs">
                @if($company['address'])
                    {{ $company['address'] }}<br>
                @endif
                @if($company['postal_code'] || $company['city'] || $company['province'])
                    {{ implode(' ', array_filter([$company['postal_code'], $company['city'], $company['province'] ? '('.$company['province'].')' : null])) }}
                    <br>
                @endif
                @if($company['vat'])
                    P.IVA: {{ $company['vat'] }}@if($company['fiscal_code'])
                        | C.F.: {{ $company['fiscal_code'] }}
                    @endif<br>
                @elseif($company['fiscal_code'])
                    C.F.: {{ $company['fiscal_code'] }}<br>
                @endif
                @if($company['phone'] || $company['email'])
                    {{ implode(' | ', array_filter([$company['phone'], $company['email']])) }}<br>
                @endif
                @if($company['website'])
                    {{ $company['website'] }}
                @endif
            </div>
        </div>
    </header>

    <!-- Clients Info -->
    <div class="flex justify-between gap-8 mb-6">
        <div class="flex-1">
            <h3 class="text-[10px] font-bold uppercase tracking-wider text-primary mb-1.5 border-b border-slate-100 pb-0.5">
                Spett.le Cliente</h3>
            <div
                class="text-slate-900 font-semibold text-sm">{{ $quote->customer->business_name ?? $quote->customer->display_name }}</div>
            <div class="text-slate-600 mt-0.5 text-xs leading-snug">
                @if($quote->customer->contact_person)
                    <div class="font-medium">{{ $quote->customer->contact_person }}</div>
                @endif
                @if($quote->customer->address)
                    {{ $quote->customer->address }}<br>
                @endif
                @if($quote->customer->city)
                    {{ $quote->customer->postal_code }} {{ $quote->customer->city }}<br>
                @endif
                @if($quote->customer->vat)
                    P.IVA/C.F.: {{ $quote->customer->vat }}
                @endif
            </div>
        </div>
        <div class="flex-1">
            <h3 class="text-[10px] font-bold uppercase tracking-wider text-primary mb-1.5 border-b border-slate-100 pb-0.5">
                Dettagli</h3>
            @if($quote->title)
                <div class="mb-1.5">
                    <span class="block text-[10px] text-slate-400">Oggetto</span>
                    <span class="font-medium text-slate-900 text-xs">{{ $quote->title }}</span>
                </div>
            @endif
            @if($quote->description)
                <div class="mb-1.5">
                    <span class="block text-[10px] text-slate-400">Descrizione</span>
                    <span
                        class="font-medium text-slate-900 text-xs">{{ \Illuminate\Support\Str::limit($quote->description, 100) }}</span>
                </div>
            @endif
            @if($quote->address && $quote->city)
                <div>
                    <span class="block text-[10px] text-slate-400">Destinazione</span>
                    <span class="font-medium text-slate-900 text-xs">{{ $quote->full_address }}</span>
                </div>
            @endif
        </div>
    </div>

    <!-- Table -->
    <div class="mb-6">
        <table class="w-full text-left border-collapse" style="font-size: 11px;">
            @php
                // Controlla se il primo item è una sezione
                $firstItem = $quote->items->whereNull('parent_id')->first();
                $firstIsSection = $firstItem && $firstItem->type === \App\Enums\QuoteItemType::Section;

                $showPriceCols = $quote->show_unit_prices
                    || $quote->items->flatMap(fn ($item) => $item->children->isNotEmpty() ? $item->children : collect([$item]))
                                    ->where('hide_unit_price', false)
                                    ->isNotEmpty();

                $showDiscountCol = $quote->items->flatMap(fn ($item) => $item->children->isNotEmpty() ? $item->children : collect([$item]))
                                    ->where('discount_percentage', '>', 0)
                                    ->isNotEmpty();
            @endphp
            @if(!$firstIsSection)
                <thead>
                <tr class="border-b-2 border-slate-800 text-slate-900 text-[10px] uppercase tracking-wide">
                    @if($quote->show_product_codes)
                        <th class="py-1 font-bold w-20">Codice</th>
                    @endif
                    <th class="py-1 font-bold">Descrizione</th>
                    <th class="py-1 font-bold w-10 text-center">U.M.</th>
                    <th class="py-1 font-bold w-10 text-center">Q.tà</th>
                    @if($showPriceCols)
                        <th class="py-1 font-bold w-24 text-right">Prezzo</th>
                    @endif
                    @if($showDiscountCol)
                        <th class="py-1 font-bold w-16 text-center">Sc.%</th>
                    @endif
                    @if($quote->show_vat || $quote->tax_included)
                        <th class="py-1 font-bold w-10 text-center">IVA</th>
                    @endif
                    @if($showPriceCols)
                        <th class="py-1 font-bold w-24 text-right">
                            Totale{{ ($quote->vat_included_in_prices || $quote->tax_included) ? ' (IVA incl.)' : '' }}</th>
                    @endif
                </tr>
                </thead>
            @endif
            <tbody class="text-slate-600">
            @foreach($quote->items->whereNull('parent_id') as $item)
                @if($item->type === \App\Enums\QuoteItemType::Section)
                    <!-- SECTION -->
                    @php
                        $totalTableColumns = 3;
                        if($quote->show_product_codes) $totalTableColumns++;
                        if($showPriceCols) $totalTableColumns++;
                        if($showDiscountCol) $totalTableColumns++;
                        if($quote->show_vat || $quote->tax_included) $totalTableColumns++;
                        if($showPriceCols) $totalTableColumns++;
                    @endphp
                    <tr class="bg-gray-300 border-b border-slate-400">
                        @if($quote->show_section_totals)
                            <td colspan="{{ $totalTableColumns - 1 }}" class="py-1 pl-3 align-middle">
                                <div
                                    class="font-bold text-slate-900 uppercase text-[10px]">{{ $item->description }}</div>
                                @if($item->notes)
                                    <div class="text-[9px] text-slate-500 italic leading-tight">{{ $item->notes }}</div>
                                @endif
                            </td>
                            <td class="py-1 text-right font-bold text-slate-900 text-[10px] align-middle"
                                style="white-space: nowrap; min-width: 7rem;">
                                € {{ number_format($item->children->sum(($quote->vat_included_in_prices || $quote->tax_included) ? 'total_with_vat' : 'total'), 2, ',', '.') }}
                            </td>
                        @else
                            <td colspan="{{ $totalTableColumns }}" class="py-1 pl-3 align-middle">
                                <div
                                    class="font-bold text-slate-900 uppercase text-[10px]">{{ $item->description }}</div>
                                @if($item->notes)
                                    <div class="text-[9px] text-slate-500 italic leading-tight">{{ $item->notes }}</div>
                                @endif
                            </td>
                        @endif
                    </tr>
                    <!-- Header ripetuto sotto la sezione -->
                    <tr class="border-b-2 border-slate-800 text-slate-900 text-[10px] uppercase tracking-wide">
                        @if($quote->show_product_codes)
                            <th class="py-1 font-bold w-20">Codice</th>
                        @endif
                        <th class="py-1 font-bold">Descrizione</th>
                        <th class="py-1 font-bold w-10 text-center">U.M.</th>
                        <th class="py-1 font-bold w-10 text-center">Q.tà</th>
                        @if($showPriceCols)
                            <th class="py-1 font-bold w-24 text-right">Prezzo</th>
                        @endif
                        @if($showDiscountCol)
                            <th class="py-1 font-bold w-16 text-center">Sc.%</th>
                        @endif
                        @if($quote->show_vat || $quote->tax_included)
                            <th class="py-1 font-bold w-10 text-center">IVA</th>
                        @endif
                        @if($showPriceCols)
                            <th class="py-1 font-bold w-24 text-right">
                                Totale{{ ($quote->vat_included_in_prices || $quote->tax_included) ? ' (IVA incl.)' : '' }}</th>
                        @endif
                    </tr>
                    @foreach($item->children as $child)
                        <tr class="border-b border-slate-100 last:border-0">
                            @if($quote->show_product_codes)
                                <td class="py-1.5 font-mono text-[10px] text-slate-500 align-top">{{ $child->code ?? ($child->product ? $child->product->code : '') }}</td>
                            @endif
                            <td class="py-1.5 align-top">
                                <div
                                    class="font-medium text-slate-800 leading-snug whitespace-pre-wrap">{{ $child->description }}</div>
                                @if($child->notes)
                                    <div
                                        class="text-[9px] mt-0.5 text-slate-500 whitespace-pre-line leading-tight">{{ $child->notes }}</div>
                                @endif
                                @if($child->billing_unit && !in_array($child->billing_unit->value, ['unit', 'flat']))
                                    @php
                                        $unitLabels = ['hour' => 'ora', 'day' => 'gg', 'week' => 'sett', 'month' => 'mese'];
                                        $unitLabel = $unitLabels[$child->billing_unit->value] ?? $child->billing_unit->value;
                                        $dur = $child->duration ?? ($quote->effective_event_days ?? null);
                                    @endphp
                                    <div style="font-size: 9px; color: #6b7280; margin-top: 1px;">
                                        {{ $child->quantity }} × {{ number_format($child->unit_price, 2, ',', '.') }}
                                        €/{{ $unitLabel }}
                                        @if($dur)
                                            × curva({{ $dur }} {{ $unitLabel }})
                                        @endif
                                    </div>
                                @endif
                            </td>
                            <td class="py-1.5 text-center align-top text-[10px]">{{ $child->unit ?? 'pz' }}</td>
                            <td class="py-1.5 text-center align-top">{{ number_format($child->quantity, 0) }}</td>
                            @if($showPriceCols)
                                <td class="py-1.5 text-right align-top" style="white-space: nowrap;">
                                    @if(!$child->hide_unit_price)
                                        {{ number_format($child->unit_price, 2, ',', '.') }} €
                                    @else
                                        <span class="text-slate-300">-</span>
                                    @endif
                                </td>
                            @endif
                            @if($showDiscountCol)
                                <td class="py-1.5 text-center align-top text-[10px]">{{ $child->discount_percentage > 0 ? number_format($child->discount_percentage, 1) . '%' : '-' }}</td>
                            @endif
                            @if($quote->show_vat || $quote->tax_included)
                                <td class="py-1.5 text-center align-top text-[10px]">{{ number_format($child->vat_rate ?? 0, 0) }}
                                    %
                                </td>
                            @endif
                            @if($showPriceCols)
                                <td class="py-1.5 text-right font-semibold text-slate-900 align-top"
                                    style="white-space: nowrap;">
                                    @if(!$child->hide_unit_price)
                                        € {{ number_format(($quote->vat_included_in_prices || $quote->tax_included) ? $child->total_with_vat : $child->total, 2, ',', '.') }}
                                    @else
                                        <span class="text-slate-300">-</span>
                                    @endif
                                </td>
                            @endif
                        </tr>
                    @endforeach
                    @if($quote->show_section_totals)
                        <tr class="bg-gray-100 border-b border-slate-300">
                            <td colspan="{{ $totalTableColumns - 1 }}" class="py-1 pl-3 align-middle">
                                <div class="font-bold text-slate-900 italic text-[10px]">
                                    Totale {{ $item->description }}</div>
                            </td>
                            <td class="py-1 text-right font-bold text-slate-900 text-[10px] align-middle"
                                style="white-space: nowrap; min-width: 7rem;">
                                € {{ number_format($item->children->sum(($quote->vat_included_in_prices || $quote->tax_included) ? 'total_with_vat' : 'total'), 2, ',', '.') }}
                            </td>
                        </tr>
                    @endif
                @elseif($item->type === \App\Enums\QuoteItemType::Item)
                    <!-- Non-section item -->
                    <tr class="border-b border-slate-100">
                        @if($quote->show_product_codes)
                            <td class="py-1.5 font-mono text-[10px] text-slate-500 align-top">{{ $item->code ?? ($item->product ? $item->product->code : '') }}</td>
                        @endif
                        <td class="py-1.5 align-top">
                            <div
                                class="font-medium text-slate-900 leading-snug whitespace-pre-wrap">{{ $item->description }}</div>
                            @if($item->notes)
                                <div
                                    class="text-[9px] mt-0.5 text-slate-500 whitespace-pre-line leading-tight">{{ $item->notes }}</div>
                            @endif
                            @if($item->billing_unit && !in_array($item->billing_unit->value, ['unit', 'flat']))
                                @php
                                    $unitLabels = ['hour' => 'ora', 'day' => 'gg', 'week' => 'sett', 'month' => 'mese'];
                                    $unitLabel = $unitLabels[$item->billing_unit->value] ?? $item->billing_unit->value;
                                    $dur = $item->duration ?? ($quote->effective_event_days ?? null);
                                @endphp
                                <div style="font-size: 9px; color: #6b7280; margin-top: 1px;">
                                    {{ $item->quantity }} × {{ number_format($item->unit_price, 2, ',', '.') }}
                                    €/{{ $unitLabel }}
                                    @if($dur)
                                        × curva({{ $dur }} {{ $unitLabel }})
                                    @endif
                                </div>
                            @endif
                        </td>
                        <td class="py-1.5 text-center align-top text-[10px]">{{ $item->unit ?? 'pz' }}</td>
                        <td class="py-1.5 text-center align-top">{{ number_format($item->quantity, 0) }}</td>
                        @if($showPriceCols)
                            <td class="py-1.5 text-right align-top" style="white-space: nowrap;">
                                @if(!$item->hide_unit_price)
                                    {{ number_format($item->unit_price, 2, ',', '.') }} €
                                @else
                                    <span class="text-slate-300">-</span>
                                @endif
                            </td>
                        @endif
                        @if($showDiscountCol)
                            <td class="py-1.5 text-center align-top text-[10px]">{{ $item->discount_percentage > 0 ? number_format($item->discount_percentage, 1) . '%' : '-' }}</td>
                        @endif
                        @if($quote->show_vat || $quote->tax_included)
                            <td class="py-1.5 text-center align-top text-[10px]">{{ number_format($item->vat_rate ?? 0, 0) }}
                                %
                            </td>
                        @endif
                        @if($showPriceCols)
                            <td class="py-1.5 text-right font-semibold text-slate-900 align-top"
                                style="white-space: nowrap;">
                                @if(!$item->hide_unit_price)
                                    € {{ number_format(($quote->vat_included_in_prices || $quote->tax_included) ? $item->total_with_vat : $item->total, 2, ',', '.') }}
                                @else
                                    <span class="text-slate-300">-</span>
                                @endif
                            </td>
                        @endif
                    </tr>
                @endif
            @endforeach
            </tbody>
        </table>
    </div>

    <!-- Totals -->
    <div class="flex justify-end mb-10 avoid-break totals-wrapper">
        <div class="w-5/12">
            @if($quote->vat_included_in_prices || $quote->tax_included)
                {{-- IVA INCLUSA nei totali --}}
                <div class="flex justify-between py-2 border-b border-slate-100">
                    <span class="text-slate-500">Imponibile (senza IVA)</span>
                    <span class="font-medium">{{ number_format($quote->subtotal, 2, ',', '.') }} €</span>
                </div>
                @if($quote->discount_amount > 0)
                    <div class="flex justify-between py-2 border-b border-slate-100 text-xs text-green-600">
                        <span>Sconti Applicati</span>
                        <span>- {{ number_format($quote->discount_amount, 2, ',', '.') }} €</span>
                    </div>
                @endif
                @foreach($vatBreakdown as $rate => $amount)
                    <div class="flex justify-between py-2 border-b border-slate-100 text-xs">
                        <span class="text-slate-500">IVA {{ number_format($rate, 0) }}%</span>
                        <span>{{ number_format($amount, 2, ',', '.') }} €</span>
                    </div>
                @endforeach
                <div class="flex justify-between py-3 border-b-2 border-slate-800 mt-2">
                    <span class="font-bold text-md text-primary">TOTALE (IVA inclusa)</span>
                    <span class="font-bold text-md text-primary">{{ number_format($quote->total_amount, 2, ',', '.') }} €</span>
                </div>
            @else
                {{-- IVA NON INCLUSA nei prezzi --}}
                <div class="flex justify-between py-2 border-b border-slate-100">
                    <span class="text-slate-500">Subtotale</span>
                    <span class="font-medium">{{ number_format($quote->subtotal, 2, ',', '.') }} €</span>
                </div>
                @if($quote->discount_amount > 0)
                    <div class="flex justify-between py-2 border-b border-slate-100 text-xs text-green-600">
                        <span>Sconti Applicati</span>
                        <span>- {{ number_format($quote->discount_amount, 2, ',', '.') }} €</span>
                    </div>
                @endif
                @if($quote->show_vat)
                    @foreach($vatBreakdown as $rate => $amount)
                        <div class="flex justify-between py-2 border-b border-slate-100 text-xs">
                            <span class="text-slate-500">IVA {{ number_format($rate, 0) }}%</span>
                            <span>{{ number_format($amount, 2, ',', '.') }} €</span>
                        </div>
                    @endforeach
                    <div class="flex justify-between py-3 border-b-2 border-slate-800 mt-2">
                        <span class="font-bold text-md text-primary">TOTALE IVA INCLUSA</span>
                        <span class="font-bold text-md text-primary">{{ number_format($quote->total_amount, 2, ',', '.') }} €</span>
                    </div>
                @else
                    {{-- IVA non mostrata: solo totale imponibile --}}
                    <div class="flex justify-between py-3 border-b-2 border-slate-800 mt-2">
                        <span class="font-bold text-md text-primary">TOTALE
{{--                            <span class="text-sm">(esc. IVA)</span>--}}
                            <span class="text-sm">IMPONIBILE</span>
                        </span>
                        <span class="font-bold text-lg text-primary">{{ number_format($quote->subtotal - $quote->discount_amount, 2, ',', '.') }} €</span>
                    </div>
                @endif
            @endif

            @if($quote->deposits->isNotEmpty())
                <div class="avoid-break mt-4 pt-4 border-t border-slate-200">
                    <h4 class="font-bold text-slate-700 text-[10px] mb-2 uppercase tracking-wider">Piano Pagamenti</h4>
                    <table class="w-full text-[10px]">
                        <thead>
                        <tr class="border-b border-slate-200">
                            <th class="text-left py-1 text-slate-500 font-medium">Descrizione</th>
                            <th class="text-right py-1 text-slate-500 font-medium w-16">%</th>
                            <th class="text-right py-1 text-slate-500 font-medium w-24">Importo</th>
                        </tr>
                        </thead>
                        <tbody>
                        @foreach($quote->deposits as $deposit)
                            <tr class="border-b border-slate-100">
                                <td class="py-1 text-slate-700">
                                    {{ $deposit->description }}
                                    @if($deposit->due_event)
                                        <span class="text-slate-400"> — {{ $deposit->due_event }}</span>
                                    @endif
                                    @if($deposit->due_date)
                                        <span class="text-slate-400"> ({{ $deposit->due_date->format('d/m/Y') }})</span>
                                    @endif
                                </td>
                                <td class="text-right py-1 text-slate-600">{{ $deposit->percentage ? number_format($deposit->percentage, 1).'%' : '—' }}</td>
                                <td class="text-right py-1 text-slate-700 font-medium">
                                    € {{ number_format($deposit->amount, 2, ',', '.') }}</td>
                            </tr>
                        @endforeach
                        <tr class="border-t-2 border-slate-300">
                            <td class="py-1 font-bold text-slate-700">{{ $quote->balance_label ?? 'Saldo finale' }}</td>
                            <td class="text-right py-1 text-slate-500">
                                {{ number_format(100 - $quote->deposits->sum('percentage'), 1) }}%
                            </td>
                            <td class="text-right py-1 font-bold text-slate-700">
                                € {{ number_format($quote->total_amount - $quote->deposits->sum('amount'), 2, ',', '.') }}
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            @elseif($quote->deposit_amount > 0)
                {{-- Retrocompatibilità: vecchio campo singolo --}}
                <div class="flex justify-between py-2 text-slate-500 text-sm mt-1">
                    <span>Acconto ({{ $quote->deposit_percentage > 0 ? number_format($quote->deposit_percentage, 0) . '%' : 'Fisso' }})</span>
                    <span>- {{ number_format($quote->deposit_amount, 2, ',', '.') }} €</span>
                </div>
                <div class="flex justify-between py-2 font-bold text-primary bg-blue-50 px-2 rounded mt-2">
                    <span>{{ $quote->balance_label ?? 'Saldo a Finire' }}</span>
                    @if($quote->tax_included)
                        <span>{{ number_format($quote->total_amount - $quote->deposit_amount, 2, ',', '.') }} €</span>
                    @else
                        <span>{{ number_format($quote->subtotal - $quote->deposit_amount, 2, ',', '.') }} €</span>
                    @endif
                </div>
            @endif
        </div>
    </div>

    <!-- Terms -->
    <div class="space-y-6 mb-10 text-xs text-slate-600">
        @if($quote->paymentTerm || $quote->financialResource || $quote->work_start_description || $quote->work_duration_description || \App\Models\Setting::get('company.iban'))
            <div class="grid grid-cols-2 gap-8 bg-slate-50 p-6 rounded-lg avoid-break">
                <div>
                    <h4 class="font-bold text-slate-900 mb-2">Pagamento & Banca</h4>
                    <p class="mb-2">
                        @if($quote->paymentTerm)
                            {{ $quote->paymentTerm->name }}
                            @if($quote->paymentTerm->description)
                                <br><span
                                    style="font-size: 8pt; color: #64748b;">{{ $quote->paymentTerm->description }}</span>
                            @endif
                        @else
                            Secondo accordi
                        @endif
                    </p>

                    @if($quote->financialResource)
                        {{-- Usa risorsa finanziaria dal preventivo --}}
                        @if($quote->financialResource->type === \App\Enums\FinancialResourceType::BANK_ACCOUNT)
                            <div class="p-2 border border-slate-200 bg-white rounded" style="font-size: 10px;">
                                <span
                                    class="block font-semibold text-slate-700">{{ $quote->financialResource->name }}</span>
                                @if($quote->financialResource->details['bank_name'] ?? null)
                                    <span
                                        class="block text-slate-600 text-[9px]">{{ $quote->financialResource->details['bank_name'] }}</span>
                                @endif
                                @if($quote->financialResource->details['iban'] ?? null)
                                    <span
                                        class="block font-mono text-slate-900 mt-1">{{ $quote->financialResource->details['iban'] }}</span>
                                @endif
                                @if($quote->financialResource->details['bic'] ?? null)
                                    <span
                                        class="block text-slate-600 text-[9px]">BIC/SWIFT: {{ $quote->financialResource->details['bic'] }}</span>
                                @endif
                            </div>
                        @elseif($quote->financialResource->type === \App\Enums\FinancialResourceType::CASH)
                            <div class="p-2 border border-slate-200 bg-white rounded" style="font-size: 10px;">
                                <span
                                    class="block font-semibold text-slate-700">💵 {{ $quote->financialResource->name }}</span>
                                <span class="block text-slate-600 text-[9px]">Pagamento in contanti</span>
                            </div>
                        @elseif($quote->financialResource->type === \App\Enums\FinancialResourceType::CARD)
                            <div class="p-2 border border-slate-200 bg-white rounded" style="font-size: 10px;">
                                <span
                                    class="block font-semibold text-slate-700">💳 {{ $quote->financialResource->name }}</span>
                                @if($quote->financialResource->details['card_type'] ?? null)
                                    <span
                                        class="block text-slate-600 text-[9px]">{{ ucfirst($quote->financialResource->details['card_type']) }}</span>
                                @endif
                                @if($quote->financialResource->details['last_four'] ?? null)
                                    <span
                                        class="block font-mono text-slate-900 text-[9px]">**** {{ $quote->financialResource->details['last_four'] }}</span>
                                @endif
                            </div>
                        @endif
                    @elseif(\App\Models\Setting::get('company.iban'))
                        {{-- Fallback ai vecchi settings --}}
                        <div class="p-2 border border-slate-200 bg-white rounded" style="font-size: 10px;">
                            <span
                                class="block font-semibold text-slate-700">{{ \App\Models\Setting::get('company.bank_name', 'Banca Intesa Sanpaolo') }}</span>
                            <span class="font-mono text-slate-900">{{ \App\Models\Setting::get('company.iban') }}</span>
                        </div>
                    @endif
                </div>
                @if($quote->work_start_description || $quote->work_start_date || $quote->work_duration_description || $quote->work_end_date)
                    <div>
                        <h4 class="font-bold text-slate-900 mb-2">Tempi di Esecuzione</h4>
                        @if($quote->work_start_description || $quote->work_start_date)
                            <div class="mb-2">
                                <span class="block font-semibold text-slate-700 text-[10px]">INIZIO LAVORI</span>
                                <span>{{ $quote->work_start_description ?? $quote->work_start_date?->format('d/m/Y') }}</span>
                            </div>
                        @endif
                        @if($quote->work_duration_description)
                            <div>
                                <span class="block font-semibold text-slate-700 text-[10px]">DURATA LAVORI</span>
                                <span>{{ $quote->work_duration_description }}</span>
                            </div>
                        @endif
                    </div>
                @endif
            </div>
        @endif

        @if($quote->notes)
            <div class="avoid-break">
                <h4 class="font-bold text-primary text-sm mb-1 uppercase tracking-wider">Note Operative</h4>
                <p class="text-justify leading-relaxed border-l-2 border-primary pl-3">{{ $quote->notes }}</p>
            </div>
        @endif

        @if($quote->warrantyType)
            <div class="avoid-break">
                <h4 class="font-bold text-slate-900 text-[10px] mb-1 uppercase tracking-wider">Garanzia</h4>
                <p class="text-justify leading-relaxed text-[10px] text-slate-700">
                    {{ $quote->warrantyType->name }}
                    @if($quote->warrantyType->description)
                        - {{ $quote->warrantyType->description }}
                    @endif
                </p>

                @if($quote->warrantyType->exclusions && count($quote->warrantyType->exclusions) > 0)
                    <div class="mt-2">
                        <p class="font-semibold text-slate-700 text-[10px] mb-1">Esclusioni:</p>
                        <ul class="list-disc list-inside text-[10px] text-slate-600 space-y-0.5">
                            @foreach($quote->warrantyType->exclusions as $exclusion)
                                <li class="leading-relaxed">{{ $exclusion }}</li>
                            @endforeach
                        </ul>
                    </div>
                @endif
            </div>
        @endif

        @if($quote->include_terms_and_conditions && $quote->terms_and_conditions)
            <div class="avoid-break pt-4 border-t border-slate-200">
                <h4 class="font-bold text-slate-500 text-[10px] mb-1 uppercase tracking-wider">Condizioni di
                    Vendita</h4>
                <p class="text-justify leading-relaxed text-[10px] text-slate-500">{{ $quote->terms_and_conditions }}</p>
            </div>
        @endif
    </div>

    <!-- Photo Attachment Section -->
    @if(count($quoteImages) > 0)
        <div class="mt-10 avoid-break">
            <h3 class="text-xl font-bold text-primary mb-6 border-b border-primary pb-2">Allegato Fotografico</h3>
            <div class="grid grid-cols-2 gap-6">
                @foreach($quoteImages as $image)
                    <div class="border border-slate-200 rounded p-3 avoid-break">
                        <div
                            class="aspect-video bg-white mb-3 overflow-hidden rounded relative flex items-center justify-center">
                            <img src="{{ $image['imagePath'] }}" alt="{{ $image['name'] }}"
                                 class="object-contain w-full h-full">
                        </div>
                        <div class="text-center text-ellipsis">
                            <div class="text-sm uppercase">{{ $image['internal_code'] }}</div>
                            <div class="font-bold text-slate-800">{{ $image['name'] }}</div>
                            @if($image['description'] !== $image['name'])
                                <div class="text-xs text-slate-500 mt-1">{{ $image['description'] }}</div>
                            @endif
                        </div>
                    </div>
                @endforeach
            </div>
        </div>
    @endif

    <div class="mt-auto pt-8 border-t border-slate-200 avoid-break">
        <div class="flex justify-between items-end">
            <div class="text-center w-2/5">
                @if(!empty($company['stamp']))
                    <img src="{{ $company['stamp'] }}" class="h-32 mx-auto object-contain mb-2" alt="Timbro">
                @else
                    <div class="h-32 border-b border-slate-300 mb-2"></div>
                @endif
                <div class="text-xs text-slate-400 uppercase tracking-wide">Timbro e Firma Azienda</div>
            </div>
            <div class="text-center w-2/5">
                @if(!empty($company['sigla']))
                    <img src="{{ $company['sigla'] }}" class="h-32 mx-auto object-contain mb-2" alt="Firma">
                @else
                    <div class="h-32 border-b border-slate-300 mb-2"></div>
                @endif
                <div class="text-xs text-slate-400 uppercase tracking-wide">Timbro e Firma per Accettazione</div>
            </div>
        </div>
    </div>
    <!-- Footer gestito da Browsershot (PdfService->footerHtml()) -->
</div>
</body>
</html>
