<?php

declare(strict_types=1);

namespace App\Data\Landlord;

use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;
use Spatie\LaravelData\Lazy;
use Spatie\LaravelData\Optional;

class PlanData extends Data
{
    public function __construct(
        public int|Optional $id,
        public string $name,
        public string $slug,
        public ?string $description,
        public ?float $price,
        public ?float $price_yearly,
        public bool $is_active,
        public int $sort_order,
        public int $trial_days,

        /** @var DataCollection<PlanFeatureData>|Lazy|null */
        #[DataCollectionOf(PlanFeatureData::class)]
        public DataCollection|Lazy|null $features = null,
    ) {}
}
