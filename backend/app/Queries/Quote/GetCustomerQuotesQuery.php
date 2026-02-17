<?php

namespace App\Queries\Quote;

use App\Models\Quote;
use Illuminate\Database\Eloquent\Collection;

class GetCustomerQuotesQuery
{
    public function __construct(
        private int $customerId,
        private ?string $status = null
    ) {}

    public function execute(): Collection
    {
        $query = Quote::forCustomer($this->customerId)
            ->with(['projectManager', 'items']);

        if ($this->status) {
            $query->ofStatus($this->status);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }
}
