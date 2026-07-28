<?php

namespace App\Http\Requests\Tasks;

use App\Enums\TaskCategory;
use App\Enums\TaskStatus;
use App\Enums\UserRole;
use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rule;

class UpdateTaskRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'project_id' => ['sometimes', 'required', 'integer', 'exists:projects,id'],
            'assignee_id' => ['sometimes', 'nullable', 'integer', Rule::exists('users', 'id')->where('role', UserRole::MEMBER->value)],
            'title' => ['sometimes', 'required', 'string', 'max:200'],
            'description' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'category' => ['sometimes', 'required', 'string', Rule::enum(TaskCategory::class)],
            'estimated_effort' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:1000'],
            'deadline' => ['sometimes', 'nullable', 'date'],
            'status' => ['sometimes', 'required', 'string', Rule::enum(TaskStatus::class)],
        ];
    }

    protected function prepareForValidation(): void
    {
        $prepared = [];

        foreach (['title', 'description', 'category', 'status'] as $field) {
            if ($this->has($field) && $this->input($field) !== null) {
                $prepared[$field] = trim((string) $this->input($field));
            }
        }

        foreach (['category', 'status'] as $field) {
            if (isset($prepared[$field])) {
                $prepared[$field] = strtolower($prepared[$field]);
            }
        }

        $this->merge($prepared);
    }

    public function messages(): array
    {
        return [
            'project_id.required' => 'The task project is required when provided.',
            'project_id.exists' => 'The selected project does not exist.',
            'assignee_id.exists' => 'The selected assignee must be a member user.',
            'title.required' => 'The task title is required when provided.',
            'title.max' => 'The task title may not be greater than 200 characters.',
            'description.max' => 'The task description may not be greater than 10000 characters.',
            'category.required' => 'The task category is required when provided.',
            'category' => 'The category field must be one of: frontend, backend, design, qa.',
            'estimated_effort.min' => 'The estimated effort must be at least 1 hour.',
            'estimated_effort.max' => 'The estimated effort may not be greater than 1000 hours.',
            'deadline.date' => 'The task deadline must be a valid date.',
            'status' => 'The status field must be one of: todo, in_progress, review, done.',
        ];
    }
}
