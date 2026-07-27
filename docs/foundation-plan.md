# ProjectPulse Foundation Plan

This document preserves useful setup notes from the temporary Codex planning files in `tasks/`.

## Scope

Establish a runnable ProjectPulse monorepo foundation without domain CRUD, real authentication flows, AI task breakdown, notifications, or time-log features.

The foundation target is:

- `backend/`: Laravel API baseline with a health contract.
- `web/`: React, TypeScript, and Vite admin/PM shell.
- `mobile/`: Ionic React, TypeScript, and Vite member shell.
- `docker-compose.yml`: local PostgreSQL, backend, and web runtime.
- `k8s/`: local-cluster Kubernetes baseline.
- `docs/`: architecture and operational notes.

## Foundation Decisions

- Use Laravel with PostgreSQL for the backend foundation.
- Use a single setup-phase API contract: `GET /api/health`.
- Use React, TypeScript, Vite, React Router, and Axios for the web shell.
- Use Ionic React, TypeScript, Vite, and Ionic Router for the mobile shell.
- Keep web and mobile setup-only until backend contracts exist for real business features.
- Keep Docker Compose focused on local development for PostgreSQL, backend, and web.
- Keep Kubernetes manifests as a local-cluster baseline with example/local images and placeholder secrets.

## Deferred Features

The setup phase intentionally does not implement:

- Real authentication or authorization.
- Clients CRUD.
- Projects CRUD.
- Tasks CRUD or task-status workflows.
- Dashboard business data.
- AI task breakdown.
- Notifications.
- Time logs.

## Acceptance Criteria

- `backend/`, `web/`, and `mobile/` are real framework projects in their intended folders.
- No nested duplicate projects such as `web/web`, `mobile/mobile`, or `backend/backend` exist.
- Web and mobile build from their final directories.
- Docker Compose and Kubernetes configuration describe the intended local runtime baseline.
- Documentation preserves the official requirements and describes only implemented behavior.

## Verification Targets

- Backend: `php artisan route:list`, `php artisan test`, and `vendor/bin/pint --test` when dependencies are installed.
- Web: `npm run lint` and `npm run build` from `web/`.
- Mobile: `npm run lint` and `npm run build` from `mobile/`.
- Docker Compose: `docker compose config`, then build/runtime checks when Docker is available.
- Kubernetes: `kubectl apply --dry-run=client -f k8s/` when a local cluster or compatible dry-run environment is available.

## Known Environment Notes

- On Windows PowerShell, use `npm.cmd` or `npx.cmd` if the `npm.ps1` shim is blocked by execution policy.
- Docker and Kubernetes runtime checks may require a working local Docker daemon and local cluster configuration.
- Temporary scaffold directories should be removed only after their contents have been compared and all useful files have been copied into the final app directories.
