<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'embedding' => [
        'url' => env('EMBEDDING_SERVICE_URL', 'http://localhost:5001'),
        'timeout' => env('EMBEDDING_SERVICE_TIMEOUT', 30),
    ],

    'browsershot' => [
        'node_binary' => env('NODE_BINARY'),
        'npm_binary' => env('NPM_BINARY'),
        'chrome_path' => env('CHROME_PATH'),
        'no_sandbox' => env('CHROME_NO_SANDBOX', false),
    ],

    'libreoffice' => [
        'binary' => env('LIBREOFFICE_BINARY', 'libreoffice'),
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI', '/api/v1/email-accounts/oauth/google/callback'),
    ],

    'microsoft' => [
        'client_id' => env('MICROSOFT_CLIENT_ID'),
        'client_secret' => env('MICROSOFT_CLIENT_SECRET'),
        'redirect' => env('MICROSOFT_REDIRECT_URI', '/api/v1/email-accounts/oauth/microsoft/callback'),
        'tenant' => env('MICROSOFT_TENANT_ID', 'common'),
    ],
];
