<?php

namespace App\Domains\Project\Data;

use Spatie\LaravelData\Data;

class ProjectRoleData extends Data
{
    public function __construct(
        public ?int $id,
        public string $name,
        public ?string $slug,
        public ?string $description,
        public ?string $color,
        public ?int $sort_order,
        public bool $is_active = true,
    ) {}

    public static function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'color' => ['nullable', 'string', 'max:20'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ];
    }
}
