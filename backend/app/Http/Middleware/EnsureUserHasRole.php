<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use App\Http\Concerns\RespondsWithApi;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    use RespondsWithApi;

    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return $this->errorResponse('Unauthenticated.', [], 401);
        }

        $allowedRoles = collect($roles)
            ->map(fn (string $role): ?string => UserRole::tryFrom($role)?->value)
            ->filter()
            ->values()
            ->all();

        $actualRole = $user->role instanceof UserRole ? $user->role->value : $user->role;

        if (! in_array($actualRole, $allowedRoles, true)) {
            return $this->errorResponse('Forbidden.', [], 403);
        }

        return $next($request);
    }
}
