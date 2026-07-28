<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Concerns\RespondsWithApi;
use App\Http\Requests\Members\IndexMemberRequest;
use App\Http\Resources\MemberResource;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class MemberController extends Controller
{
    use RespondsWithApi;

    public function index(IndexMemberRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $perPage = (int) ($validated['per_page'] ?? 25);

        $members = User::query()
            ->where('role', UserRole::MEMBER->value)
            ->withCount('assignedTasks')
            ->when(isset($validated['search']) && $validated['search'] !== '', function (Builder $query) use ($validated): void {
                $search = $validated['search'];
                $query->where(function (Builder $query) use ($search): void {
                    $this->caseInsensitiveWhere($query, 'name', $search, 'or');
                    $this->caseInsensitiveWhere($query, 'email', $search, 'or');
                });
            })
            ->when(isset($validated['profession']), fn (Builder $query) => $query->where('profession', $validated['profession']))
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();

        return $this->paginatedResponse('Members retrieved successfully', MemberResource::collection($members), $members);
    }

    private function caseInsensitiveWhere(Builder $query, string $column, string $value, string $boolean = 'and'): void
    {
        $pattern = "%{$value}%";

        if ($query->getConnection()->getDriverName() === 'pgsql') {
            $query->where($column, 'ILIKE', $pattern, $boolean);

            return;
        }

        $quotedColumn = $query->getQuery()->getGrammar()->wrap($column);
        $query->whereRaw("LOWER({$quotedColumn}) LIKE ?", [mb_strtolower($pattern)], $boolean);
    }
}
