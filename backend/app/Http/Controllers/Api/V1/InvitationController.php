<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\WorkerInvitation;
use App\Services\InvitationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvitationController extends Controller
{
    public function __construct(
        private readonly InvitationService $invitationService
    ) {}

    /**
     * Get all invitations (PM/Admin only)
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', WorkerInvitation::class);

        $filters = $request->only(['status', 'email', 'supplier_id']);
        $invitations = $this->invitationService->getAllInvitations($filters);

        return response()->json([
            'success' => true,
            'data' => $invitations,
        ]);
    }

    /**
     * Create and send a new invitation
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', WorkerInvitation::class);

        $validated = $request->validate([
            'email' => 'required|email|unique:users,email|unique:worker_invitations,email,NULL,id,accepted_at,NULL',
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'phone' => 'nullable|string|max:20',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'worker_type' => 'nullable|string',
            'contract_type' => 'nullable|string',
            'job_title' => 'nullable|string|max:100',
            'metadata' => 'nullable|array',
            'expires_in_days' => 'nullable|integer|min:1|max:30',
        ]);

        $invitation = $this->invitationService->createInvitation($validated, auth()->id());

        return response()->json([
            'success' => true,
            'message' => 'Invitation sent successfully',
            'data' => $invitation,
        ], 201);
    }

    /**
     * Get invitation by token (public endpoint for accept page)
     */
    public function showByToken(string $token): JsonResponse
    {
        $invitation = $this->invitationService->getByToken($token);

        if (! $invitation) {
            return response()->json([
                'success' => false,
                'message' => 'Invitation not found',
            ], 404);
        }

        if ($invitation->isExpired()) {
            return response()->json([
                'success' => false,
                'message' => 'This invitation has expired',
                'data' => ['invitation' => $invitation],
            ], 410);
        }

        if ($invitation->isAccepted()) {
            return response()->json([
                'success' => false,
                'message' => 'This invitation has already been accepted',
            ], 410);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'invitation' => $invitation,
            ],
        ]);
    }

    /**
     * Accept invitation and create account (public endpoint)
     */
    public function accept(Request $request, string $token): JsonResponse
    {
        $invitation = $this->invitationService->getByToken($token);

        if (! $invitation) {
            return response()->json([
                'success' => false,
                'message' => 'Invitation not found',
            ], 404);
        }

        $validated = $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        try {
            $result = $this->invitationService->acceptInvitation($invitation, $validated);

            $token = $result['user']->createToken('auth-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Account created successfully',
                'data' => [
                    'user' => $result['user'],
                    'worker' => $result['worker'],
                    'token' => $token,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Resend an invitation
     */
    public function resend(WorkerInvitation $invitation): JsonResponse
    {
        $this->authorize('update', $invitation);

        try {
            $invitation = $this->invitationService->resendInvitation($invitation);

            return response()->json([
                'success' => true,
                'message' => 'Invitation resent successfully',
                'data' => $invitation,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Cancel an invitation
     */
    public function destroy(WorkerInvitation $invitation): JsonResponse
    {
        $this->authorize('delete', $invitation);

        try {
            $this->invitationService->cancelInvitation($invitation);

            return response()->json([
                'success' => true,
                'message' => 'Invitation cancelled successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get pending invitations
     */
    public function pending(): JsonResponse
    {
        $this->authorize('viewAny', WorkerInvitation::class);

        $invitations = $this->invitationService->getPendingInvitations();

        return response()->json([
            'success' => true,
            'data' => $invitations,
        ]);
    }
}
