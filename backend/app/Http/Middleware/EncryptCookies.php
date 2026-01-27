<?php

namespace App\Http\Middleware;

use Illuminate\Cookie\Middleware\EncryptCookies as Middleware;

class EncryptCookies extends Middleware
{
    /**
     * The names of the cookies that should not be encrypted.
     *
     * Escludiamo 'auth_token' dalla crittografia per permettere
     * ai client API (Postman, cURL, etc.) di inviare il cookie
     * senza doverlo criptare con la chiave dell'applicazione.
     *
     * Il token Sanctum è già sicuro di per sé.
     *
     * @var array<int, string>
     */
    protected $except = [
        'auth_token',
    ];
}
