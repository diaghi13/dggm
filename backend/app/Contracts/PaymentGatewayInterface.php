<?php

namespace App\Contracts;

interface PaymentGatewayInterface
{
    /**
     * Addebita il cliente per un rinnovo o addon.
     *
     * @param  array<string, mixed>  $metadata
     */
    public function charge(
        string $tenantId,
        float $amount,
        string $description,
        array $metadata = []
    ): bool;

    /**
     * Verifica se il cliente ha un metodo di pagamento configurato.
     */
    public function hasPaymentMethod(string $tenantId): bool;

    /**
     * Ritorna l'ID della transazione se disponibile.
     */
    public function getLastTransactionId(): ?string;
}
