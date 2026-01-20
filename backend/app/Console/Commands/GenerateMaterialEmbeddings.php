<?php

namespace App\Console\Commands;

use App\Models\Material;
use App\Services\EmbeddingService;
use Illuminate\Console\Command;

class GenerateMaterialEmbeddings extends Command
{
    protected $signature = 'materials:generate-embeddings {--force}';
    protected $description = 'Genera embeddings per tutti i materiali';

    public function handle(EmbeddingService $embeddingService)
    {
        $query = Material::query();

        // Solo materiali senza embedding (a meno che non usi --force)
        if (!$this->option('force')) {
            $query->whereNull('description_embedding');
        }

        $materials = $query->get();
        $total = $materials->count();

        if ($total === 0) {
            $this->info('Nessun materiale da processare.');
            return 0;
        }

        $this->info("Generazione embeddings per {$total} materiali...");
        $bar = $this->output->createProgressBar($total);

        foreach ($materials as $material) {
            try {
                $text = implode(' ', array_filter([
                    $material->name,
                    $material->description,
                    $material->category,
                    $material->code
                ]));

                $embedding = $embeddingService->getEmbedding($text);

                $material->update([
                    'description_embedding' => json_encode($embedding)
                ]);

                $material->save();

                $bar->advance();
            } catch (\Exception $e) {
                $this->error("\nErrore per materiale {$material->id}: " . $e->getMessage());
            }
        }

        $bar->finish();
        $this->newLine();
        $this->info('Completato!');

        return 0;
    }
}
