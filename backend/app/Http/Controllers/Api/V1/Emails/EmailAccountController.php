<?php

namespace App\Http\Controllers\Api\V1\Emails;

use App\Actions\EmailAccount\CreateEmailAccountAction;
use App\Actions\EmailAccount\DeleteEmailAccountAction;
use App\Actions\EmailAccount\TestEmailAccountAction;
use App\Actions\EmailAccount\UpdateEmailAccountAction;
use App\Data\EmailAccountData;
use App\Http\Controllers\Controller;
use App\Models\EmailAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailAccountController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', EmailAccount::class);

        $accounts = EmailAccount::orderBy('is_default', 'desc')
            ->orderBy('name')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $accounts->map(fn (EmailAccount $account) => EmailAccountData::fromModel($account)),
            'meta' => [
                'current_page' => $accounts->currentPage(),
                'total' => $accounts->total(),
                'per_page' => $accounts->perPage(),
                'last_page' => $accounts->lastPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', EmailAccount::class);

        $account = app(CreateEmailAccountAction::class)->execute(
            EmailAccountData::from($request)
        );

        return response()->json([
            'success' => true,
            'data' => EmailAccountData::fromModel($account),
            'message' => 'Account email creato con successo.',
        ], 201);
    }

    public function show(EmailAccount $emailAccount): JsonResponse
    {
        $this->authorize('view', $emailAccount);

        return response()->json([
            'success' => true,
            'data' => EmailAccountData::fromModel($emailAccount),
        ]);
    }

    public function update(Request $request, EmailAccount $emailAccount): JsonResponse
    {
        $this->authorize('update', $emailAccount);

        $account = app(UpdateEmailAccountAction::class)->execute(
            $emailAccount,
            EmailAccountData::from($request)
        );

        return response()->json([
            'success' => true,
            'data' => EmailAccountData::fromModel($account),
            'message' => 'Account email aggiornato con successo.',
        ]);
    }

    public function destroy(EmailAccount $emailAccount): JsonResponse
    {
        $this->authorize('delete', $emailAccount);

        app(DeleteEmailAccountAction::class)->execute($emailAccount);

        return response()->json([
            'success' => true,
            'message' => 'Account email eliminato con successo.',
        ]);
    }

    public function test(EmailAccount $emailAccount): JsonResponse
    {
        $this->authorize('update', $emailAccount);

        $result = app(TestEmailAccountAction::class)->execute($emailAccount);

        return response()->json([
            'success' => $result['success'],
            'message' => $result['message'],
        ], $result['success'] ? 200 : 422);
    }

    public function setDefault(EmailAccount $emailAccount): JsonResponse
    {
        $this->authorize('update', $emailAccount);

        \Illuminate\Support\Facades\DB::transaction(function () use ($emailAccount) {
            EmailAccount::query()->where('id', '!=', $emailAccount->id)->update(['is_default' => false]);
            $emailAccount->update(['is_default' => true]);
        });

        return response()->json([
            'success' => true,
            'data' => EmailAccountData::fromModel($emailAccount->fresh()),
            'message' => 'Account impostato come predefinito.',
        ]);
    }
}
