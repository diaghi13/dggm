<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preventivo {{ $quote->code }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: {{ $template->font_size ?? 10 }}pt;
            color: #1e293b;
            line-height: 1.6;
        }

        .page {
            padding: 40px;
        }

        .header {
            margin-bottom: 30px;
            border-bottom: 3px solid {{ $template->primary_color ?? '#3B82F6' }};
            padding-bottom: 20px;
        }

        .company-info {
            text-align: right;
            margin-bottom: 15px;
        }

        .company-name {
            font-size: 20pt;
            font-weight: bold;
            color: {{ $template->primary_color ?? '#3B82F6' }};
            margin-bottom: 5px;
        }

        .company-details {
            font-size: 9pt;
            color: #64748b;
            line-height: 1.4;
        }

        .quote-title {
            font-size: 24pt;
            font-weight: bold;
            color: #0f172a;
            margin-top: 20px;
            margin-bottom: 10px;
        }

        .quote-code {
            font-size: 14pt;
            color: #64748b;
            font-weight: 600;
        }

        .info-grid {
            display: table;
            width: 100%;
            margin: 30px 0;
        }

        .info-row {
            display: table-row;
        }

        .info-col {
            display: table-cell;
            width: 50%;
            padding: 15px;
            vertical-align: top;
        }

        .info-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
        }

        .info-label {
            font-size: 9pt;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }

        .info-value {
            font-size: 11pt;
            color: #0f172a;
            font-weight: 600;
        }

        .section-title {
            font-size: 14pt;
            font-weight: bold;
            color: #0f172a;
            margin: 30px 0 15px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #e2e8f0;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }

        .items-table thead th {
            background: {{ $template->primary_color ?? '#3B82F6' }};
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
            font-size: 10pt;
        }

        .items-table th.text-right,
        .items-table td.text-right {
            text-align: right;
        }

        .items-table tbody tr {
            border-bottom: 1px solid #e2e8f0;
        }

        .items-table tbody tr.section-row {
            background: #f1f5f9;
            font-weight: bold;
        }

        .items-table tbody td {
            padding: 10px 8px;
            font-size: 9.5pt;
        }

        .item-description {
            font-weight: 500;
            color: #0f172a;
        }

        .item-notes {
            font-size: 8.5pt;
            color: #64748b;
            font-style: italic;
            margin-top: 3px;
        }

        .totals {
            margin-top: 30px;
            float: right;
            width: 350px;
        }

        .totals-table {
            width: 100%;
        }

        .totals-table tr {
            border-bottom: 1px solid #e2e8f0;
        }

        .totals-table td {
            padding: 10px 8px;
        }

        .totals-table td.label {
            text-align: left;
            color: #64748b;
        }

        .totals-table td.value {
            text-align: right;
            font-weight: 600;
            color: #0f172a;
        }

        .totals-table tr.total-row {
            background: #f8fafc;
            font-size: 12pt;
            border-top: 2px solid {{ $template->primary_color ?? '#3B82F6' }};
        }

        .totals-table tr.total-row td {
            padding: 15px 8px;
            font-weight: bold;
        }

        .totals-table tr.total-row td.value {
            color: {{ $template->primary_color ?? '#3B82F6' }};
            font-size: 14pt;
        }

        .notes {
            clear: both;
            margin-top: 40px;
            padding: 20px;
            background: #f8fafc;
            border-left: 4px solid {{ $template->secondary_color ?? '#64748B' }};
            border-radius: 4px;
        }

        .notes-title {
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 8px;
        }

        .notes-content {
            color: #475569;
            font-size: 9pt;
            line-height: 1.5;
            white-space: pre-wrap;
        }

        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 8.5pt;
        }

        .clearfix {
            clear: both;
        }
    </style>
</head>
<body>
    <div class="page">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
                <div class="company-name">{{ $company['name'] }}</div>
                <div class="company-details">
                    {{ $company['address'] }}, {{ $company['postal_code'] }} {{ $company['city'] }} ({{ $company['province'] }})<br>
                    P.IVA: {{ $company['vat'] }} | Tel: {{ $company['phone'] }} | Email: {{ $company['email'] }}
                </div>
            </div>
            <div class="quote-title">PREVENTIVO</div>
            <div class="quote-code">{{ $quote->code }}</div>
        </div>

        <!-- Customer & Quote Info -->
        <div class="info-grid">
            <div class="info-row">
                <div class="info-col">
                    <div class="info-box">
                        <div class="info-label">Cliente</div>
                        <div class="info-value">{{ $quote->customer->display_name }}</div>
                        @if($quote->customer->vat)
                            <div class="info-value" style="font-size: 9pt; color: #64748b;">P.IVA: {{ $quote->customer->vat }}</div>
                        @endif
                        @if($quote->full_address)
                            <div style="font-size: 9pt; color: #475569; margin-top: 5px;">{{ $quote->full_address }}</div>
                        @endif
                    </div>
                </div>
                <div class="info-col">
                    <div class="info-box">
                        <div class="info-label">Oggetto</div>
                        <div class="info-value">{{ $quote->title }}</div>
                        @if($quote->description)
                            <div style="font-size: 9pt; color: #475569; margin-top: 5px;">{{ $quote->description }}</div>
                        @endif
                    </div>
                </div>
            </div>
            <div class="info-row">
                <div class="info-col">
                    <div class="info-box">
                        <div class="info-label">Data Emissione</div>
                        <div class="info-value">{{ $quote->issue_date->format('d/m/Y') }}</div>
                    </div>
                </div>
                <div class="info-col">
                    <div class="info-box">
                        <div class="info-label">Validità</div>
                        <div class="info-value">
                            @if($quote->valid_until)
                                Fino al {{ $quote->valid_until->format('d/m/Y') }}
                            @else
                                Non specificata
                            @endif
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Items -->
        @if($quote->items && $quote->items->count() > 0)
            <div class="section-title">Dettaglio Voci</div>
            <table class="items-table">
                <thead>
                    <tr>
                        @if($template && $template->show_item_codes)
                            <th style="width: 10%;">Codice</th>
                        @endif
                        <th style="width: 40%;">Descrizione</th>
                        <th style="width: 10%;" class="text-right">Q.tà</th>
                        @if($template && $template->show_unit_column)
                            <th style="width: 10%;">U.M.</th>
                        @endif
                        @if($quote->show_unit_prices)
                            <th style="width: 12%;" class="text-right">Prezzo Unit.</th>
                        @endif
                        @if($quote->discount_percentage > 0)
                            <th style="width: 10%;" class="text-right">Sconto</th>
                        @endif
                        <th style="width: 15%;" class="text-right">Totale</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($quote->items->where('parent_id', null) as $item)
                        @if($item->type === 'section')
                            <tr class="section-row">
                                <td colspan="{{
                                    ($template && $template->show_item_codes ? 1 : 0) +
                                    1 +
                                    1 +
                                    ($template && $template->show_unit_column ? 1 : 0) +
                                    ($quote->show_unit_prices ? 1 : 0) +
                                    ($quote->discount_percentage > 0 ? 1 : 0) +
                                    1
                                }}">
                                    {{ $item->description }}
                                </td>
                            </tr>
                            @foreach($item->children as $child)
                                <tr>
                                    @if($template && $template->show_item_codes)
                                        <td>{{ $child->code }}</td>
                                    @endif
                                    <td>
                                        <div class="item-description">{{ $child->description }}</div>
                                        @if($child->notes)
                                            <div class="item-notes">{{ $child->notes }}</div>
                                        @endif
                                    </td>
                                    <td class="text-right">{{ number_format($child->quantity, 2, ',', '.') }}</td>
                                    @if($template && $template->show_unit_column)
                                        <td>{{ $child->unit }}</td>
                                    @endif
                                    @if($quote->show_unit_prices && !$child->hide_unit_price)
                                        <td class="text-right">€ {{ number_format($child->unit_price, 2, ',', '.') }}</td>
                                    @elseif($quote->show_unit_prices)
                                        <td class="text-right">-</td>
                                    @endif
                                    @if($quote->discount_percentage > 0)
                                        <td class="text-right">{{ number_format($child->discount_percentage, 0) }}%</td>
                                    @endif
                                    <td class="text-right"><strong>€ {{ number_format($child->total, 2, ',', '.') }}</strong></td>
                                </tr>
                            @endforeach
                        @else
                            <tr>
                                @if($template && $template->show_item_codes)
                                    <td>{{ $item->code }}</td>
                                @endif
                                <td>
                                    <div class="item-description">{{ $item->description }}</div>
                                    @if($item->notes)
                                        <div class="item-notes">{{ $item->notes }}</div>
                                    @endif
                                </td>
                                <td class="text-right">{{ number_format($item->quantity, 2, ',', '.') }}</td>
                                @if($template && $template->show_unit_column)
                                    <td>{{ $item->unit }}</td>
                                @endif
                                @if($quote->show_unit_prices && !$item->hide_unit_price)
                                    <td class="text-right">€ {{ number_format($item->unit_price, 2, ',', '.') }}</td>
                                @elseif($quote->show_unit_prices)
                                    <td class="text-right">-</td>
                                @endif
                                @if($quote->discount_percentage > 0)
                                    <td class="text-right">{{ number_format($item->discount_percentage, 0) }}%</td>
                                @endif
                                <td class="text-right"><strong>€ {{ number_format($item->total, 2, ',', '.') }}</strong></td>
                            </tr>
                        @endif
                    @endforeach
                </tbody>
            </table>
        @endif

        <!-- Totals -->
        <div class="totals">
            <table class="totals-table">
                <tr>
                    <td class="label">Subtotale</td>
                    <td class="value">€ {{ number_format($quote->subtotal, 2, ',', '.') }}</td>
                </tr>
                @if($quote->discount_percentage > 0)
                    <tr>
                        <td class="label">Sconto ({{ number_format($quote->discount_percentage, 0) }}%)</td>
                        <td class="value" style="color: #ef4444;">- € {{ number_format($quote->discount_amount, 2, ',', '.') }}</td>
                    </tr>
                @endif
                @if($quote->show_tax)
                    <tr>
                        <td class="label">
                            IVA ({{ number_format($quote->tax_percentage, 0) }}%)
                            @if($quote->tax_included)
                                <span style="font-size: 8pt;">(inclusa)</span>
                            @endif
                        </td>
                        <td class="value">€ {{ number_format($quote->tax_amount, 2, ',', '.') }}</td>
                    </tr>
                @endif
                <tr class="total-row">
                    <td class="label">TOTALE</td>
                    <td class="value">€ {{ number_format($quote->total_amount, 2, ',', '.') }}</td>
                </tr>
            </table>
        </div>

        <div class="clearfix"></div>

        <!-- Payment Info -->
        @if($quote->payment_method || $quote->payment_terms)
            <div class="section-title">Pagamento</div>
            @if($quote->payment_method)
                <div style="margin: 10px 0;">
                    <strong>Metodo:</strong> {{ $quote->payment_method }}
                </div>
            @endif
            @if($quote->payment_terms)
                <div style="margin: 10px 0;">
                    <strong>Termini:</strong> {{ $quote->payment_terms }}
                </div>
            @endif
        @endif

        <!-- Notes -->
        @if($quote->notes)
            <div class="notes">
                <div class="notes-title">Note</div>
                <div class="notes-content">{{ $quote->notes }}</div>
            </div>
        @endif

        @if($quote->terms_and_conditions)
            <div class="notes">
                <div class="notes-title">Termini e Condizioni</div>
                <div class="notes-content">{{ $quote->terms_and_conditions }}</div>
            </div>
        @endif

        <!-- Footer -->
        <div class="footer">
            @if($quote->footer_text)
                {{ $quote->footer_text }}
            @else
                Grazie per aver scelto i nostri servizi. Per qualsiasi informazione non esitate a contattarci.
            @endif
            <br><br>
            <small>Documento generato il {{ now()->format('d/m/Y H:i') }}</small>
        </div>
    </div>
</body>
</html>
