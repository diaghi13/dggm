<?php

use App\Models\RentalProfile;
use App\Services\RentalEngineService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\SettingSeeder::class);
});

describe('RentalEngineService Duration Multiplier', function () {
    it('returns exactly 1.0 for duration of 1 day', function () {
        $service = app(RentalEngineService::class);

        expect($service->calculateDurationMultiplier(1))->toBe(1.0);
    });

    it('returns 0.0 for duration of 0 or negative', function () {
        $service = app(RentalEngineService::class);

        expect($service->calculateDurationMultiplier(0))->toBe(0.0);
        expect($service->calculateDurationMultiplier(-1))->toBe(0.0);
        expect($service->calculateDurationMultiplier(-10))->toBe(0.0);
    });

    it('is monotonically increasing from 1 to 90 days', function () {
        $service = app(RentalEngineService::class);

        $prev = null;
        for ($day = 1; $day <= 90; $day++) {
            $mult = $service->calculateDurationMultiplier($day);

            if ($prev !== null) {
                expect($mult)->toBeGreaterThan($prev);
            }

            $prev = $mult;
        }
    });

    it('floors at cap value for durations beyond max_period_cap_days', function () {
        $service = app(RentalEngineService::class);

        $mult90 = $service->calculateDurationMultiplier(90);
        $mult91 = $service->calculateDurationMultiplier(91);
        $mult120 = $service->calculateDurationMultiplier(120);

        expect($mult91)->toBeGreaterThanOrEqual($mult90);
        expect($mult120)->toBeGreaterThanOrEqual($mult90);
    });

    it('weekly multiplier (7 days) is in AV industry range 3.2x to 4.0x', function () {
        $service = app(RentalEngineService::class);

        $mult7 = $service->calculateDurationMultiplier(7);

        expect($mult7)->toBeGreaterThan(3.2)->toBeLessThan(4.0);
    });

    it('monthly multiplier (30 days) is in range 7.0x to 8.5x', function () {
        $service = app(RentalEngineService::class);

        $mult30 = $service->calculateDurationMultiplier(30);

        expect($mult30)->toBeGreaterThan(7.0)->toBeLessThan(8.5);
    });

    it('seasonal multiplier (90 days) is in range 13x to 16x', function () {
        $service = app(RentalEngineService::class);

        $mult90 = $service->calculateDurationMultiplier(90);

        expect($mult90)->toBeGreaterThan(13.0)->toBeLessThan(16.0);
    });

    it('accepts a RentalProfile model and uses its parameters instead of global settings', function () {
        $service = app(RentalEngineService::class);

        $defaultMult7 = $service->calculateDurationMultiplier(7);

        // Custom profile with exponent_curve=0.5 (differs from default 0.69)
        $profile = RentalProfile::create([
            'name' => 'Test Profile',
            'sector' => 'test',
            'exponent_curve' => 0.5,
            'decay_strength' => 0.27,
            'max_duration_reference' => 30,
            'duration_offset' => 0.15,
            'max_period_cap_days' => 90,
        ]);

        $profileMult7 = $service->calculateDurationMultiplier(7, $profile);

        expect($profileMult7)->not->toEqual($defaultMult7);
        expect($profileMult7)->toBeGreaterThan(0.0);
    });
});

describe('RentalEngineService calculateRentalPrices', function () {
    it('returns all expected keys: hourly, half_day, daily, weekly, monthly, seasonal', function () {
        $service = app(RentalEngineService::class);

        $prices = $service->calculateRentalPrices(100.0);

        expect($prices)->toHaveKeys(['hourly', 'half_day', 'daily', 'weekly', 'monthly', 'seasonal']);
    });

    it('daily price is derived from purchase cost via calculateEstimatedBaseDay', function () {
        // With break_even_days=40, margin_percentage=20, commercial_index=1:
        // daily = (100 / 40) * (1 + 20/100) * 1.0 = 3.0
        $service = app(RentalEngineService::class);

        $prices = $service->calculateRentalPrices(100.0);
        $expectedDaily = $service->calculateEstimatedBaseDay(100.0);

        expect($prices['daily'])->toEqual(round($expectedDaily, 2));
    });

    it('hourly price is daily divided by hours_per_day', function () {
        // hourly = daily / hours_per_day (hours_per_day=8 by default)
        $service = app(RentalEngineService::class);

        $prices = $service->calculateRentalPrices(100.0);
        $expectedDaily = $service->calculateEstimatedBaseDay(100.0);

        expect($prices['hourly'])->toEqual(round($expectedDaily / 8, 2));
    });

    it('half_day price is daily times 0.7', function () {
        $service = app(RentalEngineService::class);

        $prices = $service->calculateRentalPrices(100.0);
        $expectedDaily = $service->calculateEstimatedBaseDay(100.0);

        expect($prices['half_day'])->toEqual(round($expectedDaily * 0.7, 2));
    });

    it('weekly price equals daily times multiplier for 7 days', function () {
        $service = app(RentalEngineService::class);

        $prices = $service->calculateRentalPrices(100.0);
        $rawDaily = $service->calculateEstimatedBaseDay(100.0);
        $mult7 = $service->calculateDurationMultiplier(7);

        expect($prices['weekly'])->toEqual(round($rawDaily * $mult7, 2));
    });

    it('seasonal price equals daily times multiplier for 90 days', function () {
        $service = app(RentalEngineService::class);

        $prices = $service->calculateRentalPrices(100.0);
        $rawDaily = $service->calculateEstimatedBaseDay(100.0);
        $mult90 = $service->calculateDurationMultiplier(90);

        expect($prices['seasonal'])->toEqual(round($rawDaily * $mult90, 2));
    });
});
