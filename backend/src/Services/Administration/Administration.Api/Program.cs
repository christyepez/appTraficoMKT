using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.ConfigureHttpJsonOptions(options => options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddDbContext<AdministrationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("AdministrationDb")));
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var jwt = JwtOptions.FromConfiguration(builder.Configuration);
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => options.TokenValidationParameters = jwt.ValidationParameters());
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CatalogAdmin", policy => policy.RequireRole("Administrador"));
    options.AddPolicy("ApproverAdmin", policy => policy.RequireRole("Administrador", "Aprobador"));
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AdministrationDbContext>();
    await db.Database.EnsureCreatedAsync();
    await AdministrationSchema.EnsureAsync(db);
    await AdministrationSeed.RunAsync(db);
}

app.MapGet("/health", () => Results.Ok(new { service = "administration", status = "healthy" }));
app.MapInitialImport();

MapCrud<Faculty, UpsertNamedRequest>(app, "/faculties", db => db.Faculties, (item, request) =>
{
    item.Code = request.Code.Trim();
    item.Name = request.Name.Trim();
    item.IsActive = request.IsActive;
});

MapCrud<Campus, UpsertNamedRequest>(app, "/campuses", db => db.Campuses, (item, request) =>
{
    item.Code = request.Code.Trim();
    item.Name = request.Name.Trim();
    item.IsActive = request.IsActive;
});

app.MapGet("/careers", async (AdministrationDbContext db) =>
    await db.Careers.OrderBy(x => x.Name).ToListAsync()).RequireAuthorization();

app.MapGet("/careers/by-faculty/{facultyId:guid}", async (Guid facultyId, AdministrationDbContext db) =>
    await db.Careers
        .Where(x => x.FacultyId == facultyId && x.IsActive)
        .OrderBy(x => x.Name)
        .ToListAsync()).RequireAuthorization();

app.MapPost("/careers", async (UpsertCareerRequest request, AdministrationDbContext db) =>
{
    if (!await db.Faculties.AnyAsync(x => x.Id == request.FacultyId)) return Results.BadRequest("La facultad seleccionada no existe.");
    var career = new Career();
    AdministrationHelpers.ApplyCareer(career, request);
    db.Careers.Add(career);
    await db.SaveChangesAsync();
    return Results.Created($"/careers/{career.Id}", career);
}).RequireAuthorization("CatalogAdmin");

app.MapPut("/careers/{id:guid}", async (Guid id, UpsertCareerRequest request, AdministrationDbContext db) =>
{
    if (!await db.Faculties.AnyAsync(x => x.Id == request.FacultyId)) return Results.BadRequest("La facultad seleccionada no existe.");
    var career = await db.Careers.FindAsync(id);
    if (career is null) return Results.NotFound();
    AdministrationHelpers.ApplyCareer(career, request);
    await db.SaveChangesAsync();
    return Results.Ok(career);
}).RequireAuthorization("CatalogAdmin");

app.MapDelete("/careers/{id:guid}", async (Guid id, AdministrationDbContext db) =>
{
    var career = await db.Careers.FindAsync(id);
    if (career is null) return Results.NotFound();
    career.IsActive = false;
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization("CatalogAdmin");

MapCrud<CatalogItem, UpsertCatalogRequest>(app, "/catalogs", db => db.CatalogItems, (item, request) =>
{
    item.Type = request.Type.Trim();
    item.Code = request.Code.Trim();
    item.Name = request.Name.Trim();
    item.IsActive = request.IsActive;
});

app.MapGet("/catalogs/by-type/{type}", async (string type, AdministrationDbContext db) =>
    await db.CatalogItems
        .Where(x => x.Type == type && x.IsActive)
        .OrderBy(x => x.Name)
        .ToListAsync()).RequireAuthorization();

app.MapGet("/approvers", async (AdministrationDbContext db) =>
    await db.Approvers.OrderBy(x => x.Name).ToListAsync()).RequireAuthorization("ApproverAdmin");

app.MapPost("/approvers", async (UpsertApproverRequest request, AdministrationDbContext db) =>
{
    var approver = new Approver
    {
        Name = request.Name.Trim(),
        Email = request.Email.Trim().ToLowerInvariant(),
        FacultyId = request.FacultyId,
        CampusId = request.CampusId,
        ApprovalLevel = request.ApprovalLevel,
        IsActive = request.IsActive
    };
    db.Approvers.Add(approver);
    await db.SaveChangesAsync();
    return Results.Created($"/approvers/{approver.Id}", approver);
}).RequireAuthorization("ApproverAdmin");

app.MapPut("/approvers/{id:guid}", async (Guid id, UpsertApproverRequest request, AdministrationDbContext db) =>
{
    var approver = await db.Approvers.FindAsync(id);
    if (approver is null) return Results.NotFound();

    approver.Name = request.Name.Trim();
    approver.Email = request.Email.Trim().ToLowerInvariant();
    approver.FacultyId = request.FacultyId;
    approver.CampusId = request.CampusId;
    approver.ApprovalLevel = request.ApprovalLevel;
    approver.IsActive = request.IsActive;
    await db.SaveChangesAsync();
    return Results.Ok(approver);
}).RequireAuthorization("ApproverAdmin");

app.MapDelete("/approvers/{id:guid}", async (Guid id, AdministrationDbContext db) =>
{
    var approver = await db.Approvers.FindAsync(id);
    if (approver is null) return Results.NotFound();

    approver.IsActive = false;
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization("ApproverAdmin");

app.Run();

static void MapCrud<TEntity, TRequest>(
    WebApplication app,
    string route,
    Func<AdministrationDbContext, DbSet<TEntity>> setSelector,
    Action<TEntity, TRequest> update)
    where TEntity : CatalogEntity, new()
{
    app.MapGet(route, async (AdministrationDbContext db) =>
        await setSelector(db).OrderBy(x => x.Name).ToListAsync()).RequireAuthorization();

    app.MapPost(route, async (TRequest request, AdministrationDbContext db) =>
    {
        var item = new TEntity();
        update(item, request);
        setSelector(db).Add(item);
        await db.SaveChangesAsync();
        return Results.Created($"{route}/{item.Id}", item);
    }).RequireAuthorization("CatalogAdmin");

    app.MapPut($"{route}/{{id:guid}}", async (Guid id, TRequest request, AdministrationDbContext db) =>
    {
        var item = await setSelector(db).FindAsync(id);
        if (item is null) return Results.NotFound();

        update(item, request);
        await db.SaveChangesAsync();
        return Results.Ok(item);
    }).RequireAuthorization("CatalogAdmin");

    app.MapDelete($"{route}/{{id:guid}}", async (Guid id, AdministrationDbContext db) =>
    {
        var item = await setSelector(db).FindAsync(id);
        if (item is null) return Results.NotFound();

        item.IsActive = false;
        await db.SaveChangesAsync();
        return Results.NoContent();
    }).RequireAuthorization("CatalogAdmin");
}

public sealed record UpsertNamedRequest(string Code, string Name, bool IsActive);
public sealed record UpsertCatalogRequest(string Type, string Code, string Name, bool IsActive);
public sealed record UpsertApproverRequest(string Name, string Email, Guid? FacultyId, Guid? CampusId, int ApprovalLevel, bool IsActive);
public sealed record UpsertCareerRequest(string Code, string Name, Guid FacultyId, bool IsActive);

public abstract class CatalogEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class Faculty : CatalogEntity;
public sealed class Campus : CatalogEntity;

public sealed class Career : CatalogEntity
{
    public Guid FacultyId { get; set; }
}

public sealed class CatalogItem : CatalogEntity
{
    public string Type { get; set; } = string.Empty;
}

public sealed class Approver
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public Guid? FacultyId { get; set; }
    public Guid? CampusId { get; set; }
    public int ApprovalLevel { get; set; } = 1;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class AdministrationDbContext(DbContextOptions<AdministrationDbContext> options) : DbContext(options)
{
    public DbSet<Faculty> Faculties => Set<Faculty>();
    public DbSet<Campus> Campuses => Set<Campus>();
    public DbSet<Career> Careers => Set<Career>();
    public DbSet<CatalogItem> CatalogItems => Set<CatalogItem>();
    public DbSet<Approver> Approvers => Set<Approver>();
    public DbSet<InitialImportRun> InitialImportRuns => Set<InitialImportRun>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ConfigureCatalog<Faculty>(modelBuilder, "Faculties");
        ConfigureCatalog<Campus>(modelBuilder, "Campuses");
        ConfigureCatalog<Career>(modelBuilder, "Careers");
        ConfigureCatalog<CatalogItem>(modelBuilder, "CatalogItems");

        modelBuilder.Entity<Career>().HasOne<Faculty>().WithMany().HasForeignKey(x => x.FacultyId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CatalogItem>().Property(x => x.Type).HasMaxLength(80).IsRequired();
        modelBuilder.Entity<CatalogItem>().HasIndex(x => new { x.Type, x.Code }).IsUnique();

        modelBuilder.Entity<Approver>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(160).IsRequired();
            entity.Property(x => x.Email).HasMaxLength(180).IsRequired();
            entity.HasIndex(x => x.Email);
            entity.HasOne<Faculty>().WithMany().HasForeignKey(x => x.FacultyId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<Campus>().WithMany().HasForeignKey(x => x.CampusId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<InitialImportRun>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.FileName).HasMaxLength(260).IsRequired();
            entity.Property(x => x.Scope).HasMaxLength(40).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(40).IsRequired();
        });
    }

    private static void ConfigureCatalog<TEntity>(ModelBuilder modelBuilder, string tableName) where TEntity : CatalogEntity
    {
        modelBuilder.Entity<TEntity>(entity =>
        {
            entity.ToTable(tableName);
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Code).HasMaxLength(40).IsRequired();
            entity.Property(x => x.Name).HasMaxLength(180).IsRequired();
            entity.HasIndex(x => x.Code).IsUnique();
        });
    }
}

public sealed record JwtOptions(string Issuer, string Audience, string Secret)
{
    public static JwtOptions FromConfiguration(IConfiguration configuration) => new(
        configuration["Jwt:Issuer"] ?? "RequirementsPlatform",
        configuration["Jwt:Audience"] ?? "RequirementsPlatformWeb",
        configuration["Jwt:Secret"] ?? "development-secret-change-me-please-32");

    public TokenValidationParameters ValidationParameters() => new()
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateIssuerSigningKey = true,
        ValidateLifetime = true,
        ValidIssuer = Issuer,
        ValidAudience = Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Secret))
    };
}

public static class AdministrationSeed
{
    public static async Task RunAsync(AdministrationDbContext db)
    {
        if (!await db.Faculties.AnyAsync())
        {
            db.Faculties.AddRange(
                new Faculty { Code = "ING", Name = "Facultad de Ingenieria" },
                new Faculty { Code = "ADM", Name = "Facultad de Administracion" });
        }

        if (!await db.Campuses.AnyAsync())
        {
            db.Campuses.AddRange(
                new Campus { Code = "MATRIZ", Name = "Sede Matriz" },
                new Campus { Code = "NORTE", Name = "Sede Norte" });
        }

        await db.SaveChangesAsync();

        if (!await db.Careers.AnyAsync())
        {
            var faculty = await db.Faculties.OrderBy(x => x.Name).FirstAsync();
            db.Careers.AddRange(
                new Career { Code = "SOFT", Name = "Software", FacultyId = faculty.Id },
                new Career { Code = "ADM", Name = "Administracion", FacultyId = faculty.Id });
        }

        await SeedCatalogAsync(db, "EstadoRequerimiento", ["Borrador", "En análisis", "En ejecución", "Pendiente de aprobación", "Completado", "Rechazado"]);
        await SeedCatalogAsync(db, "FormatoEvento", ["Presencial", "Virtual", "Hibrido"]);
        await SeedCatalogAsync(db, "EstadoProducto", ["Por hacer", "En progreso", "Evidencia adjunta", "Pendiente de aprobación", "Aprobado", "Rechazado"]);
        await SeedCatalogAsync(db, "TipoProducto", [
            "Arte Comunicados", "Arte de prensa", "Arte mailling", "Arte post", "Artes Estaticos", "Artes oficial del evento",
            "Artes pantallas", "Artes portadas", "Artes story", "Boletin de prensa", "Brochure", "Capsula Informativa",
            "Certificados", "Cobertura", "Credenciales", "Cronograma de redes", "Dipticos", "Entrevista", "Flyers",
            "Fotografias", "Guiones", "Infografia", "Invitaciones", "Logo", "Material POP", "Rull Up", "Sello",
            "Señaletica", "Spot de tv", "Spot radial", "Tripticos", "Vallas", "Video 4:5", "Video cuadrado",
            "Video Horizontal", "Video institicionales", "Video pantallas led", "Video reel", "Video Story",
            "Video Testimoniales", "Videos personalizados"
        ]);
        await SeedCatalogAsync(db, "TipoRequerimiento", ["Interno", "Institucional"]);
        await SeedCatalogAsync(db, "PublicoObjetivo", [
            "Estudiantes UTI", "Administrativos UTI", "Docentes UTI", "Estudiantes colegios", "Padres de Familia",
            "Empresas e Instituciones en general", "Universidades en general", "Graduados UTI", "Emprendedores",
            "Comunidades Indigenas"
        ]);
        await SeedCatalogAsync(db, "CanalDifusion", [
            "Todas", "Facebook", "Tik Tok", "Instagram", "Linkedin", "X", "YouTube", "Mailling", "Pagina Web",
            "Pantallas Pasillos", "Pantallas Aulas", "Radio", "Television", "Prensa Escrita"
        ]);
        await SeedCatalogAsync(db, "KpiPrincipal", [
            "# de asistentes al evento", "# impactos", "Alcance", "alcance e inscritos", "alcance e interaccion",
            "alcance inscritos", "Alcance y asistentes", "interaccion y alcance", "N/A", "NUMERO DE IMPACTOS",
            "SIN INFO", "Todos los kpi", "visualizaciones inscritos interaccion", "visualizaciones y alcance"
        ]);

        if (!await db.Approvers.AnyAsync())
        {
            db.Approvers.Add(new Approver { Name = "Aprobador principal", Email = "aprobador@local.test", ApprovalLevel = 1 });
        }

        await db.SaveChangesAsync();
    }

    private static async Task SeedCatalogAsync(AdministrationDbContext db, string type, string[] names)
    {
        var existing = await db.CatalogItems
            .Where(x => x.Type == type)
            .Select(x => new { x.Name, x.Code })
            .ToListAsync();
        var existingNames = existing.Select(x => x.Name).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var existingCodes = existing.Select(x => x.Code).ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var name in names.Select(x => x.Trim()).Where(x => !string.IsNullOrWhiteSpace(x)).Distinct(StringComparer.OrdinalIgnoreCase))
        {
            if (existingNames.Contains(name)) continue;
            var code = BuildCode(type, name);
            var suffix = 2;
            while (existingCodes.Contains(code))
            {
                var baseCode = BuildCode(type, name);
                code = $"{baseCode[..Math.Min(baseCode.Length, 34)]}-{suffix++}";
            }

            db.CatalogItems.Add(new CatalogItem
            {
                Type = type,
                Code = code,
                Name = name
            });
            existingCodes.Add(code);
            existingNames.Add(name);
        }
    }

    private static string BuildCode(string type, string name)
    {
        var normalized = new string(name
            .Normalize(NormalizationForm.FormD)
            .Where(ch => char.IsLetterOrDigit(ch))
            .Take(24)
            .ToArray())
            .ToUpperInvariant();
        return $"{type[..Math.Min(8, type.Length)].ToUpperInvariant()}-{normalized}";
    }
}

public static class AdministrationHelpers
{
    public static void ApplyCareer(Career career, UpsertCareerRequest request)
    {
        career.Code = request.Code.Trim();
        career.Name = request.Name.Trim();
        career.FacultyId = request.FacultyId;
        career.IsActive = request.IsActive;
    }
}

public sealed class InitialImportRun
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FileName { get; set; } = string.Empty;
    public string Scope { get; set; } = "all";
    public string Status { get; set; } = "Completed";
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset CompletedAt { get; set; }
    public int Faculties { get; set; }
    public int Campuses { get; set; }
    public int Careers { get; set; }
    public int Catalogs { get; set; }
    public int Approvers { get; set; }
    public int Requirements { get; set; }
    public int Products { get; set; }
    public int Users { get; set; }
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }

    public static InitialImportRun Completed(string fileName, string scope, DateTimeOffset startedAt, DateTimeOffset completedAt, InitialImportResult result) => new()
    {
        FileName = fileName,
        Scope = scope,
        StartedAt = startedAt,
        CompletedAt = completedAt,
        Faculties = result.Faculties,
        Campuses = result.Campuses,
        Careers = result.Careers,
        Catalogs = result.Catalogs,
        Approvers = result.Approvers,
        Requirements = result.Requirements,
        Products = result.Products,
        Users = result.Users
    };
}

public static class AdministrationSchema
{
    public static async Task EnsureAsync(AdministrationDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync("""
            IF OBJECT_ID('FK_Approvers_Faculties_FacultyId', 'F') IS NULL
                ALTER TABLE [Approvers] ADD CONSTRAINT [FK_Approvers_Faculties_FacultyId] FOREIGN KEY ([FacultyId]) REFERENCES [Faculties] ([Id]);
            IF OBJECT_ID('FK_Approvers_Campuses_CampusId', 'F') IS NULL
                ALTER TABLE [Approvers] ADD CONSTRAINT [FK_Approvers_Campuses_CampusId] FOREIGN KEY ([CampusId]) REFERENCES [Campuses] ([Id]);
            IF OBJECT_ID('Careers', 'U') IS NULL
            BEGIN
                CREATE TABLE [Careers] (
                    [Id] uniqueidentifier NOT NULL,
                    [Code] nvarchar(40) NOT NULL,
                    [Name] nvarchar(180) NOT NULL,
                    [FacultyId] uniqueidentifier NOT NULL,
                    [IsActive] bit NOT NULL DEFAULT(CAST(1 AS bit)),
                    [CreatedAt] datetimeoffset NOT NULL DEFAULT(SYSDATETIMEOFFSET()),
                    CONSTRAINT [PK_Careers] PRIMARY KEY ([Id])
                );
                CREATE UNIQUE INDEX [IX_Careers_Code] ON [Careers] ([Code]);
            END
            IF OBJECT_ID('FK_Careers_Faculties_FacultyId', 'F') IS NULL
                ALTER TABLE [Careers] ADD CONSTRAINT [FK_Careers_Faculties_FacultyId] FOREIGN KEY ([FacultyId]) REFERENCES [Faculties] ([Id]);
            IF OBJECT_ID('InitialImportRuns', 'U') IS NULL
            BEGIN
                CREATE TABLE [InitialImportRuns] (
                    [Id] uniqueidentifier NOT NULL,
                    [FileName] nvarchar(260) NOT NULL,
                    [Scope] nvarchar(40) NOT NULL,
                    [Status] nvarchar(40) NOT NULL,
                    [StartedAt] datetimeoffset NOT NULL,
                    [CompletedAt] datetimeoffset NOT NULL,
                    [Faculties] int NOT NULL,
                    [Campuses] int NOT NULL,
                    [Careers] int NOT NULL,
                    [Catalogs] int NOT NULL,
                    [Approvers] int NOT NULL,
                    [Requirements] int NOT NULL,
                    [Products] int NOT NULL,
                    [Users] int NOT NULL,
                    [IsDeleted] bit NOT NULL DEFAULT(0),
                    [DeletedAt] datetimeoffset NULL,
                    CONSTRAINT [PK_InitialImportRuns] PRIMARY KEY ([Id])
                );
            END
            IF COL_LENGTH('InitialImportRuns', 'IsDeleted') IS NULL
                ALTER TABLE [InitialImportRuns] ADD [IsDeleted] bit NOT NULL DEFAULT(0);
            IF COL_LENGTH('InitialImportRuns', 'DeletedAt') IS NULL
                ALTER TABLE [InitialImportRuns] ADD [DeletedAt] datetimeoffset NULL;
            """);
    }
}
