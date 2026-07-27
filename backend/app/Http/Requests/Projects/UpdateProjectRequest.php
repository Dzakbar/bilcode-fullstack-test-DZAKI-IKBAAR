<?php

namespace App\Http\Requests\Projects;

use App\Enums\ProjectStatus;
use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rule;

class UpdateProjectRequest extends ApiFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'client_id' => ['sometimes', 'required', 'integer', 'exists:clients,id'],
            'name' => ['sometimes', 'required', 'string', 'max:200'],
            'brief' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'deadline' => ['sometimes', 'nullable', 'date'],
            'status' => ['sometimes', 'required', 'string', Rule::enum(ProjectStatus::class)],
        ];
    }

    protected function prepareForValidation(): void
    {
        $prepared = [];

        foreach (['name', 'brief', 'status'] as $field) {
            if ($this->has($field) && $this->input($field) !== null) {
                $prepared[$field] = trim((string) $this->input($field));
            }
        }

        if (isset($prepared['status'])) {
            $prepared['status'] = strtolower($prepared['status']);
        }

        $this->merge($prepared);
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'client_id.required' => 'The project client is required when provided.',
            'client_id.exists' => 'The selected client does not exist.',
            'name.required' => 'The project name is required when provided.',
            'name.max' => 'The project name may not be greater than 200 characters.',
            'brief.max' => 'The project brief may not be greater than 10000 characters.',
            'deadline.date' => 'The project deadline must be a valid date.',
            'status' => 'The status field must be one of: planning, active, completed, cancelled.',
        ];
    }
}
