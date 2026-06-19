<?php

use App\Http\Controllers\Api\V1\Emails\EmailAccountOAuthController;
use App\Http\Controllers\Api\V1\InvitationController;
use App\Http\Controllers\Api\V1\Quotes\PublicQuoteActionController;
use App\Http\Controllers\Api\V1\TenantInvitationController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\GlobalAuthController;
use App\Http\Controllers\Worker\WorkerOverviewController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Password reset web route (for email links)
Route::get('/password-reset/{token}', function ($token) {
    $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
    $email = request()->query('email');

    return redirect()->away("{$frontendUrl}/reset-password?token={$token}&email={$email}");
})->name('password.reset');

// Temporary route for tenancy context testing (used in TenancyBasicTest)
Route::get('/test-tenant-context', function () {
    return response()->json(['tenant' => tenancy()->tenant?->id]);
});

// API v1 routes
Route::prefix('v1')->group(function () {
    require __DIR__.'/api/v1/auth.php';
    require __DIR__.'/api/v1/landlord.php';

    // Plans — public (registration page needs to show plans before the user has a token)
    Route::get('plans', [\App\Http\Controllers\Landlord\PlansController::class, 'index']);

    // Email verification — no auth required, HMAC validated in controller
    Route::get('auth/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
        ->middleware('throttle:6,1')
        ->name('verification.verify');

    // Email verification resend — requires GlobalUser auth
    Route::post('auth/email/verify/resend', [EmailVerificationController::class, 'resend'])
        ->middleware(['auth:global', 'throttle:6,1'])
        ->name('verification.send');

    // Authenticated global auth routes — require GlobalUser token (auth:global guard)
    // Also apply EnsureTenantMembership so that when an X-Tenant header is present,
    // the user's membership and subscription are verified.
    Route::prefix('auth/global')->middleware(['auth:global', 'tenant.member'])->group(function () {
        Route::get('/me', [GlobalAuthController::class, 'me']);
        Route::get('/tenants', [GlobalAuthController::class, 'tenants']);
        Route::post('/logout', [GlobalAuthController::class, 'logout']);
    });

    // Tenant subscription management (requires global auth + active tenant membership)
    Route::prefix('tenant/subscription')->middleware(['auth:global', 'tenant.member'])->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\V1\TenantSubscriptionController::class, 'show']);
        Route::post('/renew', [\App\Http\Controllers\Api\V1\TenantSubscriptionController::class, 'requestRenewal']);
        Route::post('/addons', [\App\Http\Controllers\Api\V1\TenantSubscriptionController::class, 'requestAddon']);
        Route::get('/requests', [\App\Http\Controllers\Api\V1\TenantSubscriptionController::class, 'getRequests']);
        Route::get('/available-addons', [\App\Http\Controllers\Api\V1\TenantSubscriptionController::class, 'getAvailableAddons']);
        Route::post('/change-plan', [\App\Http\Controllers\Api\V1\TenantSubscriptionController::class, 'changePlan']);
    });

    // Worker global view — landlord context, no x-tenant required.
    // InitializeTenancyByRequestData::$onFail is configured as a no-op in AppServiceProvider,
    // so these routes work without the x-tenant header.
    Route::prefix('my')->middleware(['auth:global'])->group(function () {
        Route::get('overview', [WorkerOverviewController::class, 'overview']);
        Route::get('projects', [WorkerOverviewController::class, 'projects']);
        Route::get('profile', [WorkerOverviewController::class, 'profile']);
        Route::patch('profile', [WorkerOverviewController::class, 'updateProfile']);
    });

    // Public invitation routes (no authentication)
    Route::get('invitations/{token}', [InvitationController::class, 'showByToken']);
    Route::post('invitations/{token}/accept', [InvitationController::class, 'accept']);

    // Tenant invitations — public (no auth required to preview/accept)
    Route::post('tenant-invitations/accept', [TenantInvitationController::class, 'accept']);
    Route::get('tenant-invitations/preview/{token}', [TenantInvitationController::class, 'preview']);

    // OAuth callback — public, tenant context recovered from encrypted state
    Route::get('email-accounts/oauth/{provider}/callback', [EmailAccountOAuthController::class, 'callback'])
        ->name('email-accounts.oauth.callback');

    // Public quote actions (no auth — customer clicks link in email)
    Route::get('public/quotes/{token}', [PublicQuoteActionController::class, 'show'])
        ->name('public.quotes.show');
    Route::get('public/quotes/{token}/accept', [PublicQuoteActionController::class, 'accept'])
        ->name('public.quotes.accept');
    Route::get('public/quotes/{token}/reject', [PublicQuoteActionController::class, 'reject'])
        ->name('public.quotes.reject');

    // Protected routes (require authentication)
    Route::middleware('auth:sanctum')->group(function () {
        require __DIR__.'/api/v1/users.php';
        require __DIR__.'/api/v1/roles_and_permissions.php';
        require __DIR__.'/api/v1/settings.php';
        require __DIR__.'/api/v1/customers.php';
        require __DIR__.'/api/v1/projects.php';
        require __DIR__.'/api/v1/final-balance.php';
        require __DIR__.'/api/v1/suppliers.php';
        require __DIR__.'/api/v1/quotes.php';
        require __DIR__.'/api/v1/media.php';
        require __DIR__.'/api/v1/products.php';
        require __DIR__.'/api/v1/price-lists.php';
        require __DIR__.'/api/v1/rental.php';
        require __DIR__.'/api/v1/registry-config.php';
        require __DIR__.'/api/v1/warehouse.php';
        require __DIR__.'/api/v1/workers.php';
        require __DIR__.'/api/v1/notifications.php';
        require __DIR__.'/api/v1/contractors.php';
        require __DIR__.'/api/v1/email-accounts.php';
    });
});
