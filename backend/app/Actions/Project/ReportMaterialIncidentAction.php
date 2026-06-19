<?php

namespace App\Actions\Project;

use App\Data\ReportIncidentData;
use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectMaterial;
use App\Domains\Project\Models\ProjectMaterialIncident;
use App\Events\MaterialIncidentReported;
use App\Services\IncidentBillingRuleService;
use Illuminate\Support\Facades\DB;

class ReportMaterialIncidentAction
{
    public function __construct(
        private readonly IncidentBillingRuleService $billingRuleService
    ) {}

    public function execute(ReportIncidentData $data, Project $project): ProjectMaterialIncident
    {
        return DB::transaction(function () use ($data, $project) {
            $material = ProjectMaterial::findOrFail($data->project_material_id);

            // Load quote relationship for context resolution
            if ($project->quote_id && ! $project->relationLoaded('quote')) {
                $project->load('quote');
            }

            $context = $this->billingRuleService->resolveProjectContext($project);
            $isChargeable = $this->billingRuleService->isChargeable($data->incident_type, $context);

            $chargeAmount = null;
            if ($isChargeable) {
                $unitCost = (float) ($material->actual_unit_cost ?? $material->planned_unit_cost ?? 0);
                $quantity = $data->quantity ?? (float) ($material->delivered_quantity ?? 1);
                $chargeAmount = $data->charge_amount ?? $this->billingRuleService->calculateChargeAmount(
                    $unitCost,
                    $quantity,
                    $data->damage_severity
                );
            }

            $chargeBasis = null;
            if ($isChargeable) {
                $chargeBasis = "Auto-calculated: {$context} context, severity: ".($data->damage_severity?->value ?? 'n/a');
            }

            $incident = ProjectMaterialIncident::create([
                'project_id' => $project->id,
                'project_material_id' => $data->project_material_id,
                'reported_by_user_id' => auth()->id(),
                'incident_type' => $data->incident_type,
                'damage_severity' => $data->damage_severity,
                'description' => $data->description,
                'incident_date' => $data->incident_date,
                'is_chargeable_to_client' => $isChargeable,
                'charge_amount' => $chargeAmount,
                'charge_basis' => $chargeBasis,
                'ddt_item_id' => $data->ddt_item_id,
            ]);

            MaterialIncidentReported::dispatch($incident);

            return $incident->load('projectMaterial.product', 'reportedBy');
        });
    }
}
