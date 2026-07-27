<?php

namespace App\Http\Requests\Projects;

use App\Enums\ProjectStatus;
use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rule;

class IndexProjectRequest extends ApiFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'string', 'max:200'],
            'client_id' => ['sometimes', 'integer', 'exists:clients,id'],
            'status' => ['sometimes', 'string', Rule::enum(ProjectStatus::class)],
            'deadline_from' => ['sometimes', 'date'],
            'deadline_to' => ['sometimes', 'date', 'after_or_equal:deadline_from'],
            'overdue' => ['sometimes', 'boolean'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'sort' => ['sometimes', 'string', Rule::in(['name', 'deadline', 'status', 'created_at', 'updated_at'])],
            'direction' => ['sometimes', 'string', Rule::in(['asc', 'desc'])],
        ];
    }

    protected function prepareForValidation(): void
    {
        $prepared = [];

        foreach (['search', 'status', 'sort', 'direction'] as $field) {
            if ($this->has($field) && $this->input($field) !== null) {
                $prepared[$field] = strtolower(trim((string) $this->input($field)));
            }
        }

        $this->merge($prepared);
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'client_id.exists' => 'The selected client does not exist.',
            'status' => 'The status field must be one of: planning, active, completed, cancelled.',
            'deadline_from.date' => 'The deadline from field must be a valid date.',
            'deadline_to.date' => 'The deadline to field must be a valid date.',
            'deadline_to.after_or_equal' => 'The deadline to field must be a date after or equal to deadline from.',
            'overdue.boolean' => 'The overdue field must be true or false.',
            'sort.in' => 'The sort field must be one of: name, deadline, status, created_at, updated_at.',
            'direction.in' => 'The direction field must be either asc or desc.',
        ];
    }
}
