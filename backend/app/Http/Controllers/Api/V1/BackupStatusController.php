<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Jobs\RunBackupJob;
use App\Queries\Backup\GetBackupStatusQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BackupStatusController extends Controller
{
    public function status(): JsonResponse
    {
        $data = app(GetBackupStatusQuery::class)->execute();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function runBackup(Request $request): JsonResponse
    {
        $type = $request->input('type', 'all');

        abort_unless(
            in_array($type, ['central', 'tenants', 'all'], true),
            422,
            'Invalid backup type. Allowed: central, tenants, all.'
        );

        dispatch(new RunBackupJob($type));

        return response()->json([
            'success' => true,
            'message' => 'Backup avviato in background.',
        ], 202);
    }
}
