<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\ApiFormRequest;

class MemberLoginRequest extends ApiFormRequest
{
    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['required', 'string', 'max:100'],
        ];
    }

    public function deviceName(): string
    {
        return trim((string) $this->input('device_name'));
    }
}
