<?php

namespace App\Services;

use App\Enums\DocumentType;
use App\Models\EmailAccount;
use App\Models\EmailLog;
use Illuminate\Mail\Mailer;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mailer\Transport\Smtp\Auth\XOAuth2Authenticator;
use Symfony\Component\Mailer\Transport\Smtp\EsmtpTransport;

class TenantMailService
{
    public function __construct(
        private readonly SettingService $settings
    ) {}

    /**
     * Resolve the email account for a document type, falling back to the default account.
     */
    public function resolveAccountForDocumentType(DocumentType $type): ?EmailAccount
    {
        $accountId = $this->settings->get("email.document_sender.{$type->value}");

        if ($accountId) {
            $account = EmailAccount::find($accountId);
            if ($account?->is_active) {
                return $account;
            }
        }

        return EmailAccount::active()->default()->first();
    }

    /**
     * Build a dynamic Mailer from an EmailAccount.
     * Automatically switches to OAuth SMTP configuration for Google/Microsoft accounts,
     * refreshing the access token if it is expired or expiring within 5 minutes.
     */
    public function buildMailer(EmailAccount $account): Mailer
    {
        if (in_array($account->provider, ['google', 'gmail', 'microsoft', 'outlook']) && $account->oauth_access_token) {
            $refreshed = app(OAuthTokenRefreshService::class)->ensureFreshToken($account);

            if (! $refreshed) {
                throw new \RuntimeException(
                    'Token OAuth scaduto e impossibile rinnovarlo automaticamente. '.
                    'Riconnetti l\'account tramite OAuth.'
                );
            }

            // Reload model to pick up the newly persisted access token
            $account->refresh();

            return $this->buildOAuthMailer($account);
        }

        return Mail::build([
            'transport' => 'smtp',
            'host' => $account->smtp_host,
            'port' => $account->smtp_port,
            'encryption' => $account->smtp_encryption,
            'username' => $account->smtp_username,
            'password' => $account->smtp_password,
        ]);
    }

    /**
     * Detect if a throwable is an SMTP authentication error (e.g. XOAUTH2 400/535).
     */
    private function isOAuthAuthError(\Throwable $e): bool
    {
        $message = $e->getMessage();

        return str_contains($message, 'Failed to authenticate')
            || str_contains($message, 'XOAUTH2')
            || str_contains($message, '535')
            || str_contains($message, '"status":"400"');
    }

    /**
     * Build a Mailer using XOAUTH2 (required for Gmail and Outlook modern auth).
     * Uses Symfony's XOAuth2Authenticator — no external packages needed.
     */
    private function buildOAuthMailer(EmailAccount $account): Mailer
    {
        [$host, $port, $tls] = match ($account->provider) {
            'google', 'gmail' => ['smtp.gmail.com', 465, true],
            'microsoft', 'outlook' => ['smtp.office365.com', 587, false],
            default => [$account->smtp_host, $account->smtp_port, $account->smtp_encryption === 'ssl'],
        };

        $username = $account->smtp_username ?? $account->from_email;
        $accessToken = $account->oauth_access_token;

        // Build an EsmtpTransport that only tries XOAUTH2, skipping LOGIN/PLAIN
        $transport = new EsmtpTransport($host, $port, $tls, authenticators: [new XOAuth2Authenticator]);
        $transport->setUsername($username);
        $transport->setPassword($accessToken);

        return new Mailer(
            'oauth-'.($account->provider ?? 'smtp'),
            app('view'),
            $transport,
            app('events'),
        );
    }

    /**
     * Send a Mailable via a specific account and create an EmailLog entry.
     */
    public function sendWithAccount(
        EmailAccount $account,
        \Illuminate\Mail\Mailable $mailable,
        string $toEmail,
        ?string $toName = null,
        DocumentType $documentType = DocumentType::Generic,
        ?int $documentId = null
    ): EmailLog {
        // Set the From header from the account — required when using a dynamic mailer
        $mailable->from($account->from_email, $account->from_name ?? $account->from_email);

        // Resolve subject from the mailable's envelope before the log entry
        $subject = method_exists($mailable, 'envelope')
            ? ($mailable->envelope()->subject ?? '')
            : ($mailable->subject ?? '');

        $log = EmailLog::create([
            'email_account_id' => $account->id,
            'document_type' => $documentType->value,
            'document_id' => $documentId,
            'to_email' => $toEmail,
            'to_name' => $toName,
            'subject' => $subject,
            'status' => 'pending',
            'created_by' => auth()->id(),
        ]);

        try {
            $mailer = $this->buildMailer($account);
            $mailer->to($toEmail, $toName)->send($mailable);

            $log->update([
                'status' => 'sent',
                'sent_at' => now(),
                'attempts' => $log->attempts + 1,
            ]);
        } catch (\Throwable $e) {
            // If XOAUTH2 auth failed (Google/Microsoft token rejected), force a refresh and retry once.
            // This covers tokens invalidated early by the provider (different from wrong-scope issues).
            if ($this->isOAuthAuthError($e) && in_array($account->provider, ['google', 'gmail', 'microsoft', 'outlook'])) {
                $refreshed = app(OAuthTokenRefreshService::class)->refresh($account);

                if ($refreshed) {
                    $account->refresh();

                    try {
                        $mailer = $this->buildOAuthMailer($account);
                        $mailer->to($toEmail, $toName)->send($mailable);

                        $log->update([
                            'status' => 'sent',
                            'sent_at' => now(),
                            'attempts' => $log->attempts + 2,
                        ]);

                        return $log->fresh();
                    } catch (\Throwable $retryException) {
                        $e = new \RuntimeException(
                            'Autenticazione OAuth fallita anche dopo il refresh del token. '.
                            'Ricollega l\'account email tramite OAuth nelle impostazioni.',
                            0,
                            $retryException
                        );
                    }
                } else {
                    $e = new \RuntimeException(
                        'Token OAuth non valido e impossibile rinnovarlo. '.
                        'Ricollega l\'account email tramite OAuth nelle impostazioni.',
                        0,
                        $e
                    );
                }
            }

            $log->update([
                'status' => 'failed',
                'failed_at' => now(),
                'attempts' => $log->attempts + 1,
                'last_error' => $e->getMessage(),
            ]);
            throw $e;
        }

        return $log->fresh();
    }
}
