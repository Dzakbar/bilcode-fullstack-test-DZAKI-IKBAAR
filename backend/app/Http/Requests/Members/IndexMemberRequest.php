<?php

namespace App\Http\Requests\Members;

use App\Enums\MemberProfession;
use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rule;

class IndexMemberRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'string', 'max:150'],
            'profession' => ['sometimes', 'string', Rule::enum(MemberProfession::class)],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $prepared = [];

        foreach (['search', 'profession'] as $field) {
            if ($this->has($field) && $this->input($field) !== null) {
                $prepared[$field] = strtolower(trim((string) $this->input($field)));
            }
        }

        $this->merge($prepared);
    }
}
