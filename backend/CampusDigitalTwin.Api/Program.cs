using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CampusDigitalTwin.Api.Api.Hubs;
using CampusDigitalTwin.Api.Application.Abstractions;
using CampusDigitalTwin.Api.Application.Contracts;
using CampusDigitalTwin.Api.Application.Services;
using CampusDigitalTwin.Api.Domain.Entities;
using CampusDigitalTwin.Api.Infrastructure.Email;
using CampusDigitalTwin.Api.Infrastructure.Persistence;
using CampusDigitalTwin.Api.Infrastructure.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().AddJsonOptions(options => options.JsonSerializerOptions.PropertyNamingPolicy = null);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:5173"];
builder.Services.AddCors(options =>
{
    options.AddPolicy("web", policy =>
    {
      policy.WithOrigins(allowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
var databaseConnectionString = builder.Configuration["DATABASE_URL"] ?? builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(databaseConnectionString) || databaseConnectionString.Contains("<set-via-env>", StringComparison.OrdinalIgnoreCase))
{
    throw new InvalidOperationException("Database connection string is not configured.");
}
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(NormalizePostgresConnectionString(databaseConnectionString)));
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<ICampusReadService, CampusReadService>();
builder.Services.AddScoped<IComplaintService, ComplaintService>();
builder.Services.AddScoped<IAiAssistantService, AiAssistantService>();
builder.Services.AddScoped<ISeedDataService, SeedDataService>();
builder.Services.AddScoped<IEmailSender>(services =>
{
    var configuration = services.GetRequiredService<IConfiguration>();
    return string.IsNullOrWhiteSpace(configuration["Smtp:Host"])
        ? ActivatorUtilities.CreateInstance<DevelopmentEmailSender>(services)
        : ActivatorUtilities.CreateInstance<SmtpEmailSender>(services);
});
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("auth", limiter =>
    {
        limiter.PermitLimit = 10;
        limiter.Window = TimeSpan.FromMinutes(1);
        limiter.QueueLimit = 0;
    });
    options.AddFixedWindowLimiter("sensitive", limiter =>
    {
        limiter.PermitLimit = 5;
        limiter.Window = TimeSpan.FromMinutes(10);
        limiter.QueueLimit = 0;
    });
    options.AddFixedWindowLimiter("upload", limiter =>
    {
        limiter.PermitLimit = 20;
        limiter.Window = TimeSpan.FromMinutes(5);
        limiter.QueueLimit = 0;
    });
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = StatusCodes.Status429TooManyRequests,
            Title = "Too many requests",
            Detail = "Please wait before trying again.",
        }, cancellationToken);
    };
});

var jwt = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = signingKey,
            ClockSkew = TimeSpan.FromMinutes(1),
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/notifications"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            },
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("SecurityOnly", policy => policy.RequireRole("Security"));
    options.AddPolicy("FacultyOrAdmin", policy => policy.RequireRole("Faculty", "Admin"));
});

var app = builder.Build();

app.UseForwardedHeaders();

app.Use(async (context, next) =>
{
    var correlationId = context.Request.Headers.TryGetValue("X-Correlation-ID", out var supplied)
        ? supplied.ToString()
        : Guid.NewGuid().ToString("N");
    context.Items["CorrelationId"] = correlationId;
    context.Response.Headers["X-Correlation-ID"] = correlationId;
    await next();
});

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var exception = context.Features.Get<IExceptionHandlerPathFeature>()?.Error;
        var correlationId = context.Items["CorrelationId"]?.ToString() ?? Guid.NewGuid().ToString("N");
        var statusCode = exception is ArgumentException ? StatusCodes.Status400BadRequest : StatusCodes.Status500InternalServerError;
        context.Response.StatusCode = statusCode;
        await context.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = statusCode,
            Title = statusCode == StatusCodes.Status400BadRequest ? "Validation failed" : "Unexpected server error",
            Detail = statusCode == StatusCodes.Status400BadRequest ? exception?.Message : "The request could not be completed.",
            Extensions = { ["correlationId"] = correlationId },
        });
    });
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseResponseCompression();
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(self)";
    context.Response.Headers["Content-Security-Policy"] = "default-src 'self'; connect-src 'self' ws: wss:; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'";
    if (!app.Environment.IsDevelopment())
    {
        context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
    }
    await next();
});
app.UseCors("web");
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<ISeedDataService>();
    for (var attempt = 1; attempt <= 8; attempt++)
    {
        try
        {
            await seeder.InitializeAsync();
            break;
        }
        catch when (attempt < 8)
        {
            await Task.Delay(TimeSpan.FromSeconds(2));
        }
    }
}

app.MapGet("/api/health", async (AppDbContext db) =>
{
    var canConnect = await db.Database.CanConnectAsync();
    if (!canConnect)
    {
        return Results.Problem("Database is not reachable.", statusCode: StatusCodes.Status503ServiceUnavailable);
    }

    return Results.Ok(new { status = "healthy", service = "Campus Digital Twin API", database = "connected" });
});

app.MapGroup("/api/auth")
    .MapPost("/login", async (LoginRequest request, HttpContext http, IJwtTokenService tokenService, AppDbContext db) =>
    {
        var email = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;
        if (!IsValidEmail(email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return Results.BadRequest(new { error = "Email and password are required." });
        }

        var user = await db.Users.FirstOrDefaultAsync(item => item.Email == email);
        if (user is null || !user.IsActive)
        {
            return Results.Unauthorized();
        }

        if (user.LockedUntil is not null && user.LockedUntil > DateTimeOffset.UtcNow)
        {
            return Results.Problem("Account is temporarily locked after repeated failed logins.", statusCode: StatusCodes.Status423Locked);
        }

        var hasher = new PasswordHasher<UserAccount>();
        var verification = hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verification == PasswordVerificationResult.Failed)
        {
            user.FailedLoginAttempts += 1;
            user.LockedUntil = user.FailedLoginAttempts >= 5 ? DateTimeOffset.UtcNow.AddMinutes(10) : null;
            await db.SaveChangesAsync();
            return Results.Unauthorized();
        }

        var tokens = tokenService.CreateTokens(user);
        var rawRefreshToken = TokenHasher.CreateOpaqueToken();
        var session = new UserSession
        {
            UserAccountId = user.Id,
            RefreshTokenHash = TokenHasher.Hash(rawRefreshToken),
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(jwt.RefreshTokenDays),
            IpAddress = http.Connection.RemoteIpAddress?.ToString(),
            UserAgent = http.Request.Headers.UserAgent.ToString(),
        };
        user.FailedLoginAttempts = 0;
        user.LockedUntil = null;
        db.UserSessions.Add(session);
        db.AuditRecords.Add(new AuditRecord { ActorId = user.Id, ActorName = user.DisplayName, Action = "Login success", Target = user.Email });
        await db.SaveChangesAsync();
        SetRefreshCookie(http, rawRefreshToken, session.ExpiresAt, app.Environment.IsDevelopment());

        return Results.Ok(tokens with { RefreshToken = "", RefreshTokenExpiresAt = session.ExpiresAt, Role = user.Role, Name = user.DisplayName });
    })
    .WithName("Login")
    .RequireRateLimiting("auth");

app.MapPost("/api/auth/register", async (RegisterStudentRequest request, AppDbContext db) =>
{
    var email = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;
    if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Length > 120 || !IsValidEmail(email) || !IsStrongPassword(request.Password))
    {
        return Results.BadRequest(new { error = "Name, valid email, and a strong password are required." });
    }

    if (await db.Users.AnyAsync(item => item.Email == email))
    {
        return Results.BadRequest(new { error = "An account already exists for this email." });
    }

    var hasher = new PasswordHasher<UserAccount>();
    var user = new UserAccount
    {
        DisplayName = request.Name.Trim(),
        Email = email,
        Role = "Student",
        Department = "Computer Science",
        RollNumber = request.RollNumber,
        Phone = request.Phone,
        IsActive = true,
    };
    user.PasswordHash = hasher.HashPassword(user, request.Password);
    db.Users.Add(user);
    await db.SaveChangesAsync();
    return Results.Created($"/api/admin/users/{user.Id}", ToUserDto(user));
}).RequireRateLimiting("auth");

app.MapPost("/api/auth/forgot-password", async (ForgotPasswordRequest request, HttpContext http, AppDbContext db, IEmailSender emailSender) =>
{
    var email = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;
    var user = IsValidEmail(email)
        ? await db.Users.FirstOrDefaultAsync(item => item.Email == email && item.IsActive)
        : null;
    if (user is not null)
    {
        var resetToken = TokenHasher.CreateOpaqueToken();
        db.PasswordResetTokens.Add(new PasswordResetToken
        {
            UserAccountId = user.Id,
            TokenHash = TokenHasher.Hash(resetToken),
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(20),
        });
        db.AuditRecords.Add(new AuditRecord { ActorId = user.Id, ActorName = user.DisplayName, Action = "Password reset requested", Target = user.Email });
        await db.SaveChangesAsync();
        var frontendBaseUrl = builder.Configuration["Frontend:BaseUrl"] ?? $"{http.Request.Scheme}://{http.Request.Host}";
        await emailSender.SendPasswordResetAsync(user, $"{frontendBaseUrl.TrimEnd('/')}/login?resetToken={Uri.EscapeDataString(resetToken)}");
    }

    return Results.Ok(new { message = "If an account exists for that email, reset instructions have been sent." });
}).RequireRateLimiting("sensitive");

app.MapPost("/api/auth/reset-password", async (ResetPasswordRequest request, AppDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Token))
    {
        return Results.BadRequest(new { error = "Reset token is required." });
    }

    if (request.NewPassword != request.ConfirmPassword)
    {
        return Results.BadRequest(new { error = "Password confirmation does not match." });
    }

    if (!IsStrongPassword(request.NewPassword))
    {
        return Results.BadRequest(new { error = "Password must be at least 10 characters and include upper, lower, number, and symbol characters." });
    }

    var tokenHash = TokenHasher.Hash(request.Token);
    var reset = await db.PasswordResetTokens.Include(item => item.UserAccount).FirstOrDefaultAsync(item => item.TokenHash == tokenHash);
    if (reset is null || reset.UserAccount is null || reset.UsedAt is not null || reset.ExpiresAt <= DateTimeOffset.UtcNow)
    {
        return Results.BadRequest(new { error = "Reset token is invalid or expired." });
    }

    var hasher = new PasswordHasher<UserAccount>();
    reset.UserAccount.PasswordHash = hasher.HashPassword(reset.UserAccount, request.NewPassword);
    reset.UserAccount.FailedLoginAttempts = 0;
    reset.UserAccount.LockedUntil = null;
    var now = DateTimeOffset.UtcNow;
    reset.UsedAt = now;
    await db.UserSessions.Where(item => item.UserAccountId == reset.UserAccountId && item.RevokedAt == null)
        .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.RevokedAt, now));
    db.AuditRecords.Add(new AuditRecord { ActorId = reset.UserAccount.Id, ActorName = reset.UserAccount.DisplayName, Action = "Password reset completed", Target = reset.UserAccount.Email });
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Password reset. Existing sessions were revoked." });
}).RequireRateLimiting("sensitive");

app.MapPost("/api/auth/logout", [Authorize] async (ClaimsPrincipal principal, HttpContext http, AppDbContext db) =>
{
    var user = await GetCurrentUserAsync(principal, db);
    var rawRefreshToken = http.Request.Cookies["campus_refresh"];
    if (user is not null && !string.IsNullOrWhiteSpace(rawRefreshToken))
    {
        var hash = TokenHasher.Hash(rawRefreshToken);
        var session = await db.UserSessions.FirstOrDefaultAsync(item => item.UserAccountId == user.Id && item.RefreshTokenHash == hash);
        if (session is not null)
        {
            session.RevokedAt = DateTimeOffset.UtcNow;
        }
        ClearRefreshCookie(http);
        await db.SaveChangesAsync();
    }
    return Results.NoContent();
});

app.MapPost("/api/auth/change-password", [Authorize] async (ChangePasswordRequest request, ClaimsPrincipal principal, HttpContext http, AppDbContext db) =>
{
    var user = await GetCurrentUserAsync(principal, db);
    if (user is null)
    {
        return Results.Unauthorized();
    }

    var hasher = new PasswordHasher<UserAccount>();
    if (hasher.VerifyHashedPassword(user, user.PasswordHash, request.CurrentPassword) == PasswordVerificationResult.Failed)
    {
        return Results.BadRequest(new { error = "Current password is incorrect." });
    }

    if (!IsStrongPassword(request.NewPassword))
    {
        return Results.BadRequest(new { error = "New password must be at least 10 characters and include upper, lower, number, and symbol characters." });
    }

    user.PasswordHash = hasher.HashPassword(user, request.NewPassword);
    var now = DateTimeOffset.UtcNow;
    await db.UserSessions.Where(item => item.UserAccountId == user.Id && item.RevokedAt == null)
        .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.RevokedAt, now));
    ClearRefreshCookie(http);
    db.AuditRecords.Add(new AuditRecord { ActorId = user.Id, ActorName = user.DisplayName, Action = "Changed password", Target = user.Email });
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireRateLimiting("sensitive");

app.MapPost("/api/auth/logout-all-devices", [Authorize] async (ClaimsPrincipal principal, HttpContext http, AppDbContext db) =>
{
    var user = await GetCurrentUserAsync(principal, db);
    if (user is null)
    {
        return Results.Unauthorized();
    }

    var now = DateTimeOffset.UtcNow;
    await db.UserSessions.Where(item => item.UserAccountId == user.Id && item.RevokedAt == null)
        .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.RevokedAt, now));
    ClearRefreshCookie(http);
    db.AuditRecords.Add(new AuditRecord { ActorId = user.Id, ActorName = user.DisplayName, Action = "Logged out all devices", Target = user.Email });
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.MapPost("/api/auth/refresh", async (RefreshRequest request, HttpContext http, IJwtTokenService tokenService, AppDbContext db) =>
{
    var rawRefreshToken = http.Request.Cookies["campus_refresh"] ?? request.RefreshToken;
    if (string.IsNullOrWhiteSpace(rawRefreshToken))
    {
        return Results.Unauthorized();
    }

    var hash = TokenHasher.Hash(rawRefreshToken);
    var session = await db.UserSessions.Include(item => item.UserAccount).FirstOrDefaultAsync(item => item.RefreshTokenHash == hash);
    if (session is null || session.UserAccount is null || !session.UserAccount.IsActive)
    {
        return Results.Unauthorized();
    }

    if (session.RevokedAt is not null)
    {
        var now = DateTimeOffset.UtcNow;
        await db.UserSessions.Where(item => item.UserAccountId == session.UserAccountId && item.TokenFamilyId == session.TokenFamilyId && item.RevokedAt == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.RevokedAt, now));
        ClearRefreshCookie(http);
        return Results.Unauthorized();
    }

    if (session.ExpiresAt <= DateTimeOffset.UtcNow)
    {
        session.RevokedAt = DateTimeOffset.UtcNow;
        ClearRefreshCookie(http);
        await db.SaveChangesAsync();
        return Results.Unauthorized();
    }

    var tokens = tokenService.CreateTokens(session.UserAccount);
    var newRawRefreshToken = TokenHasher.CreateOpaqueToken();
    var replacement = new UserSession
    {
        UserAccountId = session.UserAccountId,
        TokenFamilyId = session.TokenFamilyId,
        RefreshTokenHash = TokenHasher.Hash(newRawRefreshToken),
        ExpiresAt = DateTimeOffset.UtcNow.AddDays(jwt.RefreshTokenDays),
        IpAddress = http.Connection.RemoteIpAddress?.ToString(),
        UserAgent = http.Request.Headers.UserAgent.ToString(),
    };
    db.UserSessions.Add(replacement);
    session.RevokedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync();
    session.ReplacedByTokenId = replacement.Id;
    await db.SaveChangesAsync();
    SetRefreshCookie(http, newRawRefreshToken, replacement.ExpiresAt, app.Environment.IsDevelopment());
    return Results.Ok(tokens with { RefreshToken = "", RefreshTokenExpiresAt = replacement.ExpiresAt, Role = session.UserAccount.Role, Name = session.UserAccount.DisplayName });
}).RequireRateLimiting("auth");

app.MapGet("/api/auth/me", [Authorize] async (ClaimsPrincipal principal, AppDbContext db) =>
{
    var user = await GetCurrentUserAsync(principal, db);
    return user is null ? Results.Unauthorized() : Results.Ok(ToUserDto(user));
});

app.MapGet("/api/admin/users", [Authorize(Roles = "Admin")] async (AppDbContext db) =>
{
    var users = await db.Users.AsNoTracking().OrderBy(item => item.DisplayName).ToListAsync();
    return Results.Ok(users.Select(ToUserDto));
});

app.MapPut("/api/admin/users/{id:guid}", [Authorize(Roles = "Admin")] async (Guid id, UpdateUserRequest request, ClaimsPrincipal principal, AppDbContext db) =>
{
    var user = await db.Users.FirstOrDefaultAsync(item => item.Id == id);
    var actor = await GetCurrentUserAsync(principal, db);
    if (user is null || actor is null)
    {
        return Results.NotFound();
    }

    if (!IsValidRole(request.Role))
    {
        return Results.BadRequest(new { error = "Invalid role." });
    }

    var activeAdminCount = await db.Users.CountAsync(item => item.Role == "Admin" && item.IsActive);
    var removesAdminPower = user.Role == "Admin" && user.IsActive && (request.Role != "Admin" || !request.IsActive);
    if (removesAdminPower && activeAdminCount <= 1)
    {
        return Results.Conflict(new { error = "At least one active administrator must remain." });
    }

    if (actor.Id == user.Id && (request.Role != "Admin" || !request.IsActive))
    {
        return Results.Conflict(new { error = "Administrators cannot demote or disable their own account." });
    }

    user.DisplayName = request.DisplayName;
    user.Role = request.Role;
    user.Department = request.Department;
    user.RollNumber = request.RollNumber;
    user.Phone = request.Phone;
    user.IsActive = request.IsActive;
    user.UpdatedAt = DateTimeOffset.UtcNow;
    db.AuditRecords.Add(new AuditRecord { ActorId = actor.Id, ActorName = actor.DisplayName, Action = "Updated user account", Target = user.Email });
    await db.SaveChangesAsync();
    return Results.Ok(ToUserDto(user));
});

app.MapGet("/api/campus/buildings", [Authorize] async (ICampusReadService service) => Results.Ok(await service.GetBuildingsAsync()));
app.MapGet("/api/campus/classrooms", [Authorize] async (ICampusReadService service) => Results.Ok(await service.GetClassroomsAsync()));
app.MapGet("/api/campus/complaints", [Authorize] async (ClaimsPrincipal user, IComplaintService service) => Results.Ok(await service.GetComplaintsAsync(user)));
app.MapGet("/api/campus/wifi", [Authorize] async (ICampusReadService service) => Results.Ok(await service.GetWifiAsync()));
app.MapGet("/api/campus/energy", [Authorize] async (ICampusReadService service) => Results.Ok(await service.GetEnergyAsync()));
app.MapGet("/api/campus/analytics", [Authorize(Roles = "Admin,Faculty")] async (ICampusReadService service) => Results.Ok(await service.GetAnalyticsAsync()));

app.MapPost("/api/complaints", [Authorize(Roles = "Student,Faculty,Admin")] async (CreateComplaintRequest request, ClaimsPrincipal user, IComplaintService service) =>
{
    var complaint = await service.CreateAsync(request, user);
    return Results.Created($"/api/campus/complaints/{complaint.Id}", complaint);
});

app.MapPut("/api/complaints/{id:guid}", [Authorize(Roles = "Admin,Faculty")] async (Guid id, UpdateComplaintRequest request, ClaimsPrincipal user, IComplaintService service) =>
{
    var complaint = await service.UpdateAsync(id, request, user);
    return complaint is null ? Results.NotFound() : Results.Ok(complaint);
});

app.MapPost("/api/uploads", [Authorize] async ([FromForm] IFormFile file, ClaimsPrincipal principal, IWebHostEnvironment env, AppDbContext db) =>
{
    var user = await GetCurrentUserAsync(principal, db);
    if (user is null)
    {
        return Results.Unauthorized();
    }

    if (file.Length == 0 || file.Length > MaxAllowedBytes(file.ContentType))
    {
        return Results.BadRequest(new { error = "File is empty or exceeds the configured size limit." });
    }

    var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
    if (!IsAllowedUpload(file.ContentType, extension))
    {
        return Results.BadRequest(new { error = "Only image, video, and PDF uploads are allowed." });
    }

    await using var readStream = file.OpenReadStream();
    if (!await HasAllowedFileSignatureAsync(readStream, file.ContentType))
    {
        return Results.BadRequest(new { error = "File content does not match the declared file type." });
    }
    readStream.Position = 0;

    var uploads = Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"), "uploads");
    Directory.CreateDirectory(uploads);
    var safeName = $"{Guid.NewGuid():N}{extension}";
    var path = Path.Combine(uploads, safeName);
    await using var stream = File.Create(path);
    await readStream.CopyToAsync(stream);
    db.StoredFiles.Add(new StoredFile
    {
        OwnerId = user.Id,
        StorageKey = safeName,
        OriginalFileName = Path.GetFileName(file.FileName),
        ContentType = file.ContentType,
        Extension = extension,
        Size = file.Length,
    });
    await db.SaveChangesAsync();
    return Results.Ok(new UploadResponse($"/uploads/{safeName}", file.FileName, file.ContentType, file.Length));
}).DisableAntiforgery().RequireRateLimiting("upload");

app.MapPost("/api/ai/query", [Authorize] async (AiQueryRequest request, IAiAssistantService assistant) =>
{
    var answer = await assistant.AnswerAsync(request.Query);
    return Results.Ok(new { answer });
}).RequireRateLimiting("sensitive");

app.MapPost("/api/emergency/sos", [Authorize(Roles = "Security,Admin")] async (EmergencyRequest request, ClaimsPrincipal user, ICampusReadService service) =>
{
    await service.RecordEmergencyAsync(request, user);
    return Results.Accepted(new { status = "NotConfigured", message = "Action recorded, but external integration is not configured." });
}).RequireRateLimiting("sensitive");

app.MapGet("/api/emergency/events", [Authorize(Roles = "Security,Admin")] async (AppDbContext db) =>
    Results.Ok(await db.EmergencyEvents.Include(item => item.CreatedBy).AsNoTracking().OrderByDescending(item => item.CreatedAt).Select(item => new EmergencyEventDto(
        item.Id,
        item.Kind,
        item.Location,
        item.Notes,
        item.Severity,
        item.Status,
        item.AssignedTeam,
        item.CreatedBy != null ? item.CreatedBy.DisplayName : "System",
        item.CreatedAt)).ToListAsync()));

app.MapGet("/api/audit", [Authorize(Roles = "Admin,Security")] async (AppDbContext db) =>
    Results.Ok(await db.AuditRecords.AsNoTracking().OrderByDescending(item => item.CreatedAt).Select(item => new AuditRecordDto(
        item.Id,
        item.ActorName,
        item.Action,
        item.Target,
        item.CreatedAt)).ToListAsync()));

app.MapHub<NotificationsHub>("/hubs/notifications");

app.Run();

static async Task<UserAccount?> GetCurrentUserAsync(ClaimsPrincipal principal, AppDbContext db)
{
    var id = principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal.FindFirstValue(JwtRegisteredClaimNames.Sub);
    return Guid.TryParse(id, out var userId)
        ? await db.Users.FirstOrDefaultAsync(item => item.Id == userId)
        : null;
}

static UserDto ToUserDto(UserAccount user)
{
    return new UserDto(user.Id, user.DisplayName, user.Email, user.Role, user.Department, user.RollNumber, user.Phone, user.IsActive);
}

static void SetRefreshCookie(HttpContext http, string refreshToken, DateTimeOffset expiresAt, bool isDevelopment)
{
    http.Response.Cookies.Append("campus_refresh", refreshToken, new CookieOptions
    {
        HttpOnly = true,
        Secure = !isDevelopment,
        SameSite = isDevelopment ? SameSiteMode.Strict : SameSiteMode.None,
        Expires = expiresAt,
        Path = "/api/auth",
    });
}

static void ClearRefreshCookie(HttpContext http)
{
    http.Response.Cookies.Delete("campus_refresh", new CookieOptions
    {
        HttpOnly = true,
        Secure = !http.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment(),
        SameSite = http.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment() ? SameSiteMode.Strict : SameSiteMode.None,
        Path = "/api/auth",
    });
}

static bool IsValidEmail(string? value)
{
    return !string.IsNullOrWhiteSpace(value) && System.Net.Mail.MailAddress.TryCreate(value, out _);
}

static bool IsStrongPassword(string? value)
{
    return !string.IsNullOrWhiteSpace(value) &&
        value.Length >= 10 &&
        value.Any(char.IsUpper) &&
        value.Any(char.IsLower) &&
        value.Any(char.IsDigit) &&
        value.Any(ch => !char.IsLetterOrDigit(ch));
}

static bool IsValidRole(string role)
{
    return role is "Student" or "Faculty" or "Admin" or "Security";
}

static long MaxAllowedBytes(string contentType)
{
    if (contentType.StartsWith("video/", StringComparison.OrdinalIgnoreCase))
    {
        return 50 * 1024 * 1024;
    }

    if (contentType == "application/pdf")
    {
        return 10 * 1024 * 1024;
    }

    return 5 * 1024 * 1024;
}

static bool IsAllowedUpload(string contentType, string extension)
{
    var allowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".pdf", ".mp4", ".mov", ".webm"
    };
    var allowedMime = contentType is "image/jpeg" or "image/png" or "image/webp" or "application/pdf" or "video/mp4" or "video/quicktime" or "video/webm";
    return allowedMime && allowedExtensions.Contains(extension);
}

static async Task<bool> HasAllowedFileSignatureAsync(Stream stream, string contentType)
{
    var header = new byte[12];
    var read = await stream.ReadAsync(header);
    if (read < 4)
    {
        return false;
    }

    if (contentType == "application/pdf")
    {
        return header[0] == 0x25 && header[1] == 0x50 && header[2] == 0x44 && header[3] == 0x46;
    }

    if (contentType == "image/png")
    {
        return header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47;
    }

    if (contentType == "image/jpeg")
    {
        return header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF;
    }

    if (contentType == "image/webp")
    {
        return header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46 &&
            header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50;
    }

    if (contentType.StartsWith("video/", StringComparison.OrdinalIgnoreCase))
    {
        return header.Skip(4).Take(4).SequenceEqual("ftyp"u8.ToArray());
    }

    return false;
}

static string NormalizePostgresConnectionString(string value)
{
    if (!value.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) &&
        !value.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
    {
        return value;
    }

    var uri = new Uri(value);
    var credentials = uri.UserInfo.Split(':', 2);
    var username = Uri.UnescapeDataString(credentials.ElementAtOrDefault(0) ?? string.Empty);
    var password = Uri.UnescapeDataString(credentials.ElementAtOrDefault(1) ?? string.Empty);
    var database = uri.AbsolutePath.TrimStart('/');
    var port = uri.Port > 0 ? uri.Port : 5432;

    return $"Host={uri.Host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true";
}
