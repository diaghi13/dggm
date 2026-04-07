<?php

namespace App\Services\Payment;

use App\Contracts\PaymentGatewayInterface;

/**
 * NullPaymentGateway
 *
 * Implementazione vuota del gateway di pagamento, usata finché
 * non è integrato un provider reale (Stripe, Braintree, ecc.).
 *
 * Tutti i metodi ritornano valori neutri: nessun addebito reale viene effettuato.
 */
class NullPaymentGateway implements PaymentGatewayInterface
{
    /**
     * Nessun gateway configurato: ritorna sempre false.
     *
     * @param  array<string, mixed>  $metadata
     */
    public function charge(
        string $tenantId,
        float $amount,
        string $description,
        array $metadata = []
    ): bool {
        return false;
    }

    /**
     * Nessun gateway configurato: nessun metodo di pagamento disponibile.
     */
    public function hasPaymentMethod(string $tenantId): bool
    {
        return false;
    }

    /**
     * Nessuna transazione effettuata.
     */
    public function getLastTransactionId(): ?string
    {
        return null;
    }
}
