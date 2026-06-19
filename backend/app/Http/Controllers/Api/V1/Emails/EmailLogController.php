<?php

namespace App\Http\Controllers\Api\V1\Emails;

use App\Data\EmailLogData;
use App\Http\Controllers\Controller;
use App\Models\EmailLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', \App\Models\EmailAccount::class);

        $logs = EmailLog::query()
            ->when($request->input('document_type'), fn ($q, $type) => $q->where('document_type', $type))
            ->when($request->input('document_id'), fn ($q, $id) => $q->where('document_id', $id))
            ->when($request->input('status'), fn ($q, $status) => $q->where('status', $status))
            ->with(['emailAccount', 'createdBy'])
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $logs->map(fn (EmailLog $log) => EmailLogData::fromModel($log)),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'total' => $logs->total(),
                'per_page' => $logs->perPage(),
                'last_page' => $logs->lastPage(),
            ],
        ]);
    }

    public function show(EmailLog $emailLog): JsonResponse
    {
        $this->authorize('viewAny', \App\Models\EmailAccount::class);

        return response()->json([
            'success' => true,
            'data' => EmailLogData::fromModel($emailLog),
        ]);
    }
}
