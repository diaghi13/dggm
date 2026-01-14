<?php

namespace Database\Seeders;

use App\Enums\ContractType;
use App\Enums\PayrollFrequency;
use App\Enums\RateContext;
use App\Enums\RateType;
use App\Enums\WorkerType;
use App\Models\Contractor;
use App\Models\Worker;
use Illuminate\Database\Seeder;

class WorkerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get contractors for contractor workers
        $cooperativa = Contractor::where('company_name', 'Cooperativa Edile Roma')->first();

        // ========================================
        // 1. EMPLOYEES (3 dipendenti)
        // ========================================

        // Employee 1: Caposquadra a tempo indeterminato
        $employee1 = Worker::create([
            'worker_type' => WorkerType::Employee,
            'contract_type' => ContractType::Permanent,
            'first_name' => 'Marco',
            'last_name' => 'Esposito',
            'tax_code' => 'SPSMRC85M01H501Z',
            'vat_number' => null,
            'birth_date' => '1985-08-01',
            'birth_place' => 'Roma',
            'email' => 'marco.esposito@example.com',
            'phone' => '+39 06 1111111',
            'mobile' => '+39 333 1111111',
            'address' => 'Via Roma, 10',
            'city' => 'Roma',
            'province' => 'RM',
            'postal_code' => '00100',
            'country' => 'IT',
            'contractor_company_id' => null,
            'user_id' => null,
            'hire_date' => now()->subYears(5),
            'termination_date' => null,
            'contract_end_date' => null,
            'job_title' => 'Caposquadra',
            'job_level' => 'Livello 4',
            'specializations' => ['Muratura', 'Gestione squadra', 'Sicurezza cantiere'],
            'certifications' => ['Formazione sicurezza 40h', 'Patentino gru'],
            'is_active' => true,
            'can_drive_company_vehicles' => true,
            'has_safety_training' => true,
            'safety_training_expires_at' => now()->addYear(),
            'notes' => 'Caposquadra esperto con 15 anni di esperienza',
            'internal_notes' => 'Ottimo rapporto con i clienti',
        ]);

        // Payroll data per employee 1
        $employee1->payrollData()->create([
            'gross_monthly_salary' => 2500.00,
            'net_monthly_salary' => 1800.00,
            'contract_level' => 'Livello 4 CCNL Edilizia',
            'ccnl_type' => 'CCNL Edilizia Industria',
            'payroll_frequency' => PayrollFrequency::Monthly,
            'inps_percentage' => 9.19,
            'inail_percentage' => 3.50,
            'irpef_percentage' => 23.00,
            'meal_voucher_amount' => 8.00,
            'transport_allowance' => 50.00,
            'iban' => 'IT60X0542811101000001111111',
            'bank_name' => 'Intesa Sanpaolo',
            'notes' => 'TFR accantonato regolarmente',
        ]);

        // Rates per employee 1 (dual rate: payroll + internal cost)
        $employee1->rates()->createMany([
            [
                'rate_type' => RateType::Monthly,
                'context' => RateContext::Payroll,
                'rate_amount' => 2500.00,
                'currency' => 'EUR',
                'project_type' => null,
                'overtime_multiplier' => 1.5,
                'holiday_multiplier' => 2.0,
                'valid_from' => now()->subYears(1),
                'valid_to' => null,
                'notes' => 'Stipendio mensile lordo',
            ],
            [
                'rate_type' => RateType::Hourly,
                'context' => RateContext::InternalCost,
                'rate_amount' => 22.00,
                'currency' => 'EUR',
                'project_type' => null,
                'overtime_multiplier' => 1.5,
                'holiday_multiplier' => 2.0,
                'valid_from' => now()->subYears(1),
                'valid_to' => null,
                'notes' => 'Tariffa oraria per allocazione costi cantiere',
            ],
            [
                'rate_type' => RateType::Hourly,
                'context' => RateContext::CustomerBilling,
                'rate_amount' => 45.00,
                'currency' => 'EUR',
                'project_type' => null,
                'overtime_multiplier' => 1.5,
                'holiday_multiplier' => 2.0,
                'valid_from' => now()->subYears(1),
                'valid_to' => null,
                'notes' => 'Tariffa oraria fatturazione cliente',
            ],
        ]);

        // Employee 2: Operaio specializzato a tempo indeterminato
        $employee2 = Worker::create([
            'worker_type' => WorkerType::Employee,
            'contract_type' => ContractType::Permanent,
            'first_name' => 'Luca',
            'last_name' => 'Ferrari',
            'tax_code' => 'FRRLCU90T15H501A',
            'vat_number' => null,
            'birth_date' => '1990-12-15',
            'birth_place' => 'Milano',
            'email' => 'luca.ferrari@example.com',
            'phone' => '+39 02 2222222',
            'mobile' => '+39 335 2222222',
            'address' => 'Via Milano, 25',
            'city' => 'Milano',
            'province' => 'MI',
            'postal_code' => '20100',
            'country' => 'IT',
            'contractor_company_id' => null,
            'user_id' => null,
            'hire_date' => now()->subYears(3),
            'termination_date' => null,
            'contract_end_date' => null,
            'job_title' => 'Muratore Specializzato',
            'job_level' => 'Livello 3',
            'specializations' => ['Muratura', 'Intonacatura', 'Piastrellista'],
            'certifications' => ['Formazione sicurezza 40h'],
            'is_active' => true,
            'can_drive_company_vehicles' => false,
            'has_safety_training' => true,
            'safety_training_expires_at' => now()->addMonths(6),
            'notes' => 'Ottimo muratore con attenzione ai dettagli',
        ]);

        $employee2->payrollData()->create([
            'gross_monthly_salary' => 2000.00,
            'net_monthly_salary' => 1500.00,
            'contract_level' => 'Livello 3 CCNL Edilizia',
            'ccnl_type' => 'CCNL Edilizia Industria',
            'payroll_frequency' => PayrollFrequency::Monthly,
            'inps_percentage' => 9.19,
            'inail_percentage' => 3.50,
            'irpef_percentage' => 23.00,
            'meal_voucher_amount' => 8.00,
            'transport_allowance' => 50.00,
            'iban' => 'IT60X0542811101000002222222',
            'bank_name' => 'UniCredit',
        ]);

        $employee2->rates()->createMany([
            [
                'rate_type' => RateType::Monthly,
                'context' => RateContext::Payroll,
                'rate_amount' => 2000.00,
                'currency' => 'EUR',
                'overtime_multiplier' => 1.5,
                'holiday_multiplier' => 2.0,
                'valid_from' => now()->subYears(1),
                'valid_to' => null,
            ],
            [
                'rate_type' => RateType::Hourly,
                'context' => RateContext::InternalCost,
                'rate_amount' => 18.00,
                'currency' => 'EUR',
                'overtime_multiplier' => 1.5,
                'holiday_multiplier' => 2.0,
                'valid_from' => now()->subYears(1),
                'valid_to' => null,
            ],
            [
                'rate_type' => RateType::Hourly,
                'context' => RateContext::CustomerBilling,
                'rate_amount' => 35.00,
                'currency' => 'EUR',
                'overtime_multiplier' => 1.5,
                'holiday_multiplier' => 2.0,
                'valid_from' => now()->subYears(1),
                'valid_to' => null,
            ],
        ]);

        // Employee 3: Operaio generico a tempo determinato
        $employee3 = Worker::create([
            'worker_type' => WorkerType::Employee,
            'contract_type' => ContractType::FixedTerm,
            'first_name' => 'Antonio',
            'last_name' => 'Romano',
            'tax_code' => 'RMNNTN92H10H501B',
            'vat_number' => null,
            'birth_date' => '1992-06-10',
            'birth_place' => 'Napoli',
            'email' => 'antonio.romano@example.com',
            'phone' => null,
            'mobile' => '+39 340 3333333',
            'address' => 'Via Napoli, 5',
            'city' => 'Napoli',
            'province' => 'NA',
            'postal_code' => '80100',
            'country' => 'IT',
            'contractor_company_id' => null,
            'user_id' => null,
            'hire_date' => now()->subMonths(6),
            'termination_date' => null,
            'contract_end_date' => now()->addMonths(6),
            'job_title' => 'Operaio Generico',
            'job_level' => 'Livello 2',
            'specializations' => ['Manovalanza', 'Carico/scarico'],
            'certifications' => ['Formazione sicurezza 16h'],
            'is_active' => true,
            'can_drive_company_vehicles' => false,
            'has_safety_training' => true,
            'safety_training_expires_at' => now()->addMonths(10),
        ]);

        $employee3->payrollData()->create([
            'gross_monthly_salary' => 1600.00,
            'net_monthly_salary' => 1250.00,
            'contract_level' => 'Livello 2 CCNL Edilizia',
            'ccnl_type' => 'CCNL Edilizia Industria',
            'payroll_frequency' => PayrollFrequency::Monthly,
            'inps_percentage' => 9.19,
            'inail_percentage' => 3.50,
            'irpef_percentage' => 23.00,
            'meal_voucher_amount' => 8.00,
            'iban' => 'IT60X0542811101000003333333',
            'bank_name' => 'Banco BPM',
        ]);

        $employee3->rates()->createMany([
            [
                'rate_type' => RateType::Monthly,
                'context' => RateContext::Payroll,
                'rate_amount' => 1600.00,
                'currency' => 'EUR',
                'overtime_multiplier' => 1.5,
                'holiday_multiplier' => 2.0,
                'valid_from' => now()->subMonths(6),
                'valid_to' => null,
            ],
            [
                'rate_type' => RateType::Hourly,
                'context' => RateContext::InternalCost,
                'rate_amount' => 15.00,
                'currency' => 'EUR',
                'overtime_multiplier' => 1.5,
                'holiday_multiplier' => 2.0,
                'valid_from' => now()->subMonths(6),
                'valid_to' => null,
            ],
            [
                'rate_type' => RateType::Hourly,
                'context' => RateContext::CustomerBilling,
                'rate_amount' => 28.00,
                'currency' => 'EUR',
                'overtime_multiplier' => 1.5,
                'holiday_multiplier' => 2.0,
                'valid_from' => now()->subMonths(6),
                'valid_to' => null,
            ],
        ]);

        // ========================================
        // 2. FREELANCERS (2 freelance)
        // ========================================

        $freelancer1 = Worker::create([
            'worker_type' => WorkerType::Freelancer,
            'contract_type' => ContractType::ProjectBased,
            'first_name' => 'Giulia',
            'last_name' => 'Ricci',
            'tax_code' => 'RCCGLI88D50H501C',
            'vat_number' => '12345678902',
            'birth_date' => '1988-04-10',
            'birth_place' => 'Firenze',
            'email' => 'giulia.ricci@pec.it',
            'phone' => '+39 055 4444444',
            'mobile' => '+39 347 4444444',
            'address' => 'Via Firenze, 30',
            'city' => 'Firenze',
            'province' => 'FI',
            'postal_code' => '50100',
            'country' => 'IT',
            'contractor_company_id' => null,
            'user_id' => null,
            'hire_date' => now()->subYear(),
            'termination_date' => null,
            'contract_end_date' => null,
            'job_title' => 'Geometra Freelance',
            'job_level' => null,
            'specializations' => ['Rilievi', 'Progettazione', 'Direzione lavori'],
            'certifications' => ['Iscrizione Albo Geometri'],
            'is_active' => true,
            'can_drive_company_vehicles' => false,
            'has_safety_training' => true,
            'safety_training_expires_at' => now()->addYear(),
            'notes' => 'Collabora su base progetto per rilievi e direzione lavori',
        ]);

        $freelancer1->rates()->createMany([
            [
                'rate_type' => RateType::Daily,
                'context' => RateContext::InternalCost,
                'rate_amount' => 350.00,
                'currency' => 'EUR',
                'overtime_multiplier' => 1.0,
                'holiday_multiplier' => 1.0,
                'valid_from' => now()->subYear(),
                'valid_to' => null,
                'notes' => 'Tariffa giornaliera freelance',
            ],
            [
                'rate_type' => RateType::FixedProject,
                'context' => RateContext::InternalCost,
                'rate_amount' => 2500.00,
                'currency' => 'EUR',
                'project_type' => 'Rilievo completo',
                'overtime_multiplier' => 1.0,
                'holiday_multiplier' => 1.0,
                'valid_from' => now()->subYear(),
                'valid_to' => null,
                'notes' => 'Forfait per rilievo completo di piccola abitazione',
            ],
        ]);

        $freelancer2 = Worker::create([
            'worker_type' => WorkerType::Freelancer,
            'contract_type' => ContractType::ProjectBased,
            'first_name' => 'Stefano',
            'last_name' => 'Conti',
            'tax_code' => 'CNTSFN80L20H501D',
            'vat_number' => '98765432108',
            'birth_date' => '1980-07-20',
            'birth_place' => 'Bologna',
            'email' => 'stefano.conti@pec.it',
            'phone' => '+39 051 5555555',
            'mobile' => '+39 349 5555555',
            'address' => 'Via Bologna, 12',
            'city' => 'Bologna',
            'province' => 'BO',
            'postal_code' => '40100',
            'country' => 'IT',
            'contractor_company_id' => null,
            'user_id' => null,
            'hire_date' => now()->subMonths(8),
            'termination_date' => null,
            'contract_end_date' => null,
            'job_title' => 'Elettricista Autonomo',
            'job_level' => null,
            'specializations' => ['Impianti elettrici', 'Domotica', 'Fotovoltaico'],
            'certifications' => ['CEI 11-27', 'PES-PAV'],
            'is_active' => true,
            'can_drive_company_vehicles' => false,
            'has_safety_training' => true,
            'safety_training_expires_at' => now()->addMonths(4),
            'notes' => 'Specialista in impianti elettrici e domotica',
        ]);

        $freelancer2->rates()->createMany([
            [
                'rate_type' => RateType::Hourly,
                'context' => RateContext::InternalCost,
                'rate_amount' => 45.00,
                'currency' => 'EUR',
                'overtime_multiplier' => 1.0,
                'holiday_multiplier' => 1.0,
                'valid_from' => now()->subMonths(8),
                'valid_to' => null,
            ],
            [
                'rate_type' => RateType::FixedProject,
                'context' => RateContext::InternalCost,
                'rate_amount' => 3500.00,
                'currency' => 'EUR',
                'project_type' => 'Impianto elettrico completo',
                'overtime_multiplier' => 1.0,
                'holiday_multiplier' => 1.0,
                'valid_from' => now()->subMonths(8),
                'valid_to' => null,
                'notes' => 'Forfait per impianto elettrico completo appartamento 100mq',
            ],
        ]);

        // ========================================
        // 3. CONTRACTOR WORKERS (2 operai da cooperativa)
        // ========================================

        if ($cooperativa) {
            $contractorWorker1 = Worker::create([
                'worker_type' => WorkerType::ContractorCompany,
                'contract_type' => ContractType::Seasonal,
                'first_name' => 'Paolo',
                'last_name' => 'Russo',
                'tax_code' => 'RSSMRC87A01H501E',
                'vat_number' => null,
                'birth_date' => '1987-01-01',
                'birth_place' => 'Roma',
                'email' => null,
                'phone' => null,
                'mobile' => '+39 338 6666666',
                'address' => null,
                'city' => 'Roma',
                'province' => 'RM',
                'postal_code' => '00150',
                'country' => 'IT',
                'contractor_company_id' => $cooperativa->id,
                'user_id' => null,
                'hire_date' => now()->subMonths(3),
                'termination_date' => null,
                'contract_end_date' => now()->addMonths(9),
                'job_title' => 'Operaio Cooperativa',
                'job_level' => null,
                'specializations' => ['Muratura', 'Manovalanza'],
                'certifications' => ['Formazione sicurezza 16h'],
                'is_active' => true,
                'can_drive_company_vehicles' => false,
                'has_safety_training' => true,
                'safety_training_expires_at' => now()->addMonths(9),
                'notes' => 'Operaio tramite Cooperativa Edile Roma',
            ]);

            $contractorWorker2 = Worker::create([
                'worker_type' => WorkerType::ContractorCompany,
                'contract_type' => ContractType::Seasonal,
                'first_name' => 'Francesco',
                'last_name' => 'Marino',
                'tax_code' => 'MRNFNC89B15H501F',
                'vat_number' => null,
                'birth_date' => '1989-02-15',
                'birth_place' => 'Roma',
                'email' => null,
                'phone' => null,
                'mobile' => '+39 339 7777777',
                'address' => null,
                'city' => 'Roma',
                'province' => 'RM',
                'postal_code' => '00160',
                'country' => 'IT',
                'contractor_company_id' => $cooperativa->id,
                'user_id' => null,
                'hire_date' => now()->subMonths(3),
                'termination_date' => null,
                'contract_end_date' => now()->addMonths(9),
                'job_title' => 'Muratore Cooperativa',
                'job_level' => null,
                'specializations' => ['Muratura', 'Intonacatura'],
                'certifications' => ['Formazione sicurezza 16h'],
                'is_active' => true,
                'can_drive_company_vehicles' => false,
                'has_safety_training' => true,
                'safety_training_expires_at' => now()->addMonths(9),
                'notes' => 'Muratore specializzato tramite Cooperativa Edile Roma',
            ]);
        }
    }
}
