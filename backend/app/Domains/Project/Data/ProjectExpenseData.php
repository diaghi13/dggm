<?php

namespace App\Domains\Project\Data;

use App\Enums\ProjectExpenseCategory;
use App\Enums\ProjectExpenseStatus;
use Spatie\LaravelData\Data;

class ProjectExpenseData extends Data
{
    public function __construct(
        public ?int $id,
        public int $project_id,
        public ?int $project_worker_id = null,
        public ?int $submitted_by_user_id = null,
        public ProjectExpenseCategory $category = ProjectExpenseCategory::Other,
        public string $description = '',
        public float $amount = 0,
        public string $expense_date = '',
        public bool $is_billable_to_client = false,
        public ?int $receipt_media_id = null,
        public ProjectExpenseStatus $status = ProjectExpenseStatus::Draft,
        public ?int $approved_by_user_id = null,
        public ?string $approved_at = null,
        public ?string $rejection_reason = null,
        public ?string $notes = null,
        public ?bool $is_budgeted = null,
        public ?float $budgeted_amount = null,
        public ?bool $billable_to_final_balance = null,

        // Computed (output only)
        public readonly ?string $submitted_by_name = null,
        public readonly ?string $category_label = null,
        public readonly ?float $variance = null,
        public readonly ?string $receipt_url = null,
    ) {}

    public static function rules(): array
    {
        return [
            'project_id' => ['required', 'integer', 'exists:projects,id'],
            'project_worker_id' => ['nullable', 'integer', 'exists:project_workers,id'],
            'category' => ['required', 'string'],
            'description' => ['required', 'string', 'max:500'],
            'amount' => ['required', 'numeric', 'min:0'],
            'expense_date' => ['required', 'date'],
            'is_billable_to_client' => ['boolean'],
            'receipt_media_id' => ['nullable', 'integer'],
            'rejection_reason' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'is_budgeted' => ['nullable', 'boolean'],
            'budgeted_amount' => ['nullable', 'numeric', 'min:0'],
            'billable_to_final_balance' => ['nullable', 'boolean'],
        ];
    }

    public static function fromModel(\App\Domains\Project\Models\ProjectExpense $expense): self
    {
        return new self(
            id: $expense->id,
            project_id: $expense->project_id,
            project_worker_id: $expense->project_worker_id,
            submitted_by_user_id: $expense->submitted_by_user_id,
            category: $expense->category,
            description: $expense->description,
            amount: (float) $expense->amount,
            expense_date: $expense->expense_date->format('Y-m-d'),
            is_billable_to_client: $expense->is_billable_to_client,
            receipt_media_id: $expense->receipt_media_id,
            status: $expense->status,
            approved_by_user_id: $expense->approved_by_user_id,
            approved_at: $expense->approved_at?->toIso8601String(),
            rejection_reason: $expense->rejection_reason,
            notes: $expense->notes,
            is_budgeted: $expense->is_budgeted,
            budgeted_amount: $expense->budgeted_amount !== null ? (float) $expense->budgeted_amount : null,
            billable_to_final_balance: $expense->billable_to_final_balance,
            submitted_by_name: $expense->relationLoaded('submittedBy') ? $expense->submittedBy?->name : null,
            category_label: $expense->category->name,
            variance: $expense->variance,
            receipt_url: $expense->receipt_url,
        );
    }
}
