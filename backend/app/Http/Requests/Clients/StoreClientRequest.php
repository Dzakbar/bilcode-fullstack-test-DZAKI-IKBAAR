<?php

namespace App\Http\Requests\Clients;

use App\Http\Requests\ApiFormRequest;

class StoreClientRequest extends ApiFormRequest
{
    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'contact' => ['required', 'string', 'max:100'],
            'company' => ['nullable', 'string', 'max:150'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $prepared = [];

        foreach (['name', 'contact', 'company'] as $field) {
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
            'name.required' => 'The client name is required.',
            'name.max' => 'The client name may not be greater than 150 characters.',
            'contact.required' => 'The client contact is required.',
            'contact.max' => 'The client contact may not be greater than 100 characters.',
            'company.max' => 'The client company may not be greater than 150 characters.',
        ];
    }
}
