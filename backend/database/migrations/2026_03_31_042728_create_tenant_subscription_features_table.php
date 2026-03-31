<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'landlord';

    public function up(): void
    {
        Schema::connection('landlord')->create('tenant_subscription_features', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_subscription_id')->constrained('tenant_subscriptions')->cascadeOnDelete();
            $table->string('feature_key');
            $table->decimal('price_at_purchase', 10, 2)->nullable();
            $table->timestamps();
            $table->unique(['tenant_subscription_id', 'feature_key'], 'tsf_subscription_feature_unique');
        });
    }

    public function down(): void
    {
        Schema::connection('landlord')->dropIfExists('tenant_subscription_features');
    }
};
