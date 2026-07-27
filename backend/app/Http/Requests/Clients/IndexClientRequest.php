<?php

namespace App\Http\Requests\Clients;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rule;

class IndexClientRequest extends ApiFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'string', 'max:150'],
            'company' => ['sometimes', 'string', 'max:150'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'sort' => ['sometimes', 'string', Rule::in(['name', 'company', 'created_at', 'updated_at'])],
            'direction' => ['sometimes', 'string', Rule::in(['asc', 'desc'])],
        ];
    }

    protected function prepareForValidation(): void
    {
        $prepared = [];

        foreach (['search', 'company'] as $field) {
            if ($this->has($field) && $this->input($field) !== null) {
                $prepared[$field] = trim((string) $this->input($field));
            }
        }

        foreach (['sort', 'direction'] as $field) {
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
            'sort.in' => 'The sort field must be one of: name, company, created_at, updated_at.',
            'direction.in' => 'The direction field must be either asc or desc.',
        ];
    }
}
