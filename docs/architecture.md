# Architecture Decision Document — ProjectPulse

## 1. Ringkasan Stack

| Layer | Pilihan | Alasan singkat |
|---|---|---|
| Backend | Laravel 13 (PHP 8.3) | Produktif, Sanctum built-in untuk token auth, Eloquent ORM, ecosystem matang untuk REST API |
| Web | React 19 + TypeScript + Vite + Tailwind CSS v4 | SPA ringan, developer experience baik, Tailwind mempercepat styling tanpa CSS custom |
| Mobile | Ionic React + Capacitor | Paling diutamakan sesuai instruksi, satu bahasa (React) dengan web, akses native API via Capacitor |
| Database | PostgreSQL 16 | Reliabel, mature, fitur JSONB untuk keperluan ke depan, cocok untuk data terstruktur |
| LLM Provider | OpenRouter (default) / Gemini (fallback) | OpenRouter memberikan akses ke banyak model via satu API key; Gemini sebagai alternatif gratis |

## 2. Alur Data Utama

### Admin membuat proyek dari brief klien (AI-assisted task breakdown)

```
[Web] Admin input brief → POST /api/admin/ai/breakdown {prd_text}
  → Backend AIBreakdownService → LLM API (OpenRouter/Gemini)
  → Response: daftar task (title, category, estimated_effort)
[Web] Admin review/edit task → POST /api/admin/ai/save-tasks {project_id, tasks[]}
  → Backend validasi & batch insert ke tabel tasks
  → TaskObserver membuat notifikasi untuk assignee
```

### Member update status task via mobile

```
[Mobile] Member login → dapat bearer token
  → GET /api/mobile/tasks → menampilkan task yang di-assign
  → PATCH /api/mobile/tasks/{id}/status {status: "in_progress"}
  → Backend verifikasi assignee_id == user_id
  → Update status, return task terbaru
[Mobile] POST /api/mobile/tasks/{id}/time-logs {duration_minutes, note}
  → Backend verifikasi kepemilikan task
  → Insert ke time_logs
```

## 3. Desain Skema Database

### Tabel & Relasi

```
users
  - id (PK)
  - name, email, password
  - role: enum(admin, member)
  - profession: enum(developer, designer) nullable (hanya untuk member)
  - timestamps

clients
  - id (PK)
  - name, email, company
  - timestamps

projects
  - id (PK)
  - client_id (FK → clients.id)
  - name, brief (text), deadline (date)
  - status: enum(planning, active, completed, cancelled)
  - timestamps

tasks
  - id (PK)
  - project_id (FK → projects.id)
  - assignee_id (FK → users.id) nullable
  - title, description (text) nullable
  - category: enum(frontend, backend, design, qa)
  - estimated_effort (integer) nullable
  - deadline (date) nullable
  - status: enum(todo, in_progress, review, done)
  - timestamps

progress_logs
  - id (PK)
  - task_id (FK → tasks.id)
  - user_id (FK → users.id)
  - note (text)
  - timestamps

time_logs
  - id (PK)
  - task_id (FK → tasks.id)
  - user_id (FK → users.id)
  - work_date (date)
  - duration_minutes (integer)
  - note (text) nullable
  - timestamps

notifications
  - id (PK)
  - user_id (FK → users.id)
  - task_id (FK → tasks.id) nullable
  - type: enum(task_assigned, deadline_reminder)
  - message (text)
  - read_at (datetime) nullable
  - timestamps
```

### Alasan desain
- **assignee_id nullable di tasks** — task bisa dibuat tanpa assignee dulu, diassign kemudian oleh admin.
- **progress_logs vs time_logs** dipisah — progress log untuk catatan tekstual, time log untuk kuantitatif (jam kerja). Keduanya opsional dan independen.
- **notifications.task_id nullable** — memungkinkan notifikasi umum (e.g. pengingat sistem) tanpa perlu terkait task spesifik.
- **Enum sebagai PHP backed enum** — konsisten, type-safe, mudah di-cast oleh Eloquent.

## 4. Integrasi ML — AI Task Breakdown

### Pendekatan prompt
- **Few-shot prompt** di `AIBreakdownService::buildPrompt()` — instruksi jelas dengan format output JSON yang rigid.
- Model diminta mengembalikan `{"tasks": [...]}` dengan field: `title`, `description`, `category` (frontend/backend/design/qa), `estimated_effort` (1-80 jam), `status: "todo"`.
- Response diparsing dengan `json_decode()`, difilter dari wrapper ```json.

### Validasi output LLM
- Response harus JSON valid, jika gagal parsing → throw RuntimeException dengan pesan error.
- Array `tasks` harus ada dan tidak kosong.
- Setiap task divalidasi kembali di controller saat save (`saveTasks`) menggunakan Form Request validation.

### Penanganan kegagalan
- **Timeout**: 120s untuk OpenRouter, 60s untuk Gemini.
- **HTTP errors**: 401/403 (invalid key), 402 (insufficient credits), 429 (rate limit) — masing-masing punya pesan spesifik.
- **ConnectionException**: pesan "Could not connect to AI service".
- **Fallback**: semua error dilempar sebagai RuntimeException → controller menangkap dan return 503. Admin tetap bisa membuat task manual tanpa AI.
- **Fitur inti tidak terblokir** — ML bersifat assist, bukan blocking. Web tetap bisa CRUD task tanpa menyentuh AI sama sekali.

## 5. Autentikasi & Otorisasi

### Token-based auth
- **Laravel Sanctum** dengan bearer token (bukan session cookie).
- Endpoint login terpisah: `POST /auth/admin/login` dan `POST /auth/member/login`.
- Token di-generate dengan prefix `admin-` atau `member-` untuk identifikasi.
- `GET /auth/me` mengembalikan user + role.
- `POST /auth/logout` menghapus token yang dipakai.

### Role-based access
- Middleware `EnsureUserHasRole` (parameter `role:admin`) dipasang di route group admin.
- Semua route `/api/admin/*` — hanya admin yang bisa akses.
- Route `/api/mobile/*` — dicek di controller level (assignee verification).
- User dengan role salah mendapat 403.

### Lintas platform
- Token yang sama bisa dipakai dari web atau mobile — tidak ada session cookie.
- Token disimpan di `localStorage` (web) dan `Preferences`/memory (mobile).

## 6. Containerization & Orchestration

### Dockerfile backend
- **Base image**: `php:8.3-cli-bookworm` — minimal, tanpa web server (pakai `php artisan serve`).
- Install `pdo_pgsql` untuk PostgreSQL, Composer 2.
- **Multi-stage tidak dipakai** — cukup single stage karena ukuran tidak kritis.
- Entrypoint `docker-entrypoint.sh` — inject `.env` dari Docker secrets, jalankan `optimize:clear`.

### Dockerfile web
- **Multi-stage build**: stage 1 (`node:24-alpine`) — `npm ci` + `vite build`.
- Stage 2 (`nginx:1.27-alpine`) — serve static files dari `dist/`.
- Build arg `VITE_API_BASE_URL` untuk backend URL.

### docker-compose
- Tiga service: `postgres`, `backend`, `web` dalam satu network `projectpulse`.
- Backend menunggu postgres sehat (`condition: service_healthy`).
- `.env` backend di-inject via Docker secrets.
- Menjalankan: `docker compose up --build -d` lalu `docker compose exec backend php artisan migrate:fresh --seed`.

### Kubernetes (minikube/kind/k3d)
- 9 manifest di `k8s/`: Deployment + Service untuk backend, web, postgres; ConfigMap, Secret (contoh), Ingress.
- Ingress nginx dengan host `projectpulse.local`.
- Backend menggunakan ConfigMap (non-sensitive) + Secret (DB_PASSWORD, APP_KEY, LLM_API_KEY).
- Readiness & liveness probe untuk backend (`/api/health`) dan web (`/`).
- Deploy: `kubectl apply -f k8s/`.
- **Scaling >1 replica**: tidak ada file session (stateless, token-based auth). Database tetap via Postgres Deployment (single point). Untuk production perlu StatefulSet atau managed DB.

## 7. Error Handling & Resiliency

### Format error API konsisten
Semua response mengikuti format:
```json
{
  "success": true/false,
  "message": "Human-readable message",
  "data": {},
  "errors": {},
  "meta": {}
}
```
via trait `RespondsWithApi` di backend.

### Kode status
- `200` — sukses
- `201` — created
- `401` — unauthenticated
- `403` — forbidden (role mismatch / bukan task miliknya)
- `404` — resource not found
- `409` — conflict (delete with dependencies)
- `422` — validation error (dengan field-level errors)
- `503` — service unavailable (AI service down)

### Frontend
- `apiError.ts` utility untuk parsing error dari berbagai sumber (network error, server error, validation error).
- `ApiErrorState` component untuk tampilan error di web.
- Mobile: error ditampilkan via alert/text di halaman masing-masing.

## 8. Trade-off & Keterbatasan

| Hal | Kondisi saat ini | Rencana pengembangan |
|---|---|---|
| **Testing** | Backend: PHPUnit (139 tests). Web: belum ada. Mobile: Cypress + Vitest scaffold. | Tambah Vitest untuk web, perbanyak test mobile. |
| **CI/CD** | Belum ada GitHub Actions. | Trigger: lint + test → build & push image ke registry tiap push ke main. |
| **Helm chart** | Masih raw YAML di `k8s/`. | Bungkus ke Helm chart untuk parameterized deployment. |
| **HPA** | 1 replica, tanpa auto-scaling. | Tambah HPA berdasarkan CPU/memory. |
| **Laporan/Export** | Time log tersimpan tapi belum ada export CSV/PDF. | Endpoint export + tombol download di web. |
| **Komentar task** | Belum ada fitur diskusi per task. | Tabel `comments` + real-time via polling atau WebSocket. |
| **Kanban** | Status task diubah via dropdown. | Papan drag-and-drop dengan library (dnd-kit / react-beautiful-dnd). |
| **Push notification** | Notifikasi in-app saja (polling). | FCM/APNs via Capacitor plugins. |
| **APK/IPA build** | Hanya dev server (`npm run dev`). | Build APK dengan `capacitor build android`. |
| **Seeder klien** | 5 klien sudah cukup. | Bisa ditambah lebih banyak variasi industri untuk demo. |
