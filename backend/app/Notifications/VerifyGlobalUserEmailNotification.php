<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Mail\VerifyGlobalUserMail;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Config;

class VerifyGlobalUserEmailNotification extends VerifyEmail implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $companyName,
    ) {}

    public function toMail(mixed $notifiable): VerifyGlobalUserMail
    {
        $verificationUrl = $this->verificationUrl($notifiable);
        $expireMinutes = Config::get('auth.verification.expire', 60);

        return new VerifyGlobalUserMail(
            userName: $notifiable->name ?? '',
            email: $notifiable->getEmailForVerification(),
            companyName: $this->companyName,
            verificationUrl: $verificationUrl,
            expireMinutes: $expireMinutes,
        );
    }

    protected function verificationUrl(mixed $notifiable): string
    {
        $id = $notifiable->getKey();
        $hash = sha1($notifiable->getEmailForVerification());
        $expires = now()->addMinutes(Config::get('auth.verification.expire', 60))->timestamp;

        // Host-agnostic HMAC: depends only on id, hash, expires — not on APP_URL
        $signature = hash_hmac('sha256', $id.'|'.$hash.'|'.$expires, config('app.key'));

        $frontendBase = rtrim(config('app.frontend_url', config('app.url')), '/');

        return $frontendBase.'/verify-email?'.http_build_query([
            'id' => $id,
            'hash' => $hash,
            'expires' => $expires,
            'signature' => $signature,
        ]);
    }
}
