using BuildingBlocks;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http.Features;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.Configure<FormOptions>(options => options.MultipartBodyLengthLimit = 50 * 1024 * 1024);
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddDbContext<EvidenceDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("EvidenceDb")));
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<EvidenceDbContext>();
    await db.Database.EnsureCreatedAsync();
    await EvidenceSchema.EnsureAsync(db);
    await EvidenceSeed.RunAsync(db);
}

app.MapGet("/health", () => Results.Ok(new { service = "evidence", status = "healthy" }));

app.MapGet("/evidence", async (Guid? activityId, EvidenceDbContext db) =>
{
    var query = db.EvidenceItems.Where(x => !x.IsDeleted).AsQueryable();
    if (activityId.HasValue) query = query.Where(x => x.ActivityId == activityId.Value);
    return await query.OrderByDescending(x => x.CreatedAt).ToListAsync();
});

app.MapPost("/evidence", async (CreateEvidenceRequest request, EvidenceDbContext db) =>
{
    var evidence = new EvidenceItem(request.ActivityId, request.FileName, request.ContentType, request.StorageUrl, request.UploadedBy);
    db.EvidenceItems.Add(evidence);
    await db.SaveChangesAsync();
    return Results.Created($"/evidence/{evidence.Id}", evidence);
});

app.MapPost("/evidence/upload", async (HttpRequest request, EvidenceDbContext db, IWebHostEnvironment env) =>
{
    if (!request.HasFormContentType) return Results.BadRequest("La solicitud debe ser multipart/form-data.");

    var form = await request.ReadFormAsync();
    var file = form.Files.GetFile("file");
    if (file is null || file.Length == 0) return Results.BadRequest("Archivo requerido.");
    if (file.Length > 50 * 1024 * 1024) return Results.BadRequest("El archivo no puede superar 50 MB.");
    var activityValue = form["activityId"].FirstOrDefault() ?? form["ActivityId"].FirstOrDefault();
    if (!Guid.TryParse(activityValue, out var activityId)) return Results.BadRequest("Actividad requerida.");

    var settings = await db.StorageSettings.Where(x => x.IsActive).OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt).FirstOrDefaultAsync()
        ?? await db.StorageSettings.OrderByDescending(x => x.CreatedAt).FirstAsync();
    var uploadedBy = form["uploadedBy"].ToString();
    var storageUrl = settings.Provider.Equals("Local", StringComparison.OrdinalIgnoreCase)
        ? await LocalStorage.SaveAsync(file, settings.LocalPath, env.ContentRootPath)
        : CloudStorage.BuildPendingUrl(file.FileName, settings);

    var evidence = new EvidenceItem(activityId, file.FileName, file.ContentType, storageUrl, uploadedBy);
    db.EvidenceItems.Add(evidence);
    await db.SaveChangesAsync();
    return Results.Created($"/evidence/{evidence.Id}", evidence);
}).DisableAntiforgery();

app.MapDelete("/evidence/{id:guid}", async (Guid id, EvidenceDbContext db) =>
{
    var evidence = await db.EvidenceItems.FindAsync(id);
    if (evidence is null || evidence.IsDeleted) return Results.NotFound();

    evidence.Delete("Sistema");
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.MapGet("/files/{fileName}", (string fileName, IWebHostEnvironment env) =>
{
    var safeName = Path.GetFileName(fileName);
    var path = Path.Combine(env.ContentRootPath, "uploads", safeName);
    return File.Exists(path) ? Results.File(path, "application/octet-stream", safeName) : Results.NotFound();
});

app.MapGet("/approvals", async (Guid? activityId, EvidenceDbContext db) =>
{
    var query = db.Approvals.AsQueryable();
    if (activityId.HasValue) query = query.Where(x => x.ActivityId == activityId.Value);
    return await query.OrderByDescending(x => x.CreatedAt).ToListAsync();
});

app.MapGet("/approvals/audit", async (EvidenceDbContext db) =>
    await db.ApprovalAuditEvents.OrderByDescending(x => x.OccurredAt).ToListAsync());

app.MapGet("/approvals/metrics", async (EvidenceDbContext db) =>
{
    var approvals = await db.Approvals.ToListAsync();
    var audits = await db.ApprovalAuditEvents.ToListAsync();
    var lastAudit = audits.OrderByDescending(x => x.OccurredAt).FirstOrDefault();

    return new ApprovalMetrics(
        approvals.Count,
        approvals.Count(x => x.Decision == ApprovalDecision.Approved),
        approvals.Count(x => x.Decision == ApprovalDecision.Rejected),
        audits.Count,
        EvidenceMetricsMath.Slices(approvals, x => x.Decision.ToString()),
        lastAudit?.OccurredAt);
});

app.MapGet("/approvals/pending", async (EvidenceDbContext db) =>
    await db.Approvals.Where(x => x.Decision == ApprovalDecision.Rejected).OrderByDescending(x => x.CreatedAt).ToListAsync());

app.MapPost("/approvals", async (CreateApprovalRequest request, EvidenceDbContext db) =>
{
    var approval = new ActivityApproval(request.ActivityId, request.Decision, request.ApprovedBy, request.Comments);
    db.Approvals.Add(approval);
    db.ApprovalAuditEvents.Add(ApprovalAuditEvent.Created(
        request.ActivityId,
        request.Decision.ToString(),
        "Registro de aprobación",
        request.ApprovedBy,
        AuditJson.Build("Aprobaciones", $"Decisión {request.Decision}", request.ApprovedBy, request)));
    await db.SaveChangesAsync();
    return Results.Created($"/approvals/{approval.Id}", approval);
});

app.MapGet("/storage-settings", async (EvidenceDbContext db) =>
    await db.StorageSettings.Where(x => x.IsActive).OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt).FirstOrDefaultAsync()
        ?? await db.StorageSettings.OrderByDescending(x => x.CreatedAt).FirstAsync());

app.MapGet("/storage-settings/all", async (EvidenceDbContext db) =>
    await db.StorageSettings.OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt).ToListAsync());

app.MapPost("/storage-settings", async (UpdateStorageSettingsRequest request, EvidenceDbContext db) =>
{
    var settings = new StorageSettings();
    settings.Apply(request);
    db.StorageSettings.Add(settings);
    await db.SaveChangesAsync();
    return Results.Created($"/storage-settings/{settings.Id}", settings);
});

app.MapPut("/storage-settings", async (UpdateStorageSettingsRequest request, EvidenceDbContext db) =>
{
    var settings = await db.StorageSettings.OrderByDescending(x => x.CreatedAt).FirstAsync();
    settings.Apply(request);
    await db.SaveChangesAsync();
    return Results.Ok(settings);
});

app.MapPut("/storage-settings/{id:guid}", async (Guid id, UpdateStorageSettingsRequest request, EvidenceDbContext db) =>
{
    var settings = await db.StorageSettings.FindAsync(id);
    if (settings is null) return Results.NotFound();

    settings.Apply(request);
    await db.SaveChangesAsync();
    return Results.Ok(settings);
});

app.MapDelete("/storage-settings/{id:guid}", async (Guid id, EvidenceDbContext db) =>
{
    var settings = await db.StorageSettings.FindAsync(id);
    if (settings is null) return Results.NotFound();

    settings.IsActive = false;
    settings.UpdatedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.Run();

public sealed record CreateEvidenceRequest(Guid ActivityId, string FileName, string ContentType, string StorageUrl, string UploadedBy);
public sealed record CreateApprovalRequest(Guid ActivityId, ApprovalDecision Decision, string ApprovedBy, string Comments);
public sealed record MetricSlice(string Name, int Count, decimal Percentage);
public sealed record ApprovalMetrics(int TotalApprovals, int ApprovedApprovals, int RejectedApprovals, int AuditEvents, IReadOnlyList<MetricSlice> ByDecision, DateTimeOffset? LastAuditAt);
public sealed record UpdateStorageSettingsRequest(
    string Name,
    string Provider,
    string LocalPath,
    string BlobConnectionString,
    string BlobContainer,
    string FtpHost,
    string FtpUser,
    string FtpPassword,
    bool IsProductionCloudEnabled,
    bool IsActive);

public sealed class ApprovalAuditEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ActivityId { get; set; }
    public string Decision { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string PerformedBy { get; set; } = "Sistema";
    public string PayloadJson { get; set; } = string.Empty;
    public DateTimeOffset OccurredAt { get; set; } = DateTimeOffset.UtcNow;

    public static ApprovalAuditEvent Created(Guid activityId, string decision, string action, string performedBy, string payloadJson) =>
        new() { ActivityId = activityId, Decision = decision, Action = action, PerformedBy = performedBy, PayloadJson = payloadJson };
}

public static class AuditJson
{
    public static string Build(string process, string action, string performedBy, object data) =>
        JsonSerializer.Serialize(new
        {
            fecha = DateTimeOffset.UtcNow,
            quien = performedBy,
            proceso = process,
            accion = action,
            descripcion = $"{action} en {process}",
            datos = data
        });
}

public static class EvidenceMetricsMath
{
    public static IReadOnlyList<MetricSlice> Slices<T>(IReadOnlyList<T> items, Func<T, string> selector)
    {
        if (items.Count == 0) return [];

        return items
            .GroupBy(selector)
            .Where(group => !string.IsNullOrWhiteSpace(group.Key))
            .Select(group => new MetricSlice(group.Key, group.Count(), Math.Round(group.Count() * 100m / items.Count, 2)))
            .OrderByDescending(x => x.Count)
            .ToList();
    }
}

public sealed class StorageSettings
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "Configuración local";
    public string Provider { get; set; } = "Local";
    public string LocalPath { get; set; } = "uploads";
    public string BlobConnectionString { get; set; } = string.Empty;
    public string BlobContainer { get; set; } = "evidencias";
    public string FtpHost { get; set; } = string.Empty;
    public string FtpUser { get; set; } = string.Empty;
    public string FtpPassword { get; set; } = string.Empty;
    public bool IsProductionCloudEnabled { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }

    public void Apply(UpdateStorageSettingsRequest request)
    {
        Name = request.Name.Trim();
        Provider = request.Provider.Trim();
        LocalPath = request.LocalPath.Trim();
        BlobConnectionString = request.BlobConnectionString.Trim();
        BlobContainer = request.BlobContainer.Trim();
        FtpHost = request.FtpHost.Trim();
        FtpUser = request.FtpUser.Trim();
        FtpPassword = request.FtpPassword.Trim();
        IsProductionCloudEnabled = request.IsProductionCloudEnabled;
        IsActive = request.IsActive;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}

public sealed class EvidenceDbContext(DbContextOptions<EvidenceDbContext> options) : DbContext(options)
{
    public DbSet<EvidenceItem> EvidenceItems => Set<EvidenceItem>();
    public DbSet<ActivityApproval> Approvals => Set<ActivityApproval>();
    public DbSet<ApprovalAuditEvent> ApprovalAuditEvents => Set<ApprovalAuditEvent>();
    public DbSet<StorageSettings> StorageSettings => Set<StorageSettings>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<EvidenceItem>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.FileName).HasMaxLength(240).IsRequired();
            entity.Property(x => x.ContentType).HasMaxLength(120).IsRequired();
            entity.Property(x => x.StorageUrl).HasMaxLength(800).IsRequired();
            entity.Property(x => x.UploadedBy).HasMaxLength(120).IsRequired();
            entity.Property(x => x.DeletedBy).HasMaxLength(160);
            entity.HasIndex(x => x.ActivityId);
        });

        modelBuilder.Entity<ActivityApproval>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Decision).HasConversion<string>().HasMaxLength(32);
            entity.Property(x => x.ApprovedBy).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Comments).HasMaxLength(1000);
            entity.HasIndex(x => x.ActivityId);
        });

        modelBuilder.Entity<ApprovalAuditEvent>(entity =>
        {
            entity.ToTable("ApprovalAuditEvents");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Decision).HasMaxLength(32);
            entity.Property(x => x.Action).HasMaxLength(180).IsRequired();
            entity.Property(x => x.PerformedBy).HasMaxLength(160).IsRequired();
            entity.Property(x => x.PayloadJson).HasColumnType("nvarchar(max)");
            entity.HasIndex(x => x.ActivityId);
            entity.HasIndex(x => x.OccurredAt);
        });

        modelBuilder.Entity<StorageSettings>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Provider).HasMaxLength(32).IsRequired();
            entity.Property(x => x.LocalPath).HasMaxLength(300).IsRequired();
            entity.Property(x => x.BlobConnectionString).HasMaxLength(1000);
            entity.Property(x => x.BlobContainer).HasMaxLength(160);
            entity.Property(x => x.FtpHost).HasMaxLength(300);
            entity.Property(x => x.FtpUser).HasMaxLength(160);
            entity.Property(x => x.FtpPassword).HasMaxLength(300);
        });
    }
}

public static class LocalStorage
{
    public static async Task<string> SaveAsync(IFormFile file, string configuredPath, string contentRootPath)
    {
        var root = Path.IsPathRooted(configuredPath) ? configuredPath : Path.Combine(contentRootPath, configuredPath);
        Directory.CreateDirectory(root);
        var safeName = $"{Guid.NewGuid():N}-{Path.GetFileName(file.FileName)}";
        var fullPath = Path.Combine(root, safeName);
        await using var stream = File.Create(fullPath);
        await file.CopyToAsync(stream);
        return $"/api/files/{safeName}";
    }
}

public static class CloudStorage
{
    public static string BuildPendingUrl(string fileName, StorageSettings settings) =>
        settings.Provider.Equals("Blob", StringComparison.OrdinalIgnoreCase)
            ? $"blob://{settings.BlobContainer}/{Path.GetFileName(fileName)}"
            : $"ftp://{settings.FtpHost}/{Path.GetFileName(fileName)}";
}

public static class EvidenceSeed
{
    public static async Task RunAsync(EvidenceDbContext db)
    {
        if (!await db.StorageSettings.AnyAsync())
        {
            db.StorageSettings.Add(new StorageSettings());
            await db.SaveChangesAsync();
        }
    }
}

public static class EvidenceSchema
{
    public static async Task EnsureAsync(EvidenceDbContext db)
    {
        const string sql = """
            IF OBJECT_ID('StorageSettings', 'U') IS NULL
            BEGIN
                CREATE TABLE [StorageSettings] (
                    [Id] uniqueidentifier NOT NULL,
                    [Provider] nvarchar(32) NOT NULL,
                    [LocalPath] nvarchar(300) NOT NULL,
                    [BlobConnectionString] nvarchar(1000) NOT NULL,
                    [BlobContainer] nvarchar(160) NOT NULL,
                    [FtpHost] nvarchar(300) NOT NULL,
                    [FtpUser] nvarchar(160) NOT NULL,
                    [FtpPassword] nvarchar(300) NOT NULL,
                    [IsProductionCloudEnabled] bit NOT NULL,
                    [CreatedAt] datetimeoffset NOT NULL,
                    CONSTRAINT [PK_StorageSettings] PRIMARY KEY ([Id])
                )
            END
            IF COL_LENGTH('StorageSettings', 'Name') IS NULL
            BEGIN
                ALTER TABLE [StorageSettings] ADD [Name] nvarchar(120) NOT NULL DEFAULT('Configuración local')
            END
            IF COL_LENGTH('StorageSettings', 'IsActive') IS NULL
            BEGIN
                ALTER TABLE [StorageSettings] ADD [IsActive] bit NOT NULL DEFAULT(1)
            END
            IF COL_LENGTH('StorageSettings', 'UpdatedAt') IS NULL
            BEGIN
                ALTER TABLE [StorageSettings] ADD [UpdatedAt] datetimeoffset NULL
            END
            IF COL_LENGTH('EvidenceItems', 'IsDeleted') IS NULL
            BEGIN
                ALTER TABLE [EvidenceItems] ADD [IsDeleted] bit NOT NULL DEFAULT(0)
            END
            IF COL_LENGTH('EvidenceItems', 'DeletedAt') IS NULL
            BEGIN
                ALTER TABLE [EvidenceItems] ADD [DeletedAt] datetimeoffset NULL
            END
            IF COL_LENGTH('EvidenceItems', 'DeletedBy') IS NULL
            BEGIN
                ALTER TABLE [EvidenceItems] ADD [DeletedBy] nvarchar(160) NOT NULL DEFAULT('')
            END
            IF OBJECT_ID('Approvals', 'U') IS NOT NULL AND COL_LENGTH('Approvals', 'IsDeleted') IS NULL
            BEGIN
                ALTER TABLE [Approvals] ADD [IsDeleted] bit NOT NULL DEFAULT(0)
            END
            IF OBJECT_ID('Approvals', 'U') IS NOT NULL AND COL_LENGTH('Approvals', 'DeletedAt') IS NULL
            BEGIN
                ALTER TABLE [Approvals] ADD [DeletedAt] datetimeoffset NULL
            END
            IF OBJECT_ID('Approvals', 'U') IS NOT NULL AND COL_LENGTH('Approvals', 'DeletedBy') IS NULL
            BEGIN
                ALTER TABLE [Approvals] ADD [DeletedBy] nvarchar(160) NOT NULL DEFAULT('')
            END
            IF OBJECT_ID('Approvals', 'U') IS NOT NULL AND COL_LENGTH('Approvals', 'UpdatedAt') IS NULL
            BEGIN
                ALTER TABLE [Approvals] ADD [UpdatedAt] datetimeoffset NULL
            END
            IF OBJECT_ID('ApprovalAuditEvents', 'U') IS NULL
            BEGIN
                CREATE TABLE [ApprovalAuditEvents] (
                    [Id] uniqueidentifier NOT NULL,
                    [ActivityId] uniqueidentifier NOT NULL,
                    [Decision] nvarchar(32) NOT NULL,
                    [Action] nvarchar(180) NOT NULL,
                    [PerformedBy] nvarchar(160) NOT NULL,
                    [PayloadJson] nvarchar(max) NOT NULL,
                    [OccurredAt] datetimeoffset NOT NULL,
                    CONSTRAINT [PK_ApprovalAuditEvents] PRIMARY KEY ([Id])
                )
                CREATE INDEX [IX_ApprovalAuditEvents_ActivityId] ON [ApprovalAuditEvents] ([ActivityId])
                CREATE INDEX [IX_ApprovalAuditEvents_OccurredAt] ON [ApprovalAuditEvents] ([OccurredAt])
            END
            """;
        await db.Database.ExecuteSqlRawAsync(sql);
    }
}
