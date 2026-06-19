<?php

namespace App\Domains\Customer\Actions;

use App\Domains\Customer\Data\CustomerData;
use App\Domains\Customer\Models\Customer;
use Illuminate\Support\Facades\DB;

class CreateCustomerAction
{
    public function execute(CustomerData $data): Customer
    {
        return DB::transaction(function () use ($data) {
            $data['payment_terms'] = $data['payment_terms'] ?? 0;
            $data['discount_percentage'] = $data['discount_percentage'] ?? 0;
            $data['country'] = $data['country'] ?? 'IT';
            $data['is_active'] = $data['is_active'] ?? true;

            return Customer::query()
                ->create($data->toArray());
        });
    }
}
