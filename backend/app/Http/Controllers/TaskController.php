<?php

namespace App\Http\Controllers;

use App\Enums\TaskStatus;
use App\Http\Concerns\RespondsWithApi;
use App\Http\Requests\Tasks\IndexTaskRequest;
use App\Http\Requests\Tasks\StoreTaskRequest;
use App\Http\Requests\Tasks\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;

class TaskController extends Controller
{
    use RespondsWithApi;

    public function index(IndexTaskRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $perPage = (int) ($validated['per_page'] ?? 10);
        $sort = $validated['sort'] ?? 'created_at';
        $direction = $validated['direction'] ?? 'desc';

        $tasks = $this->baseTaskQuery()
            ->when(isset($validated['search']) && $validated['search'] !== '', function (Builder $query) use ($validated): void {
                $search = $validated['search'];
                $query->where(function (Builder $query) use ($search): void {
                    $this->caseInsensitiveWhere($query, 'title', $search);
                    $this->caseInsensitiveWhere($query, 'description', $search, 'or');
                    $query->orWhereHas('project', fn (Builder $query) => $this->caseInsensitiveWhere($query, 'name', $search));
                    $query->orWhereHas('assignee', function (Builder $query) use ($search): void {
                        $this->caseInsensitiveWhere($query, 'name', $search);
                        $this->caseInsensitiveWhere($query, 'email', $search, 'or');
                    });
                });
            })
            ->when(isset($validated['project_id']), fn (Builder $query) => $query->where('project_id', $validated['project_id']))
            ->when(isset($validated['client_id']), fn (Builder $query) => $query->whereHas('project', fn (Builder $query) => $query->where('client_id', $validated['client_id'])))
            ->when(isset($validated['assignee_id']), fn (Builder $query) => $query->where('assignee_id', $validated['assignee_id']))
            ->when(isset($validated['category']), fn (Builder $query) => $query->where('category', $validated['category']))
            ->when(isset($validated['status']), fn (Builder $query) => $query->where('status', $validated['status']))
            ->when(isset($validated['deadline_from']), fn (Builder $query) => $query->whereDate('deadline', '>=', $validated['deadline_from']))
            ->when(isset($validated['deadline_to']), fn (Builder $query) => $query->whereDate('deadline', '<=', $validated['deadline_to']))
            ->when(array_key_exists('overdue', $validated), function (Builder $query) use ($validated): void {
                $isOverdue = filter_var($validated['overdue'], FILTER_VALIDATE_BOOLEAN);

                if ($isOverdue) {
                    $query->whereDate('deadline', '<', today())->where('status', '!=', TaskStatus::DONE->value);

                    return;
                }

                $query->where(function (Builder $query): void {
                    $query->whereNull('deadline')->orWhereDate('deadline', '>=', today())->orWhere('status', TaskStatus::DONE->value);
                });
            })
            ->when(array_key_exists('unassigned', $validated), function (Builder $query) use ($validated): void {
                $isUnassigned = filter_var($validated['unassigned'], FILTER_VALIDATE_BOOLEAN);
                $isUnassigned ? $query->whereNull('assignee_id') : $query->whereNotNull('assignee_id');
            })
            ->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        return $this->paginatedResponse('Tasks retrieved successfully', TaskResource::collection($tasks), $tasks);
    }

    public function store(StoreTaskRequest $request): JsonResponse
    {
        $task = Task::query()->create($request->validated());
        $this->loadTaskForResponse($task);

        return $this->successResponse('Task created successfully', TaskResource::make($task)->resolve(), 201);
    }

    public function show(Task $task): JsonResponse
    {
        $this->loadTaskForResponse($task);

        return $this->successResponse('Task retrieved successfully', TaskResource::make($task)->resolve());
    }

    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        $task->update($request->validated());
        $this->loadTaskForResponse($task);

        return $this->successResponse('Task updated successfully', TaskResource::make($task)->resolve());
    }

    public function destroy(Task $task): JsonResponse
    {
        if ($task->progressLogs()->exists() || $task->timeLogs()->exists()) {
            return $this->taskDeleteConflictResponse();
        }

        try {
            $task->delete();
        } catch (QueryException) {
            return $this->taskDeleteConflictResponse();
        }

        return $this->successResponse('Task deleted successfully');
    }

    private function baseTaskQuery(): Builder
    {
        return Task::query()
            ->with(['project.client', 'assignee'])
            ->withCount(['progressLogs', 'timeLogs'])
            ->withSum('timeLogs', 'duration_minutes');
    }

    private function loadTaskForResponse(Task $task): void
    {
        $task->load(['project.client', 'assignee'])->loadCount(['progressLogs', 'timeLogs'])->loadSum('timeLogs', 'duration_minutes');
    }

    private function taskDeleteConflictResponse(): JsonResponse
    {
        return $this->errorResponse(
            'Task cannot be deleted because it has work history',
            ['task' => ['Remove the related progress and time logs before deleting this task.']],
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
