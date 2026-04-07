<?php

declare(strict_types=1);

namespace App\Http\Controllers\Landlord;

use App\Http\Controllers\Controller;
use App\Models\Landlord\LandlordSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LandlordSettingsController extends Controller
{
    public function index(): JsonResponse
    {
        $settings = LandlordSetting::query()
            ->orderBy('key')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    public function update(Request $request, string $key): JsonResponse
    {
        $validated = $request->validate([
            'value' => 'required|string',
        ]);

        $setting = LandlordSetting::updateOrCreate(
            ['key' => $key],
            ['value' => $validated['value']]
        );

        return response()->json([
            'success' => true,
            'data' => $setting,
        ]);
    }
}
