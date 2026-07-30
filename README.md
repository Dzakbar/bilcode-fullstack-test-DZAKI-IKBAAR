# ProjectPulse

Platform Manajemen Klien & Proyek Internal — Full Stack Application.

| Layer | Stack |
|---|---|
| **Backend** | Laravel 13 (PHP 8.3), PostgreSQL, Sanctum Auth |
| **Web** | React 19, TypeScript, Vite, Tailwind CSS 4 |
| **Mobile** | Ionic 8 + React 19 + Capacitor |
| **ML** | AI-assisted task breakdown (OpenRouter / Gemini) |
| **Infra** | Docker, Docker Compose, Kubernetes (Helm) |

---

## Prerequisites

- Docker & Docker Compose
- Node.js 24+, npm
- PHP 8.3 + Composer (manual dev-only)
- Helm CLI (Kubernetes-only)

---

## Quick Start (Docker Compose)

Cara paling cepat menjalankan seluruh aplikasi:

```bash
# 1. Clone
git clone <repo-url> && cd bil-code-fullstack-test

# 2. Setup environment backend
cp backend/.env.example backend/.env
php -r "echo 'APP_KEY=' . base64_encode(random_bytes(32));"  # atau: docker compose run --rm backend php artisan key:generate

# 3. Build & jalankan container
docker compose build
docker compose up -d

# 4. Migrasi & seed database
docker compose exec backend php artisan migrate:fresh --seed --force

# 5. Akses
# Web:     http://localhost:3000
# API:     http://localhost:8000/api
# Mobile:  http://localhost:8100
```

> **Catatan:** Untuk hot-reload backend saat development, tambahkan volume mount di `docker-compose.yml`:
> ```yaml
> backend:
>   volumes:
>     - ./backend:/var/www/html
> ```

---

## Development (Manual)

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env: isi DB_*, GENERATE APP_KEY
composer install
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve --host=0.0.0.0 --port=8000
```

**Env config penting (.env):**
```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=projectpulse
DB_USERNAME=projectpulse
DB_PASSWORD=change_me

OPENROUTER_API_KEY=sk-...       # untuk AI feature
GEMINI_API_KEY=...              # alternatif AI provider
```

### Web

```bash
cd web
cp .env.example .env
npm install
npm run dev
# → http://localhost:5173
```

### Mobile

```bash
cd mobile
cp .env.example .env
npm install
npm run dev
# → http://localhost:8100
```

---

## Docker

**Build image:**
```bash
docker compose build
```

**Build individual service:**
```bash
docker compose build backend
docker compose build web
```

**Regenerate data (setelah perubahan seeder/code):**
```bash
docker compose build backend
docker compose up -d
docker compose exec backend php artisan migrate:fresh --seed --force
```

---

## Kubernetes

### 1. Setup cluster lokal (contoh dengan kind)
```bash
kind create cluster --name projectpulse
```

### 2. Build image & load ke cluster
```bash
docker compose build
kind load docker-image bil-code-fullstack-test-backend:latest --name projectpulse
kind load docker-image bil-code-fullstack-test-web:latest --name projectpulse
```

### 3. Install ingress controller
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
```

### 4. Deploy dengan Helm
```bash
helm install projectpulse k8s/helm/projectpulse \
  --set secrets.APP_KEY="$(php -r 'echo base64_encode(random_bytes(32));')" \
  --set secrets.DB_USERNAME="projectpulse" \
  --set secrets.DB_PASSWORD="change_me" \
  --set secrets.LLM_API_KEY="sk-..." \
  --set backend.env.APP_URL="http://projectpulse.local"
```

### 5. Akses
```bash
# Tambahkan ke /etc/hosts:
echo "$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}')  projectpulse.local" | sudo tee -a /etc/hosts

# Buka: http://projectpulse.local
```

### Deploy tanpa Helm (raw YAML)
```bash
# Copy & isi secret.yaml, lalu:
kubectl apply -f k8s/
```

---

## Akun Seed

| Role | Email | Password | Profesi |
|---|---|---|---|
| Admin | admin@projectpulse.test | password | — |
| Member | developer1@projectpulse.test | password | developer |
| Member | developer2@projectpulse.test | password | developer |
| Member | designer1@projectpulse.test | password | designer |

---

## Testing

```bash
# Backend (139+ tests)
cd backend && php artisan test

# Mobile (unit)
cd mobile && npm run test.unit

# Mobile (e2e with Cypress)
cd mobile && npm run test.e2e
```

---

## Struktur Folder

```
project-root/
├── backend/               # Laravel API
│   ├── app/
│   │   ├── Enums/         # UserRole, TaskStatus, dll
│   │   ├── Http/
│   │   │   ├── Controllers/   # Auth, Client, Project, Task, Report, AI
│   │   │   ├── Middleware/    # EnsureUserHasRole
│   │   │   ├── Requests/     # Form Request validation
│   │   │   └── Resources/    # API Resource transformers
│   │   ├── Models/        # User, Client, Project, Task, TimeLog, Notification
│   │   ├── Services/      # AIBreakdownService
│   │   └── ml/            # ML dokumentasi
│   ├── database/
│   │   ├── factories/     # Seeder factories
│   │   ├── migrations/    # 12 migrations
│   │   └── seeders/       # DatabaseSeeder
│   ├── routes/api.php     # Semua API routes
│   ├── tests/             # PHPUnit tests
│   └── Dockerfile
├── web/                   # React admin dashboard
│   ├── src/
│   │   ├── pages/         # Dashboard, Clients, Projects, Tasks, AI, Reports
│   │   ├── components/    # UI components
│   │   ├── services/      # API clients (axios)
│   │   ├── routes/        # React Router
│   │   └── types/         # TypeScript types
│   └── Dockerfile         # multi-stage build
├── mobile/                # Ionic React (member app)
│   ├── src/
│   │   ├── pages/         # Login, Tasks, TaskDetail, Notifications, Profile
│   │   └── services/      # API clients
│   └── Dockerfile         # (tidak wajib, tidak dibuild)
├── k8s/
│   ├── helm/projectpulse/ # Helm chart
│   └── *.yaml             # Raw K8s manifests
├── docs/
│   ├── api/               # API documentation (OpenAPI 3.0)
│   └── architecture.md    # Decision document
└── docker-compose.yml
```

---

## API Documentation

Dokumentasi lengkap (OpenAPI 3.0) tersedia di:

```
docs/api/openapi.yaml
```

Bisa di-import ke **Postman**, **Bruno**, **Swagger Editor**, atau **Redoc**.

**Endpoint utama:**

| Method | Endpoint | Auth |
|---|---|---|
| POST | /api/auth/admin/login | Public |
| POST | /api/auth/member/login | Public |
| GET | /api/auth/me | Bearer |
| GET/POST | /api/admin/clients | Admin |
| GET/POST | /api/admin/projects | Admin |
| GET/POST | /api/admin/tasks | Admin |
| GET | /api/admin/reports/work-hours | Admin |
| GET | /api/admin/reports/work-hours/export | Admin (CSV) |
| POST | /api/admin/ai/breakdown | Admin |
| GET | /api/mobile/tasks | Member |
| PATCH | /api/mobile/tasks/{id}/status | Member |
| POST | /api/mobile/tasks/{id}/time-logs | Member |
| GET | /api/mobile/notifications | Member |

---

## Fitur

- **CRUD** Klien, Proyek, Task (admin via web)
- **Mobile** Lihat task, update status, log waktu, notifikasi (member)
- **AI** Task breakdown dari PRD brief (OpenRouter / Gemini)
- **Reports** Work hours dengan filter & export CSV
- **Token Auth** Sanctum — lintas web & mobile
- **Docker** + **Docker Compose** — dev lokal
- **Kubernetes** Helm chart + raw manifests
