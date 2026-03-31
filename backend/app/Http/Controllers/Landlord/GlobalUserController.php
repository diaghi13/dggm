<?php

declare(strict_types=1);

namespace App\Http\Controllers\Landlord;

use App\Data\Landlord\GlobalUserData;
use App\Http\Controllers\Controller;
use App\Models\Landlord\GlobalUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GlobalUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = GlobalUser::query()
            ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%")
                ->orWhere('email', 'like', "%{$s}%"))
            ->orderBy('name')
            ->paginate((int) $request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => GlobalUserData::collect($users->items()),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
                'from' => $users->firstItem(),
                'to' => $users->lastItem(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $user = GlobalUser::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => GlobalUserData::fromModel($user),
        ]);
    }
}
