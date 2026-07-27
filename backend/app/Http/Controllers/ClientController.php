<?php

namespace App\Http\Controllers;

use App\Http\Concerns\RespondsWithApi;
use App\Http\Requests\Clients\IndexClientRequest;
use App\Http\Requests\Clients\StoreClientRequest;
use App\Http\Requests\Clients\UpdateClientRequest;
use App\Http\Resources\ClientResource;
use App\Models\Client;
use Illuminate\Database\QueryException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class ClientController extends Controller
{
    use RespondsWithApi;

    public function index(IndexClientRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $perPage = (int) ($validated['per_page'] ?? 10);
        $sort = $validated['sort'] ?? 'created_at';
        $direction = $validated['direction'] ?? 'desc';

        $clients = Client::query()
            ->withCount('projects')
            ->when(isset($validated['search']) && $validated['search'] !== '', function ($query) use ($validated): void {
                $search = $validated['search'];

                $query->where(function ($query) use ($search): void {
                    foreach (['name', 'contact', 'company'] as $column) {
                        $this->caseInsensitiveWhere($query, $column, $search, 'or');
                    }
                });
            })
            ->when(isset($validated['company']) && $validated['company'] !== '', function ($query) use ($validated): void {
                $this->caseInsensitiveWhere($query, 'company', $validated['company']);
            })
            ->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        return $this->paginatedResponse(
            'Clients retrieved successfully',
            ClientResource::collection($clients),
            $clients
        );
    }

    public function store(StoreClientRequest $request): JsonResponse
    {
        $client = Client::query()->create($request->validated())->loadCount('projects');

        return $this->successResponse('Client created successfully', ClientResource::make($client)->resolve(), 201);
    }

    public function show(Client $client): JsonResponse
    {
        $client->loadCount('projects');

        return $this->successResponse('Client retrieved successfully', ClientResource::make($client)->resolve());
    }

    public function update(UpdateClientRequest $request, Client $client): JsonResponse
    {
        $client->update($request->validated());
        $client->loadCount('projects');

        return $this->successResponse('Client updated successfully', ClientResource::make($client)->resolve());
    }

    public function destroy(Client $client): JsonResponse
    {
        if ($client->projects()->exists()) {
            return $this->clientDeleteConflictResponse();
        }

        try {
            $client->delete();
        } catch (QueryException) {
            return $this->clientDeleteConflictResponse();
        }

        return $this->successResponse('Client deleted successfully');
    }

    private function clientDeleteConflictResponse(): JsonResponse
    {
        return $this->errorResponse(
            'Client cannot be deleted because it still has related projects',
            [
                'projects' => [
                    'Remove or reassign the client projects before deleting this client.',
                ],
            ],
            409
        );
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
