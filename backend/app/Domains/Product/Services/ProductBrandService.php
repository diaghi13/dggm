<?php

namespace App\Domains\Product\Services;

use App\Domains\Product\Models\ProductBrand;

class ProductBrandService
{
    /**
     * Generate unique code from brand name
     * Logic:
     * 1. Try first 3 uppercase letters from name
     * 2. If duplicate -> try 4 letters
     * 3. If duplicate -> try initials from words (max 4)
     * 4. If still duplicate -> add progressive number
     */
    public static function generateUniqueCode(string $name): string
    {
        $name = strtoupper(trim($name));

        // Strategy 1: First 3 letters (only alphabetic characters)
        $code = substr(preg_replace('/[^A-Z]/', '', $name), 0, 3);
        if (strlen($code) >= 2 && self::isCodeUnique($code)) {
            return $code;
        }

        // Strategy 2: First 4 letters
        $code = substr(preg_replace('/[^A-Z]/', '', $name), 0, 4);
        if (strlen($code) >= 3 && self::isCodeUnique($code)) {
            return $code;
        }

        // Strategy 3: Initials from words (max 4 words)
        $words = preg_split('/\s+/', $name);
        $code = '';
        foreach (array_slice($words, 0, 4) as $word) {
            $firstLetter = substr(preg_replace('/[^A-Z]/', '', $word), 0, 1);
            if ($firstLetter) {
                $code .= $firstLetter;
            }
        }
        if (strlen($code) >= 2 && self::isCodeUnique($code)) {
            return $code;
        }

        // Strategy 4: Add progressive number to base code
        $baseCode = $code ?: substr(preg_replace('/[^A-Z]/', '', $name), 0, 3);
        if (empty($baseCode)) {
            $baseCode = 'BRD'; // Fallback if name has no alphabetic characters
        }

        $counter = 1;
        while (! self::isCodeUnique($baseCode.$counter)) {
            $counter++;
            if ($counter > 999) { // Safety limit
                throw new \Exception('Unable to generate unique brand code after 999 attempts');
            }
        }

        return $baseCode.$counter;
    }

    /**
     * Check if code is unique
     */
    private static function isCodeUnique(string $code): bool
    {
        return ! ProductBrand::query()
            ->where('code', $code)->exists();
    }
}
