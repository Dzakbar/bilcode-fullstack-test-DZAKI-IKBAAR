<?php

namespace App\Http\Requests\Tasks;

use App\Enums\TaskCategory;
use App\Enums\TaskStatus;
use App\Enums\UserRole;
use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rule;

class IndexTaskRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'string', 'max:200'],
            'project_id' => ['sometimes', 'integer', 'exists:projects,id'],
            'client_id' => ['sometimes', 'integer', 'exists:clients,id'],
            'assignee_id' => ['sometimes', 'integer', Rule::exists('users', 'id')->where('role', UserRole::MEMBER->value)],
            'category' => ['sometimes', 'string', Rule::enum(TaskCategory::class)],
            'status' => ['sometimes', 'string', Rule::enum(TaskStatus::class)],
            'deadline_from' => ['sometimes', 'date'],
            'deadline_to' => ['sometimes', 'date', 'after_or_equal:deadline_from'],
            'overdue' => ['sometimes', 'boolean'],
            'unassigned' => ['sometimes', 'boolean'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'sort' => ['sometimes', 'string', Rule::in(['title', 'deadline', 'status', 'category', 'estimated_effort', 'created_at', 'updated_at'])],
            'direction' => ['sometimes', 'string', Rule::in(['asc', 'desc'])],
        ];
    }

    protected function prepareForValidation(): void
    {
        $prepared = [];

        foreach (['search', 'category', 'status', 'sort', 'direction'] as $field) {
            if ($this->has($field) && $this->input($field) !== null) {
                $prepared[$field] = strtolower(trim((string) $this->input($field)));
            }
        }

        foreach (['overdue', 'unassigned'] as $field) {
            if ($this->has($field) && is_string($this->input($field))) {
                $value = strtolower(trim((string) $this->input($field)));
                if (in_array($value, ['true', 'false'], true)) {
                    $prepared[$field] = $value === 'true';
                }
            }
        }

        $this->merge($prepared);
    }

    public function messages(): array
    {
        return [
            'project_id.exists' => 'The selected project does not exist.',
            'client_id.exists' => 'The selected client does not exist.',
            'assignee_id.exists' => 'The selected assignee must be a member user.',
            'category' => 'The category field must be one of: frontend, backend, design, qa.',
            'status' => 'The status field must be one of: todo, in_progress, review, done.',
            'deadline_to.after_or_equal' => 'The deadline to field must be a date after or equal to deadline from.',
            'overdue.boolean' => 'The overdue field must be true or false.',
            'unassigned.boolean' => 'The unassigned field must be true or false.',
            'sort.in' => 'The sort field must be one of: title, deadline, status, category, estimated_effort, created_at, updated_at.',
            'direction.in' => 'The direction field must be either asc or desc.',
        ];
    }
}
