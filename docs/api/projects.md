# ProjectPulse Admin Projects API

Base URL for local Docker development:

```text
http://localhost:8000/api
```

All Project CRUD endpoints require an admin bearer token:

```http
Authorization: Bearer {{admin_token}}
```

Members receive HTTP `403`. Requests without a valid bearer token receive HTTP `401`.

Project `brief` is stored for a later AI-assisted task breakdown feature. Creating or updating a project does not call an LLM and does not automatically create tasks.

## List projects

`GET /admin/projects`

Query parameters:

- `search`: optional string, searches project `name`, `brief`, client `name`, and client `company`.
- `client_id`: optional integer, exact client filter.
- `status`: optional, one of `planning`, `active`, `completed`, `cancelled`.
- `deadline_from`: optional valid date.
- `deadline_to`: optional valid date, must be after or equal to `deadline_from` when both are supplied.
- `overdue`: optional boolean. A project is overdue when its deadline is before today and status is not `completed` or `cancelled`.
- `per_page`: optional integer, default `10`, maximum `100`.
- `sort`: optional, one of `name`, `deadline`, `status`, `created_at`, `updated_at`; default `created_at`.
- `direction`: optional, one of `asc`, `desc`; default `desc`.

Success response:

```json
{
  "success": true,
  "message": "Projects retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "ProjectPulse Website",
      "brief": "Build a project management platform for an agency.",
      "deadline": "2026-09-30",
      "status": "active",
      "client": {
        "id": 1,
        "name": "PT Example Indonesia",
        "company": "Example Group"
      },
      "tasks_count": 0,
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
    "first": "http://localhost:8000/api/admin/projects?page=1",
    "last": "http://localhost:8000/api/admin/projects?page=1",
    "prev": null,
    "next": null
  }
}
```

## Create project

`POST /admin/projects`

Request:

```json
{
  "client_id": "{{client_id}}",
  "name": "ProjectPulse Website",
  "brief": "Build a project management platform for an agency.",
  "deadline": "2026-09-30",
  "status": "planning"
}
```

`status` is optional and defaults to `planning`. `brief` and `deadline` may be `null`.

Success response, HTTP `201`:

```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "id": 1,
    "name": "ProjectPulse Website",
    "brief": "Build a project management platform for an agency.",
    "deadline": "2026-09-30",
    "status": "planning",
    "client": {
      "id": 1,
      "name": "PT Example Indonesia",
      "company": "Example Group"
    },
    "tasks_count": 0,
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
    "client_id": ["The selected client does not exist."],
    "name": ["The project name is required."],
    "status": ["The status field must be one of: planning, active, completed, cancelled."]
  }
}
```

## Show project

`GET /admin/projects/{project}`

Success response:

```json
{
  "success": true,
  "message": "Project retrieved successfully",
  "data": {
    "id": 1,
    "name": "ProjectPulse Website",
    "brief": "Build a project management platform for an agency.",
    "deadline": "2026-09-30",
    "status": "planning",
    "client": {
      "id": 1,
      "name": "PT Example Indonesia",
      "company": "Example Group"
    },
    "tasks_count": 0,
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

## Update project

`PUT /admin/projects/{project}`

`PATCH /admin/projects/{project}`

Partial updates are supported. Omitted fields are preserved. `brief` and `deadline` may be explicitly set to `null`. Project reassignment is supported by sending another existing `client_id`.

Request:

```json
{
  "status": "active",
  "deadline": "2026-10-15"
}
```

Success response:

```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "id": 1,
    "name": "ProjectPulse Website",
    "brief": "Build a project management platform for an agency.",
    "deadline": "2026-10-15",
    "status": "active",
    "client": {
      "id": 1,
      "name": "PT Example Indonesia",
      "company": "Example Group"
    },
    "tasks_count": 0,
    "created_at": "2026-07-27T10:00:00+00:00",
    "updated_at": "2026-07-27T10:05:00+00:00"
  }
}
```

## Delete project

`DELETE /admin/projects/{project}`

Projects with related tasks cannot be deleted. Remove or reassign related tasks first.

Success response:

```json
{
  "success": true,
  "message": "Project deleted successfully",
  "data": {}
}
```

Conflict response, HTTP `409`:

```json
{
  "success": false,
  "message": "Project cannot be deleted because it still has related tasks",
  "errors": {
    "tasks": [
      "Remove or reassign the project tasks before deleting this project."
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
