<?php

namespace App\Http\Controllers;

use App\Enums\ProjectStatus;
use App\Http\Concerns\RespondsWithApi;
use App\Http\Requests\Projects\IndexProjectRequest;
use App\Http\Requests\Projects\StoreProjectRequest;
use App\Http\Requests\Projects\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;

class ProjectController extends Controller
{
    use RespondsWithApi;

    public function index(IndexProjectRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $perPage = (int) ($validated['per_page'] ?? 10);
        $sort = $validated['sort'] ?? 'created_at';
        $direction = $validated['direction'] ?? 'desc';

        $projects = Project::query()
            ->with('client')
            ->withCount('tasks')
            ->when(isset($validated['search']) && $validated['search'] !== '', function (Builder $query) use ($validated): void {
                $search = $validated['search'];

                $query->where(function (Builder $query) use ($search): void {
                    $this->caseInsensitiveWhere($query, 'name', $search);
                    $this->caseInsensitiveWhere($query, 'brief', $search, 'or');
                    $query->orWhereHas('client', function (Builder $query) use ($search): void {
                        $this->caseInsensitiveWhere($query, 'name', $search);
                        $this->caseInsensitiveWhere($query, 'company', $search, 'or');
                    });
                });
            })
            ->when(isset($validated['client_id']), fn (Builder $query) => $query->where('client_id', $validated['client_id']))
            ->when(isset($validated['status']), fn (Builder $query) => $query->where('status', $validated['status']))
            ->when(isset($validated['deadline_from']), fn (Builder $query) => $query->whereDate('deadline', '>=', $validated['deadline_from']))
            ->when(isset($validated['deadline_to']), fn (Builder $query) => $query->whereDate('deadline', '<=', $validated['deadline_to']))
            ->when(array_key_exists('overdue', $validated), function (Builder $query) use ($validated): void {
                $isOverdue = filter_var($validated['overdue'], FILTER_VALIDATE_BOOLEAN);

                if ($isOverdue) {
                    $query
                        ->whereDate('deadline', '<', today())
                        ->whereNotIn('status', [ProjectStatus::COMPLETED->value, ProjectStatus::CANCELLED->value]);

                    return;
                }

                $query->where(function (Builder $query): void {
                    $query
                        ->whereNull('deadline')
                        ->orWhereDate('deadline', '>=', today())
                        ->orWhereIn('status', [ProjectStatus::COMPLETED->value, ProjectStatus::CANCELLED->value]);
                });
            })
            ->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        return $this->paginatedResponse(
            'Projects retrieved successfully',
            ProjectResource::collection($projects),
            $projects
        );
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $project = Project::query()
            ->create($request->validated())
            ->load('client')
            ->loadCount('tasks');

        return $this->successResponse('Project created successfully', ProjectResource::make($project)->resolve(), 201);
    }

    public function show(Project $project): JsonResponse
    {
        $project->load('client')->loadCount('tasks');

        return $this->successResponse('Project retrieved successfully', ProjectResource::make($project)->resolve());
    }

    public function update(UpdateProjectRequest $request, Project $project): JsonResponse
    {
        $project->update($request->validated());
        $project->load('client')->loadCount('tasks');

        return $this->successResponse('Project updated successfully', ProjectResource::make($project)->resolve());
    }

    public function destroy(Project $project): JsonResponse
    {
        if ($project->tasks()->exists()) {
            return $this->projectDeleteConflictResponse();
        }

        try {
            $project->delete();
        } catch (QueryException) {
            return $this->projectDeleteConflictResponse();
        }

        return $this->successResponse('Project deleted successfully');
    }

    private function projectDeleteConflictResponse(): JsonResponse
    {
        return $this->errorResponse(
            'Project cannot be deleted because it still has related tasks',
            [
                'tasks' => [
                    'Remove or reassign the project tasks before deleting this project.',
                ],
            ],
            409
        );
    }

    private function caseInsensitiveWhere(Builder $query, string $column, string $value, string $boolean = 'and'): void
    {
        $pattern = "%{$value}%";

        if ($query->getConnection()->getDriverName() === 'pgsql') {
            $query->where($column, 'ILIKE', $pattern, $boolean);

            return;
        }

        $quotedColumn = $query->getQuery()->getGrammar()->wrap($column);
        $query->whereRaw("LOWER({$quotedColumn}) LIKE ?", [mb_strtolower($pattern)], $boolean);
    }
}
