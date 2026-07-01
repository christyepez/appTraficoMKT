using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Net.Http.Json;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.ConfigureHttpJsonOptions(options => options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddDbContext<IdentityDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("IdentityDb")));
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var jwt = JwtOptions.FromConfiguration(builder.Configuration);
builder.Services.AddSingleton(jwt);
builder.Services.AddHttpClient("microsoft");
builder.Services.AddHttpClient("requirements", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["Services:Requirements"] ?? "http://requirements-api:8080");
});
builder.Services.AddHttpClient("activities", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["Services:Activities"] ?? "http://activities-api:8080");
});
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = jwt.ValidationParameters();
    });
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Administrador"));
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
    await db.Database.EnsureCreatedAsync();
    await IdentitySchema.EnsureAsync(db);
    await IdentitySeed.RunAsync(db);
}

app.MapGet("/health", () => Results.Ok(new { service = "identity", status = "healthy" }));

app.MapPost("/auth/login", async (LoginRequest request, IdentityDbContext db, JwtOptions jwtOptions) =>
{
    var normalized = request.Email.Trim().ToLowerInvariant();
    var user = await db.Users.SingleOrDefaultAsync(x => x.Email == normalized);
    if (user is null) return Results.Unauthorized();
    if (!user.IsActive) return Results.BadRequest("Usuario inactivo. Solicite al administrador activar la cuenta.");
    if (!PasswordHasher.Verify(request.Password, user.PasswordHash, user.PasswordSalt))
        return Results.Unauthorized();

    user.LastLoginAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync();

    return Results.Ok(TokenFactory.Create(user, jwtOptions));
});

app.MapPost("/auth/forgot-password", async (ForgotPasswordRequest request, IdentityDbContext db, IConfiguration configuration, IHttpClientFactory httpClientFactory) =>
{
    var normalized = request.Email.Trim().ToLowerInvariant();
    var user = await db.Users.SingleOrDefaultAsync(x => x.Email == normalized && x.IsActive);
    if (user is not null)
    {
        var temporaryPassword = PasswordHasher.TemporaryPassword();
        var (hash, salt) = PasswordHasher.Hash(temporaryPassword);
        user.PasswordHash = hash;
        user.PasswordSalt = salt;
        user.MustChangePassword = true;
        user.PasswordResetAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        await PasswordResetNotifier.SendAsync(user, temporaryPassword, configuration, httpClientFactory);
    }

    return Results.Ok(new { message = "Si el correo existe, se enviará una clave temporal para recuperar el acceso." });
});

app.MapPost("/auth/change-password", async (ChangePasswordRequest request, IdentityDbContext db) =>
{
    var normalized = request.Email.Trim().ToLowerInvariant();
    var user = await db.Users.SingleOrDefaultAsync(x => x.Email == normalized && x.IsActive);
    if (user is null || !PasswordHasher.Verify(request.CurrentPassword, user.PasswordHash, user.PasswordSalt))
        return Results.Unauthorized();
    if (request.NewPassword.Length < 8) return Results.BadRequest("La nueva clave debe tener al menos 8 caracteres.");

    var (hash, salt) = PasswordHasher.Hash(request.NewPassword);
    user.PasswordHash = hash;
    user.PasswordSalt = salt;
    user.MustChangePassword = false;
    user.PasswordResetAt = null;
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Clave actualizada correctamente." });
});

app.MapPost("/auth/microsoft", (MicrosoftLoginRequest request, IConfiguration configuration) =>
    Results.BadRequest("Use /auth/microsoft/code para SSO Microsoft Entra ID."));

app.MapGet("/auth/microsoft/config", (IConfiguration configuration) =>
{
    var tenantId = configuration["AzureAd:TenantId"];
    var clientId = configuration["AzureAd:ClientId"];
    if (string.IsNullOrWhiteSpace(tenantId) || string.IsNullOrWhiteSpace(clientId))
        return Results.BadRequest("Microsoft SSO requiere AzureAd:TenantId y AzureAd:ClientId.");

    return Results.Ok(new
    {
        tenantId,
        clientId,
        authority = $"https://login.microsoftonline.com/{tenantId}",
        scopes = new[] { "openid", "profile", "email" }
    });
});

app.MapPost("/auth/microsoft/code", async (MicrosoftCodeLoginRequest request, IdentityDbContext db, JwtOptions jwtOptions, IConfiguration configuration, IHttpClientFactory httpClientFactory) =>
{
    var tenantId = configuration["AzureAd:TenantId"];
    var clientId = configuration["AzureAd:ClientId"];
    var clientSecret = configuration["AzureAd:ClientSecret"];
    var allowedDomain = configuration["AzureAd:AllowedDomain"];
    if (string.IsNullOrWhiteSpace(tenantId) || string.IsNullOrWhiteSpace(clientId))
        return Results.BadRequest("Microsoft SSO requiere AzureAd:TenantId y AzureAd:ClientId.");

    var client = httpClientFactory.CreateClient("microsoft");
    var fields = new Dictionary<string, string>
    {
        ["client_id"] = clientId,
        ["grant_type"] = "authorization_code",
        ["code"] = request.Code,
        ["redirect_uri"] = request.RedirectUri,
        ["code_verifier"] = request.CodeVerifier,
        ["scope"] = "openid profile email"
    };
    if (!string.IsNullOrWhiteSpace(clientSecret)) fields["client_secret"] = clientSecret;

    var tokenResponse = await client.PostAsync($"https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token", new FormUrlEncodedContent(fields));
    var tokenJson = await tokenResponse.Content.ReadAsStringAsync();
    if (!tokenResponse.IsSuccessStatusCode) return Results.BadRequest(tokenJson);

    using var tokenDocument = JsonDocument.Parse(tokenJson);
    var idToken = tokenDocument.RootElement.GetProperty("id_token").GetString();
    if (string.IsNullOrWhiteSpace(idToken)) return Results.BadRequest("Microsoft no devolvió id_token.");

    var principal = await MicrosoftTokenValidator.ValidateAsync(idToken, tenantId, clientId, client);
    var email = MicrosoftTokenValidator.GetEmail(principal).Trim().ToLowerInvariant();
    if (string.IsNullOrWhiteSpace(email)) return Results.BadRequest("La cuenta Microsoft no devolvió correo.");
    if (!string.IsNullOrWhiteSpace(allowedDomain) && !email.EndsWith($"@{allowedDomain.Trim().TrimStart('@')}", StringComparison.OrdinalIgnoreCase))
        return Results.Forbid();

    var user = await db.Users.SingleOrDefaultAsync(x => x.Email == email);
    if (user is null)
    {
        var (hash, salt) = PasswordHasher.Hash(Convert.ToBase64String(RandomNumberGenerator.GetBytes(24)));
        user = new AppUser
        {
            Name = principal.Identity?.Name ?? email,
            Email = email,
            PasswordHash = hash,
            PasswordSalt = salt,
            AuthProvider = "Microsoft",
            Roles = "Solicitante",
            ScreenPermissions = string.Join(",", ScreenAccess.DefaultForRoles(["Solicitante"])),
            AllowMicrosoftLogin = true,
            MenuMode = "horizontal",
            MenuCollapsed = false,
            IsActive = true
        };
        db.Users.Add(user);
    }
    else if (!user.IsActive)
    {
        return Results.BadRequest("Usuario inactivo. Solicite al administrador activar la cuenta.");
    }
    else if (!user.AllowMicrosoftLogin)
    {
        return Results.BadRequest("El ingreso por Office 365 no está habilitado para este usuario.");
    }
    else
    {
        user.AuthProvider = "Microsoft";
    }

    user.LastLoginAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(TokenFactory.Create(user, jwtOptions));
});

app.MapGet("/brand-settings", async (IdentityDbContext db) =>
    await db.BrandSettings.OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt).FirstOrDefaultAsync()
        ?? BrandSettings.Default());

app.MapPut("/brand-settings", async (UpsertBrandSettingsRequest request, IdentityDbContext db) =>
{
    var settings = await db.BrandSettings.OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt).FirstOrDefaultAsync();
    if (settings is null)
    {
        settings = BrandSettings.Default();
        db.BrandSettings.Add(settings);
    }

    settings.Apply(request);
    await db.SaveChangesAsync();
    return Results.Ok(settings);
}).RequireAuthorization("AdminOnly");

app.MapGet("/auth/me", (ClaimsPrincipal user) =>
{
    if (user.Identity?.IsAuthenticated != true) return Results.Unauthorized();
    return Results.Ok(new
    {
        id = user.FindFirstValue(ClaimTypes.NameIdentifier),
        email = user.FindFirstValue(ClaimTypes.Email),
        name = user.Identity.Name,
        roles = user.FindAll(ClaimTypes.Role).Select(x => x.Value).ToArray()
    });
}).RequireAuthorization();

app.MapGet("/users", async (IdentityDbContext db) =>
{
    var users = await db.Users.OrderBy(x => x.Name).ToListAsync();
    return users.Select(UserResponse.From).ToList();
}).RequireAuthorization("AdminOnly");

app.MapGet("/users/technicians", async (IdentityDbContext db) =>
{
    var users = await db.Users
        .Where(x => x.IsActive && x.Roles.Contains("Tecnico"))
        .OrderBy(x => x.Name)
        .ToListAsync();
    return users.Select(UserResponse.From).ToList();
}).RequireAuthorization();

app.MapGet("/usage-metrics", async (IdentityDbContext db) =>
{
    var users = await db.Users.ToListAsync();
    var now = DateTimeOffset.UtcNow;
    var active = users.Where(x => x.IsActive).ToList();
    var withLogin = users.Where(x => x.LastLoginAt.HasValue).ToList();
    var recent = users.Count(x => x.LastLoginAt.HasValue && x.LastLoginAt.Value >= now.AddDays(-7));
    return Results.Ok(new UsageMetricsResponse(
        users.Count,
        active.Count,
        recent,
        withLogin.Count == 0 ? 0 : Math.Round((decimal)withLogin.Average(x => (now - x.LastLoginAt!.Value).TotalHours), 2),
        users.OrderByDescending(x => x.LastLoginAt ?? DateTimeOffset.MinValue)
            .Take(10)
            .Select(x => new UsageUserMetric(x.Name, x.Email, x.Roles, x.LastLoginAt, x.IsActive))
            .ToList()));
}).RequireAuthorization();

app.MapPost("/users", async (CreateUserRequest request, IdentityDbContext db) =>
{
    var normalized = request.Email.Trim().ToLowerInvariant();
    if (await db.Users.AnyAsync(x => x.Email == normalized)) return Results.Conflict("Email already exists.");

    var (hash, salt) = PasswordHasher.Hash(request.Password);
    var user = new AppUser
    {
        Name = request.Name.Trim(),
        Email = normalized,
        PasswordHash = hash,
        PasswordSalt = salt,
        AuthProvider = request.AuthProvider,
        AllowMicrosoftLogin = request.AllowMicrosoftLogin,
        Roles = string.Join(",", request.Roles.Distinct(StringComparer.OrdinalIgnoreCase)),
        ScreenPermissions = string.Join(",", request.ScreenPermissions.Length == 0
            ? ScreenAccess.DefaultForRoles(request.Roles)
            : request.ScreenPermissions.Distinct(StringComparer.OrdinalIgnoreCase)),
        FacultyId = request.FacultyId,
        CampusId = request.CampusId,
        MenuMode = request.MenuMode.Equals("vertical", StringComparison.OrdinalIgnoreCase) ? "vertical" : "horizontal",
        MenuCollapsed = request.MenuCollapsed,
        IsActive = true
    };

    db.Users.Add(user);
    await db.SaveChangesAsync();
    return Results.Created($"/users/{user.Id}", UserResponse.From(user));
}).RequireAuthorization("AdminOnly");

app.MapPut("/users/{id:guid}", async (Guid id, UpdateUserRequest request, IdentityDbContext db, IHttpClientFactory httpClientFactory) =>
{
    var user = await db.Users.FindAsync(id);
    if (user is null) return Results.NotFound();
    var normalizedEmail = request.Email.Trim().ToLowerInvariant();
    if (string.IsNullOrWhiteSpace(normalizedEmail) || !normalizedEmail.Contains('@'))
        return Results.BadRequest("Ingrese un correo válido.");
    if (await db.Users.AnyAsync(x => x.Id != id && x.Email == normalizedEmail))
        return Results.Conflict("Ya existe otro usuario con ese correo.");
    if (user.IsActive && !request.IsActive)
    {
        var validation = await UserAssignmentValidator.ValidateCanDeactivateAsync(user, httpClientFactory);
        if (!validation.CanDeactivate) return Results.Conflict(validation.Message);
    }

    user.Name = request.Name.Trim();
    user.Email = normalizedEmail;
    user.Roles = string.Join(",", request.Roles.Distinct(StringComparer.OrdinalIgnoreCase));
    user.ScreenPermissions = string.Join(",", request.ScreenPermissions.Distinct(StringComparer.OrdinalIgnoreCase));
    user.FacultyId = request.FacultyId;
    user.CampusId = request.CampusId;
    user.AllowMicrosoftLogin = request.AllowMicrosoftLogin;
    user.MenuMode = request.MenuMode.Equals("vertical", StringComparison.OrdinalIgnoreCase) ? "vertical" : "horizontal";
    user.MenuCollapsed = request.MenuCollapsed;
    user.IsActive = request.IsActive;
    if (!string.IsNullOrWhiteSpace(request.Password))
    {
        if (request.Password.Length < 8) return Results.BadRequest("La clave debe tener al menos 8 caracteres.");
        var (hash, salt) = PasswordHasher.Hash(request.Password);
        user.PasswordHash = hash;
        user.PasswordSalt = salt;
        user.MustChangePassword = true;
        user.PasswordResetAt = DateTimeOffset.UtcNow;
    }
    await db.SaveChangesAsync();
    return Results.Ok(UserResponse.From(user));
}).RequireAuthorization("AdminOnly");

app.MapDelete("/users/{id:guid}", async (Guid id, IdentityDbContext db, IHttpClientFactory httpClientFactory) =>
{
    var user = await db.Users.FindAsync(id);
    if (user is null) return Results.NotFound();
    if (!user.IsActive) return Results.NoContent();

    var validation = await UserAssignmentValidator.ValidateCanDeactivateAsync(user, httpClientFactory);
    if (!validation.CanDeactivate) return Results.Conflict(validation.Message);

    user.IsActive = false;
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization("AdminOnly");

app.MapGet("/roles", () => Results.Ok(new[] { "Administrador", "Coordinador", "Solicitante", "Tecnico", "Aprobador", "Auditor" }))
    .RequireAuthorization();

app.MapGet("/screens", () => Results.Ok(ScreenAccess.All)).RequireAuthorization();

app.MapGet("/roles/{role}/screens", (string role) =>
    Results.Ok(ScreenAccess.DefaultForRoles(new[] { role }))).RequireAuthorization();

app.Run();

public sealed record LoginRequest(string Email, string Password);
public sealed record ForgotPasswordRequest(string Email);
public sealed record ChangePasswordRequest(string Email, string CurrentPassword, string NewPassword);
public sealed record AssignmentCountResponse(int Count);
public sealed record MicrosoftLoginRequest(string Email, string AccessToken);
public sealed record MicrosoftCodeLoginRequest(string Code, string CodeVerifier, string RedirectUri);
public sealed record UpsertBrandSettingsRequest(
    string Primary,
    string PrimaryDark,
    string Accent,
    string Background,
    string Surface,
    string Foreground,
    string Muted,
    string Line,
    string ButtonText,
    string Secondary,
    string SecondaryText,
    string Success,
    string Warning,
    string Danger,
    string TopbarText,
    string FontFamily,
    string MenuMode,
    bool MenuCollapsed,
    bool MobileMenuCollapsed,
    string HeaderTextAlign,
    string HeaderTextPosition,
    int BrandVersion,
    string Logo,
    string ChatbotIcon,
    bool ShowPublicRequirementForm,
    bool ShowPublicRequirementFullPage,
    bool ShowLoginChatbot,
    bool ShowDemoCredentials,
    bool ShowOffice365Login,
    string Title,
    string Subtitle);
public sealed record CreateUserRequest(string Name, string Email, string Password, string AuthProvider, bool AllowMicrosoftLogin, string[] Roles, string[] ScreenPermissions, Guid? FacultyId, Guid? CampusId, string MenuMode, bool MenuCollapsed);
public sealed record UpdateUserRequest(string Name, string Email, string? Password, bool AllowMicrosoftLogin, string[] Roles, string[] ScreenPermissions, Guid? FacultyId, Guid? CampusId, string MenuMode, bool MenuCollapsed, bool IsActive);
public sealed record UserResponse(Guid Id, string Name, string Email, string AuthProvider, bool AllowMicrosoftLogin, string[] Roles, string[] ScreenPermissions, Guid? FacultyId, Guid? CampusId, string MenuMode, bool MenuCollapsed, bool IsActive, bool MustChangePassword)
{
    public static UserResponse From(AppUser user) => new(
        user.Id,
        user.Name,
        user.Email,
        user.AuthProvider,
        user.AllowMicrosoftLogin,
        user.Roles.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries),
        user.ScreenPermissions.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries),
        user.FacultyId,
        user.CampusId,
        user.MenuMode,
        user.MenuCollapsed,
        user.IsActive,
        user.MustChangePassword);
}
public sealed record UsageMetricsResponse(int TotalUsers, int ActiveUsers, int UsersLoggedLast7Days, decimal AverageHoursSinceLastLogin, IReadOnlyList<UsageUserMetric> RecentUsers);
public sealed record UsageUserMetric(string Name, string Email, string Roles, DateTimeOffset? LastLoginAt, bool IsActive);

public sealed class AppUser
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string PasswordSalt { get; set; } = string.Empty;
    public string AuthProvider { get; set; } = "Local";
    public bool AllowMicrosoftLogin { get; set; }
    public string Roles { get; set; } = "Solicitante";
    public string ScreenPermissions { get; set; } = "dashboard";
    public Guid? FacultyId { get; set; }
    public Guid? CampusId { get; set; }
    public string MenuMode { get; set; } = "horizontal";
    public bool MenuCollapsed { get; set; }
    public bool IsActive { get; set; } = true;
    public bool MustChangePassword { get; set; }
    public DateTimeOffset? PasswordResetAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? LastLoginAt { get; set; }
}

public static class UserAssignmentValidator
{
    public static async Task<UserAssignmentValidation> ValidateCanDeactivateAsync(AppUser user, IHttpClientFactory httpClientFactory)
    {
        var requirements = await CountAsync(httpClientFactory.CreateClient("requirements"), "/requirements/assignments/by-user", user);
        var products = await CountAsync(httpClientFactory.CreateClient("activities"), "/activities/assignments/by-user", user);
        var canDeactivate = requirements == 0 && products == 0;
        var message = canDeactivate
            ? string.Empty
            : $"No se puede inactivar el usuario porque tiene {requirements} requerimiento(s) y {products} producto(s) activos asignados.";
        return new UserAssignmentValidation(canDeactivate, requirements, products, message);
    }

    private static async Task<int> CountAsync(HttpClient client, string path, AppUser user)
    {
        var url = $"{path}?email={Uri.EscapeDataString(user.Email)}&name={Uri.EscapeDataString(user.Name)}";
        var response = await client.GetAsync(url);
        if (!response.IsSuccessStatusCode) throw new InvalidOperationException("No se pudieron validar las asignaciones del usuario.");
        var count = await response.Content.ReadFromJsonAsync<AssignmentCountResponse>();
        return count?.Count ?? 0;
    }
}

public sealed record UserAssignmentValidation(bool CanDeactivate, int Requirements, int Products, string Message);

public sealed class IdentityDbContext(DbContextOptions<IdentityDbContext> options) : DbContext(options)
{
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<BrandSettings> BrandSettings => Set<BrandSettings>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(160).IsRequired();
            entity.Property(x => x.Email).HasMaxLength(180).IsRequired();
            entity.Property(x => x.PasswordHash).HasMaxLength(256).IsRequired();
            entity.Property(x => x.PasswordSalt).HasMaxLength(256).IsRequired();
            entity.Property(x => x.AuthProvider).HasMaxLength(32).IsRequired();
            entity.Property(x => x.AllowMicrosoftLogin).HasDefaultValue(false);
            entity.Property(x => x.Roles).HasMaxLength(300).IsRequired();
            entity.Property(x => x.ScreenPermissions).HasMaxLength(500).IsRequired();
            entity.Property(x => x.MenuMode).HasMaxLength(20).HasDefaultValue("horizontal");
            entity.Property(x => x.MustChangePassword).HasDefaultValue(false);
            entity.HasIndex(x => x.Email).IsUnique();
        });

        modelBuilder.Entity<BrandSettings>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Primary).HasMaxLength(20);
            entity.Property(x => x.PrimaryDark).HasMaxLength(20);
            entity.Property(x => x.Accent).HasMaxLength(20);
            entity.Property(x => x.Background).HasMaxLength(20);
            entity.Property(x => x.Surface).HasMaxLength(20);
            entity.Property(x => x.Foreground).HasMaxLength(20);
            entity.Property(x => x.Muted).HasMaxLength(20);
            entity.Property(x => x.Line).HasMaxLength(20);
            entity.Property(x => x.ButtonText).HasMaxLength(20);
            entity.Property(x => x.Secondary).HasMaxLength(20);
            entity.Property(x => x.SecondaryText).HasMaxLength(20);
            entity.Property(x => x.Success).HasMaxLength(20);
            entity.Property(x => x.Warning).HasMaxLength(20);
            entity.Property(x => x.Danger).HasMaxLength(20);
            entity.Property(x => x.TopbarText).HasMaxLength(20);
            entity.Property(x => x.FontFamily).HasMaxLength(180);
            entity.Property(x => x.MenuMode).HasMaxLength(20);
            entity.Property(x => x.MobileMenuCollapsed).HasDefaultValue(true);
            entity.Property(x => x.HeaderTextAlign).HasMaxLength(20);
            entity.Property(x => x.HeaderTextPosition).HasMaxLength(20);
            entity.Property(x => x.Logo).HasMaxLength(1200);
            entity.Property(x => x.ChatbotIcon).HasMaxLength(1200);
            entity.Property(x => x.ShowPublicRequirementForm).HasDefaultValue(true);
            entity.Property(x => x.ShowPublicRequirementFullPage).HasDefaultValue(true);
            entity.Property(x => x.ShowLoginChatbot).HasDefaultValue(true);
            entity.Property(x => x.ShowDemoCredentials).HasDefaultValue(true);
            entity.Property(x => x.ShowOffice365Login).HasDefaultValue(true);
            entity.Property(x => x.Title).HasMaxLength(180);
            entity.Property(x => x.Subtitle).HasMaxLength(240);
        });
    }
}

public sealed class BrandSettings
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Primary { get; set; } = "#3c235f";
    public string PrimaryDark { get; set; } = "#2a1844";
    public string Accent { get; set; } = "#f6b700";
    public string Background { get; set; } = "#f5f7fb";
    public string Surface { get; set; } = "#ffffff";
    public string Foreground { get; set; } = "#101b2d";
    public string Muted { get; set; } = "#697386";
    public string Line { get; set; } = "#d9deea";
    public string ButtonText { get; set; } = "#ffffff";
    public string Secondary { get; set; } = "#eef4f7";
    public string SecondaryText { get; set; } = "#001f49";
    public string Success { get; set; } = "#207044";
    public string Warning { get; set; } = "#f6b700";
    public string Danger { get; set; } = "#b42318";
    public string TopbarText { get; set; } = "#ffffff";
    public string FontFamily { get; set; } = "Segoe UI, Arial, Helvetica, sans-serif";
    public string MenuMode { get; set; } = "horizontal";
    public bool MenuCollapsed { get; set; }
    public bool MobileMenuCollapsed { get; set; } = true;
    public string HeaderTextAlign { get; set; } = "center";
    public string HeaderTextPosition { get; set; } = "middle";
    public int BrandVersion { get; set; } = 3;
    public string Logo { get; set; } = "https://www.indoamerica.edu.ec/wp-content/uploads/2026/03/logo-gen-cuad.jpg";
    public string ChatbotIcon { get; set; } = "https://www.indoamerica.edu.ec/wp-content/uploads/2026/03/logo-gen-cuad.jpg";
    public bool ShowPublicRequirementForm { get; set; } = true;
    public bool ShowPublicRequirementFullPage { get; set; } = true;
    public bool ShowLoginChatbot { get; set; } = true;
    public bool ShowDemoCredentials { get; set; } = true;
    public bool ShowOffice365Login { get; set; } = true;
    public string Title { get; set; } = "Creamos conexiones que dejan huella";
    public string Subtitle { get; set; } = "Universidad Indoamérica";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }

    public static BrandSettings Default() => new();

    public void Apply(UpsertBrandSettingsRequest request)
    {
        Primary = request.Primary.Trim();
        PrimaryDark = request.PrimaryDark.Trim();
        Accent = request.Accent.Trim();
        Background = request.Background.Trim();
        Surface = request.Surface.Trim();
        Foreground = request.Foreground.Trim();
        Muted = request.Muted.Trim();
        Line = request.Line.Trim();
        ButtonText = request.ButtonText.Trim();
        Secondary = request.Secondary.Trim();
        SecondaryText = request.SecondaryText.Trim();
        Success = request.Success.Trim();
        Warning = request.Warning.Trim();
        Danger = request.Danger.Trim();
        TopbarText = request.TopbarText.Trim();
        FontFamily = request.FontFamily.Trim();
        MenuMode = request.MenuMode.Equals("vertical", StringComparison.OrdinalIgnoreCase) ? "vertical" : "horizontal";
        MenuCollapsed = request.MenuCollapsed;
        MobileMenuCollapsed = request.MobileMenuCollapsed;
        HeaderTextAlign = request.HeaderTextAlign.ToLowerInvariant() switch
        {
            "left" => "left",
            "right" => "right",
            _ => "center"
        };
        HeaderTextPosition = request.HeaderTextPosition.ToLowerInvariant() switch
        {
            "top" => "top",
            "bottom" => "bottom",
            _ => "middle"
        };
        BrandVersion = Math.Max(3, request.BrandVersion);
        Logo = request.Logo.Trim();
        ChatbotIcon = request.ChatbotIcon.Trim();
        ShowPublicRequirementForm = request.ShowPublicRequirementForm;
        ShowPublicRequirementFullPage = request.ShowPublicRequirementFullPage;
        ShowLoginChatbot = request.ShowLoginChatbot;
        ShowDemoCredentials = request.ShowDemoCredentials;
        ShowOffice365Login = request.ShowOffice365Login;
        Title = request.Title.Trim();
        Subtitle = request.Subtitle.Trim();
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}

public static class ScreenAccess
{
    public static readonly string[] All = ["dashboard", "activities", "evidence", "approvals", "metrics", "audit", "admin", "users", "storage", "initial-import", "branding", "notifications", "my-notifications", "notification-log"];

    public static string[] DefaultForRoles(IEnumerable<string> roles)
    {
        var roleSet = roles.Select(x => x.Trim()).ToHashSet(StringComparer.OrdinalIgnoreCase);
        if (roleSet.Contains("Administrador")) return All;
        var screens = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "dashboard" };
        if (roleSet.Contains("Tecnico")) screens.UnionWith(["activities", "evidence", "my-notifications"]);
        if (roleSet.Contains("Aprobador")) screens.UnionWith(["approvals", "my-notifications"]);
        if (roleSet.Contains("Coordinador")) screens.UnionWith(["activities", "evidence", "approvals", "metrics", "audit", "my-notifications"]);
        if (roleSet.Contains("Auditor")) screens.UnionWith(["dashboard", "activities", "evidence", "approvals", "metrics", "audit"]);
        return screens.ToArray();
    }
}

public sealed record JwtOptions(string Issuer, string Audience, string Secret, int ExpiresMinutes)
{
    public static JwtOptions FromConfiguration(IConfiguration configuration) => new(
        configuration["Jwt:Issuer"] ?? "RequirementsPlatform",
        configuration["Jwt:Audience"] ?? "RequirementsPlatformWeb",
        configuration["Jwt:Secret"] ?? "development-secret-change-me-please-32",
        int.TryParse(configuration["Jwt:ExpiresMinutes"], out var minutes) ? minutes : 480);

    public SymmetricSecurityKey SigningKey => new(Encoding.UTF8.GetBytes(Secret));

    public TokenValidationParameters ValidationParameters() => new()
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateIssuerSigningKey = true,
        ValidateLifetime = true,
        ValidIssuer = Issuer,
        ValidAudience = Audience,
        IssuerSigningKey = SigningKey
    };
}

public static class TokenFactory
{
    public static object Create(AppUser user, JwtOptions options)
    {
        var roles = user.Roles.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Name),
            new(ClaimTypes.Email, user.Email)
        };
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var expires = DateTime.UtcNow.AddMinutes(options.ExpiresMinutes);
        var token = new JwtSecurityToken(
            options.Issuer,
            options.Audience,
            claims,
            expires: expires,
            signingCredentials: new SigningCredentials(options.SigningKey, SecurityAlgorithms.HmacSha256));

        return new
        {
            accessToken = new JwtSecurityTokenHandler().WriteToken(token),
            expiresAt = expires,
            user = UserResponse.From(user)
        };
    }
}

public static class PasswordHasher
{
    public static (string Hash, string Salt) Hash(string password)
    {
        var saltBytes = RandomNumberGenerator.GetBytes(16);
        var hashBytes = Rfc2898DeriveBytes.Pbkdf2(password, saltBytes, 100_000, HashAlgorithmName.SHA256, 32);
        return (Convert.ToBase64String(hashBytes), Convert.ToBase64String(saltBytes));
    }

    public static bool Verify(string password, string hash, string salt)
    {
        var saltBytes = Convert.FromBase64String(salt);
        var hashBytes = Rfc2898DeriveBytes.Pbkdf2(password, saltBytes, 100_000, HashAlgorithmName.SHA256, 32);
        return CryptographicOperations.FixedTimeEquals(hashBytes, Convert.FromBase64String(hash));
    }

    public static string TemporaryPassword()
    {
        const string alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!#$%";
        var bytes = RandomNumberGenerator.GetBytes(12);
        return new string(bytes.Select(value => alphabet[value % alphabet.Length]).ToArray());
    }
}

public static class PasswordResetNotifier
{
    public static async Task SendAsync(AppUser user, string temporaryPassword, IConfiguration configuration, IHttpClientFactory httpClientFactory)
    {
        var webhookUrl = configuration["PasswordReset:WebhookUrl"];
        if (string.IsNullOrWhiteSpace(webhookUrl)) return;

        var client = httpClientFactory.CreateClient("microsoft");
        await client.PostAsJsonAsync(webhookUrl, new
        {
            to = user.Email,
            subject = "Clave temporal - Requerimientos MKT-UTI",
            temporaryPassword,
            html = $"""
                <h2>Recuperación de contraseña</h2>
                <p>Hola {System.Net.WebUtility.HtmlEncode(user.Name)},</p>
                <p>Tu clave temporal es: <strong>{System.Net.WebUtility.HtmlEncode(temporaryPassword)}</strong></p>
                <p>Ingresa al sistema y cambia tu clave en la pantalla de actualización.</p>
                """
        });
    }
}

public static class IdentitySeed
{
    public static async Task RunAsync(IdentityDbContext db)
    {
        if (await db.Users.AnyAsync()) return;

        var (hash, salt) = PasswordHasher.Hash("Admin123!");
        db.Users.Add(new AppUser
        {
            Name = "Administrador",
            Email = "admin@local.test",
            PasswordHash = hash,
            PasswordSalt = salt,
            AuthProvider = "Local",
            Roles = "Administrador,Aprobador,Tecnico,Solicitante",
            ScreenPermissions = string.Join(",", ScreenAccess.All),
            MenuMode = "horizontal",
            MenuCollapsed = false,
            IsActive = true
        });

        db.BrandSettings.Add(BrandSettings.Default());

        await db.SaveChangesAsync();
    }
}

public static class IdentitySchema
{
    public static Task EnsureAsync(IdentityDbContext db) =>
        db.Database.ExecuteSqlRawAsync("""
            IF COL_LENGTH('Users', 'ScreenPermissions') IS NULL
            BEGIN
                ALTER TABLE [Users] ADD [ScreenPermissions] nvarchar(500) NOT NULL DEFAULT('dashboard')
            END
            IF COL_LENGTH('Users', 'MustChangePassword') IS NULL
            BEGIN
                ALTER TABLE [Users] ADD [MustChangePassword] bit NOT NULL DEFAULT(0)
            END
            IF COL_LENGTH('Users', 'PasswordResetAt') IS NULL
            BEGIN
                ALTER TABLE [Users] ADD [PasswordResetAt] datetimeoffset NULL
            END
            IF COL_LENGTH('Users', 'AllowMicrosoftLogin') IS NULL
            BEGIN
                ALTER TABLE [Users] ADD [AllowMicrosoftLogin] bit NOT NULL DEFAULT(0)
            END
            IF COL_LENGTH('Users', 'MenuMode') IS NULL
            BEGIN
                ALTER TABLE [Users] ADD [MenuMode] nvarchar(20) NOT NULL DEFAULT('horizontal')
            END
            IF COL_LENGTH('Users', 'MenuCollapsed') IS NULL
            BEGIN
                ALTER TABLE [Users] ADD [MenuCollapsed] bit NOT NULL DEFAULT(0)
            END
            EXEC('UPDATE [Users] SET [AllowMicrosoftLogin] = 1 WHERE [AuthProvider] = ''Microsoft''')
            IF OBJECT_ID('BrandSettings', 'U') IS NULL
            BEGIN
                CREATE TABLE [BrandSettings] (
                    [Id] uniqueidentifier NOT NULL,
                    [Primary] nvarchar(20) NOT NULL,
                    [PrimaryDark] nvarchar(20) NOT NULL,
                    [Accent] nvarchar(20) NOT NULL,
                    [Background] nvarchar(20) NOT NULL,
                    [Surface] nvarchar(20) NOT NULL,
                    [Foreground] nvarchar(20) NOT NULL,
                    [Muted] nvarchar(20) NOT NULL,
                    [Line] nvarchar(20) NOT NULL,
                    [ButtonText] nvarchar(20) NOT NULL,
                    [Secondary] nvarchar(20) NOT NULL,
                    [SecondaryText] nvarchar(20) NOT NULL,
                    [Success] nvarchar(20) NOT NULL,
                    [Warning] nvarchar(20) NOT NULL,
                    [Danger] nvarchar(20) NOT NULL,
                    [TopbarText] nvarchar(20) NOT NULL,
                    [FontFamily] nvarchar(180) NOT NULL,
                    [MenuMode] nvarchar(20) NOT NULL,
                    [MenuCollapsed] bit NOT NULL,
                    [MobileMenuCollapsed] bit NOT NULL DEFAULT(1),
                    [HeaderTextAlign] nvarchar(20) NOT NULL DEFAULT('center'),
                    [HeaderTextPosition] nvarchar(20) NOT NULL DEFAULT('middle'),
                    [BrandVersion] int NOT NULL,
                    [Logo] nvarchar(1200) NOT NULL,
                    [ChatbotIcon] nvarchar(1200) NOT NULL DEFAULT('https://www.indoamerica.edu.ec/wp-content/uploads/2026/03/logo-gen-cuad.jpg'),
                    [ShowPublicRequirementForm] bit NOT NULL DEFAULT(1),
                    [ShowPublicRequirementFullPage] bit NOT NULL DEFAULT(1),
                    [ShowLoginChatbot] bit NOT NULL DEFAULT(1),
                    [ShowDemoCredentials] bit NOT NULL DEFAULT(1),
                    [ShowOffice365Login] bit NOT NULL DEFAULT(1),
                    [Title] nvarchar(180) NOT NULL,
                    [Subtitle] nvarchar(240) NOT NULL,
                    [CreatedAt] datetimeoffset NOT NULL,
                    [UpdatedAt] datetimeoffset NULL,
                    CONSTRAINT [PK_BrandSettings] PRIMARY KEY ([Id])
                )
            END
            IF COL_LENGTH('BrandSettings', 'HeaderTextAlign') IS NULL
            BEGIN
                ALTER TABLE [BrandSettings] ADD [HeaderTextAlign] nvarchar(20) NOT NULL DEFAULT('center')
            END
            IF COL_LENGTH('BrandSettings', 'HeaderTextPosition') IS NULL
            BEGIN
                ALTER TABLE [BrandSettings] ADD [HeaderTextPosition] nvarchar(20) NOT NULL DEFAULT('middle')
            END
            IF COL_LENGTH('BrandSettings', 'ChatbotIcon') IS NULL
            BEGIN
                ALTER TABLE [BrandSettings] ADD [ChatbotIcon] nvarchar(1200) NOT NULL DEFAULT('https://www.indoamerica.edu.ec/wp-content/uploads/2026/03/logo-gen-cuad.jpg')
            END
            IF COL_LENGTH('BrandSettings', 'ShowPublicRequirementForm') IS NULL
            BEGIN
                ALTER TABLE [BrandSettings] ADD [ShowPublicRequirementForm] bit NOT NULL DEFAULT(1)
            END
            IF COL_LENGTH('BrandSettings', 'ShowPublicRequirementFullPage') IS NULL
            BEGIN
                ALTER TABLE [BrandSettings] ADD [ShowPublicRequirementFullPage] bit NOT NULL DEFAULT(1)
            END
            IF COL_LENGTH('BrandSettings', 'ShowLoginChatbot') IS NULL
            BEGIN
                ALTER TABLE [BrandSettings] ADD [ShowLoginChatbot] bit NOT NULL DEFAULT(1)
            END
            IF COL_LENGTH('BrandSettings', 'ShowDemoCredentials') IS NULL
            BEGIN
                ALTER TABLE [BrandSettings] ADD [ShowDemoCredentials] bit NOT NULL DEFAULT(1)
            END
            IF COL_LENGTH('BrandSettings', 'ShowOffice365Login') IS NULL
            BEGIN
                ALTER TABLE [BrandSettings] ADD [ShowOffice365Login] bit NOT NULL DEFAULT(1)
            END
            IF COL_LENGTH('BrandSettings', 'MobileMenuCollapsed') IS NULL
            BEGIN
                ALTER TABLE [BrandSettings] ADD [MobileMenuCollapsed] bit NOT NULL DEFAULT(1)
            END
            IF NOT EXISTS (SELECT 1 FROM [BrandSettings])
            BEGIN
                EXEC('INSERT INTO [BrandSettings] (
                    [Id], [Primary], [PrimaryDark], [Accent], [Background], [Surface], [Foreground], [Muted], [Line],
                    [ButtonText], [Secondary], [SecondaryText], [Success], [Warning], [Danger], [TopbarText],
                    [FontFamily], [MenuMode], [MenuCollapsed], [MobileMenuCollapsed], [BrandVersion], [Logo], [ChatbotIcon], [ShowPublicRequirementForm], [ShowPublicRequirementFullPage], [ShowLoginChatbot], [ShowDemoCredentials], [ShowOffice365Login], [Title], [Subtitle],
                    [CreatedAt], [UpdatedAt])
                VALUES (
                    NEWID(), ''#3c235f'', ''#2a1844'', ''#f6b700'', ''#f5f7fb'', ''#ffffff'', ''#101b2d'', ''#697386'', ''#d9deea'',
                    ''#ffffff'', ''#eef4f7'', ''#001f49'', ''#207044'', ''#f6b700'', ''#b42318'', ''#ffffff'',
                    ''Segoe UI, Arial, Helvetica, sans-serif'', ''horizontal'', 0, 1, 3,
                    ''https://www.indoamerica.edu.ec/wp-content/uploads/2026/03/logo-gen-cuad.jpg'',
                    ''https://www.indoamerica.edu.ec/wp-content/uploads/2026/03/logo-gen-cuad.jpg'',
                    1, 1, 1, 1, 1, ''Creamos conexiones que dejan huella'', ''Universidad Indoamérica'',
                    SYSDATETIMEOFFSET(), NULL)')
            END
            """);
}

public static class MicrosoftTokenValidator
{
    public static async Task<ClaimsPrincipal> ValidateAsync(string idToken, string tenantId, string clientId, HttpClient client)
    {
        var config = await client.GetFromJsonAsync<JsonElement>($"https://login.microsoftonline.com/{tenantId}/v2.0/.well-known/openid-configuration");
        var issuer = config.GetProperty("issuer").GetString();
        var jwksUri = config.GetProperty("jwks_uri").GetString();
        if (string.IsNullOrWhiteSpace(issuer) || string.IsNullOrWhiteSpace(jwksUri)) throw new SecurityTokenException("Configuración OpenID incompleta.");

        var jwks = await client.GetStringAsync(jwksUri);
        var keys = new JsonWebKeySet(jwks).Keys;
        var parameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = issuer,
            ValidateAudience = true,
            ValidAudience = clientId,
            ValidateIssuerSigningKey = true,
            IssuerSigningKeys = keys,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(3),
            NameClaimType = "name"
        };

        return new JwtSecurityTokenHandler().ValidateToken(idToken, parameters, out _);
    }

    public static string GetEmail(ClaimsPrincipal principal) =>
        principal.FindFirstValue("preferred_username")
        ?? principal.FindFirstValue(ClaimTypes.Email)
        ?? principal.FindFirstValue("email")
        ?? string.Empty;
}
