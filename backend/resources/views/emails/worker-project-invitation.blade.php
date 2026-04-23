<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header { background-color: #1d4ed8; padding: 24px 32px; }
        .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 600; }
        .body { padding: 32px; }
        .greeting { font-size: 16px; margin-bottom: 16px; }
        .detail-row { display: flex; margin-bottom: 10px; font-size: 14px; }
        .detail-label { font-weight: 600; min-width: 120px; color: #475569; }
        .detail-value { color: #1e293b; }
        .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
        .action-section { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 20px; margin-top: 20px; }
        .action-section p { margin: 0 0 16px 0; font-size: 14px; color: #1e293b; }
        .btn { display: inline-block; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600; }
        .btn-register { background-color: #16a34a; color: #ffffff; }
        .footer-note { font-size: 12px; color: #94a3b8; margin-top: 24px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Sei stato richiesto per un progetto</h1>
        </div>
        <div class="body">
            <p class="greeting">Ciao {{ $invitation->first_name }},</p>
            <p style="font-size: 14px; color: #475569;">
                {{ $projectWorker->worker->user->name ?? 'Il Project Manager' }} ti ha richiesto come collaboratore per il progetto <strong>{{ $projectWorker->project->name }}</strong>.
                Per partecipare, registrati gratuitamente sulla nostra piattaforma.
            </p>

            <hr class="divider">

            <div class="detail-row">
                <span class="detail-label">Cliente:</span>
                <span class="detail-value">{{ $projectWorker->project->customer->name ?? '—' }}</span>
            </div>

            <div class="detail-row">
                <span class="detail-label">Indirizzo:</span>
                <span class="detail-value">{{ $projectWorker->project->full_address ?? '—' }}</span>
            </div>

            <div class="detail-row">
                <span class="detail-label">Periodo:</span>
                <span class="detail-value">
                    Dal {{ $projectWorker->assigned_from?->format('d/m/Y') ?? '—' }}
                    {{ $projectWorker->assigned_to ? 'al ' . $projectWorker->assigned_to->format('d/m/Y') : '(data fine da definire)' }}
                </span>
            </div>

            @php
                $rolesText = $projectWorker->roles->pluck('name')->join(', ');
            @endphp

            @if($rolesText)
            <div class="detail-row">
                <span class="detail-label">Ruoli:</span>
                <span class="detail-value">{{ $rolesText }}</span>
            </div>
            @endif

            @if($projectWorker->notes)
            <div class="detail-row">
                <span class="detail-label">Note:</span>
                <span class="detail-value">{{ $projectWorker->notes }}</span>
            </div>
            @endif

            <div class="action-section">
                <p>
                    Per accettare e scegliere le giornate di lavoro, crea il tuo account.
                    Hai <strong>{{ now()->diffInDays($invitation->expires_at) }} giorni</strong> per rispondere
                    (scade il {{ $invitation->expires_at->format('d/m/Y') }}).
                </p>
                <a href="{{ $invitation->getAcceptUrl() }}" class="btn btn-register">
                    Registrati e Scegli le Giornate
                </a>
            </div>

            <p class="footer-note">Se non sei interessato, puoi ignorare questa email.</p>

            @include('emails.partials.signature', ['signature' => null])
        </div>
    </div>
</body>
</html>
