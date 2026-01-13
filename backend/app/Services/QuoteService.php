<?php

namespace App\Services;

use App\Models\Quote;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class QuoteService
{
    public function getAll(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Quote::with(['customer', 'projectManager', 'items']);

        if (! empty($filters['status'])) {
            $query->ofStatus($filters['status']);
        }

        if (! empty($filters['customer_id'])) {
            $query->forCustomer($filters['customer_id']);
        }

        if (isset($filters['is_active']) && $filters['is_active'] !== null) {
            $query->where('is_active', $filters['is_active']);
        }

        if (! empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('code', 'like', "%{$filters['search']}%")
                    ->orWhere('title', 'like', "%{$filters['search']}%");
            });
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate(min($perPage, 100));
    }

    public function create(array $data): Quote
    {
        return Quote::create($data);
    }

    public function update(Quote $quote, array $data): Quote
    {
        DB::transaction(function () use ($quote, $data) {
            // Extract items if present
            $items = $data['items'] ?? null;
            unset($data['items']);

            // Update quote basic data
            $quote->update($data);

            // Sync items if provided
            if ($items !== null) {
                $this->syncItems($quote, $items);
            }
        });

        return $quote->fresh(['customer', 'projectManager', 'items.children', 'template', 'site']);
    }

    protected function syncItems(Quote $quote, array $items): void
    {
        // Get existing item IDs
        $existingIds = $quote->items()->pluck('id')->toArray();
        $incomingIds = collect($items)->pluck('id')->filter()->toArray();

        // Delete items that are not in the incoming data
        $toDelete = array_diff($existingIds, $incomingIds);
        if (! empty($toDelete)) {
            $quote->items()->whereIn('id', $toDelete)->delete();
        }

        // Create or update items
        foreach ($items as $itemData) {
            if (isset($itemData['id']) && $itemData['id'] > 0 && in_array($itemData['id'], $existingIds)) {
                // Update existing item
                $quote->items()->where('id', $itemData['id'])->update($itemData);
            } else {
                // Create new item
                unset($itemData['id']); // Remove temporary ID from frontend
                $quote->items()->create($itemData);
            }
        }
    }

    public function delete(Quote $quote): bool
    {
        return $quote->delete();
    }

    public function changeStatus(Quote $quote, string $status): Quote
    {
        // Validate status transition
        $allowedStatuses = ['draft', 'sent', 'approved', 'rejected', 'expired'];

        if (! in_array($status, $allowedStatuses)) {
            throw new \InvalidArgumentException("Invalid status: {$status}");
        }

        // Update status with appropriate method
        match ($status) {
            'sent' => $quote->send(),
            'approved' => $this->approveQuote($quote),
            'rejected' => $quote->reject(),
            default => $quote->update(['status' => $status]),
        };

        return $quote->fresh();
    }

    protected function approveQuote(Quote $quote): void
    {
        $quote->approve();

        // Automatically convert to site when approved
        $site = $quote->convertToSite();

        if (! $site) {
            throw new \Exception('Failed to convert quote to site');
        }
    }
}
