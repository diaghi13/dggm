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
    <title>Preventivo Minimal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            font-family: 'Courier New', Courier, monospace;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0;
            color: #000;
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
    </style>
</head>
<body class="bg-white text-black">
<div class="w-full max-w-4xl mx-auto pl-8 pr-8 pb-8 relative min-h-screen flex flex-col">

    <!-- Header Asimmetrico Bold -->
    <header class="mb-12">
        <div class="border-b-4 border-black pb-4 flex justify-between items-end">
            <div>
                <h1 class="text-5xl font-black tracking-tighter">PREVENTIVO.</h1>
                <div class="text-xl font-bold mt-2">#{{ $quote->code }}</div>
            </div>
            <div class="text-right">
                <div class="font-bold">{{ $company['name'] }}</div>
                <div class="text-xs">{{ $company['email'] }}</div>
            </div>
        </div>
    </header>

    <!-- Cliente / Progetto grid -->
    <div class="grid grid-cols-2 gap-12 mb-16">
        <div>
            <div class="text-xs font-bold uppercase mb-2 border-b border-black">Cliente</div>
            <div
                class="text-lg leading-tight font-bold">{{ $quote->customer->business_name ?? $quote->customer->display_name }}</div>
            <div class="text-sm mt-1 text-gray-600">
                @if($quote->address)
                    {{ $quote->address }}, {{ $quote->city }}
                @elseif($quote->customer->address)
                    {{ $quote->customer->address }}, {{ $quote->customer->city }}
                @endif
                @if($quote->customer->vat)
                    <div>P.IVA/C.F.: {{ $quote->customer->vat }}</div>
                @endif
            </div>
        </div>
        <div>
            <div class="text-xs font-bold uppercase mb-2 border-b border-black">Progetto</div>
            @if($quote->title)
                <div class="text-sm font-bold">{{ $quote->title }}</div>
            @endif
            @if($quote->description)
                <div
                    class="text-xs mt-1 text-gray-500">{{ \Illuminate\Support\Str::limit($quote->description, 100) }}</div>
            @endif
            <div class="text-xs mt-4">DATA: {{ $quote->issue_date->format('d/m/Y') }}</div>
            @if($quote->valid_until)
                <div class="text-xs">VALIDITÀ: {{ $quote->valid_until->format('d/m/Y') }}</div>
            @endif
        </div>
    </div>

    <!-- Table: flex-based (not <table>) -->
    <div class="mb-12">
        <!-- Header row -->
        <div class="border-b-2 border-black mb-2 pb-1 flex font-bold text-xs uppercase">
            @if($quote->show_product_codes)
                <div style="width: 80px; flex-shrink: 0;">Cod.</div>
            @endif
            <div class="flex-1">Descrizione</div>
            <div style="width: 48px; flex-shrink: 0; text-align: center;">Qtà</div>
            @if($quote->show_unit_prices)
                <div style="width: 96px; flex-shrink: 0; text-align: right;">Prezzo</div>
            @endif
            @if($quote->show_vat || $quote->tax_included)
                <div style="width: 48px; flex-shrink: 0; text-align: center;">IVA</div>
            @endif
            @if($quote->show_unit_prices)
                <div style="width: 96px; flex-shrink: 0; text-align: right;">
                    Totale{{ ($quote->vat_included_in_prices || $quote->tax_included) ? '*' : '' }}</div>
            @endif
        </div>

        @foreach($quote->items->whereNull('parent_id') as $item)
            @if($item->type === \App\Enums\QuoteItemType::Section)
                <!-- Section row -->
                <div class="py-4 border-b border-black flex justify-between items-end bg-gray-50 -mx-2 px-2">
                    <div class="font-bold uppercase text-sm">{{ $item->description }}</div>
                    @if($quote->show_section_totals && $quote->show_unit_prices)
                        <div class="font-bold text-sm">
                            {{ number_format($item->children->sum(($quote->vat_included_in_prices || $quote->tax_included) ? 'total_with_vat' : 'total'), 2, ',', '.') }}
                            €
                        </div>
                    @endif
                </div>
                <!-- Children items -->
                @foreach($item->children as $child)
                    <div class="py-3 border-b border-gray-200 flex text-sm">
                        @if($quote->show_product_codes)
                            <div style="width: 80px; flex-shrink: 0;"
                                 class="text-xs py-1 opacity-60">{{ $child->code ?? ($child->product ? $child->product->code : '') }}</div>
                        @endif
                        <div class="flex-1 py-1">
                            <div class="font-bold">{{ $child->description }}</div>
                            @if($child->notes)
                                <div class="text-xs text-gray-500">{{ $child->notes }}</div>
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
                        </div>
                        <div style="width: 48px; flex-shrink: 0; text-align: center;"
                             class="py-1">{{ number_format($child->quantity, 0) }}</div>
                        @if($quote->show_unit_prices)
                            <div style="width: 96px; flex-shrink: 0; text-align: right;" class="py-1">
                                @if(!$child->hide_unit_price)
                                    {{ number_format($child->unit_price, 2, ',', '.') }} €
                                @endif
                            </div>
                        @endif
                        @if($quote->show_vat || $quote->tax_included)
                            <div style="width: 48px; flex-shrink: 0; text-align: center;"
                                 class="py-1 text-xs">{{ number_format($child->vat_rate ?? 0, 0) }}%
                            </div>
                        @endif
                        @if($quote->show_unit_prices)
                            <div style="width: 96px; flex-shrink: 0; text-align: right;" class="py-1 font-bold">
                                {{ number_format(($quote->vat_included_in_prices || $quote->tax_included) ? $child->total_with_vat : $child->total, 2, ',', '.') }}
                                €
                            </div>
                        @endif
                    </div>
                @endforeach
            @elseif($item->type === \App\Enums\QuoteItemType::Item)
                <div class="py-3 border-b border-gray-200 flex text-sm">
                    @if($quote->show_product_codes)
                        <div style="width: 80px; flex-shrink: 0;"
                             class="text-xs py-1 opacity-60">{{ $item->code ?? ($item->product ? $item->product->code : '') }}</div>
                    @endif
                    <div class="flex-1 py-1">
                        <div class="font-bold">{{ $item->description }}</div>
                        @if($item->notes)
                            <div class="text-xs text-gray-500">{{ $item->notes }}</div>
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
                    </div>
                    <div style="width: 48px; flex-shrink: 0; text-align: center;"
                         class="py-1">{{ number_format($item->quantity, 0) }}</div>
                    @if($quote->show_unit_prices)
                        <div style="width: 96px; flex-shrink: 0; text-align: right;" class="py-1">
                            @if(!$item->hide_unit_price)
                                {{ number_format($item->unit_price, 2, ',', '.') }} €
                            @endif
                        </div>
                    @endif
                    @if($quote->show_vat || $quote->tax_included)
                        <div style="width: 48px; flex-shrink: 0; text-align: center;"
                             class="py-1 text-xs">{{ number_format($item->vat_rate ?? 0, 0) }}%
                        </div>
                    @endif
                    @if($quote->show_unit_prices)
                        <div style="width: 96px; flex-shrink: 0; text-align: right;" class="py-1 font-bold">
                            {{ number_format(($quote->vat_included_in_prices || $quote->tax_included) ? $item->total_with_vat : $item->total, 2, ',', '.') }}
                            €
                        </div>
                    @endif
                </div>
            @endif
        @endforeach
    </div>

    <!-- Totals: w-1/2, black total row -->
    <div class="flex justify-end mb-16 avoid-break">
        <div class="w-1/2">
            <div class="flex justify-between py-2 border-b border-black text-sm">
                <span>SUBTOTALE</span>
                <span>{{ number_format($quote->subtotal, 2, ',', '.') }} €</span>
            </div>
            @if($quote->discount_amount > 0)
                <div class="flex justify-between py-2 border-b border-black text-sm">
                    <span>SCONTI</span>
                    <span>- {{ number_format($quote->discount_amount, 2, ',', '.') }} €</span>
                </div>
            @endif
            @foreach($vatBreakdown as $rate => $amount)
                <div class="flex justify-between py-2 border-b border-black text-sm">
                    <span>IVA {{ number_format($rate, 0) }}%</span>
                    <span>{{ number_format($amount, 2, ',', '.') }} €</span>
                </div>
            @endforeach
            <div class="flex justify-between py-4 text-2xl font-black bg-black text-white px-2 mt-4">
                <span>TOTALE</span>
                <span>{{ number_format($quote->total_amount, 2, ',', '.') }} €</span>
            </div>
            @if($quote->deposit_amount > 0)
                <div class="flex justify-between py-2 text-sm border-b border-black mt-2">
                    <span>ACCONTO</span>
                    <span>- {{ number_format($quote->deposit_amount, 2, ',', '.') }} €</span>
                </div>
                <div class="flex justify-between py-2 text-sm font-bold">
                    <span>DA SALDARE</span>
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

    <!-- Minimal Terms -->
    <div class="mb-12 avoid-break">
        @if($quote->paymentTerm || $quote->financialResource || $quote->work_start_description || $quote->work_duration_description || \App\Models\Setting::get('company.iban'))
            <div class="grid grid-cols-2 gap-10 mb-8">
                <div>
                    <div class="text-xs font-bold uppercase mb-2 border-b border-black">PAGAMENTO</div>
                    @if($quote->paymentTerm)
                        <p class="text-xs">{{ $quote->paymentTerm->name }}
                            @if($quote->paymentTerm->description)
                                <br>{{ $quote->paymentTerm->description }}
                            @endif
                        </p>
                    @endif
                    @if($quote->financialResource && $quote->financialResource->type === \App\Enums\FinancialResourceType::BANK_ACCOUNT)
                        <p class="text-xs font-bold mt-1">
                            @if($quote->financialResource->details['iban'] ?? null)
                                {{ $quote->financialResource->details['iban'] }}
                            @endif
                        </p>
                    @elseif(\App\Models\Setting::get('company.iban'))
                        <p class="text-xs font-bold mt-1">{{ \App\Models\Setting::get('company.iban') }}</p>
                    @endif
                </div>
                @if($quote->work_start_description || $quote->work_start_date || $quote->work_duration_description)
                    <div>
                        <div class="text-xs font-bold uppercase mb-2 border-b border-black">ESECUZIONE</div>
                        @if($quote->work_start_description || $quote->work_start_date)
                            <p class="text-xs"><span
                                    class="font-bold">INIZIO:</span> {{ $quote->work_start_description ?? $quote->work_start_date?->format('d/m/Y') }}
                            </p>
                        @endif
                        @if($quote->work_duration_description)
                            <p class="text-xs"><span
                                    class="font-bold">DURATA:</span> {{ $quote->work_duration_description }}</p>
                        @endif
                    </div>
                @endif
            </div>
        @endif

        @if($quote->notes)
            <div class="mb-8">
                <div class="text-xs font-bold uppercase mb-2 border-b border-black inline-block">NOTE</div>
                <p class="text-xs leading-relaxed">{{ $quote->notes }}</p>
            </div>
        @endif

        @if($quote->warrantyType)
            <div class="mb-8">
                <div class="text-xs font-bold uppercase mb-2 border-b border-black inline-block">GARANZIA</div>
                <p class="text-xs leading-relaxed">{{ $quote->warrantyType->name }}@if($quote->warrantyType->description)
                        — {{ $quote->warrantyType->description }}
                    @endif</p>
                @if($quote->warrantyType->exclusions && count($quote->warrantyType->exclusions) > 0)
                    <ul class="text-xs mt-1 list-disc list-inside text-gray-600">
                        @foreach($quote->warrantyType->exclusions as $exclusion)
                            <li>{{ $exclusion }}</li>
                        @endforeach
                    </ul>
                @endif
            </div>
        @endif

        @if($quote->include_terms_and_conditions && $quote->terms_and_conditions)
            <div>
                <div class="text-xs font-bold uppercase mb-2 border-b border-black inline-block">CONDIZIONI</div>
                <p class="text-xs leading-tight text-justify">{{ $quote->terms_and_conditions }}</p>
            </div>
        @endif
    </div>

    <!-- Photo Attachment Section -->
    @if(count($quoteImages) > 0)
        <div class="page-break mt-10">
            <h3 class="text-2xl font-black mb-6 border-b-4 border-black inline-block">IMMAGINI.</h3>
            <div class="grid grid-cols-2 gap-6">
                @foreach($quoteImages as $image)
                    <div class="avoid-break">
                        <div class="aspect-video bg-white mb-2 overflow-hidden" style="filter: grayscale(100%);">
                            <img src="{{ $image['imagePath'] }}" alt="{{ $image['name'] }}"
                                 class="object-contain w-full h-full" style="mix-blend-mode: multiply;">
                        </div>
                        <div class="text-center text-ellipsis">
                            <div class="text-sm uppercase">{{ $image['internal_code'] }}</div>
                            <div class="font-bold text-sm uppercase">{{ $image['name'] }}</div>
                            @if($image['description'] !== $image['name'])
                                <div class="text-xs text-gray-500 mt-1">{{ $image['description'] }}</div>
                            @endif
                        </div>
                    </div>
                @endforeach
            </div>
        </div>
    @endif

    <!-- Footer / Firma -->
    <div class="mt-auto pt-8 avoid-break">
        <div class="flex justify-between gap-10">
            <div class="w-1/2">
                @if(!empty($company['stamp']))
                    <img src="{{ $company['stamp'] }}" class="h-20 object-contain mb-2" alt="Timbro"
                         style="filter: grayscale(100%);">
                @endif
                <p class="text-xs font-bold leading-tight">{{ $company['name'] }}</p>
            </div>
            <div class="w-1/2 flex items-end justify-end gap-4">
                <div class="h-10 w-32 border-b-2 border-black"></div>
                <div class="text-xs font-bold uppercase">Firma</div>
            </div>
        </div>
    </div>

</div>
</body>
</html>
