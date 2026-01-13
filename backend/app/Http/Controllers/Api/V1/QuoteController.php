<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreQuoteRequest;
use App\Http\Requests\UpdateQuoteRequest;
use App\Http\Resources\QuoteResource;
use App\Models\Quote;
use App\Services\PdfService;
use App\Services\QuoteService;
use Illuminate\Http\Request;

class QuoteController extends Controller
{
    public function __construct(
        private QuoteService $quoteService,
        private PdfService $pdfService
    ) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', Quote::class);

        $filters = [
            'status' => $request->input('status'),
            'customer_id' => $request->input('customer_id'),
            'is_active' => $request->has('is_active') ? $request->boolean('is_active') : null,
            'search' => $request->input('search'),
            'sort_by' => $request->input('sort_by'),
            'sort_order' => $request->input('sort_order'),
        ];

        $perPage = min($request->integer('per_page', 15), 100);
        $quotes = $this->quoteService->getAll($filters, $perPage);

        return QuoteResource::collection($quotes);
    }

    public function store(StoreQuoteRequest $request)
    {
        $this->authorize('create', Quote::class);

        $quote = $this->quoteService->create($request->validated());

        return new QuoteResource($quote);
    }

    public function show(Quote $quote)
    {
        $this->authorize('view', $quote);

        $quote->load(['customer', 'projectManager', 'items.children', 'template', 'site']);

        return new QuoteResource($quote);
    }

    public function update(UpdateQuoteRequest $request, Quote $quote)
    {
        $this->authorize('update', $quote);

        $quote = $this->quoteService->update($quote, $request->validated());

        return new QuoteResource($quote);
    }

    public function destroy(Quote $quote)
    {
        $this->authorize('delete', $quote);

        $this->quoteService->delete($quote);

        return response()->json(['message' => 'Quote deleted successfully']);
    }

    public function downloadPdf(Quote $quote)
    {
        $this->authorize('view', $quote);

        return $this->pdfService->downloadQuotePdf($quote);
    }

    public function previewPdf(Quote $quote)
    {
        $this->authorize('view', $quote);

        return $this->pdfService->streamQuotePdf($quote);
    }

    public function changeStatus(Request $request, Quote $quote)
    {
        $this->authorize('update', $quote);

        $request->validate([
            'status' => 'required|string|in:draft,sent,approved,rejected,expired',
        ]);

        try {
            $quote = $this->quoteService->changeStatus($quote, $request->input('status'));

            return response()->json([
                'success' => true,
                'message' => 'Quote status updated successfully',
                'data' => new QuoteResource($quote->load(['customer', 'projectManager', 'items.children', 'template', 'site'])),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
