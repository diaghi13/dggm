<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Quote\ApproveQuoteAction;
use App\Actions\Quote\ConvertQuoteToProjectAction;
use App\Actions\Quote\CreateQuoteAction;
use App\Actions\Quote\CreateQuoteRevisionAction;
use App\Actions\Quote\DeleteQuoteAction;
use App\Actions\Quote\DuplicateQuoteAction;
use App\Actions\Quote\RejectQuoteAction;
use App\Actions\Quote\RestoreQuoteAction;
use App\Actions\Quote\SaveQuotePdfAction;
use App\Actions\Quote\SendQuoteAction;
use App\Actions\Quote\UpdateQuoteAction;
use App\Data\QuoteData;
use App\Enums\DocumentType;
use App\Http\Controllers\Controller;
use App\Models\Quote;
use App\Queries\Quote\GetQuoteByIdQuery;
use App\Queries\Quote\GetQuoteRevisionsQuery;
use App\Queries\Quote\GetQuotesQuery;
use App\Services\TenantMailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;
use Spatie\LaravelData\PaginatedDataCollection;

class QuoteController extends Controller
{
    public function __construct(
        private readonly CreateQuoteAction $createAction,
        private readonly UpdateQuoteAction $updateAction,
        private readonly DeleteQuoteAction $deleteAction,
        private readonly ApproveQuoteAction $approveAction,
        private readonly RejectQuoteAction $rejectAction,
        private readonly SendQuoteAction $sendAction,
        private readonly ConvertQuoteToProjectAction $convertAction,
        private readonly SaveQuotePdfAction $savePdfAction,
        private readonly DuplicateQuoteAction $duplicateAction,
        private readonly RestoreQuoteAction $restoreAction,
        private readonly CreateQuoteRevisionAction $revisionAction
    ) {}

    /**
     * Display a listing of quotes
     *
     * @OA\Get(
     *     path="/quotes",
     *     operationId="getQuotes",
     *     tags={"Quotes"},
     *     summary="List all quotes",
     *     description="Retrieve a paginated list of quotes with optional filters",
     *     security={{"sanctum":{}}},
     *
     *     @OA\Parameter(
     *         name="status",
     *         in="query",
     *         description="Filter by status",
     *         required=false,
     *
     *         @OA\Schema(type="string", enum={"draft","sent","approved","rejected","expired","converted"})
     *     ),
     *
     *     @OA\Parameter(
     *         name="customer_id",
     *         in="query",
     *         description="Filter by customer ID",
     *         required=false,
     *
     *         @OA\Schema(type="integer")
     *     ),
     *
     *     @OA\Parameter(
     *         name="project_manager_id",
     *         in="query",
     *         description="Filter by project manager user ID",
     *         required=false,
     *
     *         @OA\Schema(type="integer")
     *     ),
     *
     *     @OA\Parameter(
     *         name="is_active",
     *         in="query",
     *         description="Filter by active status",
     *         required=false,
     *
     *         @OA\Schema(type="boolean")
     *     ),
     *
     *     @OA\Parameter(
     *         name="search",
     *         in="query",
     *         description="Search by code or title",
     *         required=false,
     *
     *         @OA\Schema(type="string")
     *     ),
     *
     *     @OA\Parameter(
     *         name="from_date",
     *         in="query",
     *         description="Filter quotes from this date (issue_date)",
     *         required=false,
     *
     *         @OA\Schema(type="string", format="date")
     *     ),
     *
     *     @OA\Parameter(
     *         name="to_date",
     *         in="query",
     *         description="Filter quotes to this date (issue_date)",
     *         required=false,
     *
     *         @OA\Schema(type="string", format="date")
     *     ),
     *
     *     @OA\Parameter(
     *         name="sort_by",
     *         in="query",
     *         description="Sort by field",
     *         required=false,
     *
     *         @OA\Schema(type="string", enum={"code","title","issue_date","total_amount","created_at"}, default="created_at")
     *     ),
     *
     *     @OA\Parameter(
     *         name="sort_order",
     *         in="query",
     *         description="Sort order",
     *         required=false,
     *
     *         @OA\Schema(type="string", enum={"asc","desc"}, default="desc")
     *     ),
     *
     *     @OA\Parameter(
     *         name="per_page",
     *         in="query",
     *         description="Items per page (max 100)",
     *         required=false,
     *
     *         @OA\Schema(type="integer", default=15, maximum=100)
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Successful operation",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *
     *                 @OA\Items(ref="#/components/schemas/Quote")
     *             ),
     *
     *             @OA\Property(
     *                 property="meta",
     *                 ref="#/components/schemas/PaginationMeta"
     *             )
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=401,
     *         description="Unauthenticated",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *
     *     @OA\Response(
     *         response=403,
     *         description="Forbidden - Insufficient permissions",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Quote::class);

        $filters = $request->only([
            'status',
            'customer_id',
            'project_manager_id',
            'is_active',
            'search',
            'sort_by',
            'sort_order',
            'from_date',
            'to_date',
        ]);

        $perPage = min($request->input('per_page', 15), 100);

        $quotes = GetQuotesQuery::execute($filters, $perPage);

        // Convert paginated items to DTOs while preserving pagination meta
        return response()->json([
            'success' => true,
            ...QuoteData::collect($quotes, PaginatedDataCollection::class)->include('customer')->toArray(),
        ]);
    }

    /**
     * Store a newly created quote
     *
     * @OA\Post(
     *     path="/quotes",
     *     operationId="createQuote",
     *     tags={"Quotes"},
     *     summary="Create a new quote",
     *     description="Create a new quote with the provided data",
     *     security={{"sanctum":{}}},
     *
     *     @OA\RequestBody(
     *         required=true,
     *         description="Quote data",
     *
     *         @OA\JsonContent(ref="#/components/schemas/QuoteInput")
     *     ),
     *
     *     @OA\Response(
     *         response=201,
     *         description="Quote created successfully",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", ref="#/components/schemas/Quote"),
     *             @OA\Property(property="message", type="string", example="Preventivo creato con successo")
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=401,
     *         description="Unauthenticated",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *
     *     @OA\Response(
     *         response=403,
     *         description="Forbidden - Insufficient permissions",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
     */
    public function store(QuoteData $data): JsonResponse
    {
        $this->authorize('create', Quote::class);

        $quote = $this->createAction->execute($data);

        // Reload with all relationships using Query
        $quote = GetQuoteByIdQuery::execute($quote->id);

        return response()->json([
            'success' => true,
            'data' => QuoteData::from($quote)->include('items', 'items.children', 'deposits'),
            'message' => 'Preventivo creato con successo',
        ], 201);
    }

    /**
     * Display the specified quote
     *
     * @OA\Get(
     *     path="/quotes/{id}",
     *     operationId="getQuoteById",
     *     tags={"Quotes"},
     *     summary="Get a specific quote",
     *     description="Retrieve a single quote by ID with all related data (customer, items, etc.)",
     *     security={{"sanctum":{}}},
     *
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Quote ID",
     *         required=true,
     *
     *         @OA\Schema(type="integer")
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Successful operation",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", ref="#/components/schemas/Quote")
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=401,
     *         description="Unauthenticated",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *
     *     @OA\Response(
     *         response=403,
     *         description="Forbidden - Insufficient permissions",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *
     *     @OA\Response(
     *         response=404,
     *         description="Quote not found",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
     */
    public function show(Quote $quote): JsonResponse
    {
        $this->authorize('view', $quote);

        $quote = GetQuoteByIdQuery::execute($quote->id);

        $attachments = $quote->getMedia('attachments')->map(fn ($m) => [
            'id' => $m->id,
            'filename' => $m->file_name,
            'original_filename' => $m->file_name,
            'mime_type' => $m->mime_type,
            'file_size' => $m->size,
            'file_size_human' => $m->human_readable_size,
            'url' => $m->getUrl(),
            'type' => $m->getCustomProperty('type', 'document'),
            'description' => $m->getCustomProperty('description'),
            'sort_order' => $m->order_column ?? 0,
        ])->values();

        return response()->json([
            'success' => true,
            'data' => array_merge(
                QuoteData::from($quote)->include('items', 'items.children', 'deposits')->toArray(),
                ['attachments' => $attachments]
            ),
        ]);
    }

    /**
     * Update the specified quote
     *
     * @OA\Put(
     *     path="/quotes/{id}",
     *     operationId="updateQuote",
     *     tags={"Quotes"},
     *     summary="Update a quote",
     *     description="Update an existing quote with the provided data",
     *     security={{"sanctum":{}}},
     *
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Quote ID",
     *         required=true,
     *
     *         @OA\Schema(type="integer")
     *     ),
     *
     *     @OA\RequestBody(
     *         required=true,
     *         description="Quote data to update",
     *
     *         @OA\JsonContent(ref="#/components/schemas/QuoteInput")
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Quote updated successfully",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", ref="#/components/schemas/Quote"),
     *             @OA\Property(property="message", type="string", example="Preventivo aggiornato con successo")
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=401,
     *         description="Unauthenticated",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *
     *     @OA\Response(
     *         response=403,
     *         description="Forbidden - Insufficient permissions",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *
     *     @OA\Response(
     *         response=404,
     *         description="Quote not found",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
     */
    public function update(Request $request, Quote $quote): JsonResponse
    {
        $this->authorize('update', $quote);

        // Merge request data with existing quote data for partial updates
        $mergedData = array_merge(
            $quote->toArray(),
            $request->all(),
            ['id' => $quote->id] // Ensure ID is set for validation context
        );

        $data = QuoteData::validateAndCreate($mergedData);

        $quote = $this->updateAction->execute($quote, $data);

        // Reload with all relationships using Query
        $quote = GetQuoteByIdQuery::execute($quote->id);

        return response()->json([
            'success' => true,
            'data' => QuoteData::from($quote)->include('items', 'items.children', 'deposits'),
            'message' => 'Preventivo aggiornato con successo',
        ]);
    }

    /**
     * Remove the specified quote
     *
     * @OA\Delete(
     *     path="/quotes/{id}",
     *     operationId="deleteQuote",
     *     tags={"Quotes"},
     *     summary="Delete a quote",
     *     description="Soft delete a quote (can be restored later)",
     *     security={{"sanctum":{}}},
     *
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Quote ID",
     *         required=true,
     *
     *         @OA\Schema(type="integer")
     *     ),
     *
     *     @OA\Response(
     *         response=204,
     *         description="Quote deleted successfully"
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Unauthenticated",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *
     *     @OA\Response(
     *         response=403,
     *         description="Forbidden - Insufficient permissions",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *
     *     @OA\Response(
     *         response=404,
     *         description="Quote not found",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
     */
    public function destroy(Quote $quote): JsonResponse
    {
        $this->authorize('delete', $quote);

        try {
            $this->deleteAction->execute($quote);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Preventivo eliminato con successo',
        ], 204);
    }

    /**
     * Change quote status (generic status change endpoint)
     *
     * @OA\Post(
     *     path="/quotes/{id}/change-status",
     *     operationId="changeQuoteStatus",
     *     tags={"Quotes"},
     *     summary="Change quote status",
     *     description="Change quote status to sent, approved, or rejected",
     *     security={{"sanctum":{}}},
     *
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Quote ID",
     *         required=true,
     *
     *         @OA\Schema(type="integer")
     *     ),
     *
     *     @OA\RequestBody(
     *         required=true,
     *
     *         @OA\JsonContent(
     *             required={"status"},
     *
     *             @OA\Property(
     *                 property="status",
     *                 type="string",
     *                 enum={"draft","sent","approved","rejected","expired","converted"},
     *                 example="sent",
     *                 description="New status"
     *             )
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Status changed successfully",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", ref="#/components/schemas/Quote"),
     *             @OA\Property(property="message", type="string", example="Stato preventivo aggiornato a 'sent'")
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=400,
     *         description="Bad request - Invalid status transition",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *
     *     @OA\Response(
     *         response=401,
     *         description="Unauthenticated",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *
     *     @OA\Response(
     *         response=403,
     *         description="Forbidden - Insufficient permissions",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *
     *     @OA\Response(
     *         response=404,
     *         description="Quote not found",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
     */
    public function changeStatus(Request $request, Quote $quote): JsonResponse
    {
        $request->validate([
            'status' => 'required|string|in:draft,sent,approved,rejected,expired,converted',
        ]);

        $newStatus = $request->input('status');

        // Authorization is status-specific: restore uses 'restore', all others use 'update'
        if ($newStatus === 'draft') {
            $this->authorize('restore', $quote);
        } else {
            $this->authorize('update', $quote);
        }

        // Delegate to specific actions based on status
        $quote = match ($newStatus) {
            'draft' => $this->restoreAction->execute($quote),
            'sent' => $this->sendAction->execute($quote),
            'approved' => $this->approveAction->execute($quote),
            'rejected' => $this->rejectAction->execute($quote),
            default => throw new \InvalidArgumentException("Status change to '{$newStatus}' not supported via this endpoint"),
        };

        // Reload with all relationships using Query
        $quote = GetQuoteByIdQuery::execute($quote->id);

        return response()->json([
            'success' => true,
            'data' => QuoteData::from($quote)->include('items', 'items.children'),
            'message' => "Stato preventivo aggiornato a '{$newStatus}'",
        ]);
    }

    /**
     * Duplicate a quote
     */
    public function duplicate(Quote $quote): JsonResponse
    {
        $this->authorize('create', Quote::class);

        $newQuote = $this->duplicateAction->execute($quote);

        return response()->json([
            'success' => true,
            'data' => QuoteData::from($newQuote)->include('items', 'items.children'),
            'message' => 'Preventivo duplicato con successo',
        ], 201);
    }

    public function revise(Request $request, Quote $quote): JsonResponse
    {
        $this->authorize('create', Quote::class);

        $request->validate([
            'revision_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $newRevision = $this->revisionAction->execute($quote, $request->input('revision_notes'));

        return response()->json([
            'success' => true,
            'data' => QuoteData::from($newRevision)->include('items', 'items.children'),
            'message' => 'Revisione creata con successo',
        ], 201);
    }

    public function revisions(Quote $quote): JsonResponse
    {
        $this->authorize('view', $quote);

        $revisions = GetQuoteRevisionsQuery::execute($quote);

        return response()->json([
            'success' => true,
            'data' => $revisions,
        ]);
    }

    /**
     * Approve the quote
     *
     * @OA\Post(
     *     path="/quotes/{id}/approve",
     *     operationId="approveQuote",
     *     tags={"Quotes"},
     *     summary="Approve a quote",
     *     description="Mark quote as approved and set approval date",
     *     security={{"sanctum":{}}},
     *
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Quote ID",
     *         required=true,
     *
     *         @OA\Schema(type="integer")
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Quote approved successfully",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", ref="#/components/schemas/Quote"),
     *             @OA\Property(property="message", type="string", example="Preventivo approvato con successo")
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=401,
     *         description="Unauthenticated",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *
     *     @OA\Response(
     *         response=403,
     *         description="Forbidden - Insufficient permissions",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *
     *     @OA\Response(
     *         response=404,
     *         description="Quote not found",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
     */
    public function approve(Quote $quote): JsonResponse
    {
        $this->authorize('approve', $quote);

        $quote = $this->approveAction->execute($quote);

        // Reload with all relationships using Query
        $quote = GetQuoteByIdQuery::execute($quote->id);

        return response()->json([
            'success' => true,
            'data' => QuoteData::from($quote)->include('items', 'items.children'),
            'message' => 'Preventivo approvato con successo',
        ]);
    }

    /**
     * Reject the quote
     *
     * @OA\Post(
     *     path="/quotes/{id}/reject",
     *     operationId="rejectQuote",
     *     tags={"Quotes"},
     *     summary="Reject a quote",
     *     description="Mark quote as rejected",
     *     security={{"sanctum":{}}},
     *
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Quote ID",
     *         required=true,
     *
     *         @OA\Schema(type="integer")
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Quote rejected successfully",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", ref="#/components/schemas/Quote"),
     *             @OA\Property(property="message", type="string", example="Preventivo rifiutato")
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=401,
     *         description="Unauthenticated",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *
     *     @OA\Response(
     *         response=403,
     *         description="Forbidden - Insufficient permissions",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *
     *     @OA\Response(
     *         response=404,
     *         description="Quote not found",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
     */
    public function reject(Quote $quote): JsonResponse
    {
        $this->authorize('reject', $quote);

        $quote = $this->rejectAction->execute($quote);

        // Reload with all relationships using Query
        $quote = GetQuoteByIdQuery::execute($quote->id);

        return response()->json([
            'success' => true,
            'data' => QuoteData::from($quote)->include('items', 'items.children'),
            'message' => 'Preventivo rifiutato',
        ]);
    }

    /**
     * Send quote to customer
     *
     * @OA\Post(
     *     path="/quotes/{id}/send",
     *     operationId="sendQuote",
     *     tags={"Quotes"},
     *     summary="Send quote to customer",
     *     description="Mark quote as sent and set sent_date timestamp",
     *     security={{"sanctum":{}}},
     *
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Quote ID",
     *         required=true,
     *
     *         @OA\Schema(type="integer")
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Quote sent successfully",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="data", ref="#/components/schemas/Quote"),
     *             @OA\Property(property="message", type="string", example="Preventivo inviato al cliente")
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=401,
     *         description="Unauthenticated",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *
     *     @OA\Response(
     *         response=403,
     *         description="Forbidden - Insufficient permissions",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *
     *     @OA\Response(
     *         response=404,
     *         description="Quote not found",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
     */
    public function send(Quote $quote): JsonResponse
    {
        $this->authorize('send', $quote);

        $quote = $this->sendAction->execute($quote);

        // Reload with all relationships using Query
        $quote = GetQuoteByIdQuery::execute($quote->id);

        // Check if email will actually be delivered
        $warning = null;
        if (empty($quote->customer?->email)) {
            $warning = 'Il cliente non ha un indirizzo email — il preventivo non verrà inviato per email.';
        } else {
            $emailAccount = app(TenantMailService::class)
                ->resolveAccountForDocumentType(DocumentType::Quote);
            if (! $emailAccount) {
                $warning = 'Nessun account email configurato per i preventivi — il cliente non riceverà la mail. Configura un account email nelle impostazioni.';
            }
        }

        return response()->json([
            'success' => true,
            'data' => QuoteData::from($quote)->include('items', 'items.children'),
            'message' => 'Preventivo inviato al cliente',
            'warning' => $warning,
        ]);
    }

    /**
     * Mark quote as sent without sending email
     */
    public function markAsSent(Quote $quote): JsonResponse
    {
        $this->authorize('update', $quote);

        if ($quote->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Solo i preventivi in bozza possono essere segnati come inviati.',
            ], 422);
        }

        $quote->update([
            'status' => 'sent',
            'sent_date' => now()->toDateString(),
        ]);

        $quote = GetQuoteByIdQuery::execute($quote->id);

        return response()->json([
            'success' => true,
            'data' => QuoteData::from($quote)->include('items', 'items.children'),
            'message' => 'Preventivo segnato come inviato.',
        ]);
    }

    /**
     * Convert quote to site
     *
     * @OA\Post(
     *     path="/quotes/{id}/convert-to-site",
     *     operationId="convertQuoteToSite",
     *     tags={"Quotes"},
     *     summary="Convert approved quote to construction site",
     *     description="Create a new construction site from an approved quote. Quote must be in 'approved' status.",
     *     security={{"sanctum":{}}},
     *
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Quote ID",
     *         required=true,
     *
     *         @OA\Schema(type="integer")
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="Quote converted successfully",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="quote", ref="#/components/schemas/Quote"),
     *                 @OA\Property(property="project_id", type="integer", example=42, description="ID of the newly created project")
     *             ),
     *             @OA\Property(property="message", type="string", example="Preventivo convertito in cantiere con successo")
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=400,
     *         description="Bad request - Quote must be approved before conversion",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Il preventivo deve essere approvato prima della conversione")
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=401,
     *         description="Unauthenticated",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *
     *     @OA\Response(
     *         response=403,
     *         description="Forbidden - Insufficient permissions",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *
     *     @OA\Response(
     *         response=404,
     *         description="Quote not found",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
     */
    public function convertToProject(Quote $quote): JsonResponse
    {
        $this->authorize('convertToProject', $quote);

        $project = $this->convertAction->execute($quote);

        if (! $project) {
            return response()->json([
                'success' => false,
                'message' => 'Il preventivo deve essere approvato prima della conversione',
            ], 400);
        }

        // Reload with all relationships using Query
        $quote = GetQuoteByIdQuery::execute($quote->id);

        return response()->json([
            'success' => true,
            'data' => [
                'quote' => QuoteData::from($quote)->include('items', 'items.children'),
                'project_id' => $project->id,
            ],
            'message' => 'Preventivo convertito in progetto con successo',
        ]);
    }

    /**
     * Generate and save PDF
     *
     * @OA\Post(
     *     path="/quotes/{id}/save-pdf",
     *     operationId="saveQuotePdf",
     *     tags={"Quotes"},
     *     summary="Generate and save quote PDF",
     *     description="Generate PDF for quote and save it to media library",
     *     security={{"sanctum":{}}},
     *
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Quote ID",
     *         required=true,
     *
     *         @OA\Schema(type="integer")
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="PDF generated successfully",
     *
     *         @OA\JsonContent(
     *
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="pdf_url", type="string", example="http://localhost:8000/storage/1/quote-Q-2026-0001.pdf"),
     *                 @OA\Property(property="file_name", type="string", example="quote-Q-2026-0001.pdf")
     *             ),
     *             @OA\Property(property="message", type="string", example="PDF generato con successo")
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=401,
     *         description="Unauthenticated",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *
     *     @OA\Response(
     *         response=403,
     *         description="Forbidden - Insufficient permissions",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *
     *     @OA\Response(
     *         response=404,
     *         description="Quote not found",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
     */
    public function savePdf(Quote $quote): JsonResponse
    {
        $this->authorize('generatePdf', $quote);

        $media = $this->savePdfAction->execute($quote);

        return response()->json([
            'success' => true,
            'data' => [
                'pdf_url' => $media->getUrl(),
                'file_name' => $media->file_name,
            ],
            'message' => 'PDF generato con successo',
        ]);
    }

    /**
     * Download PDF (stream response)
     *
     * @OA\Get(
     *     path="/quotes/{id}/pdf/download",
     *     operationId="downloadQuotePdf",
     *     tags={"Quotes"},
     *     summary="Download quote PDF",
     *     description="Download quote PDF as file attachment",
     *     security={{"sanctum":{}}},
     *
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Quote ID",
     *         required=true,
     *
     *         @OA\Schema(type="integer")
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="PDF file download",
     *
     *         @OA\MediaType(
     *             mediaType="application/pdf",
     *
     *             @OA\Schema(
     *                 type="string",
     *                 format="binary"
     *             )
     *         ),
     *
     *         @OA\Header(
     *             header="Content-Disposition",
     *             description="Attachment filename",
     *
     *             @OA\Schema(type="string", example="attachment; filename=quote-Q-2026-0001.pdf")
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=401,
     *         description="Unauthenticated",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *
     *     @OA\Response(
     *         response=403,
     *         description="Forbidden - Insufficient permissions",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *
     *     @OA\Response(
     *         response=404,
     *         description="Quote not found",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
     */
    public function downloadPdf(Quote $quote): \Illuminate\Http\Response
    {
        $this->authorize('generatePdf', $quote);

        // Uses existing PdfService method
        return app(\App\Services\PdfService::class)->downloadQuotePdf($quote);
    }

    /**
     * Preview PDF (stream response)
     *
     * @OA\Get(
     *     path="/quotes/{id}/pdf/preview",
     *     operationId="previewQuotePdf",
     *     tags={"Quotes"},
     *     summary="Preview quote PDF",
     *     description="Stream quote PDF for inline preview in browser",
     *     security={{"sanctum":{}}},
     *
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Quote ID",
     *         required=true,
     *
     *         @OA\Schema(type="integer")
     *     ),
     *
     *     @OA\Response(
     *         response=200,
     *         description="PDF file stream",
     *
     *         @OA\MediaType(
     *             mediaType="application/pdf",
     *
     *             @OA\Schema(
     *                 type="string",
     *                 format="binary"
     *             )
     *         ),
     *
     *         @OA\Header(
     *             header="Content-Disposition",
     *             description="Inline display",
     *
     *             @OA\Schema(type="string", example="inline; filename=quote-Q-2026-0001.pdf")
     *         )
     *     ),
     *
     *     @OA\Response(
     *         response=401,
     *         description="Unauthenticated",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *
     *     @OA\Response(
     *         response=403,
     *         description="Forbidden - Insufficient permissions",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     ),
     *
     *     @OA\Response(
     *         response=404,
     *         description="Quote not found",
     *
     *         @OA\JsonContent(ref="#/components/schemas/ErrorResponse")
     *     )
     * )
     */
    public function previewPdf(Quote $quote): \Illuminate\Http\Response
    {
        $this->authorize('generatePdf', $quote);

        // Uses existing PdfService method
        return app(\App\Services\PdfService::class)->streamQuotePdf($quote);
    }

    public function refreshTerms(Quote $quote): JsonResponse
    {
        $this->authorize('update', $quote);

        $resolved = app(\App\Services\QuoteTermsService::class)->refreshForQuote($quote);

        return response()->json([
            'success' => true,
            'data' => ['terms_and_conditions' => $resolved],
        ]);
    }
}
