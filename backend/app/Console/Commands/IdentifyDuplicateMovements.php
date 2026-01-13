<?php

namespace App\Console\Commands;

use App\Models\StockMovement;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class IdentifyDuplicateMovements extends Command
{
    protected $signature = 'stock:identify-duplicates';

    protected $description = 'Identify potential duplicate stock movements (OUTPUT + SITE_ALLOCATION for same material/site/date)';

    public function handle(): int
    {
        $this->info('Searching for potential duplicate movements...');
        $this->newLine();

        // Find movements that might be duplicates
        // OUTPUT + SITE_ALLOCATION for same material/warehouse/site on same day
        $duplicates = DB::table('stock_movements as sm1')
            ->join('stock_movements as sm2', function ($join) {
                $join->on('sm1.material_id', '=', 'sm2.material_id')
                    ->on('sm1.warehouse_id', '=', 'sm2.warehouse_id')
                    ->on('sm1.site_id', '=', 'sm2.site_id')
                    ->on(DB::raw('DATE(sm1.movement_date)'), '=', DB::raw('DATE(sm2.movement_date)'));
            })
            ->where('sm1.type', 'OUTPUT')
            ->where('sm2.type', 'SITE_ALLOCATION')
            ->where('sm1.id', '<', 'sm2.id') // Avoid duplicating results
            ->select([
                'sm1.id as output_id',
                'sm1.code as output_code',
                'sm1.quantity as output_quantity',
                'sm1.movement_date as output_date',
                'sm2.id as allocation_id',
                'sm2.code as allocation_code',
                'sm2.quantity as allocation_quantity',
                'sm2.movement_date as allocation_date',
                'sm1.material_id',
                'sm1.warehouse_id',
                'sm1.site_id',
                'sm1.ddt_id',
            ])
            ->get();

        if ($duplicates->isEmpty()) {
            $this->info('✓ No duplicate movements found!');

            return self::SUCCESS;
        }

        $this->warn("Found {$duplicates->count()} potential duplicate movement pairs:");
        $this->newLine();

        $table = [];
        foreach ($duplicates as $dup) {
            $material = DB::table('materials')->where('id', $dup->material_id)->first();
            $warehouse = DB::table('warehouses')->where('id', $dup->warehouse_id)->first();
            $site = DB::table('sites')->where('id', $dup->site_id)->first();
            $ddt = $dup->ddt_id ? DB::table('ddts')->where('id', $dup->ddt_id)->first() : null;

            $table[] = [
                'Material' => $material->name ?? 'N/A',
                'Warehouse' => $warehouse->name ?? 'N/A',
                'Site' => $site->name ?? 'N/A',
                'DDT' => $ddt->code ?? 'N/A',
                'OUTPUT Qty' => $dup->output_quantity,
                'ALLOCATION Qty' => $dup->allocation_quantity,
                'Date' => date('Y-m-d', strtotime($dup->output_date)),
            ];
        }

        $this->table(
            ['Material', 'Warehouse', 'Site', 'DDT', 'OUTPUT Qty', 'ALLOCATION Qty', 'Date'],
            $table
        );

        $this->newLine();
        $this->warn('⚠️  These movements may represent double-counting.');
        $this->info('Review each case manually to determine if they should be merged or deleted.');

        return self::SUCCESS;
    }
}
