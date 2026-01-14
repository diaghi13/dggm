# Collaboratori Module - Remaining Tasks

## ✅ COMPLETATO (Fase 1-2)
- 7 Enums
- 7 Migrations (eseguite con successo)
- 7 Models (Worker, Contractor, WorkerRate, WorkerPayrollData, ContractorRate, SiteLaborCost, SiteWorker)
- Site model esteso
- 17 Permissions in RoleAndPermissionSeeder
- 4 Services (WorkerService, RateCalculationService, CostAllocationService, ContractorService)
- WorkerController + StoreWorkerRequest

## 🚧 DA COMPLETARE

### FormRequests (3 rimanenti)
1. UpdateWorkerRequest - Come Store ma senza unique su tax_code/vat_number
2. StoreContractorRequest - Validation contractor
3. UpdateContractorRequest

### Resources (4)
1. WorkerResource - Hide payroll_data se no permission
2. WorkerRateResource
3. ContractorResource
4. SiteLaborCostResource

### Policies (3)
1. WorkerPolicy - view, viewAny, create, update, delete, viewPayroll
2. ContractorPolicy - standard CRUD
3. SiteLaborCostPolicy - approve permission

### Controllers (2 + endpoint aggiuntivi)
1. ContractorController - CRUD standard
2. SiteLaborCostController - gestione costi

### Routes
Registrare in routes/api.php:
- workers.* routes
- contractors.* routes  
- sites/{site}/labor-costs routes
- sites/{site}/workers routes

### Seeders (2)
1. ContractorSeeder - 2-3 cooperative esempio
2. WorkerSeeder - 3 employees, 2 freelance, 2 contractor workers

## COMANDI FINALI
```bash
php artisan db:seed --class=RoleAndPermissionSeeder
php artisan db:seed --class=ContractorSeeder  
php artisan db:seed --class=WorkerSeeder
./vendor/bin/pint
```
