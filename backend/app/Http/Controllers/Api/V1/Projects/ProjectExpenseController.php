<?php

namespace App\Http\Controllers\Api\V1\Projects;

use App\Actions\Project\ApproveProjectExpenseAction;
use App\Actions\Project\CreateProjectExpenseAction;
use App\Actions\Project\RejectProjectExpenseAction;
use App\Domains\Project\Data\ProjectExpenseData;
use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectExpense;
use App\Enums\ProjectExpenseStatus;
use App\Http\Controllers\Controller;
use App\Queries\Project\GetProjectExpenseSummaryQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectExpenseController extends Controller
{
    /**
     * List all expenses for a project.
     */
    public function index(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $query = ProjectExpense::query()
            ->where('project_id', $project->id)
            ->with(['submittedBy', 'approvedBy', 'projectWorker'])
            ->when($request->status, fn ($q, $status) => $q->where('status', $status)
            )
            ->when($request->category, fn ($q, $category) => $q->where('category', $category)
            )
            ->orderByDesc('expense_date');

        $expenses = $query->paginate($request->integer('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => ProjectExpenseData::collect($expenses->items()),
            'meta' => [
                'current_page' => $expenses->currentPage(),
                'total' => $expenses->total(),
            ],
        ]);
    }

    /**
     * Submit a new expense (PM or worker).
     */
    public function store(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $validated = $request->validate([
            'project_worker_id' => ['nullable', 'integer', 'exists:project_workers,id'],
            'category' => ['required', 'string'],
            'description' => ['required', 'string', 'max:500'],
            'amount' => ['required', 'numeric', 'min:0'],
            'expense_date' => ['required', 'date'],
            'is_billable_to_client' => ['boolean'],
            'receipt_media_id' => ['nullable', 'integer'],
            'notes' => ['nullable', 'string'],
        ]);

        $expense = app(CreateProjectExpenseAction::class)->execute(
            $project,
            $validated,
            auth()->id()
        );

        return response()->json([
            'success' => true,
            'data' => ProjectExpenseData::fromModel($expense),
        ], 201);
    }

    /**
     * Show a single expense.
     */
    public function show(ProjectExpense $projectExpense): JsonResponse
    {
        $this->authorize('view', $projectExpense->project);

        $projectExpense->load(['submittedBy', 'approvedBy', 'projectWorker.worker']);

        return response()->json([
            'success' => true,
            'data' => ProjectExpenseData::fromModel($projectExpense),
        ]);
    }

    /**
     * Update a draft expense (submitter only, while still in Draft status).
     */
    public function update(Request $request, ProjectExpense $projectExpense): JsonResponse
    {
        $this->authorize('view', $projectExpense->project);

        abort_if(
            $projectExpense->status !== ProjectExpenseStatus::Draft,
            422,
            'Only draft expenses can be edited.'
        );
        abort_if(
            $projectExpense->submitted_by_user_id !== auth()->id(),
            403,
            'Only the submitter can edit this expense.'
        );

        $validated = $request->validate([
            'category' => ['nullable', 'string'],
            'description' => ['nullable', 'string', 'max:500'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'expense_date' => ['nullable', 'date'],
            'is_billable_to_client' => ['boolean'],
            'notes' => ['nullable', 'string'],
        ]);

        $projectExpense->update($validated);

        return response()->json([
            'success' => true,
            'data' => ProjectExpenseData::fromModel($projectExpense->fresh()),
        ]);
    }

    /**
     * PM approves a submitted expense.
     */
    public function approve(ProjectExpense $projectExpense): JsonResponse
    {
        $this->authorize('update', $projectExpense->project);

        abort_if(
            $projectExpense->status !== ProjectExpenseStatus::Submitted,
            422,
            'Only submitted expenses can be approved.'
        );

        $expense = app(ApproveProjectExpenseAction::class)->execute($projectExpense, auth()->id());

        return response()->json([
            'success' => true,
            'data' => ProjectExpenseData::fromModel($expense),
        ]);
    }

    /**
     * PM rejects a submitted expense.
     */
    public function reject(Request $request, ProjectExpense $projectExpense): JsonResponse
    {
        $this->authorize('update', $projectExpense->project);

        abort_if(
            $projectExpense->status !== ProjectExpenseStatus::Submitted,
            422,
            'Only submitted expenses can be rejected.'
        );

        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:500'],
        ]);

        $expense = app(RejectProjectExpenseAction::class)->execute(
            $projectExpense,
            auth()->id(),
            $validated['rejection_reason']
        );

        return response()->json([
            'success' => true,
            'data' => ProjectExpenseData::fromModel($expense),
        ]);
    }

    /**
     * Return expense totals grouped by category with variance vs budget.
     */
    public function summary(Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $summary = app(GetProjectExpenseSummaryQuery::class, ['project' => $project])->execute();

        return response()->json([
            'success' => true,
            'data' => $summary,
        ]);
    }

    /**
     * Upload or replace the receipt for an expense.
     */
    public function uploadReceipt(Request $request, ProjectExpense $projectExpense): JsonResponse
    {
        $this->authorize('update', $projectExpense->project);

        $request->validate([
            'receipt' => ['required', 'file', 'max:10240', 'mimes:jpg,jpeg,png,webp,gif,pdf'],
        ]);

        // Replace any existing receipt
        $projectExpense->clearMediaCollection('receipts');
        $media = $projectExpense->addMediaFromRequest('receipt')
            ->toMediaCollection('receipts');

        $projectExpense->update(['receipt_media_id' => $media->id]);

        return response()->json([
            'success' => true,
            'data' => [
                'media_id' => $media->id,
                'receipt_url' => $media->getUrl(),
                'file_name' => $media->file_name,
                'mime_type' => $media->mime_type,
                'size' => $media->size,
            ],
        ]);
    }

    /**
     * Remove the receipt from an expense.
     */
    public function deleteReceipt(ProjectExpense $projectExpense): JsonResponse
    {
        $this->authorize('update', $projectExpense->project);

        $projectExpense->clearMediaCollection('receipts');
        $projectExpense->update(['receipt_media_id' => null]);

        return response()->json(['success' => true]);
    }

    /**
     * Delete a draft expense.
     */
    public function destroy(ProjectExpense $projectExpense): JsonResponse
    {
        $this->authorize('view', $projectExpense->project);

        abort_if(
            $projectExpense->status !== ProjectExpenseStatus::Draft,
            422,
            'Only draft expenses can be deleted.'
        );
        abort_if(
            $projectExpense->submitted_by_user_id !== auth()->id(),
            403,
            'Only the submitter can delete this expense.'
        );

        $projectExpense->delete();

        return response()->json(['success' => true], 204);
    }
}
