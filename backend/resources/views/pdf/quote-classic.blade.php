<?php
/**
 * @var \App\Models\Quote $quote
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
    <title>Preventivo Classic</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400&display=swap"
          rel="stylesheet">
    <style>
        body {
            font-family: 'EB Garamond', Georgia, 'Times New Roman', serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0;
        }

        @page {
            margin: 10mm 0mm 30mm 0mm;
            size: A4 portrait;
        }

        .page-break {
            page-break-before: always;
        }

        .avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
        }

        .totals-wrapper {
            break-inside: avoid;
            page-break-inside: avoid;
        }

        footer {
            break-inside: avoid;
            page-break-inside: avoid;
            display: block;
        }
    </style>
</head>
<body class="bg-white text-slate-800">
<div class="w-full max-w-4xl mx-auto pl-8 pr-8 pb-8 relative min-h-screen flex flex-col">

    <!-- Header Centrato -->
    <header class="text-center mb-10 pb-6 border-b-2 border-emerald-800">
        @if($company['logo'])
            <img src="{{ $company['logo'] }}" alt="Logo" class="h-20 w-auto object-contain mx-auto mb-4">
        @endif
        <h1 class="text-3xl font-bold uppercase tracking-widest text-emerald-900 mb-2">{{ $company['name'] }}</h1>
        <div class="text-sm italic text-slate-600">
            {{ implode(' - ', array_filter([$company['address'], implode(' ', array_filter([$company['postal_code'], $company['city']]))])) }}
            @if($company['vat'])
                | P.IVA {{ $company['vat'] }}
            @endif
            <br>
            {{ implode(' | ', array_filter([$company['phone'], $company['email']])) }}
        </div>
    </header>

    <!-- Quote Details Box -->
    <div class="border border-slate-300 p-6 mb-8 bg-stone-50">
        <div class="flex justify-between items-start">
            <div>
                <h3 class="font-bold uppercase text-xs tracking-widest mb-2 text-emerald-900">Destinatario</h3>
                <div
                    class="text-lg font-bold">{{ $quote->customer->business_name ?? $quote->customer->display_name }}</div>
                <div class="text-sm">
                    @if($quote->customer->contact_person)
                        {{ $quote->customer->contact_person }}<br>
                    @endif
                    @if($quote->address)
                        {{ $quote->address }}, {{ $quote->city }}
                    @elseif($quote->customer->address)
                        {{ $quote->customer->address }}, {{ $quote->customer->city }}
                    @endif
                    @if($quote->customer->vat)
                        <br>P.IVA/C.F.: {{ $quote->customer->vat }}
                    @endif
                </div>
            </div>
            <div class="text-right">
                <h3 class="font-bold uppercase text-xs tracking-widest mb-2 text-emerald-900">Dettagli Preventivo</h3>
                <div class="text-sm"><span class="font-semibold">Nr:</span> {{ $quote->code }}</div>
                <div class="text-sm"><span class="font-semibold">Data:</span> {{ $quote->issue_date->format('d/m/Y') }}
                </div>
                @if($quote->valid_until)
                    <div class="text-sm"><span
                            class="font-semibold">Valido al:</span> {{ $quote->valid_until->format('d/m/Y') }}</div>
                @endif
                @if($quote->title)
                    <div class="text-sm"><span class="font-semibold">Oggetto:</span> {{ $quote->title }}</div>
                @endif
                @if($quote->description)
                    <div
                        class="text-sm text-slate-500 italic mt-1">{{ \Illuminate\Support\Str::limit($quote->description, 80) }}</div>
                @endif
            </div>
        </div>
    </div>

    <!-- Table Classic: full borders -->
    <div class="mb-8">
        <table class="w-full text-left border-collapse border border-slate-300">
            @php
                $firstItem = $quote->items->whereNull('parent_id')->first();
                $firstIsSection = $firstItem && $firstItem->type === \App\Enums\QuoteItemType::Section;
                $totalTableColumns = 4; // Descrizione, UM, Qtà, Sc.% always
                if($quote->show_product_codes) $totalTableColumns++;
                if($quote->show_unit_prices) $totalTableColumns++;
                if($quote->show_vat || $quote->tax_included) $totalTableColumns++;
                if($quote->show_unit_prices) $totalTableColumns++; // Totale
            @endphp
            @if(!$firstIsSection)
                <thead>
                <tr class="bg-emerald-50 text-emerald-900 text-xs uppercase font-bold text-center">
                    @if($quote->show_product_codes)
                        <th class="py-2 px-2 border border-slate-300 w-20">Cod.</th>
                    @endif
                    <th class="py-2 px-2 border border-slate-300 text-left">Descrizione</th>
                    <th class="py-2 px-2 border border-slate-300 w-12">UM</th>
                    <th class="py-2 px-2 border border-slate-300 w-12">Qtà</th>
                    @if($quote->show_unit_prices)
                        <th class="py-2 px-2 border border-slate-300 w-24">Prezzo</th>
                    @endif
                    <th class="py-2 px-2 border border-slate-300 w-14">Sc.%</th>
                    @if($quote->show_vat || $quote->tax_included)
                        <th class="py-2 px-2 border border-slate-300 w-12">IVA</th>
                    @endif
                    @if($quote->show_unit_prices)
                        <th class="py-2 px-2 border border-slate-300 w-24">
                            Totale{{ ($quote->vat_included_in_prices || $quote->tax_included) ? '*' : '' }}</th>
                    @endif
                </tr>
                </thead>
            @endif
            <tbody class="text-sm">
            @foreach($quote->items->whereNull('parent_id') as $item)
                @if($item->type === \App\Enums\QuoteItemType::Section)
                    <!-- Section row -->
                    <tr class="bg-emerald-100/50">
                        @if($quote->show_section_totals)
                            <td colspan="{{ $totalTableColumns - 1 }}"
                                class="py-2 px-3 border border-slate-300 font-bold text-emerald-900 uppercase text-xs">
                                {{ $item->description }}
                                @if($item->notes)
                                    <span
                                        class="font-normal normal-case italic text-slate-500 ml-2">{{ $item->notes }}</span>
                                @endif
                            </td>
                            <td class="py-2 px-2 border border-slate-300 text-right font-bold text-xs">
                                {{ number_format($item->children->sum(($quote->vat_included_in_prices || $quote->tax_included) ? 'total_with_vat' : 'total'), 2, ',', '.') }}
                                €
                            </td>
                        @else
                            <td colspan="{{ $totalTableColumns }}"
                                class="py-2 px-3 border border-slate-300 font-bold text-emerald-900 uppercase text-xs">
                                {{ $item->description }}
                                @if($item->notes)
                                    <span
                                        class="font-normal normal-case italic text-slate-500 ml-2">{{ $item->notes }}</span>
                                @endif
                            </td>
                        @endif
                    </tr>
                    <!-- Column header repeated under section -->
                    <tr class="bg-emerald-50 text-emerald-900 text-xs uppercase font-bold text-center">
                        @if($quote->show_product_codes)
                            <th class="py-2 px-2 border border-slate-300 w-20">Cod.</th>
                        @endif
                        <th class="py-2 px-2 border border-slate-300 text-left">Descrizione</th>
                        <th class="py-2 px-2 border border-slate-300 w-12">UM</th>
                        <th class="py-2 px-2 border border-slate-300 w-12">Qtà</th>
                        @if($quote->show_unit_prices)
                            <th class="py-2 px-2 border border-slate-300 w-24">Prezzo</th>
                        @endif
                        <th class="py-2 px-2 border border-slate-300 w-14">Sc.%</th>
                        @if($quote->show_vat || $quote->tax_included)
                            <th class="py-2 px-2 border border-slate-300 w-12">IVA</th>
                        @endif
                        @if($quote->show_unit_prices)
                            <th class="py-2 px-2 border border-slate-300 w-24">Totale</th>
                        @endif
                    </tr>
                    @foreach($item->children as $child)
                        <tr class="border border-slate-300">
                            @if($quote->show_product_codes)
                                <td class="py-2 px-2 border-r border-slate-300 text-xs text-slate-500">{{ $child->code ?? ($child->product ? $child->product->code : '') }}</td>
                            @endif
                            <td class="py-2 px-2 border-r border-slate-300">
                                <div class="font-semibold">{{ $child->description }}</div>
                                @if($child->notes)
                                    <div class="text-xs text-slate-500 italic">{{ $child->notes }}</div>
                                @endif
                                @if($child->billing_unit && !in_array($child->billing_unit->value, ['unit', 'flat']))
                                    @php
                                        $unitLabels = ['hour' => 'ora', 'day' => 'gg', 'week' => 'sett', 'month' => 'mese'];
                                        $unitLabel = $unitLabels[$child->billing_unit->value] ?? $child->billing_unit->value;
                                        $dur = $child->duration ?? ($quote->effective_event_days ?? null);
                                    @endphp
                                    <div style="font-size: 10px; color: #6b7280; margin-top: 2px;">
                                        {{ $child->quantity }} × {{ number_format($child->unit_price, 2, ',', '.') }} €/{{ $unitLabel }}
                                        @if($dur) × curva({{ $dur }} {{ $unitLabel }}) @endif
                                    </div>
                                @endif
                            </td>
                            <td class="py-2 px-2 border-r border-slate-300 text-center text-xs">{{ $child->unit ?? 'pz' }}</td>
                            <td class="py-2 px-2 border-r border-slate-300 text-center">{{ number_format($child->quantity, 0) }}</td>
                            @if($quote->show_unit_prices)
                                <td class="py-2 px-2 border-r border-slate-300 text-right">
                                    @if(!$child->hide_unit_price)
                                        {{ number_format($child->unit_price, 2, ',', '.') }} €
                                    @else
                                        <span class="text-slate-300">-</span>
                                    @endif
                                </td>
                            @endif
                            <td class="py-2 px-2 border-r border-slate-300 text-center text-xs">{{ $child->discount_percentage > 0 ? $child->discount_percentage . '%' : '-' }}</td>
                            @if($quote->show_vat || $quote->tax_included)
                                <td class="py-2 px-2 border-r border-slate-300 text-center text-xs">{{ number_format($child->vat_rate ?? 0, 0) }}
                                    %
                                </td>
                            @endif
                            @if($quote->show_unit_prices)
                                <td class="py-2 px-2 text-right font-semibold">
                                    {{ number_format(($quote->vat_included_in_prices || $quote->tax_included) ? $child->total_with_vat : $child->total, 2, ',', '.') }}
                                    €
                                </td>
                            @endif
                        </tr>
                    @endforeach
                @elseif($item->type === \App\Enums\QuoteItemType::Item)
                    <tr class="border border-slate-300">
                        @if($quote->show_product_codes)
                            <td class="py-2 px-2 border-r border-slate-300 text-xs text-slate-500">{{ $item->code ?? ($item->product ? $item->product->code : '') }}</td>
                        @endif
                        <td class="py-2 px-2 border-r border-slate-300">
                            <div class="font-semibold">{{ $item->description }}</div>
                            @if($item->notes)
                                <div class="text-xs text-slate-500 italic">{{ $item->notes }}</div>
                            @endif
                            @if($item->billing_unit && !in_array($item->billing_unit->value, ['unit', 'flat']))
                                @php
                                    $unitLabels = ['hour' => 'ora', 'day' => 'gg', 'week' => 'sett', 'month' => 'mese'];
                                    $unitLabel = $unitLabels[$item->billing_unit->value] ?? $item->billing_unit->value;
                                    $dur = $item->duration ?? ($quote->effective_event_days ?? null);
                                @endphp
                                <div style="font-size: 10px; color: #6b7280; margin-top: 2px;">
                                    {{ $item->quantity }} × {{ number_format($item->unit_price, 2, ',', '.') }} €/{{ $unitLabel }}
                                    @if($dur) × curva({{ $dur }} {{ $unitLabel }}) @endif
                                </div>
                            @endif
                        </td>
                        <td class="py-2 px-2 border-r border-slate-300 text-center text-xs">{{ $item->unit ?? 'pz' }}</td>
                        <td class="py-2 px-2 border-r border-slate-300 text-center">{{ number_format($item->quantity, 0) }}</td>
                        @if($quote->show_unit_prices)
                            <td class="py-2 px-2 border-r border-slate-300 text-right">
                                @if(!$item->hide_unit_price)
                                    {{ number_format($item->unit_price, 2, ',', '.') }} €
                                @else
                                    <span class="text-slate-300">-</span>
                                @endif
                            </td>
                        @endif
                        <td class="py-2 px-2 border-r border-slate-300 text-center text-xs">{{ $item->discount_percentage > 0 ? $item->discount_percentage . '%' : '-' }}</td>
                        @if($quote->show_vat || $quote->tax_included)
                            <td class="py-2 px-2 border-r border-slate-300 text-center text-xs">{{ number_format($item->vat_rate ?? 0, 0) }}
                                %
                            </td>
                        @endif
                        @if($quote->show_unit_prices)
                            <td class="py-2 px-2 text-right font-semibold">
                                {{ number_format(($quote->vat_included_in_prices || $quote->tax_included) ? $item->total_with_vat : $item->total, 2, ',', '.') }}
                                €
                            </td>
                        @endif
                    </tr>
                @endif
            @endforeach
            </tbody>
        </table>
    </div>

    <!-- Classic Totals: w-1/2 border box -->
    <div class="flex justify-end mb-10 avoid-break totals-wrapper">
        <div class="w-1/2 border border-slate-300 p-4 bg-stone-50">
            <div class="flex justify-between py-1 text-sm">
                <span>Imponibile</span>
                <span>{{ number_format($quote->subtotal, 2, ',', '.') }} €</span>
            </div>
            @if($quote->discount_amount > 0)
                <div class="flex justify-between py-1 text-sm text-slate-600 italic">
                    <span>Sconti applicati</span>
                    <span>- {{ number_format($quote->discount_amount, 2, ',', '.') }} €</span>
                </div>
            @endif
            @foreach($vatBreakdown as $rate => $amount)
                <div class="flex justify-between py-1 text-sm text-slate-600 italic">
                    <span>IVA {{ number_format($rate, 0) }}%</span>
                    <span>{{ number_format($amount, 2, ',', '.') }} €</span>
                </div>
            @endforeach
            <div class="flex justify-between py-2 border-t border-slate-300 mt-2 font-bold text-lg text-emerald-900">
                <span>Totale Documento</span>
                <span>{{ number_format($quote->total_amount, 2, ',', '.') }} €</span>
            </div>
            @if($quote->deposit_amount > 0)
                <div class="mt-2 pt-2 border-t border-slate-300 flex justify-between text-sm">
                    <span>Acconto ({{ $quote->deposit_percentage > 0 ? number_format($quote->deposit_percentage, 0) . '%' : 'Fisso' }})</span>
                    <span>- {{ number_format($quote->deposit_amount, 2, ',', '.') }} €</span>
                </div>
                <div class="flex justify-between text-sm font-bold">
                    <span>Da Saldare</span>
                    <span>
                        @if($quote->tax_included)
                            {{ number_format($quote->total_amount - $quote->deposit_amount, 2, ',', '.') }} €
                        @else
                            {{ number_format($quote->subtotal - $quote->deposit_amount, 2, ',', '.') }} €
                        @endif
                    </span>
                </div>
            @endif
        </div>
    </div>

    <!-- Classic Terms -->
    <div class="mb-10 text-sm text-justify avoid-break space-y-4">
        @if($quote->paymentTerm || $quote->financialResource || $quote->work_start_description || $quote->work_duration_description)
            <div class="flex justify-between gap-6">
                <div class="flex-1">
                    <h4 class="font-bold uppercase text-xs mb-1 border-b border-emerald-800 inline-block">Pagamento</h4>
                    @if($quote->paymentTerm)
                        <p class="mb-1">{{ $quote->paymentTerm->name }}
                            @if($quote->paymentTerm->description)
                                <br><span
                                    class="text-xs italic text-slate-500">{{ $quote->paymentTerm->description }}</span>
                            @endif
                        </p>
                    @endif
                    @if($quote->financialResource && $quote->financialResource->type === \App\Enums\FinancialResourceType::BANK_ACCOUNT)
                        <p class="text-xs italic">
                            @if($quote->financialResource->details['bank_name'] ?? null)
                                {{ $quote->financialResource->details['bank_name'] }} —
                            @endif
                            @if($quote->financialResource->details['iban'] ?? null)
                                {{ $quote->financialResource->details['iban'] }}
                            @endif
                        </p>
                    @elseif(\App\Models\Setting::get('company.iban'))
                        <p class="text-xs italic">{{ \App\Models\Setting::get('company.iban') }}</p>
                    @endif
                </div>
                @if($quote->work_start_description || $quote->work_start_date || $quote->work_duration_description)
                    <div class="flex-1">
                        <h4 class="font-bold uppercase text-xs mb-1 border-b border-emerald-800 inline-block">
                            Tempistiche</h4>
                        @if($quote->work_start_description || $quote->work_start_date)
                            <p><span
                                    class="font-semibold">Inizio:</span> {{ $quote->work_start_description ?? $quote->work_start_date?->format('d/m/Y') }}
                            </p>
                        @endif
                        @if($quote->work_duration_description)
                            <p><span class="font-semibold">Durata:</span> {{ $quote->work_duration_description }}</p>
                        @endif
                    </div>
                @endif
            </div>
        @endif

        @if($quote->notes)
            <div>
                <h4 class="font-bold uppercase text-xs mb-1 border-b border-emerald-800 inline-block">Note</h4>
                <p class="italic">{{ $quote->notes }}</p>
            </div>
        @endif

        @if($quote->warrantyType)
            <div>
                <h4 class="font-bold uppercase text-xs mb-1 border-b border-emerald-800 inline-block">Garanzia</h4>
                <p>{{ $quote->warrantyType->name }}@if($quote->warrantyType->description)
                        — {{ $quote->warrantyType->description }}
                    @endif</p>
                @if($quote->warrantyType->exclusions && count($quote->warrantyType->exclusions) > 0)
                    <ul class="list-disc list-inside text-xs text-slate-600 mt-1">
                        @foreach($quote->warrantyType->exclusions as $exclusion)
                            <li>{{ $exclusion }}</li>
                        @endforeach
                    </ul>
                @endif
            </div>
        @endif

        @if($quote->include_terms_and_conditions && $quote->terms_and_conditions)
            <div class="text-xs text-slate-600">
                <h4 class="font-bold uppercase text-[10px] mb-1 border-b border-emerald-800 inline-block">Condizioni di
                    Vendita</h4>
                <p>{{ $quote->terms_and_conditions }}</p>
            </div>
        @endif
    </div>

    <!-- Photo Attachment Section -->
    @if(count($quoteImages) > 0)
        <div class="page-break mt-10">
            <h3 class="text-lg font-bold text-emerald-900 mb-6 border-b border-emerald-900 pb-2 text-center uppercase">
                Allegati</h3>
            <div class="grid grid-cols-2 gap-6">
                @foreach($quoteImages as $image)
                    <div class="border border-slate-300 p-2 avoid-break bg-white">
                        <div class="aspect-video bg-white mb-2 flex items-center justify-center overflow-hidden">
                            <img src="{{ $image['imagePath'] }}" alt="{{ $image['name'] }}"
                                 class="object-contain w-full h-full">
                        </div>
                        <div class="text-center text-ellipsis">
                            <div class="text-sm uppercase">{{ $image['internal_code'] }}</div>
                            <div class="text-center italic text-sm">{{ $image['name'] }}</div>
                            @if($image['description'] !== $image['name'])
                                <div class="text-center text-xs text-slate-500">{{ $image['description'] }}</div>
                            @endif
                        </div>
                    </div>
                @endforeach
            </div>
        </div>
    @endif

    <!-- Footer / Firma -->
    <div class="mt-auto pt-8 avoid-break">
        <div class="flex justify-around items-end pb-8">
            <div class="text-center w-1/3">
                @if(!empty($company['stamp']))
                    <img src="{{ $company['stamp'] }}" class="h-32 mx-auto object-contain mb-2" alt="Timbro">
                @else
                    <div class="h-32 mb-0"></div>
                @endif
                <div class="border-t border-black pt-2 text-xs uppercase">Firma Emettitore</div>
            </div>
            <div class="text-center w-1/3">
                <div class="h-32 mb-0"></div>
                <div class="border-t border-black pt-2 text-xs uppercase">Firma per Accettazione</div>
            </div>
        </div>
        <div class="text-center text-xs text-slate-500">
            {{ $company['name'] }} — Documento generato il {{ now()->format('d/m/Y') }}
        </div>
    </div>

</div>
</body>
</html>
