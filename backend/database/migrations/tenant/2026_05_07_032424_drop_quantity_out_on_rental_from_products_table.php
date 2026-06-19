<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Distribute products.quantity_out_on_rental proportionally across inventory records
        // before dropping the column. Proportional to quantity_available per warehouse.
        $products = DB::table('products')
            ->where('quantity_out_on_rental', '>', 0)
            ->select('id', 'quantity_out_on_rental')
            ->get();

        foreach ($products as $product) {
            $inventories = DB::table('inventory')
                ->where('product_id', $product->id)
                ->where('quantity_available', '>', 0)
                ->get();

            if ($inventories->isEmpty()) {
                // No stock in any warehouse — put everything in first inventory record if any
                $first = DB::table('inventory')->where('product_id', $product->id)->first();
                if ($first) {
                    DB::table('inventory')->where('id', $first->id)
                        ->increment('quantity_out_on_rental', $product->quantity_out_on_rental);
                }

                continue;
            }

            $totalAvailable = $inventories->sum('quantity_available');
            $count = $inventories->count();
            $distributed = 0;

            foreach ($inventories as $i => $inventory) {
                if ($i === $count - 1) {
                    // Last warehouse gets the remainder to avoid rounding drift
                    $share = round($product->quantity_out_on_rental - $distributed, 2);
                } else {
                    $share = round($product->quantity_out_on_rental * ($inventory->quantity_available / $totalAvailable), 2);
                    $distributed += $share;
                }

                if ($share > 0) {
                    DB::table('inventory')->where('id', $inventory->id)
                        ->increment('quantity_out_on_rental', $share);
                }
            }
        }

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('quantity_out_on_rental');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('quantity_out_on_rental', 10, 2)->default(0)->after('estimated_base_day');
        });
    }
};
