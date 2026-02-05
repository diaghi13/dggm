<?php

namespace App\Queries\Setting;

use App\Models\Setting;

class GetSettingByKeyQuery
{
    public function __construct(
        private readonly string $key,
        private readonly ?int $userId = null
    ) {}

    public function execute(): ?Setting
    {
        $query = Setting::where('key', $this->key);

        if ($this->userId === null) {
            $query->global();
        } else {
            $query->forUser($this->userId);
        }

        return $query->first();
    }
}
