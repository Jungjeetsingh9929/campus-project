# Unified Campus Digital Twin & Complaint Portal

Secure full-stack campus operations portal combining the Digital Twin dashboard and Complaint Resolution Tracker.

## Overview

- React 19, TypeScript, Vite, Zustand, React Router, React Three Fiber, Chart.js, and SignalR client.
- ASP.NET Core 9 API, Entity Framework Core, PostgreSQL, JWT access tokens, HttpOnly refresh-cookie sessions, SignalR, Docker Compose, and Nginx reverse proxy.
- Role workspaces for Student, Faculty, Admin, and Security users.
- Existing dark 3D campus UI, dashboards, charts, complaint forms, emergency panel, and navigation styling are preserved.

## Architecture

- Frontend: `src/`
- API: `backend/CampusDigitalTwin.Api/`
- Backend tests: `backend/CampusDigitalTwin.Api.Tests/`
- Reverse proxy: `nginx.conf`
- Containers: `Dockerfile`, `backend/CampusDigitalTwin.Api/Dockerfile`, `docker-compose.yml`
- Environment template: `.env.example`

## Security Highlights

- Password reset uses `forgot-password` plus a one-time reset token.
- Reset tokens are generated cryptographically and stored only as hashes.
- Forgot-password responses are neutral and do not reveal registered emails.
- JWT access tokens stay in app memory.
- Refresh tokens are stored as hashed database sessions and delivered by HttpOnly SameSite cookies.
- Refresh-token rotation detects reuse and revokes the token family.
- Logout and logout-all-devices revoke sessions.
- Registration, login, reset, refresh, upload, AI, password-change, and emergency endpoints are rate-limited.
- Complaint reads and updates enforce backend role/resource checks.
- Admin user updates prevent removing the final active administrator and block unsafe self-disable/self-demotion.
- Uploads use size limits, MIME/extension allowlists, random filenames, signature checks, rate limiting, and PostgreSQL metadata.
- API responses use production-safe problem details with correlation IDs.
- Nginx and API add security headers.

## Local Frontend

```bash
pnpm install
pnpm dev
```

Default frontend URL:

```text
http://localhost:5173
```

## Local Full Stack With Docker

Create `.env` from `.env.example`, then set real values for:

```text
POSTGRES_PASSWORD
CONNECTION_STRING
JWT_SIGNING_KEY
SEED_USERS_DEFAULT_PASSWORD
WEB_ORIGIN
```

Run:

```bash
docker compose up --build
```

Open:

```text
http://localhost:5173
```

The API is exposed locally at:

```text
http://localhost:5151/api/health
```

## Backend Without Docker

Requires PostgreSQL and the .NET 9 SDK:

```bash
dotnet restore backend/CampusDigitalTwin.Api/CampusDigitalTwin.Api.csproj
dotnet build backend/CampusDigitalTwin.Api/CampusDigitalTwin.Api.csproj
dotnet run --project backend/CampusDigitalTwin.Api/CampusDigitalTwin.Api.csproj
```

## Database Migrations

On startup, the API runs EF migrations when migration files exist. If no generated migration files exist yet, it falls back to `EnsureCreatedAsync()` so first Render deploys can create the PostgreSQL schema instead of failing with missing tables.

Generate and apply the initial migration on a machine with the .NET SDK:

```bash
dotnet ef migrations add InitialProductionSchema --project backend/CampusDigitalTwin.Api --startup-project backend/CampusDigitalTwin.Api
dotnet ef database update --project backend/CampusDigitalTwin.Api --startup-project backend/CampusDigitalTwin.Api
```

This Codex environment did not include the `dotnet` CLI, so generated migration C# files could not be produced or verified locally. Review generated SQL before applying it to production, then keep migration files in the repo for stricter production releases.

## Seed Accounts

These users are created only when `SEED_USERS_DEFAULT_PASSWORD` is set:

- `admin@campus.edu`
- `student@campus.edu`
- `faculty@campus.edu`
- `security@campus.edu`

The seed password is environment-owned and is never written into source code.

## Password Reset Email

Development mode logs reset links through `DevelopmentEmailSender`.

Production SMTP is enabled when `SMTP__HOST` is configured:

```text
SMTP__HOST=
SMTP__PORT=587
SMTP__USERNAME=
SMTP__PASSWORD=
SMTP__FROM=
Frontend__BaseUrl=https://your-frontend-domain.example
```

## Roles

- Student: register, log in, submit complaints, upload evidence, view own complaints, receive realtime updates.
- Faculty: view/update complaints in authorized faculty scope.
- Admin: manage complaints, users, audit logs, analytics, and account status.
- Security: access emergency APIs and safety dashboards.

Backend authorization is enforced on protected APIs; frontend role guards are only a usability layer.

## Realtime

SignalR hub:

```text
/hubs/notifications
```

The frontend connects after authentication using the in-memory access token. Backend groups include individual user groups and role groups.

## Emergency Disclaimer

Emergency actions are recorded, audited, and broadcast to authorized dashboard users. The app does not contact public emergency services, send SMS, trigger sirens, or lock doors unless those external integrations are explicitly configured and confirmed by a provider.

## Production Build

Frontend:

```bash
pnpm typecheck
pnpm build
```

Backend:

```bash
dotnet restore backend/CampusDigitalTwin.Api/CampusDigitalTwin.Api.csproj
dotnet build backend/CampusDigitalTwin.Api/CampusDigitalTwin.Api.csproj --configuration Release
dotnet test backend/CampusDigitalTwin.Api.Tests/CampusDigitalTwin.Api.Tests.csproj --configuration Release
```

Docker:

```bash
docker compose config
docker compose build
```

## No-Card Online Demo

GitHub Pages can host the frontend-only demo without Render or card details.

Enable GitHub Pages with **GitHub Actions** in repository settings, then run the `deploy-github-pages` workflow.

Demo URL:

```text
https://jungjeetsingh9929.github.io/campus-project/
```

This mode sets `VITE_ENABLE_STATIC_DEMO_AUTH=true` and `VITE_ENABLE_LOCAL_DEMO_MODE=true`, accepts the demo emails listed above with any password, and is not real backend authentication.

## Render Web Services

For the full backend version using manual Render **Web Service** screens instead of Blueprint, follow [RENDER_WEB_SERVICES.md](./RENDER_WEB_SERVICES.md).

## CI

GitHub Actions runs:

- Frontend install, typecheck, test, build, and high-severity audit.
- Backend restore, build, and tests.
- Docker Compose config and build checks.

## External Integrations Still Required

- SMTP or transactional email credentials.
- Production object storage such as Azure Blob, S3, or Cloudinary.
- Malware scanning provider for uploaded evidence.
- SMS provider.
- Siren, door-lock, and public emergency-service integrations.
- Real Azure OpenAI deployment if the assistant should move beyond rule-based mode.
- Imported GIS/building data if the digital twin should match a real campus map.

## Known Limitations

- Local upload storage is suitable for development; production should use private object storage and authorized/signed downloads.
- Some analytics are calculated from seeded PostgreSQL data until real IoT integrations are configured.
- EF migration files must be generated on a machine with the .NET SDK because this workspace did not include `dotnet`.
