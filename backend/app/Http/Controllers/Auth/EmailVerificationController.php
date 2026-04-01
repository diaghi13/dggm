<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Landlord\GlobalUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailVerificationController extends Controller
{
    /**
     * Mark the authenticated GlobalUser's email address as verified.
     *
     * GET /api/v1/auth/email/verify/{id}/{hash}
     */
    public function verify(Request $request, string $id, string $hash): JsonResponse
    {
        $expires = (int) $request->query('expires', 0);
        $signature = (string) $request->query('signature', '');

        // Check expiration
        if ($expires < time()) {
            return response()->json([
                'success' => false,
                'message' => 'Il link di verifica è scaduto.',
            ], 403);
        }

        // Validate HMAC (host-agnostic: based only on id, hash, expires)
        $expected = hash_hmac('sha256', $id.'|'.$hash.'|'.$expires, config('app.key'));
        if (! hash_equals($expected, $signature)) {
            return response()->json([
                'success' => false,
                'message' => 'Link di verifica non valido.',
            ], 403);
        }

        $globalUser = GlobalUser::find($id);

        if (! $globalUser || ! hash_equals(sha1($globalUser->getEmailForVerification()), $hash)) {
            return response()->json([
                'success' => false,
                'message' => 'Link di verifica non valido.',
            ], 403);
        }

        if ($globalUser->hasVerifiedEmail()) {
            return response()->json([
                'success' => true,
                'message' => 'Email già verificata.',
            ]);
        }

        $globalUser->markEmailAsVerified();

        return response()->json([
            'success' => true,
            'message' => 'Email verificata con successo.',
        ]);
    }

    /**
     * Resend the email verification notification.
     *
     * POST /api/v1/auth/email/verify/resend
     */
    public function resend(Request $request): JsonResponse
    {
        /** @var GlobalUser $globalUser */
        $globalUser = $request->user('global');

        if ($globalUser->hasVerifiedEmail()) {
            return response()->json([
                'success' => false,
                'message' => 'Email già verificata.',
            ], 422);
        }

        $globalUser->sendEmailVerificationNotification();

        return response()->json([
            'success' => true,
            'message' => 'Email di verifica inviata.',
        ]);
    }
}
