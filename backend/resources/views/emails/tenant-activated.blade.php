<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><title>Account attivato</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
    <div style="background: #1e293b; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">DGGM ERP</h1>
    </div>
    <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
        <h2 style="color: #1e293b; margin-top: 0;">Ciao {{ $userName }}!</h2>
        <p style="font-size: 16px; line-height: 1.6;">
            Il tuo account per <strong>{{ $tenantName }}</strong> è stato attivato con successo.
        </p>
        <p style="font-size: 16px; line-height: 1.6;">
            Puoi ora accedere al sistema di gestione aziendale.
        </p>
        <div style="text-align: center; margin: 32px 0;">
            <a href="{{ $loginUrl }}" style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                Accedi a DGGM ERP
            </a>
        </div>
        <p style="font-size: 14px; color: #64748b;">
            Se non riesci a cliccare il pulsante, copia questo link nel browser:<br>
            <a href="{{ $loginUrl }}" style="color: #3b82f6;">{{ $loginUrl }}</a>
        </p>
    </div>
</body>
</html>
