using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

public static class InitialImportEndpoint
{
    public static void MapInitialImport(this WebApplication app)
    {
        app.MapPost("/initial-import", async (HttpRequest request, AdministrationDbContext db, IConfiguration configuration) =>
        {
            if (!request.HasFormContentType) return Results.BadRequest("Debe enviar un archivo .xlsx en multipart/form-data.");

            var startedAt = DateTimeOffset.UtcNow;
            var form = await request.ReadFormAsync();
            var file = form.Files["file"] ?? form.Files.FirstOrDefault();
            if (file is null || file.Length == 0) return Results.BadRequest("Archivo requerido.");
            var scope = (form["scope"].FirstOrDefault() ?? "all").Trim().ToLowerInvariant();

            await using var memory = new MemoryStream();
            await file.CopyToAsync(memory);
            memory.Position = 0;

            var workbook = XlsxReader.Read(memory);
            var import = InitialImportData.From(workbook);
            var result = InitialImportResult.Empty;

            var requirementsConnection = configuration.GetConnectionString("RequirementsDb");
            var activitiesConnection = configuration.GetConnectionString("ActivitiesDb");
            var identityConnection = configuration.GetConnectionString("IdentityDb");
            if (string.IsNullOrWhiteSpace(requirementsConnection) || string.IsNullOrWhiteSpace(activitiesConnection) || string.IsNullOrWhiteSpace(identityConnection))
                return Results.BadRequest("Faltan cadenas de conexión RequirementsDb, ActivitiesDb o IdentityDb.");

            if (scope is "all" or "administration" or "catalogs")
            {
                await using var transaction = await db.Database.BeginTransactionAsync();
                await InitialImportWriter.UpsertAdministrationAsync(db, import, scope);
                await transaction.CommitAsync();
                result = result with
                {
                    Faculties = scope is "all" or "administration" ? import.Faculties.Count : 0,
                    Campuses = scope is "all" or "administration" ? import.Campuses.Count : 0,
                    Careers = scope is "all" or "administration" ? import.Careers.Count : 0,
                    Catalogs = scope is "all" or "catalogs" ? import.Catalogs.Count : 0,
                    Approvers = scope is "all" or "administration" ? import.Approvers.Count : 0
                };
            }

            if (scope is "all" or "requirements")
            {
                await InitialImportWriter.UpsertRequirementsAsync(requirementsConnection, import);
                result = result with { Requirements = import.Requirements.Count };
            }

            if (scope is "all" or "products")
            {
                await InitialImportWriter.UpsertActivitiesAsync(activitiesConnection, import);
                result = result with { Products = import.Products.Count };
            }

            if (scope is "all" or "users")
            {
                await InitialImportWriter.UpsertUsersAsync(identityConnection, import);
                result = result with { Users = import.Users.Count };
            }

            db.InitialImportRuns.Add(InitialImportRun.Completed(
                file.FileName,
                scope,
                startedAt,
                DateTimeOffset.UtcNow,
                result));
            await db.SaveChangesAsync();

            return Results.Ok(result);
        }).RequireAuthorization("CatalogAdmin");

        app.MapGet("/initial-import/runs", async (AdministrationDbContext db) =>
            await db.InitialImportRuns
                .Where(x => !x.IsDeleted)
                .OrderByDescending(x => x.CompletedAt)
                .Take(30)
                .ToListAsync()).RequireAuthorization("CatalogAdmin");

        app.MapDelete("/initial-import/runs/{id:guid}", async (Guid id, AdministrationDbContext db) =>
        {
            var run = await db.InitialImportRuns.FindAsync(id);
            if (run is null || run.IsDeleted) return Results.NotFound();

            run.IsDeleted = true;
            run.DeletedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization("CatalogAdmin");
    }
}

public sealed record InitialImportResult(
    int Faculties,
    int Campuses,
    int Careers,
    int Catalogs,
    int Approvers,
    int Requirements,
    int Products,
    int Users)
{
    public static InitialImportResult Empty => new(0, 0, 0, 0, 0, 0, 0, 0);
}

public sealed class InitialImportData
{
    public List<RowData> Faculties { get; } = [];
    public List<RowData> Campuses { get; } = [];
    public List<RowData> Careers { get; } = [];
    public List<RowData> Catalogs { get; } = [];
    public List<RowData> Approvers { get; } = [];
    public List<RowData> Users { get; } = [];
    public List<RowData> Requirements { get; } = [];
    public List<RowData> Products { get; } = [];

    public static InitialImportData From(Dictionary<string, List<RowData>> workbook)
    {
        var data = new InitialImportData();
        data.Faculties.AddRange(Sheet(workbook, "Facultades"));
        data.Campuses.AddRange(Sheet(workbook, "Sedes"));
        data.Careers.AddRange(Sheet(workbook, "Carreras"));
        data.Catalogs.AddRange(Sheet(workbook, "Catalogos"));
        data.Approvers.AddRange(Sheet(workbook, "Aprobadores"));
        data.Users.AddRange(Sheet(workbook, "Usuarios"));
        data.Requirements.AddRange(Sheet(workbook, "Requerimientos"));
        data.Products.AddRange(Sheet(workbook, "Productos"));
        return data;
    }

    private static List<RowData> Sheet(Dictionary<string, List<RowData>> workbook, string name) =>
        workbook.TryGetValue(name, out var rows) ? rows : [];
}

public sealed class RowData(Dictionary<string, string> values)
{
    public string Get(string key) => values.TryGetValue(key, out var value) ? value.Trim() : string.Empty;
    public Guid Guid(string key) => System.Guid.TryParse(Get(key), out var value) ? value : System.Guid.Empty;
    public Guid? NullableGuid(string key) => System.Guid.TryParse(Get(key), out var value) ? value : null;
    public bool Bool(string key) => bool.TryParse(Get(key), out var value) ? value : Get(key) is "1" or "SI" or "Si" or "sí" or "Activo";
    public int Int(string key) => int.TryParse(Get(key), out var value) ? value : 0;
    public DateOnly Date(string key)
    {
        var raw = Get(key);
        if (double.TryParse(raw, out var serial)) return DateOnly.FromDateTime(DateTime.FromOADate(serial));
        return DateOnly.TryParse(raw, out var value) ? value : DateOnly.FromDateTime(DateTime.UtcNow);
    }

    public DateOnly? NullableDate(string key)
    {
        var raw = Get(key);
        if (string.IsNullOrWhiteSpace(raw)) return null;
        if (double.TryParse(raw, out var serial)) return DateOnly.FromDateTime(DateTime.FromOADate(serial));
        return DateOnly.TryParse(raw, out var value) ? value : null;
    }
}

public static class InitialImportWriter
{
    public static async Task UpsertAdministrationAsync(AdministrationDbContext db, InitialImportData import, string scope = "all")
    {
        var facultyMap = new Dictionary<Guid, Guid>();
        var campusMap = new Dictionary<Guid, Guid>();

        if (scope is "all" or "administration")
        foreach (var row in import.Faculties)
        {
            var id = row.Guid("Id");
            if (id == Guid.Empty) continue;
            var code = row.Get("Code");
            var item = await db.Faculties.FindAsync(id)
                ?? await db.Faculties.FirstOrDefaultAsync(x => x.Code == code);
            if (item is null)
            {
                item = new Faculty { Id = id };
                db.Faculties.Add(item);
            }
            item.Code = code;
            item.Name = row.Get("Name");
            item.IsActive = row.Bool("IsActive");
            facultyMap[id] = item.Id;
        }

        if (scope is "all" or "administration")
        foreach (var row in import.Campuses)
        {
            var id = row.Guid("Id");
            if (id == Guid.Empty) continue;
            var code = row.Get("Code");
            var item = await db.Campuses.FindAsync(id)
                ?? await db.Campuses.FirstOrDefaultAsync(x => x.Code == code);
            if (item is null)
            {
                item = new Campus { Id = id };
                db.Campuses.Add(item);
            }
            item.Code = code;
            item.Name = row.Get("Name");
            item.IsActive = row.Bool("IsActive");
            campusMap[id] = item.Id;
        }

        if (scope is "all" or "catalogs")
        foreach (var row in import.Catalogs)
        {
            var id = row.Guid("Id");
            if (id == Guid.Empty) continue;
            var code = row.Get("Code");
            var item = await db.CatalogItems.FindAsync(id)
                ?? await db.CatalogItems.FirstOrDefaultAsync(x => x.Code == code);
            if (item is null)
            {
                item = new CatalogItem { Id = id };
                db.CatalogItems.Add(item);
            }
            item.Type = row.Get("Type");
            item.Code = code;
            item.Name = row.Get("Name");
            item.IsActive = row.Bool("IsActive");
        }

        if (scope is "all" or "administration")
        foreach (var row in import.Careers)
        {
            var id = row.Guid("Id");
            if (id == Guid.Empty) continue;
            var code = row.Get("Code");
            var item = await db.Careers.FindAsync(id)
                ?? await db.Careers.FirstOrDefaultAsync(x => x.Code == code);
            if (item is null)
            {
                item = new Career { Id = id };
                db.Careers.Add(item);
            }
            item.Code = code;
            item.Name = row.Get("Name");
            item.FacultyId = MapId(row.NullableGuid("FacultyId"), facultyMap) ?? row.Guid("FacultyId");
            item.IsActive = row.Bool("IsActive");
        }

        if (scope is "all" or "administration")
        foreach (var row in import.Approvers)
        {
            var id = row.Guid("Id");
            if (id == Guid.Empty) continue;
            var item = await db.Approvers.FindAsync(id);
            if (item is null)
            {
                item = new Approver { Id = id };
                db.Approvers.Add(item);
            }
            item.Name = row.Get("Name");
            item.Email = row.Get("Email").ToLowerInvariant();
            item.FacultyId = MapId(row.NullableGuid("FacultyId"), facultyMap);
            item.CampusId = MapId(row.NullableGuid("CampusId"), campusMap);
            item.ApprovalLevel = Math.Max(1, row.Int("ApprovalLevel"));
            item.IsActive = row.Bool("IsActive");
        }

        await db.SaveChangesAsync();
    }

    public static async Task UpsertRequirementsAsync(string connectionString, InitialImportData import)
    {
        await using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();
        foreach (var row in import.Requirements)
        {
            var facultyId = await UpsertCatalogReferenceAsync(connection, row.Guid("FacultyId"), "Faculty", row.Get("Faculty"), row.Get("Faculty"));
            var campusId = await UpsertCatalogReferenceAsync(connection, row.Guid("CampusId"), "Campus", row.Get("Campus"), row.Get("Campus"));
            var eventFormatId = await UpsertCatalogReferenceAsync(connection, row.Guid("EventFormatId"), "FormatoEvento", row.Get("EventFormat"), row.Get("EventFormat"));
            var statusId = await UpsertCatalogReferenceAsync(connection, row.Guid("StatusId"), "EstadoRequerimiento", row.Get("Status"), row.Get("Status"));
            await ExecuteAsync(connection, """
                MERGE [Requirements] AS target
                USING (SELECT @Id AS [Id]) AS source ON target.[Id] = source.[Id]
                WHEN MATCHED THEN UPDATE SET [Code]=@Code,[ActivityOrEvent]=@ActivityOrEvent,[RequestedBy]=@RequestedBy,[FacultyId]=@FacultyId,[Faculty]=@Faculty,[Career]=@Career,[CampusId]=@CampusId,[Campus]=@Campus,[Place]=@Place,[StartDate]=@StartDate,[EndDate]=@EndDate,[EventObjective]=@EventObjective,[EventFormatId]=@EventFormatId,[EventFormat]=@EventFormat,[RequestDate]=@RequestDate,[Status]=@Status,[StatusId]=@StatusId,[UpdatedAt]=SYSDATETIMEOFFSET()
                WHEN NOT MATCHED THEN INSERT ([Id],[Code],[ActivityOrEvent],[RequestedBy],[FacultyId],[Faculty],[Career],[CampusId],[Campus],[Place],[StartDate],[EndDate],[EventObjective],[EventFormatId],[EventFormat],[RequestDate],[Status],[StatusId],[CreatedAt])
                VALUES (@Id,@Code,@ActivityOrEvent,@RequestedBy,@FacultyId,@Faculty,@Career,@CampusId,@Campus,@Place,@StartDate,@EndDate,@EventObjective,@EventFormatId,@EventFormat,@RequestDate,@Status,@StatusId,SYSDATETIMEOFFSET());
                """,
                P("@Id", row.Guid("Id")), P("@Code", row.Get("Code")), P("@ActivityOrEvent", row.Get("ActivityOrEvent")),
                P("@RequestedBy", row.Get("RequestedBy")), P("@FacultyId", facultyId), P("@Faculty", row.Get("Faculty")),
                P("@Career", row.Get("Career")), P("@CampusId", campusId), P("@Campus", row.Get("Campus")),
                P("@Place", row.Get("Place")), P("@StartDate", row.Date("StartDate").ToDateTime(TimeOnly.MinValue)),
                P("@EndDate", row.Date("EndDate").ToDateTime(TimeOnly.MinValue)), P("@EventObjective", row.Get("EventObjective")),
                P("@EventFormatId", eventFormatId), P("@EventFormat", row.Get("EventFormat")),
                P("@RequestDate", row.Date("RequestDate").ToDateTime(TimeOnly.MinValue)), P("@Status", NormalizeRequirementStatus(row.Get("Status"))),
                P("@StatusId", statusId));
        }
    }

    public static async Task UpsertActivitiesAsync(string connectionString, InitialImportData import)
    {
        await using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();
        foreach (var row in import.Products)
        {
            var requirementTypeId = await UpsertCatalogReferenceAsync(connection, row.Guid("RequirementTypeId"), "TipoRequerimiento", row.Get("RequirementType"), row.Get("RequirementType"));
            var targetAudienceId = await UpsertCatalogReferenceAsync(connection, row.Guid("TargetAudienceId"), "PublicoObjetivo", row.Get("TargetAudience"), row.Get("TargetAudience"));
            var productTypeId = await UpsertCatalogReferenceAsync(connection, row.Guid("ProductTypeId"), "TipoProducto", row.Get("ProductType"), row.Get("ProductType"));
            var diffusionChannelId = await UpsertCatalogReferenceAsync(connection, row.Guid("DiffusionChannelId"), "CanalDifusion", row.Get("DiffusionChannel"), row.Get("DiffusionChannel"));
            var mainKpiId = await UpsertCatalogReferenceAsync(connection, row.Guid("MainKpiId"), "KpiPrincipal", row.Get("MainKpi"), row.Get("MainKpi"));
            var statusId = await UpsertCatalogReferenceAsync(connection, row.Guid("StatusId"), "EstadoProducto", row.Get("Status"), row.Get("Status"));
            await ExecuteAsync(connection, """
                MERGE [Activities] AS target
                USING (SELECT @Id AS [Id]) AS source ON target.[Id] = source.[Id]
                WHEN MATCHED THEN UPDATE SET [RequirementId]=@RequirementId,[ProductId]=@ProductId,[RequirementTypeId]=@RequirementTypeId,[RequirementType]=@RequirementType,[StrategicObjective]=@StrategicObjective,[TargetAudienceId]=@TargetAudienceId,[TargetAudience]=@TargetAudience,[ProductTypeId]=@ProductTypeId,[ProductType]=@ProductType,[DiffusionChannelId]=@DiffusionChannelId,[DiffusionChannel]=@DiffusionChannel,[MainKpiId]=@MainKpiId,[MainKpi]=@MainKpi,[ProductResponsible]=@ProductResponsible,[ProductDeliveryDate]=@ProductDeliveryDate,[Status]=@Status,[StatusId]=@StatusId,[Observations]=@Observations,[UpdatedAt]=SYSDATETIMEOFFSET()
                WHEN NOT MATCHED THEN INSERT ([Id],[RequirementId],[ProductId],[RequirementTypeId],[RequirementType],[StrategicObjective],[TargetAudienceId],[TargetAudience],[ProductTypeId],[ProductType],[DiffusionChannelId],[DiffusionChannel],[MainKpiId],[MainKpi],[ProductResponsible],[ProductDeliveryDate],[Status],[StatusId],[Observations],[CreatedAt])
                VALUES (@Id,@RequirementId,@ProductId,@RequirementTypeId,@RequirementType,@StrategicObjective,@TargetAudienceId,@TargetAudience,@ProductTypeId,@ProductType,@DiffusionChannelId,@DiffusionChannel,@MainKpiId,@MainKpi,@ProductResponsible,@ProductDeliveryDate,@Status,@StatusId,@Observations,SYSDATETIMEOFFSET());
                """,
                P("@Id", row.Guid("Id")), P("@RequirementId", row.Guid("RequirementId")), P("@ProductId", row.Get("ProductId")),
                P("@RequirementTypeId", requirementTypeId), P("@RequirementType", row.Get("RequirementType")),
                P("@StrategicObjective", row.Get("StrategicObjective")), P("@TargetAudienceId", targetAudienceId),
                P("@TargetAudience", row.Get("TargetAudience")), P("@ProductTypeId", productTypeId), P("@ProductType", row.Get("ProductType")),
                P("@DiffusionChannelId", diffusionChannelId), P("@DiffusionChannel", row.Get("DiffusionChannel")),
                P("@MainKpiId", mainKpiId), P("@MainKpi", row.Get("MainKpi")), P("@ProductResponsible", row.Get("ProductResponsible")),
                P("@ProductDeliveryDate", row.NullableDate("ProductDeliveryDate")?.ToDateTime(TimeOnly.MinValue) as object ?? DBNull.Value),
                P("@Status", NormalizeActivityStatus(row.Get("Status"))), P("@StatusId", statusId), P("@Observations", row.Get("Observations")));
        }
    }

    public static async Task UpsertUsersAsync(string connectionString, InitialImportData import)
    {
        await using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();
        foreach (var row in import.Users)
        {
            var password = string.IsNullOrWhiteSpace(row.Get("PasswordInicial")) ? "User123!" : row.Get("PasswordInicial");
            var (hash, salt) = ImportPasswordHasher.Hash(password);
            await ExecuteAsync(connection, """
                MERGE [Users] AS target
                USING (SELECT @Email AS [Email]) AS source ON target.[Email] = source.[Email]
                WHEN MATCHED THEN UPDATE SET [Name]=@Name,[AuthProvider]=@AuthProvider,[Roles]=@Roles,[ScreenPermissions]=@ScreenPermissions,[FacultyId]=@FacultyId,[CampusId]=@CampusId,[IsActive]=@IsActive
                WHEN NOT MATCHED THEN INSERT ([Id],[Name],[Email],[PasswordHash],[PasswordSalt],[AuthProvider],[Roles],[ScreenPermissions],[FacultyId],[CampusId],[IsActive],[CreatedAt])
                VALUES (@Id,@Name,@Email,@PasswordHash,@PasswordSalt,@AuthProvider,@Roles,@ScreenPermissions,@FacultyId,@CampusId,@IsActive,SYSDATETIMEOFFSET());
                """,
                P("@Id", row.Guid("Id")), P("@Name", row.Get("Name")), P("@Email", row.Get("Email").ToLowerInvariant()),
                P("@PasswordHash", hash), P("@PasswordSalt", salt), P("@AuthProvider", row.Get("AuthProvider")),
                P("@Roles", row.Get("Roles")), P("@ScreenPermissions", row.Get("ScreenPermissions")),
                P("@FacultyId", row.NullableGuid("FacultyId") as object ?? DBNull.Value), P("@CampusId", row.NullableGuid("CampusId") as object ?? DBNull.Value),
                P("@IsActive", row.Bool("IsActive")));
        }
    }

    private static async Task<Guid> UpsertCatalogReferenceAsync(SqlConnection connection, Guid id, string type, string code, string name)
    {
        if (id == Guid.Empty) return id;
        var safeCode = string.IsNullOrWhiteSpace(code) ? id.ToString("N")[..12] : code;
        var currentId = await ScalarGuidAsync(connection, "SELECT [Id] FROM [CatalogReferences] WHERE [Id] = @Id", P("@Id", id))
            ?? await ScalarGuidAsync(connection, "SELECT [Id] FROM [CatalogReferences] WHERE [Type] = @Type AND [Code] = @Code", P("@Type", type), P("@Code", safeCode))
            ?? id;

        var exists = await ScalarGuidAsync(connection, "SELECT [Id] FROM [CatalogReferences] WHERE [Id] = @Id", P("@Id", currentId));
        if (exists.HasValue)
        {
            await ExecuteAsync(connection, """
                UPDATE [CatalogReferences]
                SET [Type]=@Type,[Code]=@Code,[Name]=@Name,[IsActive]=1
                WHERE [Id]=@Id;
                """, P("@Id", currentId), P("@Type", type), P("@Code", safeCode), P("@Name", name));
            return currentId;
        }

        await ExecuteAsync(connection, """
            INSERT INTO [CatalogReferences] ([Id],[Type],[Code],[Name],[IsActive],[CreatedAt])
            VALUES (@Id,@Type,@Code,@Name,1,SYSDATETIMEOFFSET());
            """, P("@Id", currentId), P("@Type", type), P("@Code", safeCode), P("@Name", name));
        return currentId;
    }

    private static string NormalizeRequirementStatus(string status) => status switch
    {
        "Borrador" => "Draft",
        "En análisis" => "InAnalysis",
        "En ejecucion" or "En ejecución" => "InExecution",
        "Pendiente de aprobación" => "PendingApproval",
        "Completado" => "Completed",
        "Rechazado" => "Rejected",
        "" => "Draft",
        _ => status
    };

    private static string NormalizeActivityStatus(string status) => status switch
    {
        "Por hacer" => "Todo",
        "En progreso" => "InProgress",
        "Evidencia adjunta" => "EvidenceAttached",
        "Pendiente de aprobación" => "PendingApproval",
        "Aprobado" => "Approved",
        "Rechazado" => "Rejected",
        "" => "Todo",
        _ => status
    };

    private static SqlParameter P(string name, object value) => new(name, value);

    private static Guid? MapId(Guid? id, Dictionary<Guid, Guid> map) =>
        id.HasValue && map.TryGetValue(id.Value, out var mapped) ? mapped : id;

    private static async Task ExecuteAsync(SqlConnection connection, string sql, params SqlParameter[] parameters)
    {
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddRange(parameters);
        await command.ExecuteNonQueryAsync();
    }

    private static async Task<Guid?> ScalarGuidAsync(SqlConnection connection, string sql, params SqlParameter[] parameters)
    {
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddRange(parameters);
        var value = await command.ExecuteScalarAsync();
        return value is Guid id ? id : null;
    }
}

public static class ImportPasswordHasher
{
    public static (string Hash, string Salt) Hash(string password)
    {
        var saltBytes = RandomNumberGenerator.GetBytes(16);
        var hashBytes = Rfc2898DeriveBytes.Pbkdf2(password, saltBytes, 100_000, HashAlgorithmName.SHA256, 32);
        return (Convert.ToBase64String(hashBytes), Convert.ToBase64String(saltBytes));
    }
}

public static class XlsxReader
{
    public static Dictionary<string, List<RowData>> Read(Stream stream)
    {
        using var document = SpreadsheetDocument.Open(stream, false);
        var workbookPart = document.WorkbookPart ?? throw new InvalidOperationException("Libro Excel inválido.");
        var sharedStrings = workbookPart.SharedStringTablePart?.SharedStringTable?.Elements<SharedStringItem>().Select(x => x.InnerText).ToArray() ?? [];
        var result = new Dictionary<string, List<RowData>>(StringComparer.OrdinalIgnoreCase);

        foreach (var sheet in workbookPart.Workbook.Sheets?.Elements<Sheet>() ?? [])
        {
            if (sheet.Id?.Value is null || sheet.Name?.Value is null) continue;
            var worksheetPart = (WorksheetPart)workbookPart.GetPartById(sheet.Id.Value);
            var rows = worksheetPart.Worksheet.Descendants<Row>().ToList();
            if (rows.Count == 0) continue;

            var headerRow = rows.FirstOrDefault(row => row.Descendants<Cell>().Any(cell => CellValue(cell, sharedStrings) == "Id"));
            if (headerRow is null) continue;

            var headers = headerRow.Descendants<Cell>()
                .Select(cell => new { Column = ColumnIndex(cell.CellReference?.Value), Name = CellValue(cell, sharedStrings) })
                .Where(x => !string.IsNullOrWhiteSpace(x.Name))
                .ToList();

            var sheetRows = new List<RowData>();
            foreach (var row in rows.Where(x => x.RowIndex?.Value > headerRow.RowIndex?.Value))
            {
                var cells = row.Descendants<Cell>().ToDictionary(cell => ColumnIndex(cell.CellReference?.Value), cell => CellValue(cell, sharedStrings));
                var values = headers.ToDictionary(header => header.Name, header => cells.TryGetValue(header.Column, out var value) ? value : string.Empty, StringComparer.OrdinalIgnoreCase);
                if (values.Values.All(string.IsNullOrWhiteSpace)) continue;
                sheetRows.Add(new RowData(values));
            }

            result[sheet.Name.Value] = sheetRows;
        }

        return result;
    }

    private static string CellValue(Cell cell, string[] sharedStrings)
    {
        var raw = cell.CellValue?.Text ?? string.Empty;
        if (cell.DataType?.Value == CellValues.SharedString && int.TryParse(raw, out var index) && index >= 0 && index < sharedStrings.Length)
            return sharedStrings[index];
        if (cell.DataType?.Value == CellValues.Boolean) return raw == "1" ? "true" : "false";
        return raw;
    }

    private static int ColumnIndex(string? reference)
    {
        if (string.IsNullOrWhiteSpace(reference)) return 0;
        var index = 0;
        foreach (var ch in reference.TakeWhile(char.IsLetter))
        {
            index *= 26;
            index += char.ToUpperInvariant(ch) - 'A' + 1;
        }
        return index;
    }
}
