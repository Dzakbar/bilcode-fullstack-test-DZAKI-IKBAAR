# ProjectPulse Admin Clients API

Base URL for local Docker development:

```text
http://localhost:8000/api
```

All Client CRUD endpoints require an admin bearer token:

```http
Authorization: Bearer {{admin_token}}
```

Members receive HTTP `403`. Requests without a valid bearer token receive HTTP `401`.

## List clients

`GET /admin/clients`

Query parameters:

- `search`: optional string, searches `name`, `contact`, and `company`.
- `company`: optional string, filters by company.
- `per_page`: optional integer, default `10`, maximum `100`.
- `sort`: optional, one of `name`, `company`, `created_at`, `updated_at`; default `created_at`.
- `direction`: optional, one of `asc`, `desc`; default `desc`.

Success response:

```json
{
  "success": true,
  "message": "Clients retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "PT Example Indonesia",
      "contact": "081234567890",
      "company": "Example Group",
      "projects_count": 0,
      "created_at": "2026-07-27T10:00:00+00:00",
      "updated_at": "2026-07-27T10:00:00+00:00"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 10,
    "total": 1
  },
  "links": {
    "first": "http://localhost:8000/api/admin/clients?page=1",
    "last": "http://localhost:8000/api/admin/clients?page=1",
    "prev": null,
    "next": null
  }
}
```

## Create client

`POST /admin/clients`

Request:

```json
{
  "name": "PT Example Indonesia",
  "contact": "081234567890",
  "company": "Example Group"
}
```

Success response, HTTP `201`:

```json
{
  "success": true,
  "message": "Client created successfully",
  "data": {
    "id": 1,
    "name": "PT Example Indonesia",
    "contact": "081234567890",
    "company": "Example Group",
    "projects_count": 0,
    "created_at": "2026-07-27T10:00:00+00:00",
    "updated_at": "2026-07-27T10:00:00+00:00"
  }
}
```

Validation response, HTTP `422`:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "name": ["The client name is required."],
    "contact": ["The client contact is required."]
  }
}
```

## Show client

`GET /admin/clients/{client}`

Success response:

```json
{
  "success": true,
  "message": "Client retrieved successfully",
  "data": {
    "id": 1,
    "name": "PT Example Indonesia",
    "contact": "081234567890",
    "company": "Example Group",
    "projects_count": 0,
    "created_at": "2026-07-27T10:00:00+00:00",
    "updated_at": "2026-07-27T10:00:00+00:00"
  }
}
```

Not found response, HTTP `404`:

```json
{
  "success": false,
  "message": "Resource not found.",
  "errors": {}
}
```

## Update client

`PUT /admin/clients/{client}`

`PATCH /admin/clients/{client}`

Partial updates are supported. Omitted fields are preserved.

Request:

```json
{
  "contact": "client-updated@example.test"
}
```

Success response:

```json
{
  "success": true,
  "message": "Client updated successfully",
  "data": {
    "id": 1,
    "name": "PT Example Indonesia",
    "contact": "client-updated@example.test",
    "company": "Example Group",
    "projects_count": 0,
    "created_at": "2026-07-27T10:00:00+00:00",
    "updated_at": "2026-07-27T10:05:00+00:00"
  }
}
```

## Delete client

`DELETE /admin/clients/{client}`

Clients with related projects cannot be deleted. Reassign or delete related projects first.

Success response:

```json
{
  "success": true,
  "message": "Client deleted successfully",
  "data": {}
}
```

Conflict response, HTTP `409`:

```json
{
  "success": false,
  "message": "Client cannot be deleted because it still has related projects",
  "errors": {
    "projects": [
      "Remove or reassign the client projects before deleting this client."
    ]
  }
}
```

## Shared auth errors

Unauthenticated, HTTP `401`:

```json
{
  "success": false,
  "message": "Unauthenticated.",
  "errors": {}
}
```

Forbidden, HTTP `403`:

```json
{
  "success": false,
  "message": "Forbidden.",
  "errors": {}
}
```
