# ProjectPulse Admin Tasks API

Base URL for local Docker development:

```text
http://localhost:8000/api
```

All Admin Task endpoints require an admin bearer token:

```http
Authorization: Bearer {{admin_token}}
```

Members receive HTTP `403`. Requests without a valid bearer token receive HTTP `401`.

This module does not implement mobile member task workflows, progress-log endpoints, time-log endpoints, notifications, Kanban, dashboard statistics, or AI task breakdown.

## List tasks

`GET /admin/tasks`

Query parameters:

- `search`: optional string, searches task title, description, project name, assignee name, and assignee email.
- `project_id`: optional existing project ID.
- `client_id`: optional existing client ID.
- `assignee_id`: optional existing member user ID.
- `category`: optional, one of `frontend`, `backend`, `design`, `qa`.
- `status`: optional, one of `todo`, `in_progress`, `review`, `done`.
- `deadline_from`: optional valid date.
- `deadline_to`: optional valid date, must be after or equal to `deadline_from`.
- `overdue`: optional boolean. A task is overdue when deadline is before today and status is not `done`.
- `unassigned`: optional boolean.
- `per_page`: optional integer, default `10`, maximum `100`.
- `sort`: optional, one of `title`, `deadline`, `status`, `category`, `estimated_effort`, `created_at`, `updated_at`.
- `direction`: optional, one of `asc`, `desc`.

Success response:

```json
{
  "success": true,
  "message": "Tasks retrieved successfully",
  "data": [
    {
      "id": 1,
      "title": "Implement authentication API",
      "description": "Create Sanctum login and role authorization.",
      "category": "backend",
      "estimated_effort": 8,
      "deadline": "2026-08-05",
      "status": "todo",
      "project": {
        "id": 1,
        "name": "ProjectPulse Website",
        "status": "active",
        "client": {
          "id": 1,
          "name": "PT Example Indonesia",
          "company": "Example Group"
        }
      },
      "assignee": {
        "id": 2,
        "name": "Developer One",
        "email": "developer1@projectpulse.test",
        "profession": "developer"
      },
      "progress_logs_count": 0,
      "time_logs_count": 0,
      "total_logged_minutes": 0,
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
    "first": "http://localhost:8000/api/admin/tasks?page=1",
    "last": "http://localhost:8000/api/admin/tasks?page=1",
    "prev": null,
    "next": null
  }
}
```

## Create task

`POST /admin/tasks`

Request:

```json
{
  "project_id": "{{project_id}}",
  "assignee_id": "{{member_id}}",
  "title": "Implement authentication API",
  "description": "Create Sanctum login and role authorization.",
  "category": "backend",
  "estimated_effort": 8,
  "deadline": "2026-08-05",
  "status": "todo"
}
```

`assignee_id`, `description`, `estimated_effort`, and `deadline` may be `null`. `status` is optional and defaults to `todo`. Assignees must be member users; admin users cannot be assigned.

Success response, HTTP `201`:

```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": 1,
    "title": "Implement authentication API",
    "description": "Create Sanctum login and role authorization.",
    "category": "backend",
    "estimated_effort": 8,
    "deadline": "2026-08-05",
    "status": "todo",
    "project": {
      "id": 1,
      "name": "ProjectPulse Website",
      "status": "active",
      "client": {
        "id": 1,
        "name": "PT Example Indonesia",
        "company": "Example Group"
      }
    },
    "assignee": null,
    "progress_logs_count": 0,
    "time_logs_count": 0,
    "total_logged_minutes": 0,
    "created_at": "2026-07-27T10:00:00+00:00",
    "updated_at": "2026-07-27T10:00:00+00:00"
  }
}
```

## Show task

`GET /admin/tasks/{task}`

Returns one task with project/client, optional assignee, log counts, and total logged minutes. It does not return full progress-log or time-log history.

Not found response, HTTP `404`:

```json
{
  "success": false,
  "message": "Resource not found.",
  "errors": {}
}
```

## Update task

`PUT /admin/tasks/{task}`

`PATCH /admin/tasks/{task}`

Partial updates are supported. Omitted fields are preserved. `assignee_id` may be set to `null` to unassign a task.

Request:

```json
{
  "assignee_id": "{{member_id}}",
  "status": "in_progress",
  "deadline": "2026-08-10"
}
```

Success response:

```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "id": 1,
    "title": "Implement authentication API",
    "description": "Create Sanctum login and role authorization.",
    "category": "backend",
    "estimated_effort": 8,
    "deadline": "2026-08-10",
    "status": "in_progress",
    "project": {
      "id": 1,
      "name": "ProjectPulse Website",
      "status": "active",
      "client": {
        "id": 1,
        "name": "PT Example Indonesia",
        "company": "Example Group"
      }
    },
    "assignee": {
      "id": 2,
      "name": "Developer One",
      "email": "developer1@projectpulse.test",
      "profession": "developer"
    },
    "progress_logs_count": 0,
    "time_logs_count": 0,
    "total_logged_minutes": 0,
    "created_at": "2026-07-27T10:00:00+00:00",
    "updated_at": "2026-07-27T10:05:00+00:00"
  }
}
```

## Delete task

`DELETE /admin/tasks/{task}`

Tasks with progress logs or time logs cannot be deleted because they have work history.

Success response:

```json
{
  "success": true,
  "message": "Task deleted successfully",
  "data": {}
}
```

Conflict response, HTTP `409`:

```json
{
  "success": false,
  "message": "Task cannot be deleted because it has work history",
  "errors": {
    "task": [
      "Remove the related progress and time logs before deleting this task."
    ]
  }
}
```

## List members for assignment

`GET /admin/members`

Query parameters:

- `search`: optional string, searches member name and email.
- `profession`: optional, one of `developer`, `designer`.
- `per_page`: optional integer, default `25`, maximum `100`.

Success response:

```json
{
  "success": true,
  "message": "Members retrieved successfully",
  "data": [
    {
      "id": 2,
      "name": "Developer One",
      "email": "developer1@projectpulse.test",
      "profession": "developer",
      "assigned_tasks_count": 3
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 25,
    "total": 1
  },
  "links": {
    "first": "http://localhost:8000/api/admin/members?page=1",
    "last": "http://localhost:8000/api/admin/members?page=1",
    "prev": null,
    "next": null
  }
}
```

## Shared errors

Validation failure, HTTP `422`:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "category": ["The category field must be one of: frontend, backend, design, qa."]
  }
}
```

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
