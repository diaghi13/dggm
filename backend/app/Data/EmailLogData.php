<?php

namespace App\Data;

use App\Models\EmailLog;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class EmailLogData extends Data
{
    public function __construct(
        public int|Optional $id,

        public ?int $email_account_id,

        public ?string $document_type,

        public ?int $document_id,

        public ?int $created_by,

        public string $to_email,

        public ?string $to_name,

        public string $subject,

        public string $status,

        public int $attempts,

        public ?string $last_error,

        public ?string $sent_at,

        public ?string $failed_at,

        public ?array $metadata,

        public ?string $created_at,

        public ?string $updated_at,
    ) {}

    public static function fromModel(EmailLog $log): self
    {
        return new self(
            id: $log->id,
            email_account_id: $log->email_account_id,
            document_type: $log->document_type,
            document_id: $log->document_id,
            created_by: $log->created_by,
            to_email: $log->to_email,
            to_name: $log->to_name,
            subject: $log->subject,
            status: $log->status,
            attempts: $log->attempts,
            last_error: $log->last_error,
            sent_at: $log->sent_at?->toIso8601String(),
            failed_at: $log->failed_at?->toIso8601String(),
            metadata: $log->metadata,
            created_at: $log->created_at?->toIso8601String(),
            updated_at: $log->updated_at?->toIso8601String(),
        );
    }
}
