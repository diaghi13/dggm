<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><title>Verifica il tuo indirizzo email</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
    <div style="background: #1e293b; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: 0.5px;">{{ $companyName }}</h1>
    </div>
    <div style="background: #ffffff; padding: 40px 32px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="font-size: 16px; line-height: 1.6; margin-top: 0;">Ciao <strong>{{ $userName }}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.7; color: #475569;">
            Per completare la registrazione clicca sul pulsante qui sotto per verificare il tuo indirizzo email.
        </p>
        <div style="text-align: center; margin: 36px 0;">
            <a href="{{ $verificationUrl }}"
               style="background: #1e293b; color: white; padding: 13px 32px; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 600; display: inline-block;">
                Verifica email
            </a>
        </div>
        <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; margin-bottom: 0;">
            Il link è valido per {{ $expireMinutes }} minuti. Se non hai creato un account, ignora questa email.<br>
            <span style="color: #cbd5e1;">Se il pulsante non funziona:</span>
            <a href="{{ $verificationUrl }}" style="color: #64748b; word-break: break-all;">{{ $verificationUrl }}</a>
        </p>
    </div>
    <p style="text-align: center; font-size: 11px; color: #cbd5e1; margin-top: 20px;">
        {{ $companyName }} &mdash; Messaggio automatico, non rispondere.
    </p>
</body>
</html>
