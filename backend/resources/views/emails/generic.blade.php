<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
    </style>
</head>
<body>
    {!! $bodyHtml !!}
    @include('emails.partials.signature', ['signature' => $signature ?? null])
</body>
</html>
