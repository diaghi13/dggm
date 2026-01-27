<?php

namespace App\Data;

use Spatie\LaravelData\Data;

class SiteData extends Data
{
    public function __construct(
        public int|null $id,
        public string   $code,
        public string   $name,
        public ?string  $description,
        public int      $customer_id,
        public ?int     $quote_id,
        public ?string  $address,
        public ?string  $city,
        public ?string  $province,
        public ?string  $postal_code,
        public ?string  $country,
        public ?float   $latitude,
        public ?float   $longitude,
        public ?int     $gps_radius,
        public ?int     $project_manager_id,
        public ?float   $estimated_amount,
        public ?float   $actual_cost,
        public ?float   $invoiced_amount,
        public ?string  $start_date,
        public ?string  $estimated_end_date,
        public ?string  $actual_end_date,
        public ?string  $status,
        public ?string  $priority,
        public ?string  $notes,
        public ?string  $internal_notes,
        public bool     $is_active,
    )
    {
    }
}
