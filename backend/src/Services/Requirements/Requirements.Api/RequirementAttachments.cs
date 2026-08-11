using BuildingBlocks;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

public sealed class RequirementAttachment : Entity
{
    private RequirementAttachment()
    {
        OriginalFileName = string.Empty;
        StoredFileName = string.Empty;
        ContentType = string.Empty;
        StorageKey = string.Empty;
        Status = "Uploaded";
        UploadedBy = string.Empty;
    }

    public RequirementAttachment(Guid requirementId, string originalFileName, string storedFileName, string contentType, long sizeBytes, string storageKey, string uploadedBy)
    {
        if (requirementId == Guid.Empty) throw new ArgumentException("Requirement id is required.", nameof(requirementId));
        if (string.IsNullOrWhiteSpace(originalFileName)) throw new ArgumentException("File name is required.", nameof(originalFileName));
        if (string.IsNullOrWhiteSpace(storedFileName)) throw new ArgumentException("Stored file name is required.", nameof(storedFileName));
        if (sizeBytes <= 0) throw new ArgumentException("File size is required.", nameof(sizeBytes));
        if (string.IsNullOrWhiteSpace(storageKey)) throw new ArgumentException("Storage key is required.", nameof(storageKey));

        RequirementId = requirementId;
        OriginalFileName = RequirementFileNames.Sanitize(originalFileName);
        StoredFileName = storedFileName.Trim();
        ContentType = contentType.Trim();
        SizeBytes = sizeBytes;
        StorageKey = storageKey.Trim();
        Status = "Uploaded";
        UploadedBy = string.IsNullOrWhiteSpace(uploadedBy) ? "Sistema" : uploadedBy.Trim();
    }

    public Guid RequirementId { get; private set; }
    public string OriginalFileName { get; private set; }
    public string StoredFileName { get; private set; }
    public string ContentType { get; private set; }
    public long SizeBytes { get; private set; }
    public string StorageKey { get; private set; }
    public string Status { get; private set; }
    public string UploadedBy { get; private set; }

    public void Delete(string deletedBy)
    {
        Status = "Deleted";
        DeleteLogically(deletedBy);
    }
}

public sealed class RequirementPublicCreation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RequirementId { get; set; }
    public string IdempotencyKeyHash { get; set; } = string.Empty;
    public string UploadTokenHash { get; set; } = string.Empty;
    public string UploadTokenValue { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed record RequirementAttachmentResponse(Guid Id, Guid RequirementId, string OriginalFileName, string ContentType, long SizeBytes, string Status, string UploadedBy, DateTimeOffset CreatedAt);
public sealed record RequirementAttachmentUploadResult(IReadOnlyList<RequirementAttachmentResponse> Uploaded, IReadOnlyList<string> FailedFiles);
public sealed record PublicRequirementCreationResponse(Guid RequirementId, string RequirementCode, string UploadToken, DateTimeOffset UploadTokenExpiresAt, string Message);

public interface IRequirementAttachmentRepository
{
    Task<int> CountActiveAsync(Guid requirementId);
    Task<IReadOnlyList<RequirementAttachment>> ListAsync(Guid requirementId);
    Task<RequirementAttachment?> FindAsync(Guid requirementId, Guid attachmentId);
    Task AddAsync(RequirementAttachment attachment);
    Task SaveChangesAsync();
}

public sealed class RequirementAttachmentRepository(RequirementsDbContext db) : IRequirementAttachmentRepository
{
    public Task<int> CountActiveAsync(Guid requirementId) =>
        db.RequirementAttachments.CountAsync(x => x.RequirementId == requirementId && !x.IsDeleted);

    public async Task<IReadOnlyList<RequirementAttachment>> ListAsync(Guid requirementId) =>
        await db.RequirementAttachments.Where(x => x.RequirementId == requirementId && !x.IsDeleted).OrderByDescending(x => x.CreatedAt).ToListAsync();

    public Task<RequirementAttachment?> FindAsync(Guid requirementId, Guid attachmentId) =>
        db.RequirementAttachments.FirstOrDefaultAsync(x => x.RequirementId == requirementId && x.Id == attachmentId && !x.IsDeleted);

    public async Task AddAsync(RequirementAttachment attachment) => await db.RequirementAttachments.AddAsync(attachment);
    public Task SaveChangesAsync() => db.SaveChangesAsync();
}

public interface IRequirementFileValidator
{
    RequirementFileValidation Validate(IFormFile file);
}

public sealed record RequirementFileValidation(bool IsValid, string Message);

public sealed class RequirementFileValidator : IRequirementFileValidator
{
    public const int MaxFiles = 5;
    public const long MaxBytes = 5 * 1024 * 1024;
    private static readonly HashSet<string> AllowedMimeTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    private static readonly HashSet<string> AllowedExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];

    public RequirementFileValidation Validate(IFormFile file)
    {
        if (file.Length <= 0) return new(false, "Archivo requerido.");
        if (file.Length > MaxBytes) return new(false, "El archivo no puede superar 5 MB.");
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension)) return new(false, "Extensión de archivo no permitida.");
        if (!AllowedMimeTypes.Contains(file.ContentType)) return new(false, "Tipo de archivo no permitido.");
        if (extension == ".svg" || file.ContentType.Contains("svg", StringComparison.OrdinalIgnoreCase)) return new(false, "SVG no permitido.");
        if (!HasExpectedSignature(file, extension)) return new(false, "El contenido del archivo no coincide con su tipo.");
        return new(true, string.Empty);
    }

    private static bool HasExpectedSignature(IFormFile file, string extension)
    {
        Span<byte> buffer = stackalloc byte[12];
        using var stream = file.OpenReadStream();
        var read = stream.Read(buffer);
        return extension switch
        {
            ".pdf" => read >= 4 && buffer[0] == 0x25 && buffer[1] == 0x50 && buffer[2] == 0x44 && buffer[3] == 0x46,
            ".jpg" or ".jpeg" => read >= 3 && buffer[0] == 0xFF && buffer[1] == 0xD8 && buffer[2] == 0xFF,
            ".png" => read >= 8 && buffer[0] == 0x89 && buffer[1] == 0x50 && buffer[2] == 0x4E && buffer[3] == 0x47 && buffer[4] == 0x0D && buffer[5] == 0x0A && buffer[6] == 0x1A && buffer[7] == 0x0A,
            ".webp" => read >= 12 && buffer[0] == 0x52 && buffer[1] == 0x49 && buffer[2] == 0x46 && buffer[3] == 0x46 && buffer[8] == 0x57 && buffer[9] == 0x45 && buffer[10] == 0x42 && buffer[11] == 0x50,
            _ => false
        };
    }
}

public interface IRequirementFileStorageProvider
{
    Task<StoredRequirementFile> SaveAsync(IFormFile file);
    Task<Stream?> OpenReadAsync(string storageKey);
    Task DeleteAsync(string storageKey);
}

public sealed record StoredRequirementFile(string StoredFileName, string StorageKey);

public sealed class LocalRequirementFileStorageProvider(IWebHostEnvironment env, IConfiguration configuration) : IRequirementFileStorageProvider
{
    private readonly string root = configuration["RequirementAttachments:LocalPath"] ?? Path.Combine(env.ContentRootPath, "uploads", "requirements");

    public async Task<StoredRequirementFile> SaveAsync(IFormFile file)
    {
        Directory.CreateDirectory(root);
        var storedFileName = $"{Guid.NewGuid():N}{Path.GetExtension(file.FileName).ToLowerInvariant()}";
        var path = Path.Combine(root, storedFileName);
        await using var stream = File.Create(path);
        await file.CopyToAsync(stream);
        return new(storedFileName, storedFileName);
    }

    public Task<Stream?> OpenReadAsync(string storageKey)
    {
        var safeName = Path.GetFileName(storageKey);
        var path = Path.Combine(root, safeName);
        return Task.FromResult<Stream?>(File.Exists(path) ? File.OpenRead(path) : null);
    }

    public Task DeleteAsync(string storageKey)
    {
        var safeName = Path.GetFileName(storageKey);
        var path = Path.Combine(root, safeName);
        if (File.Exists(path)) File.Delete(path);
        return Task.CompletedTask;
    }
}

public interface IRequirementAttachmentService
{
    Task<RequirementAttachmentUploadResult> UploadAsync(Guid requirementId, IFormFileCollection files, string uploadedBy);
    Task<IReadOnlyList<RequirementAttachmentResponse>> ListAsync(Guid requirementId);
    Task<(RequirementAttachment Attachment, Stream Content)?> OpenAsync(Guid requirementId, Guid attachmentId);
    Task<bool> DeleteAsync(Guid requirementId, Guid attachmentId, string deletedBy);
}

public sealed class RequirementAttachmentService(
    RequirementsDbContext db,
    IRequirementAttachmentRepository repository,
    IRequirementFileValidator validator,
    IRequirementFileStorageProvider storage) : IRequirementAttachmentService
{
    public async Task<RequirementAttachmentUploadResult> UploadAsync(Guid requirementId, IFormFileCollection files, string uploadedBy)
    {
        var requirement = await db.Requirements.FindAsync(requirementId);
        if (requirement is null || requirement.IsDeleted) throw new InvalidOperationException("Requerimiento no existe.");
        var currentCount = await repository.CountActiveAsync(requirementId);
        if (currentCount + files.Count > RequirementFileValidator.MaxFiles) throw new InvalidOperationException("Puede adjuntar máximo 5 archivos por requerimiento.");

        var uploaded = new List<RequirementAttachmentResponse>();
        var failed = new List<string>();
        foreach (var file in files)
        {
            var validation = validator.Validate(file);
            if (!validation.IsValid)
            {
                failed.Add($"{RequirementFileNames.Sanitize(file.FileName)}: {validation.Message}");
                continue;
            }

            var stored = await storage.SaveAsync(file);
            var attachment = new RequirementAttachment(requirementId, file.FileName, stored.StoredFileName, file.ContentType, file.Length, stored.StorageKey, uploadedBy);
            await repository.AddAsync(attachment);
            db.AuditEvents.Add(RequirementAuditEvent.Changed(requirementId, requirement.Status.ToString(), requirement.Status.ToString(), "Adjunto de requerimiento cargado", uploadedBy, AuditJson.Build("Adjuntos requerimiento", "Cargar", uploadedBy, new { requirementId, attachment.OriginalFileName, attachment.ContentType, attachment.SizeBytes })));
            uploaded.Add(RequirementAttachmentMapper.ToResponse(attachment));
        }

        await repository.SaveChangesAsync();
        return new(uploaded, failed);
    }

    public Task<IReadOnlyList<RequirementAttachmentResponse>> ListAsync(Guid requirementId) =>
        repository.ListAsync(requirementId).ContinueWith(task => (IReadOnlyList<RequirementAttachmentResponse>)task.Result.Select(RequirementAttachmentMapper.ToResponse).ToList());

    public async Task<(RequirementAttachment Attachment, Stream Content)?> OpenAsync(Guid requirementId, Guid attachmentId)
    {
        var attachment = await repository.FindAsync(requirementId, attachmentId);
        if (attachment is null) return null;
        var stream = await storage.OpenReadAsync(attachment.StorageKey);
        if (stream is null) return null;
        db.AuditEvents.Add(RequirementAuditEvent.Changed(requirementId, string.Empty, string.Empty, "Adjunto de requerimiento consultado", "Sistema", AuditJson.Build("Adjuntos requerimiento", "Consultar", "Sistema", new { requirementId, attachmentId })));
        await db.SaveChangesAsync();
        return (attachment, stream);
    }

    public async Task<bool> DeleteAsync(Guid requirementId, Guid attachmentId, string deletedBy)
    {
        var requirement = await db.Requirements.FindAsync(requirementId);
        if (requirement is null || requirement.IsDeleted) return false;
        if (!requirement.CanEdit) throw new InvalidOperationException("Solo se pueden eliminar adjuntos si el requerimiento está en borrador.");
        var attachment = await repository.FindAsync(requirementId, attachmentId);
        if (attachment is null) return false;
        attachment.Delete(deletedBy);
        await storage.DeleteAsync(attachment.StorageKey);
        db.AuditEvents.Add(RequirementAuditEvent.Changed(requirementId, requirement.Status.ToString(), requirement.Status.ToString(), "Adjunto de requerimiento eliminado", deletedBy, AuditJson.Build("Adjuntos requerimiento", "Eliminar", deletedBy, new { requirementId, attachmentId })));
        await repository.SaveChangesAsync();
        return true;
    }
}

public static class RequirementAttachmentMapper
{
    public static RequirementAttachmentResponse ToResponse(RequirementAttachment attachment) =>
        new(attachment.Id, attachment.RequirementId, attachment.OriginalFileName, attachment.ContentType, attachment.SizeBytes, attachment.Status, attachment.UploadedBy, attachment.CreatedAt);
}

public interface IRequirementUploadTokenService
{
    string CreateToken();
    string Hash(string token);
}

public sealed class RequirementUploadTokenService : IRequirementUploadTokenService
{
    public string CreateToken() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)).Replace("+", "-").Replace("/", "_").TrimEnd('=');

    public string Hash(string token)
    {
        var bytes = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(token.Trim()));
        return Convert.ToHexString(bytes);
    }
}

public static class RequirementFileNames
{
    public static string Sanitize(string fileName)
    {
        var safe = Path.GetFileName(fileName).Replace("\\", "").Replace("/", "").Trim();
        return string.IsNullOrWhiteSpace(safe) ? "archivo" : safe;
    }
}
