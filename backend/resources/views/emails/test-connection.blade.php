<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test connessione email</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        h1 { color: #1890ff; font-size: 22px; }
        p { color: #555; line-height: 1.6; }
        .badge { display: inline-block; background: #e6f7ff; color: #1890ff; border: 1px solid #91d5ff; padding: 4px 12px; border-radius: 4px; font-size: 14px; }
        .footer { margin-top: 32px; font-size: 12px; color: #aaa; border-top: 1px solid #eee; padding-top: 16px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Test connessione email riuscito</h1>
        <p>Questa email conferma che la configurazione dell'account <strong>{{ $accountName }}</strong> funziona correttamente.</p>
        <p><span class="badge">{{ $fromEmail }}</span> &nbsp; <span class="badge">Provider: {{ $provider }}</span></p>
        <p>Puoi iniziare a utilizzare questo account per inviare documenti dal sistema DGGM ERP.</p>
        <div class="footer">DGGM ERP — Messaggio automatico di verifica</div>
        @include('emails.partials.signature', ['signature' => $signature ?? null])
    </div>
</body>
</html>
