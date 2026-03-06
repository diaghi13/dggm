<?php

namespace App\Http\Controllers\Api;

/**
 * @OA\Schema(
 *     schema="Quote",
 *     type="object",
 *     title="Quote",
 *     description="Quote model with all details",
 *
 *     @OA\Property(property="id", type="integer", example=1, description="Quote ID"),
 *     @OA\Property(property="code", type="string", example="Q-2026-0001", description="Unique quote code"),
 *     @OA\Property(property="title", type="string", example="Impianto elettrico completo", description="Quote title"),
 *     @OA\Property(property="description", type="string", nullable=true, example="Installazione impianto elettrico per uffici", description="Detailed description"),
 *     @OA\Property(property="status", type="string", enum={"draft","sent","approved","rejected","expired","converted"}, example="draft", description="Quote status"),
 *     @OA\Property(property="customer_id", type="integer", example=1, description="Customer ID"),
 *     @OA\Property(property="project_manager_id", type="integer", nullable=true, example=5, description="Project manager user ID"),
 *     @OA\Property(property="address", type="string", nullable=true, example="Via Roma 123", description="Site address"),
 *     @OA\Property(property="city", type="string", nullable=true, example="Milano", description="City"),
 *     @OA\Property(property="province", type="string", nullable=true, example="MI", description="Province (2 chars)"),
 *     @OA\Property(property="postal_code", type="string", nullable=true, example="20100", description="Postal code"),
 *     @OA\Property(property="issue_date", type="string", format="date", nullable=true, example="2026-02-01", description="Issue date"),
 *     @OA\Property(property="expiry_date", type="string", format="date", nullable=true, example="2026-03-01", description="Expiry date"),
 *     @OA\Property(property="sent_date", type="string", format="date-time", nullable=true, example="2026-02-05T10:30:00Z", description="Sent to customer timestamp"),
 *     @OA\Property(property="approved_date", type="string", format="date-time", nullable=true, example="2026-02-10T14:20:00Z", description="Approval timestamp"),
 *     @OA\Property(property="subtotal", type="number", format="float", example=1000.00, description="Subtotal before discounts and taxes"),
 *     @OA\Property(property="discount_percentage", type="number", format="float", example=10.00, description="Discount percentage"),
 *     @OA\Property(property="discount_amount", type="number", format="float", example=100.00, description="Discount amount in EUR"),
 *     @OA\Property(property="tax_percentage", type="number", format="float", example=22.00, description="Tax percentage (default VAT)"),
 *     @OA\Property(property="tax_amount", type="number", format="float", example=198.00, description="Tax amount in EUR"),
 *     @OA\Property(property="total_amount", type="number", format="float", example=1098.00, description="Final total amount"),
 *     @OA\Property(property="deposit_percentage", type="number", format="float", nullable=true, example=30.00, description="Deposit percentage"),
 *     @OA\Property(property="deposit_amount", type="number", format="float", nullable=true, example=329.40, description="Deposit amount in EUR"),
 *     @OA\Property(property="price_list_id", type="integer", nullable=true, example=1, description="Price list ID"),
 *     @OA\Property(property="payment_term_id", type="integer", nullable=true, example=1, description="Payment term ID"),
 *     @OA\Property(property="template_id", type="integer", nullable=true, example=1, description="Quote template ID"),
 *     @OA\Property(property="project_id", type="integer", nullable=true, example=null, description="Project ID if converted"),
 *     @OA\Property(property="warranty_type_id", type="integer", nullable=true, example=1, description="Warranty type ID"),
 *     @OA\Property(property="work_start_description", type="string", nullable=true, example="Inizio lavori previsto per marzo 2026", description="Work start description"),
 *     @OA\Property(property="work_start_date", type="string", format="date", nullable=true, example="2026-03-15", description="Planned work start date"),
 *     @OA\Property(property="work_duration_description", type="string", nullable=true, example="Durata stimata: 3 settimane", description="Work duration description"),
 *     @OA\Property(property="work_end_date", type="string", format="date", nullable=true, example="2026-04-05", description="Planned work end date"),
 *     @OA\Property(property="show_tax", type="boolean", example=true, description="Show tax in PDF"),
 *     @OA\Property(property="tax_included", type="boolean", example=false, description="Tax included in prices"),
 *     @OA\Property(property="show_unit_prices", type="boolean", example=true, description="Show unit prices in PDF"),
 *     @OA\Property(property="show_product_codes", type="boolean", example=true, description="Show product codes in PDF"),
 *     @OA\Property(property="show_vat", type="boolean", example=true, description="Show VAT in PDF"),
 *     @OA\Property(property="vat_included_in_prices", type="boolean", example=false, description="VAT included in prices"),
 *     @OA\Property(property="include_terms_and_conditions", type="boolean", example=true, description="Include terms and conditions in PDF"),
 *     @OA\Property(property="notes", type="string", nullable=true, example="Note aggiuntive sul preventivo", description="Internal notes"),
 *     @OA\Property(property="terms_and_conditions", type="string", nullable=true, example="Termini e condizioni generali", description="Terms and conditions text"),
 *     @OA\Property(property="footer_text", type="string", nullable=true, example="Grazie per la fiducia", description="Footer text for PDF"),
 *     @OA\Property(property="created_at", type="string", format="date-time", example="2026-02-01T09:00:00Z"),
 *     @OA\Property(property="updated_at", type="string", format="date-time", example="2026-02-10T15:30:00Z"),
 *     @OA\Property(
 *         property="customer",
 *         ref="#/components/schemas/CustomerBasic",
 *         description="Customer details (when included)"
 *     ),
 *     @OA\Property(
 *         property="items",
 *         type="array",
 *
 *         @OA\Items(ref="#/components/schemas/QuoteItem"),
 *         description="Quote items (when included)"
 *     )
 * )
 *
 * @OA\Schema(
 *     schema="QuoteItem",
 *     type="object",
 *     title="Quote Item",
 *     description="Individual item in a quote",
 *
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="quote_id", type="integer", example=1),
 *     @OA\Property(property="product_id", type="integer", nullable=true, example=5),
 *     @OA\Property(property="description", type="string", example="Cavo elettrico 3x2.5mm"),
 *     @OA\Property(property="quantity", type="number", format="float", example=50.00),
 *     @OA\Property(property="unit_price", type="number", format="float", example=2.50),
 *     @OA\Property(property="discount_percentage", type="number", format="float", example=5.00),
 *     @OA\Property(property="tax_percentage", type="number", format="float", example=22.00),
 *     @OA\Property(property="total", type="number", format="float", example=125.00),
 *     @OA\Property(property="position", type="integer", example=1, description="Display order"),
 *     @OA\Property(property="notes", type="string", nullable=true),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 *
 * @OA\Schema(
 *     schema="CustomerBasic",
 *     type="object",
 *     title="Customer (Basic)",
 *     description="Basic customer information",
 *
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="name", type="string", example="Acme Corporation"),
 *     @OA\Property(property="email", type="string", example="info@acme.com"),
 *     @OA\Property(property="phone", type="string", nullable=true, example="+39 02 1234567")
 * )
 *
 * @OA\Schema(
 *     schema="SuccessResponse",
 *     type="object",
 *     title="Success Response",
 *
 *     @OA\Property(property="success", type="boolean", example=true),
 *     @OA\Property(property="data", type="object", description="Response data"),
 *     @OA\Property(property="message", type="string", example="Operation completed successfully")
 * )
 *
 * @OA\Schema(
 *     schema="PaginationMeta",
 *     type="object",
 *     title="Pagination Meta",
 *
 *     @OA\Property(property="current_page", type="integer", example=1),
 *     @OA\Property(property="per_page", type="integer", example=15),
 *     @OA\Property(property="total", type="integer", example=150),
 *     @OA\Property(property="last_page", type="integer", example=10),
 *     @OA\Property(property="from", type="integer", example=1),
 *     @OA\Property(property="to", type="integer", example=15)
 * )
 *
 * @OA\Schema(
 *     schema="ErrorResponse",
 *     type="object",
 *     title="Error Response",
 *
 *     @OA\Property(property="success", type="boolean", example=false),
 *     @OA\Property(
 *         property="error",
 *         type="object",
 *         @OA\Property(property="message", type="string", example="Validation failed"),
 *         @OA\Property(property="code", type="string", example="VALIDATION_ERROR"),
 *         @OA\Property(
 *             property="details",
 *             type="object",
 *             example={"title": {"The title field is required."}}
 *         )
 *     )
 * )
 *
 * @OA\Schema(
 *     schema="QuoteInput",
 *     type="object",
 *     title="Quote Input",
 *     description="Input data for creating or updating a quote",
 *     required={"title", "customer_id"},
 *
 *     @OA\Property(property="title", type="string", example="Impianto elettrico completo", description="Quote title (required)"),
 *     @OA\Property(property="customer_id", type="integer", example=1, description="Customer ID (required)"),
 *     @OA\Property(property="project_manager_id", type="integer", nullable=true, example=5),
 *     @OA\Property(property="description", type="string", nullable=true),
 *     @OA\Property(property="address", type="string", nullable=true),
 *     @OA\Property(property="city", type="string", nullable=true),
 *     @OA\Property(property="province", type="string", nullable=true),
 *     @OA\Property(property="postal_code", type="string", nullable=true),
 *     @OA\Property(property="status", type="string", enum={"draft","sent","approved","rejected","expired","converted"}, example="draft"),
 *     @OA\Property(property="issue_date", type="string", format="date", nullable=true),
 *     @OA\Property(property="expiry_date", type="string", format="date", nullable=true),
 *     @OA\Property(property="price_list_id", type="integer", nullable=true),
 *     @OA\Property(property="payment_term_id", type="integer", nullable=true),
 *     @OA\Property(property="warranty_type_id", type="integer", nullable=true),
 *     @OA\Property(property="subtotal", type="number", format="float", example=0),
 *     @OA\Property(property="discount_percentage", type="number", format="float", example=0),
 *     @OA\Property(property="tax_percentage", type="number", format="float", example=22),
 *     @OA\Property(property="notes", type="string", nullable=true),
 *     @OA\Property(property="terms_and_conditions", type="string", nullable=true)
 * )
 */
class OpenApiSchemas
{
    // This class is only used for OpenAPI schema annotations
}
