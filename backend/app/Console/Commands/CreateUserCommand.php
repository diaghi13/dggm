<?php

namespace App\Console\Commands;

use App\Models\Landlord\GlobalUser;
use App\Models\Landlord\TenantMembership;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class CreateUserCommand extends Command
{
    protected $signature = 'user:create
                            {--name= : Nome completo}
                            {--email= : Email}
                            {--password= : Password}
                            {--role= : Ruolo (SuperAdmin, Admin, ProjectManager, Foreman, Worker, Accountant, WarehouseManager)}';

    protected $description = 'Crea un nuovo utente con ruolo opzionale';

    public function handle(): int
    {
        $name = $this->option('name') ?? $this->ask('Nome completo');
        $email = $this->option('email') ?? $this->ask('Email');

        if (User::where('email', $email)->exists()) {
            $this->error("Esiste già un utente con email: {$email}");

            return self::FAILURE;
        }

        $password = $this->option('password') ?? $this->secret('Password');

        $roles = Role::pluck('name')->toArray();
        $role = $this->option('role');

        if ($role && ! in_array($role, $roles, true)) {
            $this->error("Ruolo non valido: {$role}. Disponibili: ".implode(', ', $roles));

            return self::FAILURE;
        }

        if (! $role && $roles) {
            $role = $this->choice('Ruolo', array_merge(['(nessuno)'], $roles), 0);
            if ($role === '(nessuno)') {
                $role = null;
            }
        }

        // Create or find GlobalUser in landlord DB
        $globalUser = GlobalUser::firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => $password, // GlobalUser model handles hashing via cast
            ]
        );

        // Create TenantMembership if inside a tenant context
        $tenantId = tenancy()->tenant?->id;
        if ($tenantId) {
            TenantMembership::firstOrCreate(
                ['global_user_id' => $globalUser->id, 'tenant_id' => $tenantId],
                ['role' => strtolower($role ?? 'admin'), 'status' => 'active']
            );
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'global_user_id' => $globalUser->id,
        ]);

        if ($role) {
            $user->assignRole($role);
        }

        $this->info('Utente creato con successo!');
        $this->table(
            ['Campo', 'Valore'],
            [
                ['ID', $user->id],
                ['Nome', $user->name],
                ['Email', $user->email],
                ['Ruolo', $role ?? '(nessuno)'],
            ]
        );

        return self::SUCCESS;
    }
}
