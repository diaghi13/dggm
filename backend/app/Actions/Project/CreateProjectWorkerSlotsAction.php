<?php

namespace App\Actions\Project;

use App\Enums\ProjectWorkerStatus;
use App\Enums\QuoteItemType;
use App\Models\Project;
use App\Models\ProjectWorker;
use App\Models\Quote;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CreateProjectWorkerSlotsAction
{
    /**
     * Create ProjectWorker slot records from all labor items in a quote.
     *
     * @return Collection<int, ProjectWorker>
     */
    public function execute(Quote $quote, Project $project): Collection
    {
        return DB::transaction(function () use ($quote, $project) {
            $slots = collect();

            // Load all quote items with their product, then filter to labor items.
            // An item qualifies as a labor item if its type is Labor OR its linked
            // product has the is_labor_role flag set to true.
            $allItems = $quote->items()->with('product')->get();

            $laborItems = $allItems->filter(function ($item) {
                if ($item->type === QuoteItemType::Labor) {
                    return true;
                }

                return $item->product && $item->product->is_labor_role;
            });

            foreach ($laborItems as $item) {
                // How many workers does this line item require?
                $count = (int) max(1, round((float) ($item->quantity ?? 1)));
                $isScheduled = ($quote->type?->value ?? '') === 'event';

                // Effective duration: item's own duration or quote event_days fallback
                $estimatedDays = $item->duration !== null
                    ? (float) $item->duration
                    : (float) ($quote->event_days ?? 1);

                for ($i = 1; $i <= $count; $i++) {
                    $slot = ProjectWorker::create([
                        'project_id' => $project->id,
                        'worker_id' => null, // no worker yet
                        'status' => ProjectWorkerStatus::Slot,
                        'assigned_by_user_id' => auth()->id(),
                        'role_name' => $item->description,
                        'slot_index' => $i,
                        'quote_item_id' => $item->id,
                        'estimated_days' => $estimatedDays,
                        'budget_cost_rate' => $item->cost_price,  // internal budget cost / day
                        'customer_rate' => $item->unit_price,  // what client is charged / day
                        'is_external' => false, // unknown yet — updated on worker assignment
                        'is_scheduled' => $isScheduled,
                        'is_active' => true,
                    ]);

                    $slots->push($slot);
                }
            }

            return $slots;
        });
    }
}
