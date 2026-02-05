<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\PaymentTermData;
use App\Http\Controllers\Controller;
use App\Models\PaymentTerm;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentTermController extends Controller
{
    /**
     * Display a listing of payment terms
     */
    public function index(Request $request): JsonResponse
    {
        $query = PaymentTerm::query();

        // Filter by active status
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Filter by payment type
        if ($request->filled('payment_type')) {
            $query->where('payment_type', $request->input('payment_type'));
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        // Sort by sort_order and name by default
        $query->orderBy('sort_order')->orderBy('name');

        $perPage = min($request->input('per_page', 50), 100);
        $terms = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            ...PaymentTermData::collect($terms, \Spatie\LaravelData\PaginatedDataCollection::class)->toArray(),
        ]);
    }

    /**
     * Store a newly created payment term
     */
    public function store(PaymentTermData $data): JsonResponse
    {
        $term = PaymentTerm::create($data->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Payment term created successfully',
            'data' => PaymentTermData::from($term),
        ], 201);
    }

    /**
     * Display the specified payment term
     */
    public function show(PaymentTerm $paymentTerm): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => PaymentTermData::from($paymentTerm),
        ]);
    }

    /**
     * Update the specified payment term
     */
    public function update(PaymentTermData $data, PaymentTerm $paymentTerm): JsonResponse
    {
        $paymentTerm->update($data->toArray());

        return response()->json([
            'success' => true,
            'message' => 'Payment term updated successfully',
            'data' => PaymentTermData::from($paymentTerm->fresh()),
        ]);
    }

    /**
     * Remove the specified payment term
     */
    public function destroy(PaymentTerm $paymentTerm): JsonResponse
    {
        $paymentTerm->delete();

        return response()->json([
            'success' => true,
            'message' => 'Payment term deleted successfully',
        ]);
    }
}
