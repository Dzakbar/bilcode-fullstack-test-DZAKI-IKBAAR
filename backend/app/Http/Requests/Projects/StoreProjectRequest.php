<?php

namespace App\Http\Requests\Projects;

use App\Enums\ProjectStatus;
use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rule;

class StoreProjectRequest extends ApiFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'name' => ['required', 'string', 'max:200'],
            'brief' => ['nullable', 'string', 'max:10000'],
            'deadline' => ['nullable', 'date'],
            'status' => ['sometimes', 'string', Rule::enum(ProjectStatus::class)],
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
     * @return array<string, mixed>
     */
    public function validated($key = null, $default = null)
    {
        $validated = parent::validated($key, $default);

        if ($key !== null) {
            return $validated;
        }

        $validated['status'] ??= ProjectStatus::PLANNING->value;

        return $validated;
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'client_id.required' => 'The project client is required.',
            'client_id.exists' => 'The selected client does not exist.',
            'name.required' => 'The project name is required.',
            'name.max' => 'The project name may not be greater than 200 characters.',
            'brief.max' => 'The project brief may not be greater than 10000 characters.',
            'deadline.date' => 'The project deadline must be a valid date.',
            'status' => 'The status field must be one of: planning, active, completed, cancelled.',
        ];
    }
}
