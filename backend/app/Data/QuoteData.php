<?php

namespace App\Data;

use Illuminate\Validation\Rule;
use Spatie\LaravelData\Attributes\Validation\Exists;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;
use Spatie\LaravelData\Lazy;
use Spatie\LaravelData\Optional;
use Spatie\LaravelData\Support\Validation\ValidationContext;

class QuoteData extends Data
{
    public function __construct(
        // Required fields
        #[Required, Max(255)]
        public string $title,

        #[Required, Exists('customers', 'id')]
        public int $customer_id,

        // Optional fields (nullable)
        public int|Optional $id = new Optional,

        public string|Optional $code = new Optional,

        #[Exists('users', 'id')]
        public ?int $project_manager_id = null,

        public ?string $description = null,

        // Indirizzo
        #[Max(255)]
        public ?string $address = null,

        #[Max(100)]
        public ?string $city = null,

        #[Max(2)]
        public ?string $province = null,

        #[Max(20)]
        public ?string $postal_code = null,

        // Status & Date (with defaults)
        public string $status = 'draft',

        public ?\Carbon\Carbon $issue_date = null,

        public ?\Carbon\Carbon $expiry_date = null,

        public ?\Carbon\Carbon $sent_date = null,

        public ?\Carbon\Carbon $approved_date = null,

        // Riferimenti
        #[Exists('price_lists', 'id')]
        public ?int $price_list_id = null,

        #[Exists('payment_terms', 'id')]
        public ?int $payment_term_id = null,

        #[Exists('financial_resources', 'id')]
        public ?int $financial_resource_id = null,

        public ?int $template_id = null,

        #[Exists('sites', 'id')]
        public ?int $site_id = null,

        #[Exists('warranty_types', 'id')]
        public ?int $warranty_type_id = null,

        // Importi (with defaults)
        public float $subtotal = 0,

        public float $discount_percentage = 0,

        public float $discount_amount = 0,

        public float $tax_percentage = 22,

        public float $tax_amount = 0,

        public float $total_amount = 0,

        // Acconto
        public ?float $deposit_percentage = null,

        public ?float $deposit_amount = null,

        // Lavori
        public ?string $work_start_description = null,

        public ?\Carbon\Carbon $work_start_date = null,

        public ?string $work_duration_description = null,

        public ?\Carbon\Carbon $work_end_date = null,

        // Flags visualizzazione (with defaults)
        public bool $tax_included = false,

        public bool $show_unit_prices = true,

        public bool $show_product_codes = true,

        public bool $show_vat = true,

        public bool $show_section_totals = true,

        public bool $vat_included_in_prices = false,

        public bool $include_terms_and_conditions = true,

        // Testi
        public ?string $notes = null,

        public ?string $terms_and_conditions = null,

        public ?string $footer_text = null,

        // Relazioni (output only)
        public CustomerData|Lazy|Optional $customer = new Optional,

        public UserData|Lazy|Optional $projectManager = new Optional,

        public PriceListData|Lazy|Optional $priceList = new Optional,

        public PaymentTermData|Lazy|Optional $paymentTerm = new Optional,

        public FinancialResourceData|Lazy|Optional $financialResource = new Optional,

        public WarrantyTypeData|Lazy|Optional $warrantyType = new Optional,

        public SiteData|Lazy|Optional $site = new Optional,

        /** @var DataCollection<QuoteItemData>|Lazy|Optional */
        public DataCollection|Lazy|Optional $items = new Optional,

        // Computed attributes
        public string|Optional $full_address = new Optional,
    ) {}

    public static function rules(ValidationContext $context): array
    {
        $quoteId = $context->payload['id'] ?? null;
        $isUpdate = $quoteId !== null;

        return [
            'code' => ['nullable', 'string', 'max:50', Rule::unique('quotes', 'code')->ignore($quoteId)],
            'title' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:255'],
            'customer_id' => [$isUpdate ? 'sometimes' : 'required', 'exists:customers,id'],
            'project_manager_id' => ['nullable', 'exists:users,id'],
            'description' => ['nullable', 'string'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'province' => ['nullable', 'string', 'max:2'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'status' => ['string', 'in:draft,sent,approved,rejected,expired,converted'],
            'issue_date' => ['nullable', 'date'],
            'expiry_date' => ['nullable', 'date', 'after_or_equal:issue_date'],
            'sent_date' => ['nullable', 'date'],
            'approved_date' => ['nullable', 'date'],
            'price_list_id' => ['nullable', 'exists:price_lists,id'],
            'payment_term_id' => ['nullable', 'exists:payment_terms,id'],
            'financial_resource_id' => ['nullable', 'exists:financial_resources,id'],
            'template_id' => ['nullable', 'exists:quote_templates,id'],
            'site_id' => ['nullable', 'exists:sites,id'],
            'warranty_type_id' => ['nullable', 'exists:warranty_types,id'],
            'subtotal' => ['nullable', 'numeric', 'min:0'],
            'discount_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'tax_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'tax_amount' => ['nullable', 'numeric', 'min:0'],
            'total_amount' => ['nullable', 'numeric', 'min:0'],
            'deposit_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'deposit_amount' => ['nullable', 'numeric', 'min:0'],
            'work_start_description' => ['nullable', 'string', 'max:1000'],
            'work_start_date' => ['nullable', 'date'],
            'work_duration_description' => ['nullable', 'string', 'max:500'],
            'work_end_date' => ['nullable', 'date', 'after_or_equal:work_start_date'],
            'tax_included' => ['nullable', 'boolean'],
            'show_unit_prices' => ['nullable', 'boolean'],
            'show_product_codes' => ['nullable', 'boolean'],
            'show_vat' => ['nullable', 'boolean'],
            'show_section_totals' => ['nullable', 'boolean'],
            'vat_included_in_prices' => ['nullable', 'boolean'],
            'include_terms_and_conditions' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
            'terms_and_conditions' => ['nullable', 'string'],
            'footer_text' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
