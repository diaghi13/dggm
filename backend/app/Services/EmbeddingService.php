<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class EmbeddingService
{
    private string $serviceUrl;
    private int $timeout;

    public function __construct()
    {
        $this->serviceUrl = config('services.embedding.url', 'http://localhost:5000');
        $this->timeout = config('services.embedding.timeout', 30);
    }

    /**
     * Genera embedding per un singolo testo
     */
    public function getEmbedding(string $text): array
    {
        // Cache per evitare chiamate ripetute
        $cacheKey = 'embedding:' . md5($text);

        return Cache::remember($cacheKey, 3600, function () use ($text) {
            $response = Http::timeout($this->timeout)
                ->post("{$this->serviceUrl}/embed", [
                    'text' => $text
                ]);

            if (!$response->successful()) {
                throw new \Exception('Embedding service failed: ' . $response->body());
            }

            return $response->json()['embedding'];
        });
    }

    /**
     * Calcola similarità tra una query e multipli testi
     *
     * @param string $query La ricerca dell'utente
     * @param array $texts Array di testi da confrontare
     * @return array Array di score di similarità (0-1)
     */
    public function search(string $query, array $texts): array
    {
        $response = Http::timeout($this->timeout)
            ->post("{$this->serviceUrl}/similarity", [
                'query' => $query,
                'texts' => $texts
            ]);

        if (!$response->successful()) {
            throw new \Exception('Similarity search failed: ' . $response->body());
        }

        return $response->json()['similarities'];
    }

    /**
     * Verifica se il servizio è disponibile
     */
    public function isAvailable(): bool
    {
        try {
            $response = Http::timeout(2)->get("{$this->serviceUrl}/health");
            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }
}
