using BuildingBlocks;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddHttpClient("activities", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["Services:Activities"] ?? "http://activities-api:8080");
});
builder.Services.AddHttpClient("notifications", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["Services:Activities"] ?? "http://activities-api:8080");
});
builder.Services.AddDbContext<RequirementsDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("RequirementsDb")));

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
    var db = scope.ServiceProvider.GetRequiredService<RequirementsDbContext>();
    await db.Database.EnsureCreatedAsync();
    await RequirementsSchema.EnsureAsync(db);
}

app.MapGet("/health", () => Results.Ok(new { service = "requirements", status = "healthy" }));

app.MapGet("/requirements", async (RequirementsDbContext db, IHttpClientFactory httpClientFactory) =>
{
    await RequirementWorkflowReconciliation.CompleteReadyAsync(db, httpClientFactory);
    return await db.Requirements.Where(x => !x.IsDeleted).OrderByDescending(x => x.CreatedAt).ToListAsync();
});

app.MapGet("/requirements/assignments/by-user", async (string email, string? name, RequirementsDbContext db) =>
{
    var keys = AssignmentKeys.From(email, name);
    var total = await db.Requirements
        .Where(x => !x.IsDeleted && x.Status != RequirementStatus.Completed)
        .CountAsync(x => keys.Contains(x.RequestedBy.ToLower()));
    return Results.Ok(new AssignmentCountResponse(total));
});

app.MapGet("/requirements/metrics", async (RequirementsDbContext db) =>
{
    var requirements = await db.Requirements.Where(x => !x.IsDeleted).ToListAsync();
    var audits = await db.AuditEvents.ToListAsync();
    var now = DateTimeOffset.UtcNow;
    var completed = requirements.Where(x => x.Status == RequirementStatus.Completed).ToList();

    return Results.Ok(new RequirementMetricsResponse(
        requirements.Count,
        completed.Count,
        requirements.Count(x => x.Status != RequirementStatus.Completed),
        RequirementMetricsMath.AverageDays(requirements.Select(x => ((x.UpdatedAt ?? now) - x.CreatedAt).TotalDays)),
        RequirementMetricsMath.Slice(requirements.GroupBy(x => x.Status.ToString()), requirements.Count),
        RequirementMetricsMath.Slice(requirements.GroupBy(x => x.Faculty), requirements.Count),
        RequirementMetricsMath.Slice(requirements.GroupBy(x => x.Campus), requirements.Count),
        RequirementMetricsMath.Slice(requirements.GroupBy(x => x.EventFormat), requirements.Count),
        RequirementMetricsMath.StageTimes(audits)));
});

app.MapGet("/requirements/audit", async (RequirementsDbContext db) =>
    await db.AuditEvents.OrderByDescending(x => x.OccurredAt).ToListAsync());

app.MapGet("/requirements/{id:guid}/audit", async (Guid id, RequirementsDbContext db) =>
    await db.AuditEvents.Where(x => x.RequirementId == id).OrderBy(x => x.OccurredAt).ToListAsync());

app.MapGet("/requirements/{id:guid}", async (Guid id, RequirementsDbContext db) =>
    await db.Requirements.FindAsync(id) is { IsDeleted: false } requirement ? Results.Ok(requirement) : Results.NotFound());

app.MapPost("/requirements", async (CreateRequirementRequest request, RequirementsDbContext db, IHttpClientFactory httpClientFactory) =>
{
    CatalogReferenceWriter.UpsertReferences(db, request);
    var requirement = new Requirement(
        request.ActivityOrEvent,
        request.RequestedBy,
        request.FacultyId,
        request.Faculty,
        request.Career,
        request.CampusId,
        request.Campus,
        request.Place,
        request.StartDate,
        request.EndDate,
        request.EventObjective,
        request.EventFormatId,
        request.EventFormat,
        request.RequestDate);
    requirement.SetStatusReference(request.StatusId ?? WorkflowCatalogIds.ForRequirement(requirement.Status));
    db.Requirements.Add(requirement);
    db.AuditEvents.Add(RequirementAuditEvent.Created(requirement.Id, null, requirement.Status.ToString(), "Creación del requerimiento", request.RequestedBy, AuditJson.Build("Requerimientos", "Crear", request.RequestedBy, request)));
    await db.SaveChangesAsync();
    await RequirementNotifications.NotifyAsync(httpClientFactory, new SystemNotificationRequest(
        "RequirementCreated",
        "Requerimiento creado",
        $"Se creó el requerimiento {requirement.Code}: {requirement.ActivityOrEvent}",
        requirement.RequestedBy,
        "Sistema",
        requirement.Id,
        null,
        AuditJson.Build("Notificaciones", "Requerimiento creado", request.RequestedBy, requirement)));
    return Results.Created($"/requirements/{requirement.Id}", requirement);
});

app.MapPut("/requirements/{id:guid}", async (Guid id, CreateRequirementRequest request, RequirementsDbContext db) =>
{
    var requirement = await db.Requirements.FindAsync(id);
    if (requirement is null || requirement.IsDeleted) return Results.NotFound();

    CatalogReferenceWriter.UpsertReferences(db, request);
    var previousStatus = requirement.Status.ToString();
    requirement.Update(
        request.ActivityOrEvent,
        request.RequestedBy,
        request.FacultyId,
        request.Faculty,
        request.Career,
        request.CampusId,
        request.Campus,
        request.Place,
        request.StartDate,
        request.EndDate,
        request.EventObjective,
        request.EventFormatId,
        request.EventFormat,
        request.RequestDate);
    requirement.SetStatusReference(request.StatusId ?? WorkflowCatalogIds.ForRequirement(requirement.Status));
    db.AuditEvents.Add(RequirementAuditEvent.Changed(requirement.Id, previousStatus, requirement.Status.ToString(), "Actualización de datos del requerimiento", request.RequestedBy, AuditJson.Build("Requerimientos", "Editar", request.RequestedBy, request)));
    await db.SaveChangesAsync();
    return Results.Ok(requirement);
});

app.MapDelete("/requirements/{id:guid}", async (Guid id, RequirementsDbContext db, IHttpClientFactory httpClientFactory) =>
{
    var requirement = await db.Requirements.FindAsync(id);
    if (requirement is null || requirement.IsDeleted) return Results.NotFound();
    if (requirement.Status == RequirementStatus.Completed)
        return Results.Conflict(new { message = "No se puede eliminar un requerimiento completado." });

    var previousStatus = requirement.Status.ToString();
    requirement.Reject();
    CatalogReferenceWriter.UpsertStatusReference(db, requirement.Status);
    db.AuditEvents.Add(RequirementAuditEvent.Changed(id, previousStatus, requirement.Status.ToString(), "Requerimiento finalizado rechazado", "Sistema", AuditJson.Build("Requerimientos", "Finalizar rechazado", "Sistema", new { id })));
    await db.SaveChangesAsync();
    return Results.Ok(requirement);
});

app.MapPatch("/requirements/{id:guid}/analysis", async (Guid id, RequirementsDbContext db) =>
{
    var requirement = await db.Requirements.FindAsync(id);
    if (requirement is null || requirement.IsDeleted) return Results.NotFound();

    var previousStatus = requirement.Status.ToString();
    requirement.StartAnalysis();
    CatalogReferenceWriter.UpsertStatusReference(db, requirement.Status);
    db.AuditEvents.Add(RequirementAuditEvent.Changed(id, previousStatus, requirement.Status.ToString(), "Inicio de análisis", "Sistema", AuditJson.Build("Requerimientos", "Inicio de análisis", "Sistema", new { id })));
    await db.SaveChangesAsync();
    return Results.Ok(requirement);
});

app.MapPatch("/requirements/{id:guid}/execution", async (Guid id, RequirementsDbContext db, IHttpClientFactory httpClientFactory) =>
{
    var requirement = await db.Requirements.FindAsync(id);
    if (requirement is null || requirement.IsDeleted) return Results.NotFound();

    var previousStatus = requirement.Status.ToString();
    requirement.StartExecution();
    CatalogReferenceWriter.UpsertStatusReference(db, requirement.Status);
    db.AuditEvents.Add(RequirementAuditEvent.Changed(id, previousStatus, requirement.Status.ToString(), "Inicio de ejecución", "Sistema", AuditJson.Build("Requerimientos", "Inicio de ejecución", "Sistema", new { id })));
    await db.SaveChangesAsync();
    await RequirementNotifications.NotifyAsync(httpClientFactory, new SystemNotificationRequest(
        "RequirementExecution",
        "Requerimiento en ejecución",
        $"El requerimiento {requirement.Code}: {requirement.ActivityOrEvent} pasó a ejecución.",
        requirement.RequestedBy,
        "Sistema",
        requirement.Id,
        null,
        AuditJson.Build("Notificaciones", "Requerimiento en ejecución", "Sistema", requirement)));
    return Results.Ok(requirement);
});

app.MapPatch("/requirements/{id:guid}/complete", async (Guid id, RequirementsDbContext db, IHttpClientFactory httpClientFactory) =>
{
    var requirement = await db.Requirements.FindAsync(id);
    if (requirement is null || requirement.IsDeleted) return Results.NotFound();

    var client = httpClientFactory.CreateClient("activities");
    var summary = await client.GetFromJsonAsync<ActivitySummary>($"/activities/summary/{id}");
    if (summary is null) return Results.Problem("Activities service did not return a summary.");

    var previousStatus = requirement.Status.ToString();
    requirement.Complete(summary.Total, summary.Approved);
    CatalogReferenceWriter.UpsertStatusReference(db, requirement.Status);
    db.AuditEvents.Add(RequirementAuditEvent.Changed(id, previousStatus, requirement.Status.ToString(), $"Requerimiento completado con {summary.Approved}/{summary.Total} productos aprobados", "Sistema", AuditJson.Build("Requerimientos", "Completar", "Sistema", new { id, summary.Total, summary.Approved })));
    await db.SaveChangesAsync();
    return Results.Ok(requirement);
});

app.Run();

public sealed record CreateRequirementRequest(
    string ActivityOrEvent,
    string RequestedBy,
    Guid FacultyId,
    string Faculty,
    string Career,
    Guid CampusId,
    string Campus,
    string Place,
    DateOnly StartDate,
    DateOnly EndDate,
    string EventObjective,
    Guid EventFormatId,
    string EventFormat,
    DateOnly RequestDate,
    Guid? StatusId = null);
public sealed record ActivitySummary(int Total, int Approved, int Pending);
public sealed record AssignmentCountResponse(int Count);
public sealed record SystemNotificationRequest(string EventType, string Title, string Message, string RecipientEmail, string CreatedBy, Guid? RequirementId, Guid? ActivityId, string PayloadJson);
public sealed record MetricSlice(string Name, int Count, decimal Percentage);
public sealed record StageMetric(string Stage, decimal AverageHours, int Events);
public sealed record RequirementMetricsResponse(
    int TotalRequirements,
    int CompletedRequirements,
    int ActiveRequirements,
    decimal AverageCycleDays,
    IReadOnlyList<MetricSlice> ByStatus,
    IReadOnlyList<MetricSlice> ByFaculty,
    IReadOnlyList<MetricSlice> ByCampus,
    IReadOnlyList<MetricSlice> ByFormat,
    IReadOnlyList<StageMetric> AverageHoursByStage);

public sealed class RequirementsDbContext(DbContextOptions<RequirementsDbContext> options) : DbContext(options)
{
    public DbSet<Requirement> Requirements => Set<Requirement>();
    public DbSet<CatalogReference> CatalogReferences => Set<CatalogReference>();
    public DbSet<RequirementAuditEvent> AuditEvents => Set<RequirementAuditEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CatalogReference>(entity =>
        {
            entity.ToTable("CatalogReferences");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Type).HasMaxLength(80).IsRequired();
            entity.Property(x => x.Code).HasMaxLength(80).IsRequired();
            entity.Property(x => x.Name).HasMaxLength(180).IsRequired();
            entity.HasIndex(x => new { x.Type, x.Code }).IsUnique();
        });

        modelBuilder.Entity<Requirement>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Code).HasMaxLength(32).IsRequired();
            entity.Property(x => x.ActivityOrEvent).HasMaxLength(240).IsRequired();
            entity.Property(x => x.RequestedBy).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Faculty).HasMaxLength(160).IsRequired();
            entity.Property(x => x.Career).HasMaxLength(160).IsRequired();
            entity.Property(x => x.Campus).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Place).HasMaxLength(180).IsRequired();
            entity.Property(x => x.EventObjective).HasMaxLength(4000).IsRequired();
            entity.Property(x => x.EventFormat).HasMaxLength(80).IsRequired();
            entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            entity.Property(x => x.DeletedBy).HasMaxLength(160);
            entity.HasIndex(x => x.Code).IsUnique();
            entity.HasOne<CatalogReference>().WithMany().HasForeignKey(x => x.FacultyId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<CatalogReference>().WithMany().HasForeignKey(x => x.CampusId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<CatalogReference>().WithMany().HasForeignKey(x => x.EventFormatId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<CatalogReference>().WithMany().HasForeignKey(x => x.StatusId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RequirementAuditEvent>(entity =>
        {
            entity.ToTable("RequirementAuditEvents");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.FromStatus).HasMaxLength(32);
            entity.Property(x => x.ToStatus).HasMaxLength(32).IsRequired();
            entity.Property(x => x.Action).HasMaxLength(180).IsRequired();
            entity.Property(x => x.PerformedBy).HasMaxLength(160).IsRequired();
            entity.Property(x => x.Comments).HasColumnType("nvarchar(max)");
            entity.HasIndex(x => x.RequirementId);
            entity.HasIndex(x => x.OccurredAt);
        });
    }
}

public sealed class CatalogReference
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class RequirementAuditEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RequirementId { get; set; }
    public string? FromStatus { get; set; }
    public string ToStatus { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string PerformedBy { get; set; } = "Sistema";
    public string Comments { get; set; } = string.Empty;
    public DateTimeOffset OccurredAt { get; set; } = DateTimeOffset.UtcNow;

    public static RequirementAuditEvent Created(Guid requirementId, string? fromStatus, string toStatus, string action, string performedBy, string comments = "") =>
        new() { RequirementId = requirementId, FromStatus = fromStatus, ToStatus = toStatus, Action = action, PerformedBy = performedBy, Comments = comments };

    public static RequirementAuditEvent Changed(Guid requirementId, string? fromStatus, string toStatus, string action, string performedBy, string comments = "") =>
        new() { RequirementId = requirementId, FromStatus = fromStatus, ToStatus = toStatus, Action = action, PerformedBy = performedBy, Comments = comments };
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

public static class RequirementNotifications
{
    public static async Task NotifyAsync(IHttpClientFactory httpClientFactory, SystemNotificationRequest request)
    {
        try
        {
            var client = httpClientFactory.CreateClient("notifications");
            await client.PostAsJsonAsync("/notification-records/system", request);
        }
        catch
        {
            // La gestión del requerimiento no debe fallar si la notificación está temporalmente no disponible.
        }
    }
}

public static class RequirementWorkflowReconciliation
{
    public static async Task CompleteReadyAsync(RequirementsDbContext db, IHttpClientFactory httpClientFactory)
    {
        try
        {
            var client = httpClientFactory.CreateClient("activities");
            var summaries = await client.GetFromJsonAsync<List<CompletedRequirementSummary>>("/activities/completed-requirements") ?? [];
            if (summaries.Count == 0) return;
            var completedRequirementIds = summaries.Select(x => x.RequirementId).ToList();

            var requirements = await db.Requirements
                .Where(x => completedRequirementIds.Contains(x.Id) && !x.IsDeleted && x.Status != RequirementStatus.Completed)
                .ToListAsync();

            foreach (var requirement in requirements)
            {
                var summary = summaries.Single(x => x.RequirementId == requirement.Id);
                var previousStatus = requirement.Status.ToString();
                requirement.Complete(summary.Total, summary.Approved);
                CatalogReferenceWriter.UpsertStatusReference(db, requirement.Status);
                db.AuditEvents.Add(RequirementAuditEvent.Changed(
                    requirement.Id,
                    previousStatus,
                    requirement.Status.ToString(),
                    "Requerimiento completado automáticamente: todos sus productos están aprobados",
                    "Sistema",
                    AuditJson.Build("Requerimientos", "Completar automáticamente", "Sistema", new { requirement.Id, summary.Total, summary.Approved })));
            }

            if (requirements.Count > 0) await db.SaveChangesAsync();
        }
        catch
        {
            // La lectura de requerimientos continúa si el servicio de productos está temporalmente no disponible.
        }
    }
}

public sealed record CompletedRequirementSummary(Guid RequirementId, int Total, int Approved);

public static class AssignmentKeys
{
    public static string[] From(string email, string? name) =>
        new[] { email, name ?? string.Empty }
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value.Trim().ToLowerInvariant())
            .Distinct()
            .ToArray();
}

public static class CatalogReferenceWriter
{
    public static void UpsertReferences(RequirementsDbContext db, CreateRequirementRequest request)
    {
        UpsertReference(db, request.FacultyId, "Faculty", request.Faculty, request.Faculty);
        UpsertReference(db, request.CampusId, "Campus", request.Campus, request.Campus);
        UpsertReference(db, request.EventFormatId, "FormatoEvento", request.EventFormat, request.EventFormat);
        UpsertReference(db, request.StatusId ?? WorkflowCatalogIds.RequirementDraft, "EstadoRequerimiento", "Draft", "Borrador");
    }

    public static void UpsertStatusReference(RequirementsDbContext db, RequirementStatus status) =>
        UpsertReference(db, WorkflowCatalogIds.ForRequirement(status), "EstadoRequerimiento", status.ToString(), StatusName(status));

    private static void UpsertReference(RequirementsDbContext db, Guid id, string type, string code, string name)
    {
        var current = db.CatalogReferences.Local.FirstOrDefault(x => x.Id == id)
            ?? db.CatalogReferences.Find(id);
        if (current is null)
        {
            db.CatalogReferences.Add(new CatalogReference
            {
                Id = id,
                Type = type,
                Code = string.IsNullOrWhiteSpace(code) ? id.ToString("N")[..12] : code.Trim(),
                Name = name.Trim()
            });
            return;
        }

        current.Type = type;
        current.Code = string.IsNullOrWhiteSpace(code) ? current.Code : code.Trim();
        current.Name = name.Trim();
        current.IsActive = true;
    }

    private static string StatusName(RequirementStatus status) => status switch
    {
        RequirementStatus.Draft => "Borrador",
        RequirementStatus.InAnalysis => "En análisis",
        RequirementStatus.InExecution => "En ejecución",
        RequirementStatus.PendingApproval => "Pendiente de aprobación",
        RequirementStatus.Completed => "Completado",
        RequirementStatus.Rejected => "Rechazado",
        _ => status.ToString()
    };
}

public static class RequirementMetricsMath
{
    public static IReadOnlyList<MetricSlice> Slice<TKey>(IEnumerable<IGrouping<TKey, Requirement>> groups, int total) =>
        groups
            .Select(group => new MetricSlice(group.Key?.ToString() ?? "Sin dato", group.Count(), total == 0 ? 0 : Math.Round(group.Count() * 100m / total, 2)))
            .OrderByDescending(x => x.Count)
            .ToList();

    public static decimal AverageDays(IEnumerable<double> values)
    {
        var list = values.ToList();
        return list.Count == 0 ? 0 : Math.Round((decimal)list.Average(), 2);
    }

    public static IReadOnlyList<StageMetric> StageTimes(IReadOnlyList<RequirementAuditEvent> audits)
    {
        var durations = audits
            .GroupBy(x => x.RequirementId)
            .SelectMany(group => group.OrderBy(x => x.OccurredAt).Zip(group.OrderBy(x => x.OccurredAt).Skip(1), (from, to) => new
            {
                Stage = from.ToStatus,
                Hours = (to.OccurredAt - from.OccurredAt).TotalHours
            }))
            .GroupBy(x => x.Stage)
            .Select(group => new StageMetric(group.Key, Math.Round((decimal)group.Average(x => x.Hours), 2), group.Count()))
            .OrderBy(x => x.Stage)
            .ToList();
        return durations;
    }
}

public static class RequirementsSchema
{
    public static async Task EnsureAsync(RequirementsDbContext db)
    {
        var columns = new Dictionary<string, string>
        {
            ["ActivityOrEvent"] = "nvarchar(240) NOT NULL DEFAULT('Sin nombre')",
            ["FacultyId"] = "uniqueidentifier NULL",
            ["Faculty"] = "nvarchar(160) NOT NULL DEFAULT('No definida')",
            ["Career"] = "nvarchar(160) NOT NULL DEFAULT('No definida')",
            ["CampusId"] = "uniqueidentifier NULL",
            ["Campus"] = "nvarchar(120) NOT NULL DEFAULT('No definida')",
            ["Place"] = "nvarchar(180) NOT NULL DEFAULT('No definido')",
            ["StartDate"] = "date NOT NULL DEFAULT(CONVERT(date, GETUTCDATE()))",
            ["EndDate"] = "date NOT NULL DEFAULT(CONVERT(date, GETUTCDATE()))",
            ["EventObjective"] = "nvarchar(4000) NOT NULL DEFAULT('No definido')",
            ["EventFormatId"] = "uniqueidentifier NULL",
            ["EventFormat"] = "nvarchar(80) NOT NULL DEFAULT('Presencial')",
            ["StatusId"] = "uniqueidentifier NULL",
            ["RequestDate"] = "date NOT NULL DEFAULT(CONVERT(date, GETUTCDATE()))",
            ["IsDeleted"] = "bit NOT NULL DEFAULT(0)",
            ["DeletedAt"] = "datetimeoffset NULL",
            ["DeletedBy"] = "nvarchar(160) NOT NULL DEFAULT('')"
        };

        foreach (var column in columns)
        {
            var sql = $"""
                IF COL_LENGTH('Requirements', '{column.Key}') IS NULL
                BEGIN
                    ALTER TABLE [Requirements] ADD [{column.Key}] {column.Value}
                END
                """;
            await db.Database.ExecuteSqlRawAsync(sql);
        }

        await db.Database.ExecuteSqlRawAsync("""
            IF COL_LENGTH('Requirements', 'Title') IS NOT NULL ALTER TABLE [Requirements] ALTER COLUMN [Title] nvarchar(180) NULL;
            IF COL_LENGTH('Requirements', 'Description') IS NOT NULL ALTER TABLE [Requirements] ALTER COLUMN [Description] nvarchar(4000) NULL;
            IF COL_LENGTH('Requirements', 'Priority') IS NOT NULL ALTER TABLE [Requirements] ALTER COLUMN [Priority] nvarchar(32) NULL;
            IF COL_LENGTH('RequirementAuditEvents', 'Comments') IS NOT NULL ALTER TABLE [RequirementAuditEvents] ALTER COLUMN [Comments] nvarchar(max) NOT NULL;
            """);

        await db.Database.ExecuteSqlRawAsync("""
            IF OBJECT_ID('CatalogReferences', 'U') IS NULL
            BEGIN
                CREATE TABLE [CatalogReferences] (
                    [Id] uniqueidentifier NOT NULL,
                    [Type] nvarchar(80) NOT NULL,
                    [Code] nvarchar(80) NOT NULL,
                    [Name] nvarchar(180) NOT NULL,
                    [IsActive] bit NOT NULL,
                    [CreatedAt] datetimeoffset NOT NULL,
                    CONSTRAINT [PK_CatalogReferences] PRIMARY KEY ([Id])
                )
                CREATE UNIQUE INDEX [IX_CatalogReferences_Type_Code] ON [CatalogReferences] ([Type], [Code])
            END
            """);

        await db.Database.ExecuteSqlRawAsync("""
            MERGE [CatalogReferences] AS target
            USING (VALUES
                ('33333333-3333-3333-3333-333333333391', 'EstadoRequerimiento', 'Draft', 'Borrador'),
                ('33333333-3333-3333-3333-333333333393', 'EstadoRequerimiento', 'InAnalysis', 'En análisis'),
                ('33333333-3333-3333-3333-333333333394', 'EstadoRequerimiento', 'InExecution', 'En ejecución'),
                ('33333333-3333-3333-3333-333333333395', 'EstadoRequerimiento', 'PendingApproval', 'Pendiente de aprobación'),
                ('33333333-3333-3333-3333-333333333396', 'EstadoRequerimiento', 'Completed', 'Completado'),
                ('33333333-3333-3333-3333-333333333397', 'EstadoRequerimiento', 'Rejected', 'Rechazado')
            ) AS source ([Id], [Type], [Code], [Name])
            ON target.[Id] = CONVERT(uniqueidentifier, source.[Id])
            WHEN MATCHED THEN UPDATE SET [Type] = source.[Type], [Code] = source.[Code], [Name] = source.[Name], [IsActive] = 1
            WHEN NOT MATCHED THEN INSERT ([Id], [Type], [Code], [Name], [IsActive], [CreatedAt])
                VALUES (CONVERT(uniqueidentifier, source.[Id]), source.[Type], source.[Code], source.[Name], 1, SYSDATETIMEOFFSET());

            IF EXISTS (SELECT 1 FROM [Requirements] WHERE [FacultyId] IS NULL)
            BEGIN
                INSERT INTO [CatalogReferences] ([Id], [Type], [Code], [Name], [IsActive], [CreatedAt])
                SELECT NEWID(), 'Faculty', LEFT([Faculty], 80), [Faculty], 1, SYSDATETIMEOFFSET()
                FROM [Requirements] r
                WHERE [FacultyId] IS NULL
                  AND NOT EXISTS (SELECT 1 FROM [CatalogReferences] c WHERE c.[Type] = 'Faculty' AND c.[Name] = r.[Faculty])
                GROUP BY [Faculty]

                UPDATE r
                SET [FacultyId] = c.[Id]
                FROM [Requirements] r
                INNER JOIN [CatalogReferences] c ON c.[Type] = 'Faculty' AND c.[Name] = r.[Faculty]
                WHERE r.[FacultyId] IS NULL
            END

            IF EXISTS (SELECT 1 FROM [Requirements] WHERE [CampusId] IS NULL)
            BEGIN
                INSERT INTO [CatalogReferences] ([Id], [Type], [Code], [Name], [IsActive], [CreatedAt])
                SELECT NEWID(), 'Campus', LEFT([Campus], 80), [Campus], 1, SYSDATETIMEOFFSET()
                FROM [Requirements] r
                WHERE [CampusId] IS NULL
                  AND NOT EXISTS (SELECT 1 FROM [CatalogReferences] c WHERE c.[Type] = 'Campus' AND c.[Name] = r.[Campus])
                GROUP BY [Campus]

                UPDATE r
                SET [CampusId] = c.[Id]
                FROM [Requirements] r
                INNER JOIN [CatalogReferences] c ON c.[Type] = 'Campus' AND c.[Name] = r.[Campus]
                WHERE r.[CampusId] IS NULL
            END

            IF EXISTS (SELECT 1 FROM [Requirements] WHERE [EventFormatId] IS NULL)
            BEGIN
                INSERT INTO [CatalogReferences] ([Id], [Type], [Code], [Name], [IsActive], [CreatedAt])
                SELECT NEWID(), 'FormatoEvento', LEFT([EventFormat], 80), [EventFormat], 1, SYSDATETIMEOFFSET()
                FROM [Requirements] r
                WHERE [EventFormatId] IS NULL
                  AND NOT EXISTS (SELECT 1 FROM [CatalogReferences] c WHERE c.[Type] = 'FormatoEvento' AND c.[Name] = r.[EventFormat])
                GROUP BY [EventFormat]

                UPDATE r
                SET [EventFormatId] = c.[Id]
                FROM [Requirements] r
                INNER JOIN [CatalogReferences] c ON c.[Type] = 'FormatoEvento' AND c.[Name] = r.[EventFormat]
                WHERE r.[EventFormatId] IS NULL
            END

            UPDATE [Requirements]
            SET [StatusId] = CASE [Status]
                WHEN 'Draft' THEN '33333333-3333-3333-3333-333333333391'
                WHEN 'InAnalysis' THEN '33333333-3333-3333-3333-333333333393'
                WHEN 'InExecution' THEN '33333333-3333-3333-3333-333333333394'
                WHEN 'PendingApproval' THEN '33333333-3333-3333-3333-333333333395'
                WHEN 'Completed' THEN '33333333-3333-3333-3333-333333333396'
                WHEN 'Rejected' THEN '33333333-3333-3333-3333-333333333397'
                ELSE '33333333-3333-3333-3333-333333333391'
            END
            WHERE [StatusId] IS NULL

            ALTER TABLE [Requirements] ALTER COLUMN [FacultyId] uniqueidentifier NOT NULL;
            ALTER TABLE [Requirements] ALTER COLUMN [CampusId] uniqueidentifier NOT NULL;
            ALTER TABLE [Requirements] ALTER COLUMN [EventFormatId] uniqueidentifier NOT NULL;
            ALTER TABLE [Requirements] ALTER COLUMN [StatusId] uniqueidentifier NOT NULL;

            IF OBJECT_ID('FK_Requirements_CatalogReferences_FacultyId', 'F') IS NULL
                ALTER TABLE [Requirements] ADD CONSTRAINT [FK_Requirements_CatalogReferences_FacultyId] FOREIGN KEY ([FacultyId]) REFERENCES [CatalogReferences] ([Id]);
            IF OBJECT_ID('FK_Requirements_CatalogReferences_CampusId', 'F') IS NULL
                ALTER TABLE [Requirements] ADD CONSTRAINT [FK_Requirements_CatalogReferences_CampusId] FOREIGN KEY ([CampusId]) REFERENCES [CatalogReferences] ([Id]);
            IF OBJECT_ID('FK_Requirements_CatalogReferences_EventFormatId', 'F') IS NULL
                ALTER TABLE [Requirements] ADD CONSTRAINT [FK_Requirements_CatalogReferences_EventFormatId] FOREIGN KEY ([EventFormatId]) REFERENCES [CatalogReferences] ([Id]);
            IF OBJECT_ID('FK_Requirements_CatalogReferences_StatusId', 'F') IS NULL
                ALTER TABLE [Requirements] ADD CONSTRAINT [FK_Requirements_CatalogReferences_StatusId] FOREIGN KEY ([StatusId]) REFERENCES [CatalogReferences] ([Id]);
            """);

        await db.Database.ExecuteSqlRawAsync("""
            IF OBJECT_ID('RequirementAuditEvents', 'U') IS NULL
            BEGIN
                CREATE TABLE [RequirementAuditEvents] (
                    [Id] uniqueidentifier NOT NULL,
                    [RequirementId] uniqueidentifier NOT NULL,
                    [FromStatus] nvarchar(32) NULL,
                    [ToStatus] nvarchar(32) NOT NULL,
                    [Action] nvarchar(180) NOT NULL,
                    [PerformedBy] nvarchar(160) NOT NULL,
                    [Comments] nvarchar(1000) NOT NULL,
                    [OccurredAt] datetimeoffset NOT NULL,
                    CONSTRAINT [PK_RequirementAuditEvents] PRIMARY KEY ([Id])
                )
                CREATE INDEX [IX_RequirementAuditEvents_RequirementId] ON [RequirementAuditEvents] ([RequirementId])
                CREATE INDEX [IX_RequirementAuditEvents_OccurredAt] ON [RequirementAuditEvents] ([OccurredAt])
            END
            """);
    }
}
