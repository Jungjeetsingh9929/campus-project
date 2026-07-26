# Render manual Web Services setup

Use this when you do not want to use Render Blueprints.

Create three Render resources manually:

1. PostgreSQL database
2. Backend API Web Service
3. Frontend Web Service

## 1. Create PostgreSQL

1. Open Render Dashboard.
2. Click **New +**.
3. Click **PostgreSQL**.
4. Name it:

```text
campus-digital-twin-db
```

5. Choose the free/starter option available to your account.
6. Create the database.
7. Copy the database connection string. Prefer the internal database URL when the API is also on Render.

## 2. Create backend API Web Service

1. Click **New +**.
2. Click **Web Service**.
3. Connect repository:

```text
Jungjeetsingh9929/campus-project
```

4. Select branch:

```text
main
```

5. Runtime:

```text
Docker
```

6. Dockerfile path:

```text
backend/CampusDigitalTwin.Api/Dockerfile
```

7. Docker build context directory:

```text
backend/CampusDigitalTwin.Api
```

8. Service name:

```text
campus-digital-twin-api
```

9. Health check path:

```text
/api/health
```

10. Add environment variables:

```text
ASPNETCORE_ENVIRONMENT=Production
DATABASE_URL=<your Render PostgreSQL connection string>
Jwt__Issuer=CampusDigitalTwin
Jwt__Audience=CampusDigitalTwinWeb
Jwt__SigningKey=<generate a long random secret>
Cors__AllowedOrigins__0=https://campus-digital-twin-web.onrender.com
Frontend__BaseUrl=https://campus-digital-twin-web.onrender.com
SeedUsers__DefaultPassword=<make a strong password>
```

Optional email reset variables:

```text
SMTP__HOST=
SMTP__PORT=587
SMTP__USERNAME=
SMTP__PASSWORD=
SMTP__FROM=
```

11. Click **Create Web Service**.
12. Wait until deploy succeeds.
13. Test:

```text
https://campus-digital-twin-api.onrender.com/api/health
```

If Render gives your backend a different URL, copy that URL for the frontend step.

## 3. Create frontend Web Service

1. Click **New +**.
2. Click **Web Service**.
3. Connect repository:

```text
Jungjeetsingh9929/campus-project
```

4. Select branch:

```text
main
```

5. Runtime:

```text
Docker
```

6. Dockerfile path:

```text
Dockerfile
```

7. Docker build context directory:

```text
.
```

8. Service name:

```text
campus-digital-twin-web
```

9. Add environment variables before the first deploy:

```text
VITE_API_BASE_URL=https://campus-digital-twin-api.onrender.com/api
VITE_ENABLE_LIVE_API=true
VITE_ENABLE_STATIC_DEMO_AUTH=false
VITE_ENABLE_LOCAL_DEMO_MODE=false
VITE_ENABLE_DEMO_FALLBACKS=false
```

If Render gave your backend a different URL, use that backend URL for `VITE_API_BASE_URL`.

10. Click **Create Web Service**.
11. Wait until deploy succeeds.
12. Open:

```text
https://campus-digital-twin-web.onrender.com
```

## 4. If Render uses different URLs

Update backend API environment variables:

```text
Cors__AllowedOrigins__0=<your actual frontend URL>
Frontend__BaseUrl=<your actual frontend URL>
```

Update frontend environment variable:

```text
VITE_API_BASE_URL=<your actual backend URL>/api
```

Then redeploy both services.

## Demo accounts

Use the password you set in `SeedUsers__DefaultPassword`.

```text
admin@campus.edu
student@campus.edu
faculty@campus.edu
security@campus.edu
```

## Important

Do not use GitHub Pages for the full backend version. GitHub Pages is frontend-only.
