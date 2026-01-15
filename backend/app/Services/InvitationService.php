<?php

namespace App\Services;

use App\Enums\WorkerType;
use App\Models\User;
use App\Models\Worker;
use App\Models\WorkerInvitation;
use App\Notifications\WorkerInvited;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

class InvitationService
{
    /**
     * Create and send an invitation to a new worker
     */
    public function createInvitation(array $data, int $invitedByUserId): WorkerInvitation
    {
        $invitation = WorkerInvitation::create([
            'email' => $data['email'],
            'token' => WorkerInvitation::generateToken(),
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'phone' => $data['phone'] ?? null,
            'invited_by_user_id' => $invitedByUserId,
            'supplier_id' => $data['supplier_id'] ?? null,
            'worker_type' => $data['worker_type'] ?? WorkerType::External,
            'contract_type' => $data['contract_type'] ?? null,
            'job_title' => $data['job_title'] ?? null,
            'metadata' => $data['metadata'] ?? null,
            'expires_at' => now()->addDays($data['expires_in_days'] ?? 7),
        ]);

        $invitation->load(['invitedBy', 'supplier']);

        $this->sendInvitation($invitation);

        return $invitation;
    }

    /**
     * Send invitation email
     */
    public function sendInvitation(WorkerInvitation $invitation): void
    {
        Notification::route('mail', $invitation->email)
            ->notify(new WorkerInvited($invitation));
    }

    /**
     * Resend an existing invitation
     */
    public function resendInvitation(WorkerInvitation $invitation): WorkerInvitation
    {
        if ($invitation->isAccepted()) {
            throw new \Exception('Cannot resend an accepted invitation');
        }

        $invitation->update([
            'token' => WorkerInvitation::generateToken(),
            'expires_at' => now()->addDays(7),
        ]);

        $this->sendInvitation($invitation->fresh(['invitedBy', 'supplier']));

        return $invitation;
    }

    /**
     * Get invitation by token
     */
    public function getByToken(string $token): ?WorkerInvitation
    {
        return WorkerInvitation::with(['invitedBy', 'supplier'])
            ->where('token', $token)
            ->first();
    }

    /**
     * Accept invitation and create user + worker
     */
    public function acceptInvitation(WorkerInvitation $invitation, array $userData): array
    {
        if ($invitation->isExpired()) {
            throw new \Exception('This invitation has expired');
        }

        if ($invitation->isAccepted()) {
            throw new \Exception('This invitation has already been accepted');
        }

        if (User::where('email', $invitation->email)->exists()) {
            throw new \Exception('A user with this email already exists');
        }

        return DB::transaction(function () use ($invitation, $userData) {
            $user = User::create([
                'name' => $invitation->first_name.' '.$invitation->last_name,
                'email' => $invitation->email,
                'password' => Hash::make($userData['password']),
            ]);

            $user->assignRole('Worker');

            $worker = Worker::create([
                'user_id' => $user->id,
                'worker_type' => $invitation->worker_type,
                'contract_type' => $invitation->contract_type,
                'first_name' => $invitation->first_name,
                'last_name' => $invitation->last_name,
                'email' => $invitation->email,
                'phone' => $invitation->phone,
                'supplier_id' => $invitation->supplier_id,
                'job_title' => $invitation->job_title,
                'is_active' => true,
            ]);

            $invitation->update([
                'accepted_at' => now(),
                'created_user_id' => $user->id,
            ]);

            return [
                'user' => $user,
                'worker' => $worker,
                'invitation' => $invitation,
            ];
        });
    }

    /**
     * Cancel an invitation
     */
    public function cancelInvitation(WorkerInvitation $invitation): bool
    {
        if ($invitation->isAccepted()) {
            throw new \Exception('Cannot cancel an accepted invitation');
        }

        return $invitation->delete();
    }

    /**
     * Get all pending invitations
     */
    public function getPendingInvitations(): Collection
    {
        return WorkerInvitation::with(['invitedBy', 'supplier'])
            ->pending()
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get all invitations (with filters)
     */
    public function getAllInvitations(?array $filters = []): Collection
    {
        $query = WorkerInvitation::with(['invitedBy', 'supplier', 'createdUser']);

        if (isset($filters['status'])) {
            match ($filters['status']) {
                'pending' => $query->pending(),
                'expired' => $query->expired(),
                'accepted' => $query->accepted(),
                default => null,
            };
        }

        if (isset($filters['email'])) {
            $query->where('email', 'like', "%{$filters['email']}%");
        }

        if (isset($filters['supplier_id'])) {
            $query->where('supplier_id', $filters['supplier_id']);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    /**
     * Clean up expired invitations
     */
    public function cleanupExpiredInvitations(): int
    {
        return WorkerInvitation::expired()
            ->where('created_at', '<', now()->subMonths(3))
            ->delete();
    }
}
