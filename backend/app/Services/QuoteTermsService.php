<?php

namespace App\Services;

use App\Models\Quote;
use App\Models\Setting;

class QuoteTermsService
{
    /**
     * Re-resolve placeholders using current quote data.
     * Falls back to the template from settings if terms_and_conditions is empty.
     * Does NOT persist — the caller decides when to save.
     */
    public function refreshForQuote(Quote $quote): string
    {
        $template = $quote->terms_and_conditions;

        if (empty($template)) {
            $template = Setting::get('quotes.terms_and_conditions_template');
        }

        if (empty($template)) {
            return '';
        }

        $quote->calculateTotals();

        return $this->resolvePlaceholders($template, $quote);
    }

    /**
     * Replace template placeholders with actual quote data.
     * Requires calculateTotals() to have been called so deposit_amount is populated.
     */
    public function resolvePlaceholders(string $template, Quote $quote): string
    {
        // {validity_days}
        $validityDays = (int) (Setting::get('quotes.default_validity_days', 30) ?: 30);

        // {payment_terms}
        $paymentTermsText = '';
        if ($quote->payment_term_id) {
            $paymentTerm = $quote->load('paymentTerm')->paymentTerm;
            $paymentTermsText = $paymentTerm?->name ?? '';
        }
        if (empty($paymentTermsText) && ! empty($quote->payment_terms)) {
            $paymentTermsText = $quote->payment_terms;
        }

        // {deposit_info}
        if ($quote->deposit_percentage > 0) {
            $amountStr = $quote->deposit_amount > 0
                ? ' (€ '.number_format((float) $quote->deposit_amount, 2, ',', '.').')'
                : '';
            $depositInfo = 'È richiesto un acconto del '.$quote->deposit_percentage.'%'.$amountStr.'.';
        } elseif ($quote->deposit_amount > 0) {
            $depositInfo = 'È richiesto un acconto di € '.number_format((float) $quote->deposit_amount, 2, ',', '.').'.';
        } else {
            $depositInfo = '';
        }

        // {work_timeline}
        $timeline = '';
        if (! empty($quote->work_start_description)) {
            $timeline = $quote->work_start_description;
        } elseif ($quote->work_start_date) {
            $timeline = 'Inizio previsto: '.$quote->work_start_date->format('d/m/Y');
        }
        if (! empty($quote->work_duration_description)) {
            $timeline .= ($timeline ? '. ' : '').$quote->work_duration_description;
        } elseif ($quote->work_end_date) {
            $timeline .= ($timeline ? '. ' : '').'Fine prevista: '.$quote->work_end_date->format('d/m/Y');
        } elseif ($quote->event_days) {
            $timeline .= ($timeline ? '. ' : '').'Durata stimata: '.$quote->event_days.' giorni';
        }

        // {warranty_info}
        $warrantyText = '';
        if ($quote->warranty_type_id) {
            $warrantyType = $quote->load('warrantyType')->warrantyType;
            $warrantyText = $warrantyType?->name ?? '';
        }

        // {company_location}
        $companyLocation = Setting::get('company.city') ?? '';

        return strtr($template, [
            '{validity_days}' => $validityDays,
            '{payment_terms}' => $paymentTermsText ?: 'da concordare',
            '{deposit_info}' => $depositInfo,
            '{work_timeline}' => $timeline ?: 'da concordare',
            '{warranty_info}' => $warrantyText ?: 'come da normativa vigente',
            '{company_location}' => $companyLocation,
        ]);
    }
}
