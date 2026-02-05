<?php

namespace App\Queries\Setting;

use App\Models\Setting;
use Illuminate\Database\Eloquent\Collection;

class GetAllSettingsQuery
{
    public function __construct(
        private readonly array $filters = []
    ) {}

    public function execute(): Collection
    {
        $query = Setting::query();

        // Filter by group
        if (isset($this->filters['group'])) {
            $query->inGroup($this->filters['group']);
        }

        // Filter by user (null = global)
        if (array_key_exists('user_id', $this->filters)) {
            if ($this->filters['user_id'] === null) {
                $query->global();
            } else {
                $query->forUser($this->filters['user_id']);
            }
        }

        // Filter by public visibility
        if (isset($this->filters['is_public'])) {
            $query->where('is_public', filter_var($this->filters['is_public'], FILTER_VALIDATE_BOOLEAN));
        }

        // Filter by key search
        if (isset($this->filters['search'])) {
            $query->where('key', 'like', '%'.$this->filters['search'].'%');
        }

        return $query->orderBy('group')->orderBy('key')->get();
    }
}
