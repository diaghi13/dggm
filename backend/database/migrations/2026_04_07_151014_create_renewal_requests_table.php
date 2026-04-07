<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'landlord';

    public function up(): void
    {
        Schema::connection('landlord')->create('renewal_requests', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->index();
            $table->foreignId('tenant_subscription_id')
                ->constrained('tenant_subscriptions')
                ->cascadeOnDelete();
            $table->enum('type', ['renewal', 'addon_add', 'renewal_with_addons']);
            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled'])->default('pending');
            $table->string('requested_by_global_user_id')->nullable();
            $table->json('addons')->nullable();
            $table->decimal('prorated_amount', 10, 2)->nullable();
            $table->integer('cycle_days_total')->nullable();
            $table->integer('cycle_days_remaining')->nullable();
            $table->enum('billing_cycle', ['monthly', 'yearly'])->nullable();
            $table->text('notes')->nullable();
            $table->text('admin_notes')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->string('processed_by_global_user_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::connection('landlord')->dropIfExists('renewal_requests');
    }
};
