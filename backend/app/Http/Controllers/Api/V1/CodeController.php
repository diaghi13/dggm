<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\CodeGeneratorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Code Generation Controller
 *
 * Generates progressive codes for various entities (quotes, products, suppliers, etc.)
 * Uses CodeGeneratorService for centralized code generation logic.
 */
class CodeController extends Controller
{
    public function __construct(
        private readonly CodeGeneratorService $codeGenerator
    ) {}

    /**
     * Generate next available code for entity
     *
     * GET /api/v1/codes/generate/{entity}
     * Query params:
     *   - year: Filter by year (optional)
     *   - date: Filter by date in Ymd format (optional)
     *
     * Supported entities: quote, product, supplier, worker, contractor, ddt, movement, site
     *
     * @param  string  $entity  Entity type
     */
    public function generate(Request $request, string $entity): JsonResponse
    {
        // Validate entity type
        $validEntities = ['quote', 'product', 'supplier', 'worker', 'contractor', 'ddt', 'movement', 'project'];

        if (! in_array($entity, $validEntities)) {
            return response()->json([
                'success' => false,
                'error' => [
                    'message' => 'Invalid entity type',
                    'code' => 'INVALID_ENTITY',
                    'details' => [
                        'valid_entities' => $validEntities,
                    ],
                ],
            ], 400);
        }

        // Build context from request
        $context = [];
        if ($request->has('year')) {
            $context['year'] = $request->input('year');
        }
        if ($request->has('date')) {
            $context['date'] = $request->input('date');
        }

        // Generate code
        $code = $this->codeGenerator->generate($entity, $context);

        return response()->json([
            'success' => true,
            'data' => [
                'entity' => $entity,
                'code' => $code,
                'context' => $context,
            ],
        ]);
    }
}
