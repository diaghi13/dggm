<?php

namespace App\Http\Controllers\Api\V1\Quotes;

use App\Actions\Quote\ApproveQuoteAction;
use App\Actions\Quote\RejectQuoteAction;
use App\Domains\Quote\Models\Quote;
use App\Domains\Quote\Models\QuoteToken;
use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Stancl\Tenancy\Exceptions\TenantCouldNotBeIdentifiedById;

class PublicQuoteActionController extends Controller
{
    public function show(string $token): JsonResponse
    {
        $error = $this->initializeTenantFromToken($token);
        if ($error) {
            return $error;
        }

        try {
            $quote = Quote::with('customer')->where('customer_token', $token)->first();

            if (! $quote) {
                return response()->json(['success' => false, 'message' => 'Preventivo non trovato.'], 404);
            }

            $companyLogo = Setting::get('company.logo');
            $logoUrl = $companyLogo
                ? rtrim(config('app.url'), '/').'/'.ltrim($companyLogo, '/')
                : null;

            return response()->json([
                'success' => true,
                'data' => [
                    'token_valid' => $quote->isCustomerTokenValid(),
                    'quote' => [
                        'code' => $quote->code,
                        'title' => $quote->title,
                        'status' => $quote->status,
                        'total_amount' => $quote->total_amount,
                        'expiry_date' => $quote->expiry_date?->format('Y-m-d'),
                        'notes' => $quote->notes,
                        'customer_name' => $this->resolveCustomerName($quote),
                    ],
                    'company' => [
                        'name' => Setting::get('company.name') ?? '',
                        'logo_url' => $logoUrl,
                    ],
                ],
            ]);
        } finally {
            tenancy()->end();
        }
    }

    public function accept(string $token): JsonResponse
    {
        return $this->handleAction($token, 'accept');
    }

    public function reject(string $token): JsonResponse
    {
        return $this->handleAction($token, 'reject');
    }

    private function handleAction(string $token, string $action): JsonResponse
    {
        $error = $this->initializeTenantFromToken($token);
        if ($error) {
            return $error;
        }

        try {
            $quote = Quote::with('customer')->where('customer_token', $token)->firstOrFail();

            if (! $quote->isCustomerTokenValid()) {
                return response()->json([
                    'success' => false,
                    'code' => 'token_expired',
                    'message' => "Questo link di conferma è scaduto. Contatta l'azienda per ulteriori informazioni.",
                ], 410);
            }

            if ($quote->status !== 'sent') {
                return response()->json([
                    'success' => false,
                    'code' => 'invalid_status',
                    'status' => $quote->status,
                    'message' => match ($quote->status) {
                        'approved' => 'Il preventivo è già stato accettato.',
                        'rejected' => 'Il preventivo è già stato rifiutato.',
                        'expired' => 'Il preventivo è scaduto.',
                        default => 'Questo preventivo non può essere modificato.',
                    },
                ], 422);
            }

            if ($action === 'accept') {
                app(ApproveQuoteAction::class)->execute($quote);

                return response()->json([
                    'success' => true,
                    'action' => 'accepted',
                    'code' => $quote->code,
                    'message' => 'Preventivo accettato con successo.',
                ]);
            }

            app(RejectQuoteAction::class)->execute($quote);

            return response()->json([
                'success' => true,
                'action' => 'rejected',
                'code' => $quote->code,
                'message' => 'Preventivo rifiutato.',
            ]);
        } finally {
            tenancy()->end();
        }
    }

    /**
     * Look up the QuoteToken in the central DB and initialize the matching tenant.
     * Returns a JsonResponse error if the token is invalid or the tenant can't be loaded.
     */
    private function initializeTenantFromToken(string $token): ?JsonResponse
    {
        /** @var QuoteToken|null $quoteToken */
        $quoteToken = QuoteToken::where('token', $token)->with('tenant')->first();

        if (! $quoteToken || ! $quoteToken->tenant) {
            return response()->json(['success' => false, 'message' => 'Token non valido.'], 404);
        }

        try {
            tenancy()->initialize($quoteToken->tenant);
        } catch (TenantCouldNotBeIdentifiedById) {
            return response()->json(['success' => false, 'message' => 'Token non valido.'], 404);
        }

        return null;
    }

    private function resolveCustomerName(Quote $quote): ?string
    {
        if (! $quote->customer) {
            return null;
        }

        if ($quote->customer->type === 'company') {
            return $quote->customer->company_name;
        }

        $fullName = trim(($quote->customer->first_name ?? '').' '.($quote->customer->last_name ?? ''));

        return $fullName ?: $quote->customer->company_name;
    }
}
