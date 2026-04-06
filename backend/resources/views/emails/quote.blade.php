<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preventivo {{ $quote->code }}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
    </style>
</head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 32px 0;">
    <tr>
        <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

                {{-- Header --}}
                <tr>
                    <td style="background-color: #1890ff; padding: 28px 32px;">
                        <p style="margin: 0; font-family: Arial, sans-serif; font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 0.5px;">
                            {{ \App\Models\Setting::get('company.name', config('app.name')) ?: config('app.name') }}
                        </p>
                        <p style="margin: 6px 0 0; font-family: Arial, sans-serif; font-size: 13px; color: rgba(255,255,255,0.85);">
                            Preventivo n. {{ $quote->code }}
                        </p>
                    </td>
                </tr>

                {{-- Body --}}
                <tr>
                    <td style="padding: 32px;">

                        {{-- Saluto --}}
                        <p style="margin: 0 0 20px; font-family: Arial, sans-serif; font-size: 15px; color: #333333; line-height: 1.6;">
                            Gentile
                            @if($quote->customer)
                                @if($quote->customer->type === 'company')
                                    <strong>{{ $quote->customer->company_name }}</strong>
                                @else
                                    <strong>{{ trim(($quote->customer->first_name ?? '') . ' ' . ($quote->customer->last_name ?? '')) ?: $quote->customer->company_name }}</strong>
                                @endif
                            @else
                                Cliente
                            @endif
                            ,
                        </p>

                        {{-- Messaggio personalizzato --}}
                        @if(!empty($customMessage))
                        <p style="margin: 0 0 20px; font-family: Arial, sans-serif; font-size: 15px; color: #333333; line-height: 1.6;">
                            {!! nl2br(e($customMessage)) !!}
                        </p>
                        @else
                        <p style="margin: 0 0 20px; font-family: Arial, sans-serif; font-size: 15px; color: #333333; line-height: 1.6;">
                            Siamo lieti di trasmetterLe il preventivo richiesto. In allegato trova il documento completo in formato PDF.
                        </p>
                        @endif

                        {{-- Riepilogo preventivo --}}
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
                            <tr>
                                <td colspan="2" style="background-color: #f8fafc; padding: 12px 16px; border-bottom: 1px solid #e2e8f0;">
                                    <p style="margin: 0; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">
                                        Riepilogo Preventivo
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-family: Arial, sans-serif; font-size: 13px; color: #64748b; width: 50%;">
                                    Numero preventivo
                                </td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-family: Arial, sans-serif; font-size: 13px; color: #1e293b; font-weight: bold;">
                                    {{ $quote->code }}
                                </td>
                            </tr>
                            @if($quote->title)
                            <tr>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-family: Arial, sans-serif; font-size: 13px; color: #64748b;">
                                    Oggetto
                                </td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-family: Arial, sans-serif; font-size: 13px; color: #1e293b;">
                                    {{ $quote->title }}
                                </td>
                            </tr>
                            @endif
                            @if($quote->issue_date)
                            <tr>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-family: Arial, sans-serif; font-size: 13px; color: #64748b;">
                                    Data emissione
                                </td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-family: Arial, sans-serif; font-size: 13px; color: #1e293b;">
                                    {{ \Carbon\Carbon::parse($quote->issue_date)->locale('it')->isoFormat('D MMMM YYYY') }}
                                </td>
                            </tr>
                            @endif
                            @if($quote->expiry_date ?? $quote->valid_until)
                            <tr>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-family: Arial, sans-serif; font-size: 13px; color: #64748b;">
                                    Valido fino al
                                </td>
                                <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-family: Arial, sans-serif; font-size: 13px; color: #1e293b;">
                                    {{ \Carbon\Carbon::parse($quote->expiry_date ?? $quote->valid_until)->locale('it')->isoFormat('D MMMM YYYY') }}
                                </td>
                            </tr>
                            @endif
                            <tr>
                                <td style="padding: 12px 16px; font-family: Arial, sans-serif; font-size: 14px; color: #64748b; font-weight: bold;">
                                    Importo totale
                                </td>
                                <td style="padding: 12px 16px; font-family: Arial, sans-serif; font-size: 16px; color: #1890ff; font-weight: bold;">
                                    € {{ number_format((float) $quote->total_amount, 2, ',', '.') }}
                                </td>
                            </tr>
                        </table>

                        {{-- Note cliente --}}
                        @if(!empty($quote->notes))
                        <div style="margin: 20px 0; padding: 16px; background-color: #f8fafc; border-left: 4px solid #1890ff; border-radius: 0 4px 4px 0;">
                            <p style="margin: 0 0 6px; font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Note</p>
                            <p style="margin: 0; font-family: Arial, sans-serif; font-size: 13px; color: #4b5563; line-height: 1.6;">
                                {!! nl2br(e($quote->notes)) !!}
                            </p>
                        </div>
                        @endif

                        <p style="margin: 24px 0 0; font-family: Arial, sans-serif; font-size: 15px; color: #333333; line-height: 1.6;">
                            Restiamo a disposizione per qualsiasi chiarimento o informazione aggiuntiva.
                        </p>

                        <p style="margin: 8px 0 0; font-family: Arial, sans-serif; font-size: 15px; color: #333333; line-height: 1.6;">
                            Cordiali saluti,
                        </p>

                        {{-- CTA Buttons: only shown when token is available and quote is actionable --}}
                        @if(!empty($acceptUrl) && !empty($rejectUrl))
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:32px;margin-bottom:8px;">
                          <tr>
                            <td align="center">
                              <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:14px;color:#64748b;margin:0 0 20px;line-height:1.5;">
                                Puoi accettare o rifiutare questo preventivo direttamente da qui:
                              </p>
                              <table cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                  {{-- Accept button --}}
                                  <td style="padding-right:12px;">
                                    <a href="{{ $acceptUrl }}"
                                       style="display:inline-block;padding:13px 28px;background-color:#16a34a;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.01em;">
                                      ✓&nbsp;&nbsp;Accetta Preventivo
                                    </a>
                                  </td>
                                  {{-- Reject button --}}
                                  <td>
                                    <a href="{{ $rejectUrl }}"
                                       style="display:inline-block;padding:13px 28px;background-color:#ffffff;color:#64748b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.01em;border:1.5px solid #e2e8f0;">
                                      ✕&nbsp;&nbsp;Rifiuta
                                    </a>
                                  </td>
                                </tr>
                              </table>
                              @if(!empty($quote->expiry_date))
                              <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:12px;color:#94a3b8;margin:16px 0 0;">
                                Link valido fino al {{ \Carbon\Carbon::parse($quote->expiry_date)->format('d/m/Y') }}
                              </p>
                              @endif
                            </td>
                          </tr>
                        </table>

                        {{-- Divider before signature --}}
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;margin-bottom:8px;">
                          <tr><td style="border-top:1px solid #e2e8f0;"></td></tr>
                        </table>
                        @endif

                    </td>
                </tr>

                {{-- Firma --}}
                <tr>
                    <td style="padding: 0 32px 32px;">
                        @include('emails.partials.signature', ['signature' => $signature ?? null])
                    </td>
                </tr>

                {{-- Footer --}}
                <tr>
                    <td style="background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0;">
                        <p style="margin: 0; font-family: Arial, sans-serif; font-size: 11px; color: #94a3b8; text-align: center;">
                            Questo messaggio è generato automaticamente dal sistema DGGM ERP. Si prega di non rispondere a questa email se non indicato diversamente.
                        </p>
                    </td>
                </tr>

            </table>
        </td>
    </tr>
</table>
</body>
</html>
