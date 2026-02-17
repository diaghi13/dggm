<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;

/**
 * @OA\OpenApi(
 *
 *     @OA\Info(
 *         title="DGGM ERP API",
 *         version="1.0.0",
 *         description="Complete management system for construction companies and site management. API-first architecture with Laravel backend.",
 *
 *         @OA\Contact(email="info@dggm.it"),
 *
 *         @OA\License(name="Proprietary", url="https://dggm.it/license")
 *     ),
 *
 *     @OA\Server(url="http://localhost:8000/api/v1", description="Local Development Server"),
 *     @OA\Server(url="https://api.dggm.it/api/v1", description="Production Server"),
 *     security={{"sanctum": {}}}
 * )
 *
 * @OA\SecurityScheme(
 *     type="http",
 *     securityScheme="sanctum",
 *     scheme="bearer",
 *     bearerFormat="JWT",
 *     description="Laravel Sanctum authentication. Use 'Bearer {token}' format."
 * )
 *
 * @OA\Tag(name="Quotes", description="Quote management - Create, manage, approve and convert quotes to sites")
 * @OA\Tag(name="Customers", description="Customer registry management")
 * @OA\Tag(name="Sites", description="Construction site management")
 * @OA\Tag(name="Warehouse", description="Warehouse and inventory management")
 */
abstract class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;
}
