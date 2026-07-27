# ProjectPulse Authentication API

Base URL for local Docker development:

```text
http://localhost:8000/api
```

Use bearer tokens for protected endpoints:

```http
Authorization: Bearer {{admin_token}}
```

## Health check

`GET /health`

Success response:

```json
{
  "success": true,
  "message": "ProjectPulse backend is healthy",
  "data": {
    "status": "ok",
    "service": "projectpulse-backend"
  }
}
```

## Admin login

`POST /auth/admin/login`

Request:

```json
{
  "email": "admin@projectpulse.test",
  "password": "password",
  "device_name": "web-browser"
}
```

Success response:

```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "token": "{{admin_token}}",
    "token_type": "Bearer",
    "user": {
      "id": 1,
      "name": "ProjectPulse Admin",
      "email": "admin@projectpulse.test",
      "role": "admin",
      "profession": null
    }
  }
}
```

## Member login

`POST /auth/member/login`

Request:

```json
{
  "email": "developer1@projectpulse.test",
  "password": "password",
  "device_name": "ionic-local"
}
```

Success response:

```json
{
  "success": true,
  "message": "Member login successful",
  "data": {
    "token": "{{member_token}}",
    "token_type": "Bearer",
    "user": {
      "id": 2,
      "name": "Developer One",
      "email": "developer1@projectpulse.test",
      "role": "member",
      "profession": "developer"
    }
  }
}
```

## Current user

`GET /auth/me`

Headers:

```http
Authorization: Bearer {{admin_token}}
```

Success response:

```json
{
  "success": true,
  "message": "Authenticated user retrieved",
  "data": {
    "user": {
      "id": 1,
      "name": "ProjectPulse Admin",
      "email": "admin@projectpulse.test",
      "role": "admin",
      "profession": null
    }
  }
}
```

## Logout current token

`POST /auth/logout`

Headers:

```http
Authorization: Bearer {{admin_token}}
```

Success response:

```json
{
  "success": true,
  "message": "Logout successful",
  "data": {}
}
```

Logout revokes only the bearer token used for the current request.

## Error responses

Validation failure, HTTP `422`:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": ["The email field must be a valid email address."]
  }
}
```

Invalid credentials, HTTP `401`:

```json
{
  "success": false,
  "message": "Invalid credentials",
  "errors": {}
}
```

Missing or invalid bearer token, HTTP `401`:

```json
{
  "success": false,
  "message": "Unauthenticated.",
  "errors": {}
}
```

Forbidden role, HTTP `403`:

```json
{
  "success": false,
  "message": "Forbidden.",
  "errors": {}
}
```

Local development seed credentials are documented only for local use:

- Admin: `admin@projectpulse.test` / `password`
- Member: `developer1@projectpulse.test` / `password`
