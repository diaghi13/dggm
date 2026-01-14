<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('site_workers', function (Blueprint $table) {
            // Status dell'assegnazione (enum)
            $table->string('status')->default('pending')->after('worker_id');

            // Chi ha creato l'assegnazione (audit)
            $table->foreignId('assigned_by_user_id')->nullable()->constrained('users')->nullOnDelete()->after('worker_id');

            // Data e ora risposta (quando il worker ha accettato/rifiutato)
            $table->timestamp('responded_at')->nullable()->after('assigned_to');

            // Scadenza risposta per esterni (entro quando deve rispondere)
            $table->timestamp('response_due_at')->nullable()->after('responded_at');

            // Motivazione in caso di rifiuto
            $table->text('rejection_reason')->nullable()->after('notes');

            // Campi aggiuntivi per override tariffa (già c'era hourly_rate_override)
            // Aggiungiamo possibilità di impostare tariffa fissa per l'intero cantiere
            $table->decimal('fixed_rate_override', 10, 2)->nullable()->after('hourly_rate_override');
            $table->string('rate_override_notes')->nullable()->after('fixed_rate_override');

            // Indexes
            $table->index('status');
            $table->index('assigned_by_user_id');
            $table->index('responded_at');
            $table->index('response_due_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('site_workers', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['assigned_by_user_id']);
            $table->dropIndex(['responded_at']);
            $table->dropIndex(['response_due_at']);

            $table->dropForeign(['assigned_by_user_id']);

            $table->dropColumn([
                'status',
                'assigned_by_user_id',
                'responded_at',
                'response_due_at',
                'rejection_reason',
                'fixed_rate_override',
                'rate_override_notes',
            ]);
        });
    }
};
