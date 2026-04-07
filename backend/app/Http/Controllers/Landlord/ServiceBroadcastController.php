<?php

declare(strict_types=1);

namespace App\Http\Controllers\Landlord;

use App\Http\Controllers\Controller;
use App\Jobs\DispatchServiceBroadcastJob;
use App\Models\Landlord\ServiceBroadcast;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceBroadcastController extends Controller
{
    public function index(): JsonResponse
    {
        $broadcasts = ServiceBroadcast::query()
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $broadcasts->items(),
            'meta' => [
                'current_page' => $broadcasts->currentPage(),
                'per_page' => $broadcasts->perPage(),
                'total' => $broadcasts->total(),
                'last_page' => $broadcasts->lastPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:2000'],
            'type' => ['required', 'string', 'in:info,success,warning,announcement'],
            'target_roles' => ['nullable', 'array'],
            'target_roles.*' => ['string'],
        ]);

        $broadcast = ServiceBroadcast::create([
            ...$validated,
            'created_by_global_user_id' => auth('global')->id(),
        ]);

        DispatchServiceBroadcastJob::dispatch($broadcast);

        return response()->json([
            'success' => true,
            'data' => $broadcast->toArray(),
        ], 201);
    }

    public function show(ServiceBroadcast $broadcast): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $broadcast->toArray(),
        ]);
    }
}
