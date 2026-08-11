using BuildingBlocks;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

public static class RequirementEndpoints
{
    public static void MapRequirementPublicEndpoints(this WebApplication app)
    {
        app.MapPost("/requirements/public", async (
            CreateRequirementRequest request,
            HttpRequest httpRequest,
            RequirementsDbContext db,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            IRequirementUploadTokenService tokenService) =>
        {
            var idempotencyKey = request.IdempotencyKey ?? httpRequest.Headers["Idempotency-Key"].FirstOrDefault();
            if (string.IsNullOrWhiteSpace(idempotencyKey)) return Results.BadRequest(new { message = "Clave de idempotencia requerida." });
            if (!await TurnstileVerifier.IsValidAsync(request.TurnstileToken, httpRequest, httpClientFactory, configuration))
                return Results.BadRequest(new { message = "No se pudo validar Turnstile." });
            var idempotencyHash = tokenService.Hash(idempotencyKey);
            var existing = await db.RequirementPublicCreations.FirstOrDefaultAsync(x => x.IdempotencyKeyHash == idempotencyHash);
            if (existing is not null)
            {
                var existingRequirement = await db.Requirements.FindAsync(existing.RequirementId);
                if (existingRequirement is null) return Results.Conflict(new { message = "La creación previa no está disponible." });
                return Results.Ok(new PublicRequirementCreationResponse(existingRequirement.Id, existingRequirement.Code, existing.UploadTokenValue, existing.ExpiresAt, RequirementMessages.Created(existingRequirement.Code)));
            }

            var validation = RequirementRequestValidator.Validate(request);
            if (!validation.IsValid) return Results.BadRequest(new { message = validation.Message });

            await using var transaction = await db.Database.BeginTransactionAsync();
            var resolvedRequest = CatalogReferenceWriter.ResolveReferences(db, request);
            var requirement = RequirementFactory.Create(resolvedRequest);
            requirement.SetStatusReference(resolvedRequest.StatusId ?? WorkflowCatalogIds.ForRequirement(requirement.Status));
            db.Requirements.Add(requirement);
            db.AuditEvents.Add(RequirementAuditEvent.Created(requirement.Id, null, requirement.Status.ToString(), "Creación pública del requerimiento", requirement.RequesterEmail, AuditJson.Build("Requerimientos", "Crear público", requirement.RequesterEmail, new { requirement.Id, requirement.Code })));
            await db.SaveChangesAsync();

            var uploadToken = tokenService.CreateToken();
            db.RequirementPublicCreations.Add(new RequirementPublicCreation
            {
                RequirementId = requirement.Id,
                IdempotencyKeyHash = idempotencyHash,
                UploadTokenHash = tokenService.Hash(uploadToken),
                UploadTokenValue = uploadToken,
                ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(30)
            });
            await db.SaveChangesAsync();
            await transaction.CommitAsync();

            await RequirementNotifications.NotifyAsync(httpClientFactory, new SystemNotificationRequest(
                "RequirementCreated",
                "Requerimiento creado",
                $"Se creó el requerimiento {requirement.Code}: {requirement.ActivityOrEvent}",
                requirement.RequesterEmail,
                "Sistema",
                requirement.Id,
                null,
                AuditJson.Build("Notificaciones", "Requerimiento creado", requirement.RequesterEmail, requirement)));

            return Results.Created($"/requirements/{requirement.Id}", new PublicRequirementCreationResponse(requirement.Id, requirement.Code, uploadToken, DateTimeOffset.UtcNow.AddMinutes(30), RequirementMessages.Created(requirement.Code)));
        }).RequireRateLimiting("public-requirements");
    }

    public static void MapRequirementAttachmentEndpoints(this WebApplication app)
    {
        app.MapPost("/requirements/{requirementId:guid}/attachments", async (
            Guid requirementId,
            HttpRequest request,
            RequirementsDbContext db,
            IRequirementAttachmentService service,
            IRequirementUploadTokenService tokenService) =>
        {
            if (!request.HasFormContentType) return Results.BadRequest(new { message = "La solicitud debe ser multipart/form-data." });
            if (!await IsAuthorizedUploadAsync(requirementId, request, db, tokenService)) return Results.Unauthorized();
            IFormCollection form;
            try
            {
                form = await request.ReadFormAsync();
            }
            catch (InvalidDataException)
            {
                return Results.BadRequest(new { message = "El archivo no puede superar 5 MB." });
            }
            if (form.Files.Count == 0) return Results.BadRequest(new { message = "Adjunte al menos un archivo." });
            var uploadedBy = form["uploadedBy"].FirstOrDefault() ?? "Sistema";
            try
            {
                var result = await service.UploadAsync(requirementId, form.Files, uploadedBy);
                if (result.Uploaded.Count == 0 && result.FailedFiles.Count > 0) return Results.BadRequest(result);
                return Results.Created($"/requirements/{requirementId}/attachments", result);
            }
            catch (InvalidOperationException error)
            {
                return Results.BadRequest(new { message = error.Message });
            }
        }).DisableAntiforgery().RequireRateLimiting("public-requirements");

        app.MapGet("/requirements/{requirementId:guid}/attachments", async (Guid requirementId, IRequirementAttachmentService service) =>
            Results.Ok(await service.ListAsync(requirementId)));

        app.MapGet("/requirements/{requirementId:guid}/attachments/{attachmentId:guid}", async (Guid requirementId, Guid attachmentId, IRequirementAttachmentService service) =>
        {
            var item = await service.OpenAsync(requirementId, attachmentId);
            return item is null
                ? Results.NotFound()
                : Results.File(item.Value.Content, item.Value.Attachment.ContentType, item.Value.Attachment.OriginalFileName);
        });

        app.MapDelete("/requirements/{requirementId:guid}/attachments/{attachmentId:guid}", async (Guid requirementId, Guid attachmentId, HttpRequest request, IRequirementAttachmentService service) =>
        {
            var deletedBy = request.Headers["X-User-Email"].FirstOrDefault() ?? "Sistema";
            try
            {
                return await service.DeleteAsync(requirementId, attachmentId, deletedBy) ? Results.NoContent() : Results.NotFound();
            }
            catch (InvalidOperationException error)
            {
                return Results.Conflict(new { message = error.Message });
            }
        });
    }

    private static async Task<bool> IsAuthorizedUploadAsync(Guid requirementId, HttpRequest request, RequirementsDbContext db, IRequirementUploadTokenService tokenService)
    {
        var token = request.Headers["X-Requirement-Upload-Token"].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(token) && request.HasFormContentType)
        {
            var form = await request.ReadFormAsync();
            token = form["uploadToken"].FirstOrDefault();
        }
        if (string.IsNullOrWhiteSpace(token)) return true;
        var tokenHash = tokenService.Hash(token);
        return await db.RequirementPublicCreations.AnyAsync(x => x.RequirementId == requirementId && x.UploadTokenHash == tokenHash && x.ExpiresAt >= DateTimeOffset.UtcNow);
    }
}

public static class TurnstileVerifier
{
    private const string VerifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    public static async Task<bool> IsValidAsync(string? token, HttpRequest request, IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        var secret = configuration["Turnstile:SecretKey"] ?? configuration["TURNSTILE_SECRET_KEY"];
        if (string.IsNullOrWhiteSpace(secret)) return true;
        if (string.IsNullOrWhiteSpace(token)) return false;

        try
        {
            var client = httpClientFactory.CreateClient();
            using var content = new FormUrlEncodedContent(new Dictionary<string, string?>
            {
                ["secret"] = secret,
                ["response"] = token,
                ["remoteip"] = request.HttpContext.Connection.RemoteIpAddress?.ToString()
            }.Where(x => !string.IsNullOrWhiteSpace(x.Value)).ToDictionary(x => x.Key, x => x.Value!));
            var response = await client.PostAsync(VerifyUrl, content);
            if (!response.IsSuccessStatusCode) return false;
            var result = await response.Content.ReadFromJsonAsync<TurnstileResponse>();
            return result?.Success == true;
        }
        catch
        {
            return false;
        }
    }

    private sealed record TurnstileResponse([property: JsonPropertyName("success")] bool Success);
}

public static class RequirementFactory
{
    public static Requirement Create(CreateRequirementRequest request) => new(
        request.ActivityOrEvent,
        request.RequestedBy,
        request.FacultyId,
        request.Faculty,
        request.Career,
        request.CampusId,
        request.Campus,
        request.Place,
        request.StartDate,
        request.StartTime,
        request.EndDate,
        request.EndTime,
        request.EventObjective,
        request.EventFormatId,
        request.EventFormat,
        request.RequestDate,
        request.CareerId,
        request.RequesterName,
        request.RequesterEmail,
        request.AudienceType,
        request.ActivityFormatDescription);
}

public static class RequirementRequestValidator
{
    public static RequirementRequestValidation Validate(CreateRequirementRequest request)
    {
        if (request.EndDate < request.StartDate) return new(false, "La fecha de fin no puede ser anterior al inicio.");
        if (request.EndDate == request.StartDate && request.StartTime.HasValue && request.EndTime.HasValue && request.EndTime <= request.StartTime)
            return new(false, "La hora de fin debe ser posterior al inicio.");
        if (WordCount(request.EventObjective) > 70) return new(false, "El objetivo del evento debe tener máximo 70 palabras.");
        if (WordCount(request.ActivityFormatDescription ?? string.Empty) > 70) return new(false, "El formato o dinámica debe tener máximo 70 palabras.");
        if (!string.IsNullOrWhiteSpace(request.RequesterEmail) && !request.RequesterEmail.Contains('@')) return new(false, "Correo del solicitante inválido.");
        return new(true, string.Empty);
    }

    private static int WordCount(string value) => string.IsNullOrWhiteSpace(value)
        ? 0
        : value.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Length;
}

public sealed record RequirementRequestValidation(bool IsValid, string Message);

public static class RequirementMessages
{
    public static string Created(string code) => $"Su requerimiento fue registrado correctamente con el código {code}. El área de Marketing revisará la información enviada.";
}
