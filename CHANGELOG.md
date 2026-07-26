# Changelog

## Production-hardening pass

- Replaced email-only password reset with forgot-password and one-time reset-token flow.
- Added hashed password reset tokens with expiry and used timestamp.
- Added development email provider for local reset-link logging.
- Reworked refresh sessions to use HttpOnly SameSite cookies and hashed database session records.
- Added refresh-token rotation, session revocation, logout, and logout-all-devices endpoints.
- Removed password and token persistence from frontend localStorage.
- Added user sessions, reset tokens, stored file metadata, notification records, emergency events, and audit records to the EF model.
- Switched database startup from `EnsureCreatedAsync()` to `MigrateAsync()`.
- Added correlation IDs, production-safe problem details, security headers, and endpoint rate limiting.
- Added stricter validation for auth, roles, complaints, coordinates, statuses, and uploads.
- Replaced count-based complaint ticket numbers with a PostgreSQL sequence.
- Added resource-level complaint authorization for students and faculty.
- Added final-active-admin protections.
- Hardened file uploads with size limits, MIME/extension allowlists, random storage names, and signature checks.
- Connected SignalR groups for individual users and roles, plus complaint/emergency event publishing.
- Added Nginx proxy support for API, SignalR, uploads, caching, upload size limits, and security headers.
- Hardened Docker Compose with PostgreSQL health checks and persistent upload storage.
- Added backend token hashing tests and CI commands for frontend, backend, Docker, audit, and tests.

## External integrations still required

- SMTP or transactional email credentials for production password-reset email delivery.
- Azure Blob, S3, Cloudinary, or equivalent object storage credentials for production evidence storage.
- Malware scanning provider for uploaded evidence.
- SMS provider for emergency text notifications.
- Siren, door-lock, and public emergency-service integrations before representing the emergency panel as a real safety control system.
- Real Azure OpenAI deployment before presenting the assistant as generative AI.
