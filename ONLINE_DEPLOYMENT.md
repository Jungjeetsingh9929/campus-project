# Online deployment guide

Recommended platform: Render.

Render supports Docker services, static sites, environment variables, and hosted PostgreSQL, which matches this project well.

No-card alternative: GitHub Pages can host a frontend-only static demo. It does not run the ASP.NET API, PostgreSQL, secure backend authentication, uploads, email reset, or SignalR backend.

## No-card GitHub Pages demo

1. Open the GitHub repository.
2. Go to **Settings**.
3. Go to **Pages**.
4. Under **Build and deployment**, choose **GitHub Actions**.
5. Go to **Actions**.
6. Run or wait for the `deploy-github-pages` workflow.
7. Open:

```text
https://jungjeetsingh9929.github.io/campus-project/
```

Demo login emails:

```text
admin@campus.edu
student@campus.edu
faculty@campus.edu
security@campus.edu
```

Enter any password in GitHub Pages demo mode. This is intentionally not production authentication.

## What you need

- GitHub account
- Render account
- This project pushed to a GitHub repository
- A strong seed password for demo users
- Optional SMTP credentials for real password-reset email

## Step 1: Upload the project to GitHub

1. Extract `unified-campus-digital-twin-website.zip`.
2. Create a new GitHub repository.
3. Upload the extracted files, including `render.yaml`.

## Step 2: Create the Render Blueprint

1. Open Render.
2. Choose **New**.
3. Choose **Blueprint**.
4. Connect your GitHub repository.
5. Render will read `render.yaml`.
6. During setup, Render will ask for the `sync: false` secrets.

Use these values:

```text
Cors__AllowedOrigins__0=https://campus-digital-twin-web.onrender.com
Frontend__BaseUrl=https://campus-digital-twin-web.onrender.com
SeedUsers__DefaultPassword=<make-a-strong-password>
SMTP__HOST=<optional>
SMTP__USERNAME=<optional>
SMTP__PASSWORD=<optional>
SMTP__FROM=<optional>
```

If Render gives your frontend a different URL, use that URL instead of `https://campus-digital-twin-web.onrender.com`.

## Step 3: Check the API URL

After the API deploys, open:

```text
https://campus-digital-twin-api.onrender.com/api/health
```

If Render gives the API a different URL, update the frontend static site environment variable:

```text
VITE_API_BASE_URL=https://your-real-api-url.onrender.com/api
```

Then redeploy the frontend.

## Step 4: Open the frontend

Open:

```text
https://campus-digital-twin-web.onrender.com
```

Seed accounts:

```text
admin@campus.edu
student@campus.edu
faculty@campus.edu
security@campus.edu
```

Password:

```text
The value you entered for SeedUsers__DefaultPassword
```

## Important production notes

- Do not put secrets in GitHub.
- Set real SMTP credentials before relying on password reset.
- Replace local upload storage with Azure Blob, S3, Cloudinary, or another private object-storage provider before heavy production use.
- Emergency actions are recorded and audited, but they do not contact public emergency services or hardware until those integrations are configured.
