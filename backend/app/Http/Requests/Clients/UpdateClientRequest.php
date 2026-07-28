<?php

namespace App\Http\Requests\Clients;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rule;

class UpdateClientRequest extends ApiFormRequest
{
    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:150',
                Rule::unique('clients', 'email')->ignore($this->route('client')),
            ],
            'company' => ['sometimes', 'nullable', 'string', 'max:150'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $prepared = [];

        foreach (['name', 'email', 'company'] as $field) {
            if ($this->has($field) && $this->input($field) !== null) {
                $prepared[$field] = trim((string) $this->input($field));
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
            'name.required' => 'The client name is required when provided.',
            'name.max' => 'The client name may not be greater than 150 characters.',
            'email.required' => 'The client email is required when provided.',
            'email.email' => 'The client email must be a valid email address.',
            'email.unique' => 'The client email has already been taken.',
            'email.max' => 'The client email may not be greater than 150 characters.',
            'company.max' => 'The client company may not be greater than 150 characters.',
        ];
    }
}
