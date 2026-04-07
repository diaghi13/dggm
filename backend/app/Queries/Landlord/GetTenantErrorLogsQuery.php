<?php

declare(strict_types=1);

namespace App\Queries\Landlord;

use App\Models\EmailLog;
use App\Models\SystemErrorLog;
use App\Models\Tenant;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class GetTenantErrorLogsQuery
{
    public function execute(array $filters = []): array
    {
        $tenantIdFilter = $filters['tenant_id'] ?? null;
        $typeFilter = $filters['type'] ?? null;
        $dateFrom = $filters['date_from'] ?? null;

        $items = collect();

        // --- Email logs (from each tenant DB) ---
        if ($typeFilter === null || $typeFilter === 'email') {
            $tenants = $tenantIdFilter
                ? Tenant::where('id', $tenantIdFilter)->get()
                : Tenant::all();

            foreach ($tenants as $tenant) {
                try {
                    tenancy()->initialize($tenant);

                    $query = EmailLog::where('status', 'failed')
                        ->orderByDesc('failed_at')
                        ->take(30);

                    $logs = $query->get();

                    tenancy()->end();

                    foreach ($logs as $log) {
                        $occurredAt = $log->failed_at instanceof Carbon
                            ? $log->failed_at->toIso8601String()
                            : (string) $log->failed_at;

                        if ($dateFrom && $occurredAt < $dateFrom) {
                            continue;
                        }

                        $message = $log->last_error ?? '';
                        if (mb_strlen($message) > 300) {
                            $message = mb_substr($message, 0, 300);
                        }

                        $items->push([
                            'id' => "email-{$tenant->id}-{$log->id}",
                            'type' => 'email',
                            'tenant_id' => $tenant->id,
                            'tenant_name' => $tenant->name ?? $tenant->id,
                            'severity' => 'error',
                            'title' => 'Email fallita: '.($log->subject ?? '(no subject)'),
                            'message' => $message,
                            'details' => [
                                'to_email' => $log->to_email,
                                'document_type' => $log->document_type,
                                'document_id' => $log->document_id,
                                'attempts' => $log->attempts,
                                'subject' => $log->subject,
                            ],
                            'occurred_at' => $occurredAt,
                        ]);
                    }
                } catch (\Throwable) {
                    // Skip unreachable tenant DBs — ensure tenancy is reset
                    try {
                        tenancy()->end();
                    } catch (\Throwable) {
                        // ignore
                    }
                }
            }
        }

        // --- System error logs (from each tenant DB) ---
        if ($typeFilter === null || $typeFilter === 'system') {
            $tenantsForSystem = $tenantIdFilter
                ? Tenant::where('id', $tenantIdFilter)->get()
                : Tenant::all();

            foreach ($tenantsForSystem as $tenant) {
                try {
                    tenancy()->initialize($tenant);

                    $logs = SystemErrorLog::query()
                        ->when($dateFrom, fn ($q, $d) => $q->where('occurred_at', '>=', $d))
                        ->orderByDesc('occurred_at')
                        ->take(50)
                        ->get();

                    tenancy()->end();

                    foreach ($logs as $log) {
                        $occurredAt = $log->occurred_at instanceof \Illuminate\Support\Carbon
                            ? $log->occurred_at->toIso8601String()
                            : (string) $log->occurred_at;

                        $items->push([
                            'id' => "system-{$tenant->id}-{$log->id}",
                            'type' => 'system',
                            'tenant_id' => $tenant->id,
                            'tenant_name' => $tenant->name ?? $tenant->id,
                            'severity' => $log->severity,
                            'title' => class_basename($log->exception_class),
                            'message' => $log->message,
                            'details' => [
                                'exception_class' => $log->exception_class,
                                'url' => $log->url,
                                'method' => $log->method,
                                'user_id' => $log->user_id,
                            ],
                            'occurred_at' => $occurredAt,
                        ]);
                    }
                } catch (\Throwable) {
                    try {
                        tenancy()->end();
                    } catch (\Throwable) {
                        // ignore
                    }
                }
            }
        }

        // --- Failed jobs (central DB — no tenancy context needed) ---
        if ($typeFilter === null || $typeFilter === 'job') {
            $failedJobs = DB::table('failed_jobs')
                ->orderByDesc('failed_at')
                ->take(100)
                ->get();

            // Pre-load tenants once for name lookup
            $tenantsById = Tenant::all()->keyBy('id');

            foreach ($failedJobs as $job) {
                $payload = json_decode($job->payload ?? '{}', true) ?? [];
                $displayName = $payload['displayName'] ?? $job->queue ?? 'UnknownJob';

                // Extract tenant_id from payload data if present
                $payloadTenantId = $payload['data']['tenantId']
                    ?? $payload['tenantId']
                    ?? null;

                // Apply tenant_id filter
                if ($tenantIdFilter !== null && $payloadTenantId !== $tenantIdFilter) {
                    continue;
                }

                $tenantName = $payloadTenantId
                    ? ($tenantsById[$payloadTenantId]?->name ?? $payloadTenantId)
                    : 'Sistema';

                $occurredAt = $job->failed_at instanceof Carbon
                    ? $job->failed_at->toIso8601String()
                    : Carbon::parse($job->failed_at)->toIso8601String();

                if ($dateFrom && $occurredAt < $dateFrom) {
                    continue;
                }

                $exception = $job->exception ?? '';
                $firstLine = strtok($exception, "\n") ?: $exception;
                $message = mb_strlen($firstLine) > 300 ? mb_substr($firstLine, 0, 300) : $firstLine;

                $simpleClass = class_basename(str_replace('\\', '/', $displayName));

                $items->push([
                    'id' => "job-{$job->id}",
                    'type' => 'job',
                    'tenant_id' => $payloadTenantId,
                    'tenant_name' => $tenantName,
                    'severity' => 'error',
                    'title' => "Job fallito: {$simpleClass}",
                    'message' => $message,
                    'details' => [
                        'queue' => $job->queue,
                        'uuid' => $payload['uuid'] ?? null,
                        'attempts' => $payload['attempts'] ?? 0,
                    ],
                    'occurred_at' => $occurredAt,
                ]);
            }
        }

        $sorted = $items->sortByDesc('occurred_at')->take(100)->values()->all();

        $emailCount = collect($sorted)->where('type', 'email')->count();
        $jobCount = collect($sorted)->where('type', 'job')->count();
        $systemCount = collect($sorted)->where('type', 'system')->count();

        return [
            'items' => $sorted,
            'total' => count($sorted),
            'types' => [
                'email' => $emailCount,
                'job' => $jobCount,
                'system' => $systemCount,
            ],
        ];
    }
}
