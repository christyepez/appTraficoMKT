using BuildingBlocks;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddHttpClient("evidence", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["Services:Evidence"] ?? "http://evidence-api:8080");
});
builder.Services.AddHttpClient("requirements", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["Services:Requirements"] ?? "http://requirements-api:8080");
});
builder.Services.AddHttpClient("identity", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["Services:Identity"] ?? "http://identity-api:8080");
});
builder.Services.AddHttpClient("notifications");
builder.Services.AddDbContext<ActivitiesDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("ActivitiesDb")));
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
    var db = scope.ServiceProvider.GetRequiredService<ActivitiesDbContext>();
    await db.Database.EnsureCreatedAsync();
    await ActivitiesSchema.EnsureAsync(db);
    await ActivitiesSeed.RunAsync(db);
}

app.MapGet("/health", () => Results.Ok(new { service = "activities", status = "healthy" }));

app.MapGet("/activities", async (Guid? requirementId, ActivitiesDbContext db) =>
{
    var query = db.Activities.Where(x => !x.IsDeleted);
    if (requirementId.HasValue) query = query.Where(x => x.RequirementId == requirementId.Value);
    return await query.OrderByDescending(x => x.CreatedAt).ToListAsync();
});

app.MapGet("/activities/assignments/by-user", async (string email, string? name, ActivitiesDbContext db) =>
{
    var keys = AssignmentKeys.From(email, name);
    var total = await db.Activities
        .Where(x => !x.IsDeleted && x.Status != ActivityStatus.Approved)
        .CountAsync(x => keys.Contains(x.ProductResponsible.ToLower()));
    return Results.Ok(new AssignmentCountResponse(total));
});

app.MapGet("/activities/next-product-id", async (ActivitiesDbContext db) =>
{
    var productIds = await db.Activities.Select(x => x.ProductId).ToListAsync();
    return Results.Ok(new NextProductIdResponse(ProductIdSequence.Next(productIds)));
});

app.MapGet("/activities/metrics", async (ActivitiesDbContext db) =>
{
    var activities = await db.Activities.Where(x => !x.IsDeleted).ToListAsync();
    var audits = await db.AuditEvents.ToListAsync();
    var now = DateTimeOffset.UtcNow;
    var total = activities.Count;
    var completed = activities.Count(x => x.Status == ActivityStatus.Approved);

    return Results.Ok(new ProductMetricsResponse(
        total,
        completed,
        activities.Count(x => x.Status != ActivityStatus.Approved),
        ProductMetricsMath.AverageDays(activities.Select(x => ((x.UpdatedAt ?? now) - x.CreatedAt).TotalDays)),
        ProductMetricsMath.Slice(activities.GroupBy(x => x.Status.ToString()), total),
        ProductMetricsMath.Slice(activities.GroupBy(x => x.ProductResponsible), total),
        ProductMetricsMath.Slice(activities.GroupBy(x => x.ProductType), total),
        ProductMetricsMath.Slice(activities.GroupBy(x => x.DiffusionChannel), total),
        ProductMetricsMath.Slice(activities.GroupBy(x => x.MainKpi), total),
        ProductMetricsMath.Slice(activities.GroupBy(x => x.TargetAudience), total),
        ProductMetricsMath.StageTimes(audits)));
});

app.MapGet("/activities/audit", async (ActivitiesDbContext db) =>
    await db.AuditEvents.OrderByDescending(x => x.OccurredAt).ToListAsync());

app.MapGet("/agenda", async (string? technician, ActivitiesDbContext db) =>
{
    var query = db.AgendaItems.Where(x => !x.IsDeleted);
    if (!string.IsNullOrWhiteSpace(technician))
    {
        var key = technician.Trim().ToLowerInvariant();
        query = query.Where(x => x.TechnicianEmail.ToLower() == key || x.TechnicianName.ToLower() == key);
    }

    return await query.OrderBy(x => x.StartAt).ToListAsync();
});

app.MapPost("/agenda", async (CreateAgendaItemRequest request, ActivitiesDbContext db) =>
{
    if (request.EndAt <= request.StartAt) return Results.BadRequest("La fecha y hora de fin debe ser mayor al inicio.");
    var activity = await db.Activities.FindAsync(request.ActivityId);
    if (activity is null || activity.IsDeleted) return Results.BadRequest("Seleccione un producto válido.");

    var item = TechnicalAgendaItem.Create(request, activity.RequirementId, activity.ProductId, activity.ProductType);
    db.AgendaItems.Add(item);
    db.AuditEvents.Add(ActivityAuditEvent.Changed(activity.Id, activity.RequirementId, activity.Status.ToString(), activity.Status.ToString(), "Bloque de agenda creado", request.CreatedBy, AuditJson.Build("Agenda técnica", "Crear bloque", request.CreatedBy, request)));
    await db.SaveChangesAsync();
    return Results.Created($"/agenda/{item.Id}", item);
});

app.MapPut("/agenda/{id:guid}", async (Guid id, CreateAgendaItemRequest request, ActivitiesDbContext db) =>
{
    if (request.EndAt <= request.StartAt) return Results.BadRequest("La fecha y hora de fin debe ser mayor al inicio.");
    var item = await db.AgendaItems.FindAsync(id);
    if (item is null || item.IsDeleted) return Results.NotFound();
    var activity = await db.Activities.FindAsync(request.ActivityId);
    if (activity is null || activity.IsDeleted) return Results.BadRequest("Seleccione un producto válido.");

    item.Update(request, activity.RequirementId, activity.ProductId, activity.ProductType);
    db.AuditEvents.Add(ActivityAuditEvent.Changed(activity.Id, activity.RequirementId, activity.Status.ToString(), activity.Status.ToString(), "Bloque de agenda actualizado", request.CreatedBy, AuditJson.Build("Agenda técnica", "Editar bloque", request.CreatedBy, request)));
    await db.SaveChangesAsync();
    return Results.Ok(item);
});

app.MapDelete("/agenda/{id:guid}", async (Guid id, ActivitiesDbContext db) =>
{
    var item = await db.AgendaItems.FindAsync(id);
    if (item is null || item.IsDeleted) return Results.NotFound();
    item.Delete("Sistema");
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.MapGet("/activities/{id:guid}/audit", async (Guid id, ActivitiesDbContext db) =>
    await db.AuditEvents.Where(x => x.ActivityId == id).OrderBy(x => x.OccurredAt).ToListAsync());

app.MapGet("/activities/summary/{requirementId:guid}", async (Guid requirementId, ActivitiesDbContext db) =>
{
    var activities = await db.Activities.Where(x => x.RequirementId == requirementId && !x.IsDeleted).ToListAsync();
    return new ActivitySummary(
        activities.Count,
        activities.Count(x => x.Status == ActivityStatus.Approved),
        activities.Count(x => x.Status != ActivityStatus.Approved));
});

app.MapGet("/activities/completed-requirements", async (ActivitiesDbContext db) =>
    await db.Activities
        .Where(x => !x.IsDeleted)
        .GroupBy(x => x.RequirementId)
        .Where(group => group.Any() && group.All(x => x.Status == ActivityStatus.Approved))
        .Select(group => new CompletedRequirementSummary(
            group.Key,
            group.Count(),
            group.Count(x => x.Status == ActivityStatus.Approved)))
        .ToListAsync());

app.MapPost("/activities", async (CreateActivityRequest request, ActivitiesDbContext db, IHttpClientFactory httpClientFactory) =>
{
    await using var transaction = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
    await db.Database.ExecuteSqlRawAsync("EXEC sp_getapplock @Resource = 'Activities.ProductIdSequence', @LockMode = 'Exclusive', @LockOwner = 'Transaction', @LockTimeout = 10000");
    var productIds = await db.Activities.Select(x => x.ProductId).ToListAsync();
    var generatedProductId = ProductIdSequence.Next(productIds);

    CatalogReferenceWriter.UpsertReferences(db, request);
    var activity = new TechnicalActivity(
        request.RequirementId,
        generatedProductId,
        request.RequirementTypeId,
        request.RequirementType,
        request.StrategicObjective,
        request.TargetAudienceId,
        request.TargetAudience,
        request.ProductTypeId,
        request.ProductType,
        request.DiffusionChannelId,
        request.DiffusionChannel,
        request.MainKpiId,
        request.MainKpi,
        request.ProductResponsible,
        request.ProductDeliveryDate,
        request.Observations);
    activity.SetStatusReference(request.StatusId ?? WorkflowCatalogIds.ForActivity(activity.Status));
    db.Activities.Add(activity);
    db.AuditEvents.Add(ActivityAuditEvent.Created(activity.Id, activity.RequirementId, null, activity.Status.ToString(), "Creación del producto", request.ProductResponsible, AuditJson.Build("Productos", "Crear", request.ProductResponsible, new { ProductId = generatedProductId, Request = request })));
    await db.SaveChangesAsync();
    await transaction.CommitAsync();
    await RequirementWorkflowSync.StartAnalysisAsync(activity.RequirementId, httpClientFactory);
    return Results.Created($"/activities/{activity.Id}", activity);
});

app.MapPut("/activities/{id:guid}", async (Guid id, CreateActivityRequest request, ActivitiesDbContext db) =>
{
    var activity = await db.Activities.FindAsync(id);
    if (activity is null || activity.IsDeleted) return Results.NotFound();
    if (activity.Status == ActivityStatus.Approved)
        return Results.Conflict(new { message = "No se puede editar un producto completado." });
    CatalogReferenceWriter.UpsertReferences(db, request);
    var previousStatus = activity.Status.ToString();
    activity.Update(
        request.RequirementId,
        activity.ProductId,
        request.RequirementTypeId,
        request.RequirementType,
        request.StrategicObjective,
        request.TargetAudienceId,
        request.TargetAudience,
        request.ProductTypeId,
        request.ProductType,
        request.DiffusionChannelId,
        request.DiffusionChannel,
        request.MainKpiId,
        request.MainKpi,
        request.ProductResponsible,
        request.ProductDeliveryDate,
        request.Observations);
    activity.SetStatusReference(request.StatusId ?? WorkflowCatalogIds.ForActivity(activity.Status));
    db.AuditEvents.Add(ActivityAuditEvent.Changed(activity.Id, activity.RequirementId, previousStatus, activity.Status.ToString(), "Actualización de datos del producto", request.ProductResponsible, AuditJson.Build("Productos", "Editar", request.ProductResponsible, request)));
    await db.SaveChangesAsync();
    return Results.Ok(activity);
});

app.MapDelete("/activities/{id:guid}", async (Guid id, ActivitiesDbContext db) =>
{
    var activity = await db.Activities.FindAsync(id);
    if (activity is null || activity.IsDeleted) return Results.NotFound();
    if (activity.Status == ActivityStatus.Approved)
        return Results.Conflict(new { message = "No se puede eliminar un producto completado." });

    var previousStatus = activity.Status.ToString();
    activity.Delete("Sistema");
    db.AuditEvents.Add(ActivityAuditEvent.Changed(activity.Id, activity.RequirementId, previousStatus, activity.Status.ToString(), "Eliminación lógica del producto", "Sistema", AuditJson.Build("Productos", "Eliminar lógico", "Sistema", new { id })));
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.MapDelete("/activities/by-requirement/{requirementId:guid}", async (Guid requirementId, ActivitiesDbContext db) =>
{
    var activities = await db.Activities
        .Where(x => x.RequirementId == requirementId && !x.IsDeleted && x.Status != ActivityStatus.Approved)
        .ToListAsync();
    var blocked = await db.Activities
        .CountAsync(x => x.RequirementId == requirementId && !x.IsDeleted && x.Status == ActivityStatus.Approved);
    foreach (var activity in activities)
    {
        var previousStatus = activity.Status.ToString();
        activity.Delete("Sistema");
        db.AuditEvents.Add(ActivityAuditEvent.Changed(activity.Id, activity.RequirementId, previousStatus, activity.Status.ToString(), "Eliminación lógica por eliminación del requerimiento", "Sistema", AuditJson.Build("Productos", "Eliminar lógico por requerimiento", "Sistema", new { requirementId, activity.Id })));
    }

    await db.SaveChangesAsync();
    return Results.Ok(new { deleted = activities.Count, blocked });
});

app.MapPatch("/activities/{id:guid}/start", async (Guid id, ActivitiesDbContext db, IHttpClientFactory httpClientFactory) =>
{
    var activity = await db.Activities.FindAsync(id);
    if (activity is null || activity.IsDeleted) return Results.NotFound();

    var previousStatus = activity.Status.ToString();
    activity.Start();
    CatalogReferenceWriter.UpsertStatusReference(db, activity.Status);
    db.AuditEvents.Add(ActivityAuditEvent.Changed(activity.Id, activity.RequirementId, previousStatus, activity.Status.ToString(), "Inicio de gestión del producto", activity.ProductResponsible, AuditJson.Build("Productos", "Inicio de gestión", activity.ProductResponsible, new { id })));
    await db.SaveChangesAsync();
    await RequirementWorkflowSync.StartExecutionAsync(activity.RequirementId, httpClientFactory);
    return Results.Ok(activity);
});

app.MapPatch("/activities/{id:guid}/evidence-attached", async (Guid id, ActivitiesDbContext db) =>
{
    var activity = await db.Activities.FindAsync(id);
    if (activity is null || activity.IsDeleted) return Results.NotFound();

    var previousStatus = activity.Status.ToString();
    activity.MarkEvidenceAttached();
    CatalogReferenceWriter.UpsertStatusReference(db, activity.Status);
    db.AuditEvents.Add(ActivityAuditEvent.Changed(activity.Id, activity.RequirementId, previousStatus, activity.Status.ToString(), "Evidencia adjuntada", activity.ProductResponsible, AuditJson.Build("Productos", "Evidencia adjuntada", activity.ProductResponsible, new { id })));
    await db.SaveChangesAsync();
    return Results.Ok(activity);
});

app.MapPatch("/activities/{id:guid}/submit-approval", async (Guid id, ActivitiesDbContext db) =>
{
    var activity = await db.Activities.FindAsync(id);
    if (activity is null || activity.IsDeleted) return Results.NotFound();

    var previousStatus = activity.Status.ToString();
    activity.SendToApproval();
    CatalogReferenceWriter.UpsertStatusReference(db, activity.Status);
    db.AuditEvents.Add(ActivityAuditEvent.Changed(activity.Id, activity.RequirementId, previousStatus, activity.Status.ToString(), "Producto enviado a aprobación", activity.ProductResponsible, AuditJson.Build("Productos", "Enviar aprobación", activity.ProductResponsible, new { id })));
    await db.SaveChangesAsync();
    return Results.Ok(activity);
});

app.MapPost("/activities/{id:guid}/submit-approval", async (Guid id, SubmitApprovalRequest request, ActivitiesDbContext db, IHttpClientFactory httpClientFactory, IConfiguration configuration, HttpContext httpContext) =>
{
    var activity = await db.Activities.FindAsync(id);
    if (activity is null || activity.IsDeleted) return Results.NotFound();
    if (activity.Status == ActivityStatus.PendingApproval)
        return Results.Conflict(new { message = "El producto ya fue enviado a aprobación." });
    if (activity.Status == ActivityStatus.Approved)
        return Results.Conflict(new { message = "El producto ya está aprobado." });

    var notificationSettings = await db.NotificationSettings.Where(x => x.IsActive).OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt).FirstOrDefaultAsync();
    var approverEmail = ApprovalRecipient.ResolveApprover(request.ApproverEmail, notificationSettings, configuration);
    if (string.IsNullOrWhiteSpace(approverEmail)) return Results.BadRequest("Configure un aprobador o correo destino para solicitar aprobación.");

    var requesterEmail = string.IsNullOrWhiteSpace(request.RequesterEmail)
        ? await NotificationRecipientResolver.ResolveAsync(activity.ProductResponsible, httpContext, httpClientFactory)
        : request.RequesterEmail.Trim().ToLowerInvariant();

    var evidenceClient = httpClientFactory.CreateClient("evidence");
    var approvalResponse = await evidenceClient.PostAsJsonAsync("/approvals/requests", new SubmitApprovalRequestToEvidence(activity.Id, approverEmail, requesterEmail, request.Comments, request.Source ?? "web", "PendingNotification", null));
    if (!approvalResponse.IsSuccessStatusCode)
    {
        var errorText = await approvalResponse.Content.ReadAsStringAsync();
        return Results.Json(new { message = string.IsNullOrWhiteSpace(errorText) ? "No se pudo crear la solicitud de aprobación." : errorText }, statusCode: (int)approvalResponse.StatusCode);
    }

    var approval = await approvalResponse.Content.ReadFromJsonAsync<ActivityApprovalDto>();
    var previousStatus = activity.Status.ToString();
    activity.SendToApproval();
    CatalogReferenceWriter.UpsertStatusReference(db, activity.Status);
    db.AuditEvents.Add(ActivityAuditEvent.Changed(activity.Id, activity.RequirementId, previousStatus, activity.Status.ToString(), "Producto enviado a aprobación", activity.ProductResponsible, AuditJson.Build("Productos", "Enviar aprobación", activity.ProductResponsible, new { activity.Id, activity.ProductId, approvalId = approval?.Id, approverEmail, requesterEmail })));

    var record = NotificationRecord.Create(
        "ProductApprovalRequested",
        $"Aprobación producto {activity.ProductId}",
        $"El producto {activity.ProductId} requiere aprobación.",
        approverEmail,
        activity.ProductResponsible,
        activity.RequirementId,
        activity.Id,
        AuditJson.Build("Notificaciones", "Solicitud de aprobación", activity.ProductResponsible, new { activity.Id, activity.ProductId, approverEmail, requesterEmail, approvalId = approval?.Id }));
    db.NotificationRecords.Add(record);
    await db.SaveChangesAsync();
    await NotificationDelivery.SafeSendAsync(record, notificationSettings, httpClientFactory, configuration, db);

    return Results.Ok(new SubmitApprovalResponse(activity.Id, approval?.Id ?? Guid.Empty, activity.Status.ToString(), "PendingNotification"));
});

app.MapGet("/activities/{id:guid}/approvals", async (Guid id, IHttpClientFactory httpClientFactory) =>
{
    var approvals = await httpClientFactory.CreateClient("evidence").GetFromJsonAsync<List<ActivityApprovalDto>>($"/approvals?activityId={id}") ?? [];
    return Results.Ok(approvals);
});

app.MapPost("/approvals/{approvalId:guid}/decision", async (Guid approvalId, ApprovalDecisionCallbackRequest request, ActivitiesDbContext db, IHttpClientFactory httpClientFactory, IConfiguration configuration, HttpContext httpContext) =>
{
    var evidenceClient = httpClientFactory.CreateClient("evidence");
    if (ApprovalCallbackSecurity.RequiresCallbackKey(request.Source) && httpContext.Request.Headers.TryGetValue("x-api-key", out var apiKey))
        evidenceClient.DefaultRequestHeaders.Add("x-api-key", apiKey.ToString());

    var evidenceResponse = await evidenceClient.PostAsJsonAsync($"/approvals/{approvalId}/decision", request);
    if (!evidenceResponse.IsSuccessStatusCode)
    {
        var errorText = await evidenceResponse.Content.ReadAsStringAsync();
        return Results.Json(new { message = string.IsNullOrWhiteSpace(errorText) ? "No se pudo registrar la decisión." : errorText }, statusCode: (int)evidenceResponse.StatusCode);
    }

    var approval = await evidenceResponse.Content.ReadFromJsonAsync<ActivityApprovalDto>();
    if (approval is null) return Results.Problem("La aprobación se registró sin respuesta válida.", statusCode: 502);

    var activity = await db.Activities.FindAsync(approval.ActivityId);
    if (activity is null || activity.IsDeleted) return Results.NotFound();

    var previousStatus = activity.Status.ToString();
    var decision = approval.Decision.Equals("Approved", StringComparison.OrdinalIgnoreCase) ? ApprovalDecision.Approved : ApprovalDecision.Rejected;
    activity.Decide(decision);
    CatalogReferenceWriter.UpsertStatusReference(db, activity.Status);
    db.AuditEvents.Add(ActivityAuditEvent.Changed(activity.Id, activity.RequirementId, previousStatus, activity.Status.ToString(), $"Producto {decision}", approval.DecidedByEmail, AuditJson.Build("Productos", $"Decisión {decision}", approval.DecidedByEmail, new { approvalId, approval })));

    var notificationSettings = await db.NotificationSettings.Where(x => x.IsActive).OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt).FirstOrDefaultAsync();
    var recipientEmail = string.IsNullOrWhiteSpace(approval.RequesterEmail)
        ? await NotificationRecipientResolver.ResolveAsync(activity.ProductResponsible, httpContext, httpClientFactory)
        : approval.RequesterEmail;
    var approved = decision == ApprovalDecision.Approved;
    var notificationAction = approved ? "Producto aprobado" : "Producto rechazado";
    var record = NotificationRecord.Create(
        approved ? "ProductApproved" : "ProductRejected",
        notificationAction,
        $"El producto {activity.ProductId} fue {(approved ? "aprobado" : "rechazado y devuelto a proceso")}. {approval.Comments}".Trim(),
        recipientEmail,
        approval.DecidedByEmail,
        activity.RequirementId,
        activity.Id,
        AuditJson.Build("Notificaciones", notificationAction, approval.DecidedByEmail, new { activity.Id, activity.ProductId, recipientEmail, approval.Comments, approvalId }));
    db.NotificationRecords.Add(record);
    await db.SaveChangesAsync();

    if (approved)
    {
        await ProductNotification.SendApprovedAsync(activity, new ApproveActivityRequest(ApprovalDecision.Approved, approval.DecidedByEmail, approval.Comments), httpClientFactory, configuration, notificationSettings, db, record);
        await RequirementWorkflowSync.CompleteIfReadyAsync(activity.RequirementId, httpClientFactory);
    }
    else
    {
        await NotificationDelivery.SafeSendAsync(record, notificationSettings, httpClientFactory, configuration, db);
    }

    return Results.Ok(activity);
});

app.MapPost("/activities/{id:guid}/approvals", async (Guid id, ApproveActivityRequest request, ActivitiesDbContext db, IHttpClientFactory httpClientFactory, IConfiguration configuration, HttpContext httpContext) =>
{
    var activity = await db.Activities.FindAsync(id);
    if (activity is null || activity.IsDeleted) return Results.NotFound();

    var previousStatus = activity.Status.ToString();
    activity.Decide(request.Decision);
    CatalogReferenceWriter.UpsertStatusReference(db, activity.Status);
    db.AuditEvents.Add(ActivityAuditEvent.Changed(activity.Id, activity.RequirementId, previousStatus, activity.Status.ToString(), $"Producto {request.Decision}", request.ApprovedBy, AuditJson.Build("Productos", $"Decisión {request.Decision}", request.ApprovedBy, request)));
    await db.SaveChangesAsync();

    var client = httpClientFactory.CreateClient("evidence");
    await client.PostAsJsonAsync("/approvals", new CreateApprovalRequest(id, request.Decision, request.ApprovedBy, request.Comments));

    var notificationSettings = await db.NotificationSettings.Where(x => x.IsActive).OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt).FirstOrDefaultAsync();
    var recipientEmail = await NotificationRecipientResolver.ResolveAsync(activity.ProductResponsible, httpContext, httpClientFactory);
    var approved = request.Decision == ApprovalDecision.Approved;

    var notificationAction = approved ? "Producto aprobado" : "Producto rechazado";
    var record = NotificationRecord.Create(
        approved ? "ProductApproved" : "ProductRejected",
        notificationAction,
        $"El producto {activity.ProductId} fue {(approved ? "aprobado" : "rechazado y devuelto a proceso")}. {request.Comments}".Trim(),
        recipientEmail,
        request.ApprovedBy,
        activity.RequirementId,
        activity.Id,
        AuditJson.Build("Notificaciones", notificationAction, request.ApprovedBy, new { activity.Id, activity.ProductId, activity.ProductResponsible, recipientEmail, request.Comments }));
    db.NotificationRecords.Add(record);
    await db.SaveChangesAsync();

    if (approved)
    {
        await ProductNotification.SendApprovedAsync(activity, request, httpClientFactory, configuration, notificationSettings, db, record);
        await RequirementWorkflowSync.CompleteIfReadyAsync(activity.RequirementId, httpClientFactory);
    }
    else
        await NotificationDelivery.SendAsync(record, notificationSettings, httpClientFactory, configuration, db);

    return Results.Ok(activity);
});

app.MapGet("/notification-settings", async (ActivitiesDbContext db) =>
{
    var settings = await db.NotificationSettings.OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt).ToListAsync();
    return settings.Select(NotificationSettingsDto.From).ToList();
});

app.MapPost("/notification-settings", async (UpsertNotificationSettingsRequest request, ActivitiesDbContext db) =>
{
    var settings = new NotificationSettings();
    settings.Apply(request);
    db.NotificationSettings.Add(settings);
    await db.SaveChangesAsync();
    return Results.Created($"/notification-settings/{settings.Id}", settings);
});

app.MapPut("/notification-settings/{id:guid}", async (Guid id, UpsertNotificationSettingsRequest request, ActivitiesDbContext db) =>
{
    var settings = await db.NotificationSettings.FindAsync(id);
    if (settings is null) return Results.NotFound();

    settings.Apply(request);
    await db.SaveChangesAsync();
    return Results.Ok(settings);
});

app.MapDelete("/notification-settings/{id:guid}", async (Guid id, ActivitiesDbContext db) =>
{
    var settings = await db.NotificationSettings.FindAsync(id);
    if (settings is null) return Results.NotFound();

    settings.IsActive = false;
    settings.UpdatedAt = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.MapGet("/notification-records", async (ActivitiesDbContext db) =>
    await db.NotificationRecords.OrderByDescending(x => x.CreatedAt).ToListAsync());

app.MapGet("/notification-records/by-user", async (string email, string? name, ActivitiesDbContext db) =>
{
    var normalized = email.Trim().ToLowerInvariant();
    var normalizedName = name?.Trim().ToLowerInvariant() ?? string.Empty;
    return await db.NotificationRecords
        .Where(x => x.RecipientEmail == normalized || (normalizedName != "" && x.RecipientEmail == normalizedName) || x.RecipientEmail == "todos")
        .OrderByDescending(x => x.CreatedAt)
        .ToListAsync();
});

app.MapGet("/notification-records/unread-count", async (string email, string? name, ActivitiesDbContext db) =>
{
    var normalized = email.Trim().ToLowerInvariant();
    var normalizedName = name?.Trim().ToLowerInvariant() ?? string.Empty;
    var total = await db.NotificationRecords.CountAsync(x => !x.IsAcknowledged && (x.RecipientEmail == normalized || (normalizedName != "" && x.RecipientEmail == normalizedName) || x.RecipientEmail == "todos"));
    return Results.Ok(new NotificationCountResponse(total));
});

app.MapPatch("/notification-records/{id:guid}/ack", async (Guid id, AcknowledgeNotificationRequest request, ActivitiesDbContext db) =>
{
    var record = await db.NotificationRecords.FindAsync(id);
    if (record is null) return Results.NotFound();
    record.Acknowledge(request.AcknowledgedBy);
    await db.SaveChangesAsync();
    return Results.Ok(record);
});

app.MapPost("/notification-records/system", async (SystemNotificationRequest request, ActivitiesDbContext db, IHttpClientFactory httpClientFactory, IConfiguration configuration) =>
{
    var settings = await db.NotificationSettings.Where(x => x.IsActive).OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt).FirstOrDefaultAsync();
    var record = NotificationRecord.Create(request.EventType, request.Title, request.Message, request.RecipientEmail, request.CreatedBy, request.RequirementId, request.ActivityId, request.PayloadJson);
    db.NotificationRecords.Add(record);
    await db.SaveChangesAsync();
    await NotificationDelivery.SendAsync(record, settings, httpClientFactory, configuration, db, request.Html);
    return Results.Created($"/notification-records/{record.Id}", record);
});

app.Run();

public sealed record CreateActivityRequest(
    Guid RequirementId,
    string ProductId,
    Guid RequirementTypeId,
    string RequirementType,
    string StrategicObjective,
    Guid TargetAudienceId,
    string TargetAudience,
    Guid ProductTypeId,
    string ProductType,
    Guid DiffusionChannelId,
    string DiffusionChannel,
    Guid MainKpiId,
    string MainKpi,
      string ProductResponsible,
      DateOnly? ProductDeliveryDate,
      string Observations,
      Guid? StatusId = null);
public sealed record CreateAgendaItemRequest(Guid ActivityId, string TechnicianName, string TechnicianEmail, DateTimeOffset StartAt, DateTimeOffset EndAt, string Title, string Notes, string CreatedBy);
public sealed record NextProductIdResponse(string ProductId);
public sealed record ApproveActivityRequest(ApprovalDecision Decision, string ApprovedBy, string Comments);
public sealed record CreateApprovalRequest(Guid ActivityId, ApprovalDecision Decision, string ApprovedBy, string Comments);
public sealed record ActivitySummary(int Total, int Approved, int Pending);
public sealed record CompletedRequirementSummary(Guid RequirementId, int Total, int Approved);
public sealed record AssignmentCountResponse(int Count);
public sealed record MetricSlice(string Name, int Count, decimal Percentage);
public sealed record StageMetric(string Stage, decimal AverageHours, int Events);
public sealed record ProductMetricsResponse(
    int TotalProducts,
    int ApprovedProducts,
    int ActiveProducts,
    decimal AverageCycleDays,
    IReadOnlyList<MetricSlice> ByStatus,
    IReadOnlyList<MetricSlice> WorkloadByResponsible,
    IReadOnlyList<MetricSlice> ByProductType,
    IReadOnlyList<MetricSlice> ByDiffusionChannel,
    IReadOnlyList<MetricSlice> ByMainKpi,
    IReadOnlyList<MetricSlice> ByTargetAudience,
    IReadOnlyList<StageMetric> AverageHoursByStage);
public sealed record SubmitApprovalRequest(string? ApproverEmail, string? RequesterEmail, string? Comments, string? Source);
public sealed record SubmitApprovalRequestToEvidence(Guid ActivityId, string ApproverEmail, string RequesterEmail, string? Comments, string? Source, string? NotificationStatus, string? PowerAutomateRunId);
public sealed record SubmitApprovalResponse(Guid ActivityId, Guid ApprovalId, string ProductStatus, string NotificationStatus);
public sealed record ApprovalDecisionCallbackRequest(string Decision, string DecidedByEmail, string? Comments, string? Source, string? CorrelationId);
public sealed record ActivityApprovalDto(
    Guid Id,
    Guid ActivityId,
    string Decision,
    string ApprovedBy,
    string Comments,
    DateTimeOffset CreatedAt,
    string ApproverEmail,
    string RequesterEmail,
    string Status,
    DateTimeOffset SubmittedAt,
    DateTimeOffset? DecidedAt,
    string DecisionSource,
    string CorrelationId,
    string PowerAutomateRunId,
    string NotificationStatus,
    string DecidedByEmail);
public sealed record UpsertNotificationSettingsRequest(
    string Name,
    bool EmailEnabled,
    string EmailTo,
    bool TeamsEnabled,
    string TeamsChannel,
    string PowerAutomateWebhookUrl,
    string? EmailPowerAutomateWebhookUrl,
    string? TeamsPowerAutomateWebhookUrl,
    string HtmlTemplate,
    string? EmailHtmlTemplate,
    string? TeamsHtmlTemplate,
    bool IsActive);
public sealed record NotificationSettingsDto(Guid Id, string Name, bool EmailEnabled, string EmailTo, bool TeamsEnabled, string TeamsChannel, string PowerAutomateWebhookUrl, string EmailPowerAutomateWebhookUrl, string TeamsPowerAutomateWebhookUrl, string HtmlTemplate, string EmailHtmlTemplate, string TeamsHtmlTemplate, bool IsActive, DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt)
{
    public static NotificationSettingsDto From(NotificationSettings settings) => new(
        settings.Id,
        settings.Name,
        settings.EmailEnabled,
        settings.EmailTo,
        settings.TeamsEnabled,
        settings.TeamsChannel,
        string.IsNullOrWhiteSpace(settings.PowerAutomateWebhookUrl) ? string.Empty : "Configurado",
        string.IsNullOrWhiteSpace(settings.EmailPowerAutomateWebhookUrl) ? string.Empty : "Configurado",
        string.IsNullOrWhiteSpace(settings.TeamsPowerAutomateWebhookUrl) ? string.Empty : "Configurado",
        settings.HtmlTemplate,
        settings.EmailHtmlTemplate,
        settings.TeamsHtmlTemplate,
        settings.IsActive,
        settings.CreatedAt,
        settings.UpdatedAt);
}
public sealed record SystemNotificationRequest(string EventType, string Title, string Message, string RecipientEmail, string CreatedBy, Guid? RequirementId, Guid? ActivityId, string PayloadJson, string? Html = null);
public sealed record NotificationCountResponse(int Count);
public sealed record AcknowledgeNotificationRequest(string AcknowledgedBy);
public sealed record EvidenceItemDto(Guid Id, Guid ActivityId, string FileName, string StorageUrl, string UploadedBy);
public sealed record NotificationUserDto(string Name, string Email, bool IsActive);

public sealed class TechnicalAgendaItem : Entity
{
    public Guid ActivityId { get; private set; }
    public Guid RequirementId { get; private set; }
    public string ProductId { get; private set; } = string.Empty;
    public string ProductType { get; private set; } = string.Empty;
    public string TechnicianName { get; private set; } = string.Empty;
    public string TechnicianEmail { get; private set; } = string.Empty;
    public DateTimeOffset StartAt { get; private set; }
    public DateTimeOffset EndAt { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Notes { get; private set; } = string.Empty;

    public static TechnicalAgendaItem Create(CreateAgendaItemRequest request, Guid requirementId, string productId, string productType)
    {
        var item = new TechnicalAgendaItem();
        item.Update(request, requirementId, productId, productType);
        return item;
    }

    public void Update(CreateAgendaItemRequest request, Guid requirementId, string productId, string productType)
    {
        if (request.ActivityId == Guid.Empty) throw new ArgumentException("Producto requerido.", nameof(request.ActivityId));
        if (string.IsNullOrWhiteSpace(request.TechnicianEmail)) throw new ArgumentException("Técnico requerido.", nameof(request.TechnicianEmail));
        if (request.EndAt <= request.StartAt) throw new ArgumentException("La fecha y hora de fin debe ser mayor al inicio.", nameof(request.EndAt));

        ActivityId = request.ActivityId;
        RequirementId = requirementId;
        ProductId = productId.Trim();
        ProductType = productType.Trim();
        TechnicianName = request.TechnicianName.Trim();
        TechnicianEmail = request.TechnicianEmail.Trim().ToLowerInvariant();
        StartAt = request.StartAt;
        EndAt = request.EndAt;
        Title = string.IsNullOrWhiteSpace(request.Title) ? ProductType : request.Title.Trim();
        Notes = (request.Notes ?? string.Empty).Trim();
        Touch();
    }

    public void Delete(string deletedBy) => DeleteLogically(deletedBy);
}

public static class NotificationRecipientResolver
{
    public static async Task<string> ResolveAsync(string responsible, HttpContext httpContext, IHttpClientFactory httpClientFactory)
    {
        var normalized = responsible.Trim();
        if (normalized.Contains('@')) return normalized.ToLowerInvariant();

        try
        {
            var client = httpClientFactory.CreateClient("identity");
            var authorization = httpContext.Request.Headers.Authorization.ToString();
            if (!string.IsNullOrWhiteSpace(authorization))
                client.DefaultRequestHeaders.Authorization = AuthenticationHeaderValue.Parse(authorization);

            var users = await client.GetFromJsonAsync<List<NotificationUserDto>>("/users/technicians") ?? [];
            var user = users.FirstOrDefault(x => x.IsActive && x.Name.Equals(normalized, StringComparison.OrdinalIgnoreCase));
            if (!string.IsNullOrWhiteSpace(user?.Email)) return user.Email.Trim().ToLowerInvariant();
        }
        catch
        {
            // La decisión no debe fallar si Identity está temporalmente indisponible.
        }

        return normalized.ToLowerInvariant();
    }
}

public static class ApprovalRecipient
{
    public static string ResolveApprover(string? requestedApprover, NotificationSettings? settings, IConfiguration configuration)
    {
        if (!string.IsNullOrWhiteSpace(requestedApprover)) return requestedApprover.Trim().ToLowerInvariant();
        var settingsEmail = settings?.EmailTo
            .Split([',', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault(email => email.Contains('@'));
        if (!string.IsNullOrWhiteSpace(settingsEmail)) return settingsEmail.Trim().ToLowerInvariant();
        var configuredEmail = configuration["Notifications:DefaultApproverEmail"] ?? configuration["Approvals:DefaultApproverEmail"];
        return string.IsNullOrWhiteSpace(configuredEmail) ? string.Empty : configuredEmail.Trim().ToLowerInvariant();
    }
}

public static class ApprovalCallbackSecurity
{
    public static bool RequiresCallbackKey(string? source) =>
        source is not null && source.Equals("powerautomate", StringComparison.OrdinalIgnoreCase);
}

public static class ProductNotification
{
    public static async Task SendApprovedAsync(
        TechnicalActivity activity,
        ApproveActivityRequest approval,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        NotificationSettings? settings,
        ActivitiesDbContext db,
        NotificationRecord record)
    {
        var evidence = await httpClientFactory.CreateClient("evidence").GetFromJsonAsync<List<EvidenceItemDto>>($"/evidence?activityId={activity.Id}") ?? [];

        var baseHtml = NotificationTemplate.Render(settings?.HtmlTemplate, activity, approval);
        var metadataHtml = $"{baseHtml}<p><strong>Adjuntos:</strong> {evidence.Count}</p>";
        if (settings?.EmailEnabled != false)
            await NotificationDelivery.SendChannelAsync("Email", NotificationWebhookResolver.Email(settings, configuration), record, settings, httpClientFactory, db, metadataHtml);
        if (settings?.TeamsEnabled != false)
            await NotificationDelivery.SendChannelAsync("Teams", NotificationWebhookResolver.Teams(settings, configuration), record, settings, httpClientFactory, db, metadataHtml);
    }
}

public static class RequirementWorkflowSync
{
    public static Task StartAnalysisAsync(Guid requirementId, IHttpClientFactory httpClientFactory) =>
        PatchRequirementAsync(requirementId, "analysis", httpClientFactory);

    public static Task StartExecutionAsync(Guid requirementId, IHttpClientFactory httpClientFactory) =>
        PatchRequirementAsync(requirementId, "execution", httpClientFactory);

    public static Task CompleteIfReadyAsync(Guid requirementId, IHttpClientFactory httpClientFactory) =>
        PatchRequirementAsync(requirementId, "complete", httpClientFactory);

    private static async Task PatchRequirementAsync(Guid requirementId, string action, IHttpClientFactory httpClientFactory)
    {
        try
        {
            var client = httpClientFactory.CreateClient("requirements");
            await client.PatchAsync($"/requirements/{requirementId}/{action}", null);
        }
        catch
        {
            // The product workflow should not fail when requirement synchronization is temporarily unavailable.
        }
    }
}

public sealed class ActivitiesDbContext(DbContextOptions<ActivitiesDbContext> options) : DbContext(options)
{
    public DbSet<TechnicalActivity> Activities => Set<TechnicalActivity>();
    public DbSet<TechnicalAgendaItem> AgendaItems => Set<TechnicalAgendaItem>();
    public DbSet<CatalogReference> CatalogReferences => Set<CatalogReference>();
    public DbSet<NotificationSettings> NotificationSettings => Set<NotificationSettings>();
    public DbSet<NotificationRecord> NotificationRecords => Set<NotificationRecord>();
    public DbSet<NotificationDeliveryAttempt> NotificationDeliveryAttempts => Set<NotificationDeliveryAttempt>();
    public DbSet<ActivityAuditEvent> AuditEvents => Set<ActivityAuditEvent>();

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

        modelBuilder.Entity<TechnicalActivity>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ProductId).HasMaxLength(80).IsRequired();
            entity.Property(x => x.RequirementType).HasMaxLength(120).IsRequired();
            entity.Property(x => x.StrategicObjective).HasMaxLength(600);
            entity.Property(x => x.TargetAudience).HasMaxLength(240);
            entity.Property(x => x.ProductType).HasMaxLength(120);
            entity.Property(x => x.DiffusionChannel).HasMaxLength(120);
            entity.Property(x => x.MainKpi).HasMaxLength(240);
            entity.Property(x => x.ProductResponsible).HasMaxLength(160).IsRequired();
            entity.Property(x => x.Observations).HasMaxLength(2000);
            entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            entity.Property(x => x.DeletedBy).HasMaxLength(160);
            entity.HasIndex(x => x.RequirementId);
            entity.HasIndex(x => x.ProductId).IsUnique().HasFilter("[IsDeleted] = 0");
            entity.HasOne<CatalogReference>().WithMany().HasForeignKey(x => x.RequirementTypeId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<CatalogReference>().WithMany().HasForeignKey(x => x.TargetAudienceId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<CatalogReference>().WithMany().HasForeignKey(x => x.ProductTypeId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<CatalogReference>().WithMany().HasForeignKey(x => x.DiffusionChannelId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<CatalogReference>().WithMany().HasForeignKey(x => x.MainKpiId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<CatalogReference>().WithMany().HasForeignKey(x => x.StatusId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TechnicalAgendaItem>(entity =>
        {
            entity.ToTable("TechnicalAgendaItems");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ProductId).HasMaxLength(80).IsRequired();
            entity.Property(x => x.ProductType).HasMaxLength(120).IsRequired();
            entity.Property(x => x.TechnicianName).HasMaxLength(160).IsRequired();
            entity.Property(x => x.TechnicianEmail).HasMaxLength(180).IsRequired();
            entity.Property(x => x.Title).HasMaxLength(240).IsRequired();
            entity.Property(x => x.Notes).HasMaxLength(2000);
            entity.Property(x => x.DeletedBy).HasMaxLength(160);
            entity.HasIndex(x => x.ActivityId);
            entity.HasIndex(x => x.TechnicianEmail);
            entity.HasIndex(x => x.StartAt);
        });

        modelBuilder.Entity<ActivityAuditEvent>(entity =>
        {
            entity.ToTable("ActivityAuditEvents");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.FromStatus).HasMaxLength(32);
            entity.Property(x => x.ToStatus).HasMaxLength(32).IsRequired();
            entity.Property(x => x.Action).HasMaxLength(180).IsRequired();
            entity.Property(x => x.PerformedBy).HasMaxLength(160).IsRequired();
            entity.Property(x => x.Comments).HasColumnType("nvarchar(max)");
            entity.HasIndex(x => x.ActivityId);
            entity.HasIndex(x => x.RequirementId);
            entity.HasIndex(x => x.OccurredAt);
        });

        modelBuilder.Entity<NotificationSettings>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.EmailTo).HasMaxLength(500);
            entity.Property(x => x.TeamsChannel).HasMaxLength(300);
            entity.Property(x => x.PowerAutomateWebhookUrl).HasMaxLength(1200);
            entity.Property(x => x.EmailPowerAutomateWebhookUrl).HasMaxLength(1200);
            entity.Property(x => x.TeamsPowerAutomateWebhookUrl).HasMaxLength(1200);
            entity.Property(x => x.HtmlTemplate).HasColumnType("nvarchar(max)");
            entity.Property(x => x.EmailHtmlTemplate).HasColumnType("nvarchar(max)");
            entity.Property(x => x.TeamsHtmlTemplate).HasColumnType("nvarchar(max)");
        });

        modelBuilder.Entity<NotificationRecord>(entity =>
        {
            entity.ToTable("NotificationRecords");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.EventType).HasMaxLength(80).IsRequired();
            entity.Property(x => x.Title).HasMaxLength(180).IsRequired();
            entity.Property(x => x.Message).HasMaxLength(1000).IsRequired();
            entity.Property(x => x.RecipientEmail).HasMaxLength(180).IsRequired();
            entity.Property(x => x.CreatedBy).HasMaxLength(160).IsRequired();
            entity.Property(x => x.AcknowledgedBy).HasMaxLength(160);
            entity.Property(x => x.PayloadJson).HasColumnType("nvarchar(max)");
            entity.HasIndex(x => x.RecipientEmail);
            entity.HasIndex(x => x.CreatedAt);
        });

        modelBuilder.Entity<NotificationDeliveryAttempt>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Channel).HasMaxLength(40).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(40).IsRequired();
            entity.Property(x => x.Error).HasMaxLength(600);
            entity.Property(x => x.IdempotencyKey).HasMaxLength(160).IsRequired();
            entity.HasIndex(x => x.NotificationRecordId);
            entity.HasIndex(x => x.IdempotencyKey).IsUnique();
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

public sealed class ActivityAuditEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ActivityId { get; set; }
    public Guid RequirementId { get; set; }
    public string? FromStatus { get; set; }
    public string ToStatus { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string PerformedBy { get; set; } = "Sistema";
    public string Comments { get; set; } = string.Empty;
    public DateTimeOffset OccurredAt { get; set; } = DateTimeOffset.UtcNow;

    public static ActivityAuditEvent Created(Guid activityId, Guid requirementId, string? fromStatus, string toStatus, string action, string performedBy, string comments = "") =>
        new() { ActivityId = activityId, RequirementId = requirementId, FromStatus = fromStatus, ToStatus = toStatus, Action = action, PerformedBy = performedBy, Comments = comments };

    public static ActivityAuditEvent Changed(Guid activityId, Guid requirementId, string? fromStatus, string toStatus, string action, string performedBy, string comments = "") =>
        new() { ActivityId = activityId, RequirementId = requirementId, FromStatus = fromStatus, ToStatus = toStatus, Action = action, PerformedBy = performedBy, Comments = comments };
}

public static class AssignmentKeys
{
    public static string[] From(string email, string? name) =>
        new[] { email, name ?? string.Empty }
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value.Trim().ToLowerInvariant())
            .Distinct()
            .ToArray();
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

public static class CatalogReferenceWriter
{
    public static void UpsertReferences(ActivitiesDbContext db, CreateActivityRequest request)
    {
        UpsertReference(db, request.RequirementTypeId, "TipoRequerimiento", request.RequirementType, request.RequirementType);
        UpsertReference(db, request.TargetAudienceId, "PublicoObjetivo", request.TargetAudience, request.TargetAudience);
        UpsertReference(db, request.ProductTypeId, "TipoProducto", request.ProductType, request.ProductType);
        UpsertReference(db, request.DiffusionChannelId, "CanalDifusion", request.DiffusionChannel, request.DiffusionChannel);
        UpsertReference(db, request.MainKpiId, "KpiPrincipal", request.MainKpi, request.MainKpi);
        UpsertReference(db, request.StatusId ?? WorkflowCatalogIds.ActivityTodo, "EstadoProducto", "Todo", "Por hacer");
    }

    public static void UpsertStatusReference(ActivitiesDbContext db, ActivityStatus status) =>
        UpsertReference(db, WorkflowCatalogIds.ForActivity(status), "EstadoProducto", status.ToString(), StatusName(status));

    private static void UpsertReference(ActivitiesDbContext db, Guid id, string type, string code, string name)
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

    private static string StatusName(ActivityStatus status) => status switch
    {
        ActivityStatus.Todo => "Por hacer",
        ActivityStatus.InProgress => "En progreso",
        ActivityStatus.EvidenceAttached => "Evidencia adjunta",
        ActivityStatus.PendingApproval => "Pendiente de aprobación",
        ActivityStatus.Approved => "Aprobado",
        ActivityStatus.Rejected => "Rechazado",
        _ => status.ToString()
    };
}

public static class ProductMetricsMath
{
    public static IReadOnlyList<MetricSlice> Slice<TKey>(IEnumerable<IGrouping<TKey, TechnicalActivity>> groups, int total) =>
        groups
            .Select(group => new MetricSlice(group.Key?.ToString() ?? "Sin dato", group.Count(), total == 0 ? 0 : Math.Round(group.Count() * 100m / total, 2)))
            .OrderByDescending(x => x.Count)
            .ToList();

    public static decimal AverageDays(IEnumerable<double> values)
    {
        var list = values.ToList();
        return list.Count == 0 ? 0 : Math.Round((decimal)list.Average(), 2);
    }

    public static IReadOnlyList<StageMetric> StageTimes(IReadOnlyList<ActivityAuditEvent> audits)
    {
        var transitions = audits
            .GroupBy(x => x.ActivityId)
            .SelectMany(group => group.OrderBy(x => x.OccurredAt).Zip(group.OrderBy(x => x.OccurredAt).Skip(1), (from, to) => new
            {
                Stage = from.ToStatus,
                Hours = (to.OccurredAt - from.OccurredAt).TotalHours
            }))
            .GroupBy(x => x.Stage)
            .Select(group => new StageMetric(group.Key, Math.Round((decimal)group.Average(x => x.Hours), 2), group.Count()))
            .OrderBy(x => x.Stage)
            .ToList();
        return transitions;
    }
}

public static class ProductIdSequence
{
    public static string Next(IEnumerable<string> productIds)
    {
        var max = productIds
            .Select(Parse)
            .DefaultIfEmpty(0)
            .Max();
        return $"PROD-{max + 1:0000}";
    }

    private static int Parse(string value)
    {
        if (string.IsNullOrWhiteSpace(value) || !value.StartsWith("PROD-", StringComparison.OrdinalIgnoreCase)) return 0;
        return int.TryParse(value[5..], out var number) ? number : 0;
    }
}

public sealed class NotificationSettings
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "Flujo principal";
    public bool EmailEnabled { get; set; } = true;
    public string EmailTo { get; set; } = string.Empty;
    public bool TeamsEnabled { get; set; } = true;
    public string TeamsChannel { get; set; } = string.Empty;
    public string PowerAutomateWebhookUrl { get; set; } = string.Empty;
    public string EmailPowerAutomateWebhookUrl { get; set; } = string.Empty;
    public string TeamsPowerAutomateWebhookUrl { get; set; } = string.Empty;
    public string HtmlTemplate { get; set; } = NotificationTemplate.Default;
    public string EmailHtmlTemplate { get; set; } = NotificationTemplate.DefaultEmail;
    public string TeamsHtmlTemplate { get; set; } = NotificationTemplate.DefaultTeams;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }

    public void Apply(UpsertNotificationSettingsRequest request)
    {
        Name = request.Name.Trim();
        EmailEnabled = request.EmailEnabled;
        EmailTo = request.EmailTo.Trim();
        TeamsEnabled = request.TeamsEnabled;
        TeamsChannel = request.TeamsChannel.Trim();
        if (!string.IsNullOrWhiteSpace(request.PowerAutomateWebhookUrl) && !request.PowerAutomateWebhookUrl.Equals("Configurado", StringComparison.OrdinalIgnoreCase))
            PowerAutomateWebhookUrl = request.PowerAutomateWebhookUrl.Trim();
        if (!string.IsNullOrWhiteSpace(request.EmailPowerAutomateWebhookUrl) && !request.EmailPowerAutomateWebhookUrl.Equals("Configurado", StringComparison.OrdinalIgnoreCase))
            EmailPowerAutomateWebhookUrl = request.EmailPowerAutomateWebhookUrl.Trim();
        if (!string.IsNullOrWhiteSpace(request.TeamsPowerAutomateWebhookUrl) && !request.TeamsPowerAutomateWebhookUrl.Equals("Configurado", StringComparison.OrdinalIgnoreCase))
            TeamsPowerAutomateWebhookUrl = request.TeamsPowerAutomateWebhookUrl.Trim();
        HtmlTemplate = string.IsNullOrWhiteSpace(request.HtmlTemplate) ? NotificationTemplate.Default : request.HtmlTemplate.Trim();
        EmailHtmlTemplate = string.IsNullOrWhiteSpace(request.EmailHtmlTemplate) ? NotificationTemplate.DefaultEmail : request.EmailHtmlTemplate.Trim();
        TeamsHtmlTemplate = string.IsNullOrWhiteSpace(request.TeamsHtmlTemplate) ? NotificationTemplate.DefaultTeams : request.TeamsHtmlTemplate.Trim();
        IsActive = request.IsActive;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}

public sealed class NotificationRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string EventType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string RecipientEmail { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = "Sistema";
    public Guid? RequirementId { get; set; }
    public Guid? ActivityId { get; set; }
    public string PayloadJson { get; set; } = string.Empty;
    public bool IsAcknowledged { get; set; }
    public string AcknowledgedBy { get; set; } = string.Empty;
    public DateTimeOffset? AcknowledgedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public static NotificationRecord Create(string eventType, string title, string message, string recipientEmail, string createdBy, Guid? requirementId, Guid? activityId, string payloadJson) =>
        new()
        {
            EventType = eventType.Trim(),
            Title = title.Trim(),
            Message = message.Trim(),
            RecipientEmail = string.IsNullOrWhiteSpace(recipientEmail) ? "todos" : recipientEmail.Trim().ToLowerInvariant(),
            CreatedBy = string.IsNullOrWhiteSpace(createdBy) ? "Sistema" : createdBy.Trim(),
            RequirementId = requirementId,
            ActivityId = activityId,
            PayloadJson = payloadJson
        };

    public void Acknowledge(string acknowledgedBy)
    {
        IsAcknowledged = true;
        AcknowledgedBy = string.IsNullOrWhiteSpace(acknowledgedBy) ? "Usuario" : acknowledgedBy.Trim();
        AcknowledgedAt = DateTimeOffset.UtcNow;
    }
}

public sealed class NotificationDeliveryAttempt
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid NotificationRecordId { get; set; }
    public Guid? RequirementId { get; set; }
    public Guid? ActivityId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string Channel { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
    public int Attempts { get; set; }
    public string Error { get; set; } = string.Empty;
    public string IdempotencyKey { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? SentAt { get; set; }
}

public interface IEmailNotificationSender
{
    Task SendAsync(NotificationRecord record, NotificationSettings? settings, IHttpClientFactory httpClientFactory, IConfiguration configuration, ActivitiesDbContext db, string html);
}

public interface ITeamsNotificationSender
{
    Task SendAsync(NotificationRecord record, NotificationSettings? settings, IHttpClientFactory httpClientFactory, IConfiguration configuration, ActivitiesDbContext db, string html);
}

public sealed class PowerAutomateEmailNotificationSender : IEmailNotificationSender
{
    public Task SendAsync(NotificationRecord record, NotificationSettings? settings, IHttpClientFactory httpClientFactory, IConfiguration configuration, ActivitiesDbContext db, string html) =>
        NotificationDelivery.SendChannelAsync("Email", NotificationWebhookResolver.Email(settings, configuration), record, settings, httpClientFactory, db, html);
}

public sealed class PowerAutomateTeamsNotificationSender : ITeamsNotificationSender
{
    public Task SendAsync(NotificationRecord record, NotificationSettings? settings, IHttpClientFactory httpClientFactory, IConfiguration configuration, ActivitiesDbContext db, string html) =>
        NotificationDelivery.SendChannelAsync("Teams", NotificationWebhookResolver.Teams(settings, configuration), record, settings, httpClientFactory, db, html);
}

public static class NotificationDelivery
{
    public static async Task SafeSendAsync(NotificationRecord record, NotificationSettings? settings, IHttpClientFactory httpClientFactory, IConfiguration configuration, ActivitiesDbContext db, string? customHtml = null)
    {
        try
        {
            await SendAsync(record, settings, httpClientFactory, configuration, db, customHtml);
        }
        catch
        {
            // La gestión interna no debe fallar si el canal externo está temporalmente indisponible.
        }
    }

    public static async Task SendAsync(NotificationRecord record, NotificationSettings? settings, IHttpClientFactory httpClientFactory, IConfiguration configuration, ActivitiesDbContext db, string? customHtml = null)
    {
        var html = string.IsNullOrWhiteSpace(customHtml) ? $"<h2>{System.Net.WebUtility.HtmlEncode(record.Title)}</h2><p>{System.Net.WebUtility.HtmlEncode(record.Message)}</p>" : customHtml;
        if (settings?.EmailEnabled != false)
            await new PowerAutomateEmailNotificationSender().SendAsync(record, settings, httpClientFactory, configuration, db, RenderGeneric(settings?.EmailHtmlTemplate, record, html));
        if (settings?.TeamsEnabled != false)
            await new PowerAutomateTeamsNotificationSender().SendAsync(record, settings, httpClientFactory, configuration, db, RenderGeneric(settings?.TeamsHtmlTemplate, record, html));
    }

    public static async Task SendChannelAsync(string channel, string? webhookUrl, NotificationRecord record, NotificationSettings? settings, IHttpClientFactory httpClientFactory, ActivitiesDbContext db, string html)
    {
        var idempotencyKey = $"{record.Id}:{channel}";
        if (await db.NotificationDeliveryAttempts.AnyAsync(x => x.IdempotencyKey == idempotencyKey)) return;
        var attempt = new NotificationDeliveryAttempt
        {
            NotificationRecordId = record.Id,
            RequirementId = record.RequirementId,
            ActivityId = record.ActivityId,
            EventType = record.EventType,
            Channel = channel,
            IdempotencyKey = idempotencyKey
        };
        db.NotificationDeliveryAttempts.Add(attempt);
        if (string.IsNullOrWhiteSpace(webhookUrl))
        {
            attempt.Status = "Skipped";
            attempt.Error = "Webhook no configurado.";
            await db.SaveChangesAsync();
            return;
        }

        try
        {
            attempt.Attempts++;
            var payload = new
            {
                eventType = record.EventType,
                channel,
                subject = record.Title,
                teamsTitle = record.Title,
                html,
                recipientEmail = record.RecipientEmail,
                teamsChannel = settings?.TeamsChannel,
                idempotencyKey,
                data = new { record.Id, record.RecipientEmail, record.RequirementId, record.ActivityId, record.PayloadJson }
            };
            await httpClientFactory.CreateClient("notifications").PostAsJsonAsync(webhookUrl, payload);
            attempt.Status = "Sent";
            attempt.SentAt = DateTimeOffset.UtcNow;
        }
        catch (Exception error)
        {
            attempt.Status = "Failed";
            attempt.Error = SanitizeError(error.Message);
        }
        await db.SaveChangesAsync();
    }

    private static string SanitizeError(string value) => value.Length <= 600 ? value : value[..600];
    private static string RenderGeneric(string? template, NotificationRecord record, string fallback) => string.IsNullOrWhiteSpace(template)
        ? fallback
        : template.Replace("{{subject}}", System.Net.WebUtility.HtmlEncode(record.Title))
            .Replace("{{message}}", System.Net.WebUtility.HtmlEncode(record.Message))
            .Replace("{{recipientEmail}}", System.Net.WebUtility.HtmlEncode(record.RecipientEmail));
}

public static class NotificationWebhookResolver
{
    public static string? Email(NotificationSettings? settings, IConfiguration configuration) =>
        FirstConfigured(settings?.EmailPowerAutomateWebhookUrl, configuration["Notifications:EmailWebhookUrl"], settings?.PowerAutomateWebhookUrl, configuration["Notifications:PowerAutomateWebhookUrl"]);

    public static string? Teams(NotificationSettings? settings, IConfiguration configuration) =>
        FirstConfigured(settings?.TeamsPowerAutomateWebhookUrl, configuration["Notifications:TeamsWebhookUrl"], settings?.PowerAutomateWebhookUrl, configuration["Notifications:PowerAutomateWebhookUrl"]);

    private static string? FirstConfigured(params string?[] values) => values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value) && !value.Equals("Configurado", StringComparison.OrdinalIgnoreCase));
}

public static class NotificationTemplate
{
    public const string DefaultEmail = """
        <h2>{{subject}}</h2>
        <p>{{message}}</p>
        <p>Revise la aplicación para consultar el detalle y los adjuntos internos.</p>
        """;

    public const string DefaultTeams = """
        <h2>{{subject}}</h2>
        <p>{{message}}</p>
        <p>Canal de coordinación de Marketing.</p>
        """;

    public const string Default = """
        <h2>Producto aprobado</h2>
        <table>
          <tr><td><strong>Id producto</strong></td><td>{{productId}}</td></tr>
          <tr><td><strong>Tipo producto</strong></td><td>{{productType}}</td></tr>
          <tr><td><strong>Tipo requerimiento</strong></td><td>{{requirementType}}</td></tr>
          <tr><td><strong>Responsable</strong></td><td>{{productResponsible}}</td></tr>
          <tr><td><strong>Canal difusión</strong></td><td>{{diffusionChannel}}</td></tr>
          <tr><td><strong>KPI principal</strong></td><td>{{mainKpi}}</td></tr>
          <tr><td><strong>Aprobado por</strong></td><td>{{approvedBy}}</td></tr>
          <tr><td><strong>Comentarios</strong></td><td>{{comments}}</td></tr>
        </table>
        """;

    public static string Render(string? template, TechnicalActivity activity, ApproveActivityRequest approval)
    {
        var html = string.IsNullOrWhiteSpace(template) ? Default : template;
        return html
            .Replace("{{productId}}", activity.ProductId)
            .Replace("{{productType}}", activity.ProductType)
            .Replace("{{requirementType}}", activity.RequirementType)
            .Replace("{{productResponsible}}", activity.ProductResponsible)
            .Replace("{{diffusionChannel}}", activity.DiffusionChannel)
            .Replace("{{mainKpi}}", activity.MainKpi)
            .Replace("{{approvedBy}}", approval.ApprovedBy)
            .Replace("{{comments}}", approval.Comments);
    }
}

public static class ActivitiesSchema
{
    public static async Task EnsureAsync(ActivitiesDbContext db)
    {
        var columns = new Dictionary<string, string>
        {
            ["ProductId"] = "nvarchar(80) NOT NULL DEFAULT('PROD-LEGACY')",
            ["RequirementTypeId"] = "uniqueidentifier NULL",
            ["RequirementType"] = "nvarchar(120) NOT NULL DEFAULT('General')",
            ["StrategicObjective"] = "nvarchar(600) NOT NULL DEFAULT('No definido')",
            ["TargetAudienceId"] = "uniqueidentifier NULL",
            ["TargetAudience"] = "nvarchar(240) NOT NULL DEFAULT('No definido')",
            ["ProductTypeId"] = "uniqueidentifier NULL",
            ["ProductType"] = "nvarchar(120) NOT NULL DEFAULT('General')",
            ["DiffusionChannelId"] = "uniqueidentifier NULL",
            ["DiffusionChannel"] = "nvarchar(120) NOT NULL DEFAULT('No definido')",
            ["MainKpiId"] = "uniqueidentifier NULL",
            ["MainKpi"] = "nvarchar(240) NOT NULL DEFAULT('No definido')",
            ["StatusId"] = "uniqueidentifier NULL",
            ["ProductResponsible"] = "nvarchar(160) NOT NULL DEFAULT('No definido')",
            ["ProductDeliveryDate"] = "date NULL",
            ["Observations"] = "nvarchar(2000) NOT NULL DEFAULT('')"
        };

        foreach (var column in columns)
        {
            var sql = $"""
                IF COL_LENGTH('Activities', '{column.Key}') IS NULL
                BEGIN
                    ALTER TABLE [Activities] ADD [{column.Key}] {column.Value}
                END
                """;
            await db.Database.ExecuteSqlRawAsync(sql);
        }

        await db.Database.ExecuteSqlRawAsync("""
            IF COL_LENGTH('Activities', 'Title') IS NOT NULL ALTER TABLE [Activities] ALTER COLUMN [Title] nvarchar(180) NULL;
            IF COL_LENGTH('Activities', 'Description') IS NOT NULL ALTER TABLE [Activities] ALTER COLUMN [Description] nvarchar(4000) NULL;
            IF COL_LENGTH('Activities', 'Assignee') IS NOT NULL ALTER TABLE [Activities] ALTER COLUMN [Assignee] nvarchar(120) NULL;
            IF COL_LENGTH('Activities', 'IsDeleted') IS NULL ALTER TABLE [Activities] ADD [IsDeleted] bit NOT NULL DEFAULT(0);
            IF COL_LENGTH('Activities', 'DeletedAt') IS NULL ALTER TABLE [Activities] ADD [DeletedAt] datetimeoffset NULL;
            IF COL_LENGTH('Activities', 'DeletedBy') IS NULL ALTER TABLE [Activities] ADD [DeletedBy] nvarchar(160) NOT NULL DEFAULT('');
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
                ('33333333-3333-3333-3333-333333333392', 'EstadoProducto', 'Todo', 'Por hacer'),
                ('33333333-3333-3333-3333-333333333398', 'EstadoProducto', 'InProgress', 'En progreso'),
                ('33333333-3333-3333-3333-333333333399', 'EstadoProducto', 'EvidenceAttached', 'Evidencia adjunta'),
                ('33333333-3333-3333-3333-3333333333a1', 'EstadoProducto', 'PendingApproval', 'Pendiente de aprobación'),
                ('33333333-3333-3333-3333-3333333333a2', 'EstadoProducto', 'Approved', 'Aprobado'),
                ('33333333-3333-3333-3333-3333333333a3', 'EstadoProducto', 'Rejected', 'Rechazado')
            ) AS source ([Id], [Type], [Code], [Name])
            ON target.[Id] = CONVERT(uniqueidentifier, source.[Id])
            WHEN MATCHED THEN UPDATE SET [Type] = source.[Type], [Code] = source.[Code], [Name] = source.[Name], [IsActive] = 1
            WHEN NOT MATCHED THEN INSERT ([Id], [Type], [Code], [Name], [IsActive], [CreatedAt])
                VALUES (CONVERT(uniqueidentifier, source.[Id]), source.[Type], source.[Code], source.[Name], 1, SYSDATETIMEOFFSET());
            """);

        await EnsureCatalogReferenceAsync(db, "RequirementTypeId", "TipoRequerimiento", "RequirementType");
        await EnsureCatalogReferenceAsync(db, "TargetAudienceId", "PublicoObjetivo", "TargetAudience");
        await EnsureCatalogReferenceAsync(db, "ProductTypeId", "TipoProducto", "ProductType");
        await EnsureCatalogReferenceAsync(db, "DiffusionChannelId", "CanalDifusion", "DiffusionChannel");
        await EnsureCatalogReferenceAsync(db, "MainKpiId", "KpiPrincipal", "MainKpi");

        await db.Database.ExecuteSqlRawAsync("""
            UPDATE [Activities]
            SET [Status] = 'InProgress',
                [StatusId] = '33333333-3333-3333-3333-333333333398'
            WHERE [Status] = 'Rejected'
            """);

        await db.Database.ExecuteSqlRawAsync("""
            UPDATE [Activities]
            SET [StatusId] = CASE [Status]
                WHEN 'Todo' THEN '33333333-3333-3333-3333-333333333392'
                WHEN 'InProgress' THEN '33333333-3333-3333-3333-333333333398'
                WHEN 'EvidenceAttached' THEN '33333333-3333-3333-3333-333333333399'
                WHEN 'PendingApproval' THEN '33333333-3333-3333-3333-3333333333a1'
                WHEN 'Approved' THEN '33333333-3333-3333-3333-3333333333a2'
                WHEN 'Rejected' THEN '33333333-3333-3333-3333-3333333333a3'
                ELSE '33333333-3333-3333-3333-333333333392'
            END
            WHERE [StatusId] IS NULL

            ALTER TABLE [Activities] ALTER COLUMN [RequirementTypeId] uniqueidentifier NOT NULL;
            ALTER TABLE [Activities] ALTER COLUMN [TargetAudienceId] uniqueidentifier NOT NULL;
            ALTER TABLE [Activities] ALTER COLUMN [ProductTypeId] uniqueidentifier NOT NULL;
            ALTER TABLE [Activities] ALTER COLUMN [DiffusionChannelId] uniqueidentifier NOT NULL;
            ALTER TABLE [Activities] ALTER COLUMN [MainKpiId] uniqueidentifier NOT NULL;
            ALTER TABLE [Activities] ALTER COLUMN [StatusId] uniqueidentifier NOT NULL;

            IF OBJECT_ID('FK_Activities_CatalogReferences_RequirementTypeId', 'F') IS NULL
                ALTER TABLE [Activities] ADD CONSTRAINT [FK_Activities_CatalogReferences_RequirementTypeId] FOREIGN KEY ([RequirementTypeId]) REFERENCES [CatalogReferences] ([Id]);
            IF OBJECT_ID('FK_Activities_CatalogReferences_TargetAudienceId', 'F') IS NULL
                ALTER TABLE [Activities] ADD CONSTRAINT [FK_Activities_CatalogReferences_TargetAudienceId] FOREIGN KEY ([TargetAudienceId]) REFERENCES [CatalogReferences] ([Id]);
            IF OBJECT_ID('FK_Activities_CatalogReferences_ProductTypeId', 'F') IS NULL
                ALTER TABLE [Activities] ADD CONSTRAINT [FK_Activities_CatalogReferences_ProductTypeId] FOREIGN KEY ([ProductTypeId]) REFERENCES [CatalogReferences] ([Id]);
            IF OBJECT_ID('FK_Activities_CatalogReferences_DiffusionChannelId', 'F') IS NULL
                ALTER TABLE [Activities] ADD CONSTRAINT [FK_Activities_CatalogReferences_DiffusionChannelId] FOREIGN KEY ([DiffusionChannelId]) REFERENCES [CatalogReferences] ([Id]);
            IF OBJECT_ID('FK_Activities_CatalogReferences_MainKpiId', 'F') IS NULL
                ALTER TABLE [Activities] ADD CONSTRAINT [FK_Activities_CatalogReferences_MainKpiId] FOREIGN KEY ([MainKpiId]) REFERENCES [CatalogReferences] ([Id]);
            IF OBJECT_ID('FK_Activities_CatalogReferences_StatusId', 'F') IS NULL
                ALTER TABLE [Activities] ADD CONSTRAINT [FK_Activities_CatalogReferences_StatusId] FOREIGN KEY ([StatusId]) REFERENCES [CatalogReferences] ([Id]);
            IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Activities_ProductId' AND object_id = OBJECT_ID('Activities') AND filter_definition IS NULL)
                DROP INDEX [IX_Activities_ProductId] ON [Activities];

            DECLARE @MaxProductNumber int = COALESCE((
                SELECT MAX(TRY_CONVERT(int, SUBSTRING([ProductId], 6, 30)))
                FROM [Activities]
                WHERE [ProductId] LIKE 'PROD-%'
            ), 0);

            ;WITH RankedProducts AS (
                SELECT [Id], [CreatedAt], ROW_NUMBER() OVER (PARTITION BY UPPER(LTRIM(RTRIM([ProductId]))) ORDER BY [CreatedAt], [Id]) AS DuplicateRank
                FROM [Activities]
                WHERE [IsDeleted] = 0
            ), Duplicates AS (
                SELECT [Id], ROW_NUMBER() OVER (ORDER BY [CreatedAt], [Id]) AS SequenceOffset
                FROM RankedProducts
                WHERE DuplicateRank > 1
            )
            UPDATE activity
            SET [ProductId] = CONCAT('PROD-', FORMAT(@MaxProductNumber + duplicate.SequenceOffset, '0000'))
            FROM [Activities] activity
            INNER JOIN Duplicates duplicate ON duplicate.[Id] = activity.[Id];

            IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Activities_ProductId' AND object_id = OBJECT_ID('Activities'))
                CREATE UNIQUE INDEX [IX_Activities_ProductId] ON [Activities] ([ProductId]) WHERE [IsDeleted] = 0;
            """);

        await db.Database.ExecuteSqlRawAsync("""
            IF OBJECT_ID('NotificationSettings', 'U') IS NULL
            BEGIN
                CREATE TABLE [NotificationSettings] (
                    [Id] uniqueidentifier NOT NULL,
                    [Name] nvarchar(120) NOT NULL,
                    [EmailEnabled] bit NOT NULL,
                    [EmailTo] nvarchar(500) NOT NULL,
                    [TeamsEnabled] bit NOT NULL,
                    [TeamsChannel] nvarchar(300) NOT NULL,
                    [PowerAutomateWebhookUrl] nvarchar(1200) NOT NULL,
                    [EmailPowerAutomateWebhookUrl] nvarchar(1200) NOT NULL DEFAULT(''),
                    [TeamsPowerAutomateWebhookUrl] nvarchar(1200) NOT NULL DEFAULT(''),
                    [HtmlTemplate] nvarchar(max) NOT NULL,
                    [EmailHtmlTemplate] nvarchar(max) NOT NULL DEFAULT('<h2>Notificación</h2><p>{{message}}</p>'),
                    [TeamsHtmlTemplate] nvarchar(max) NOT NULL DEFAULT('<h2>Notificación Teams</h2><p>{{message}}</p>'),
                    [IsActive] bit NOT NULL,
                    [CreatedAt] datetimeoffset NOT NULL,
                    [UpdatedAt] datetimeoffset NULL,
                    CONSTRAINT [PK_NotificationSettings] PRIMARY KEY ([Id])
                )
            END
            IF COL_LENGTH('NotificationSettings', 'HtmlTemplate') IS NULL
            BEGIN
                ALTER TABLE [NotificationSettings] ADD [HtmlTemplate] nvarchar(max) NOT NULL DEFAULT('<h2>Producto aprobado</h2><p>{{productId}}</p>')
            END
            IF COL_LENGTH('NotificationSettings', 'EmailPowerAutomateWebhookUrl') IS NULL
            BEGIN
                ALTER TABLE [NotificationSettings] ADD [EmailPowerAutomateWebhookUrl] nvarchar(1200) NOT NULL DEFAULT('')
            END
            IF COL_LENGTH('NotificationSettings', 'TeamsPowerAutomateWebhookUrl') IS NULL
            BEGIN
                ALTER TABLE [NotificationSettings] ADD [TeamsPowerAutomateWebhookUrl] nvarchar(1200) NOT NULL DEFAULT('')
            END
            IF COL_LENGTH('NotificationSettings', 'EmailHtmlTemplate') IS NULL
            BEGIN
                ALTER TABLE [NotificationSettings] ADD [EmailHtmlTemplate] nvarchar(max) NOT NULL DEFAULT('<h2>Notificación</h2><p>{{message}}</p>')
            END
            IF COL_LENGTH('NotificationSettings', 'TeamsHtmlTemplate') IS NULL
            BEGIN
                ALTER TABLE [NotificationSettings] ADD [TeamsHtmlTemplate] nvarchar(max) NOT NULL DEFAULT('<h2>Notificación Teams</h2><p>{{message}}</p>')
            END
            """);

        await db.Database.ExecuteSqlRawAsync("""
            IF OBJECT_ID('NotificationRecords', 'U') IS NULL
            BEGIN
                CREATE TABLE [NotificationRecords] (
                    [Id] uniqueidentifier NOT NULL,
                    [EventType] nvarchar(80) NOT NULL,
                    [Title] nvarchar(180) NOT NULL,
                    [Message] nvarchar(1000) NOT NULL,
                    [RecipientEmail] nvarchar(180) NOT NULL,
                    [CreatedBy] nvarchar(160) NOT NULL,
                    [RequirementId] uniqueidentifier NULL,
                    [ActivityId] uniqueidentifier NULL,
                    [PayloadJson] nvarchar(max) NOT NULL,
                    [IsAcknowledged] bit NOT NULL,
                    [AcknowledgedBy] nvarchar(160) NOT NULL,
                    [AcknowledgedAt] datetimeoffset NULL,
                    [CreatedAt] datetimeoffset NOT NULL,
                    CONSTRAINT [PK_NotificationRecords] PRIMARY KEY ([Id])
                )
                CREATE INDEX [IX_NotificationRecords_RecipientEmail] ON [NotificationRecords] ([RecipientEmail])
                CREATE INDEX [IX_NotificationRecords_CreatedAt] ON [NotificationRecords] ([CreatedAt])
            END
            """);

        await db.Database.ExecuteSqlRawAsync("""
            IF OBJECT_ID('NotificationDeliveryAttempts', 'U') IS NULL
            BEGIN
                CREATE TABLE [NotificationDeliveryAttempts] (
                    [Id] uniqueidentifier NOT NULL,
                    [NotificationRecordId] uniqueidentifier NOT NULL,
                    [RequirementId] uniqueidentifier NULL,
                    [ActivityId] uniqueidentifier NULL,
                    [EventType] nvarchar(max) NOT NULL,
                    [Channel] nvarchar(40) NOT NULL,
                    [Status] nvarchar(40) NOT NULL,
                    [Attempts] int NOT NULL,
                    [Error] nvarchar(600) NOT NULL,
                    [IdempotencyKey] nvarchar(160) NOT NULL,
                    [CreatedAt] datetimeoffset NOT NULL,
                    [SentAt] datetimeoffset NULL,
                    CONSTRAINT [PK_NotificationDeliveryAttempts] PRIMARY KEY ([Id])
                )
                CREATE UNIQUE INDEX [IX_NotificationDeliveryAttempts_IdempotencyKey] ON [NotificationDeliveryAttempts] ([IdempotencyKey])
                CREATE INDEX [IX_NotificationDeliveryAttempts_NotificationRecordId] ON [NotificationDeliveryAttempts] ([NotificationRecordId])
            END
            """);

        await db.Database.ExecuteSqlRawAsync("""
            IF OBJECT_ID('ActivityAuditEvents', 'U') IS NULL
            BEGIN
                CREATE TABLE [ActivityAuditEvents] (
                    [Id] uniqueidentifier NOT NULL,
                    [ActivityId] uniqueidentifier NOT NULL,
                    [RequirementId] uniqueidentifier NOT NULL,
                    [FromStatus] nvarchar(32) NULL,
                    [ToStatus] nvarchar(32) NOT NULL,
                    [Action] nvarchar(180) NOT NULL,
                    [PerformedBy] nvarchar(160) NOT NULL,
                    [Comments] nvarchar(max) NOT NULL,
                    [OccurredAt] datetimeoffset NOT NULL,
                    CONSTRAINT [PK_ActivityAuditEvents] PRIMARY KEY ([Id])
                )
                CREATE INDEX [IX_ActivityAuditEvents_ActivityId] ON [ActivityAuditEvents] ([ActivityId])
                CREATE INDEX [IX_ActivityAuditEvents_RequirementId] ON [ActivityAuditEvents] ([RequirementId])
                CREATE INDEX [IX_ActivityAuditEvents_OccurredAt] ON [ActivityAuditEvents] ([OccurredAt])
            END
            IF COL_LENGTH('ActivityAuditEvents', 'Comments') IS NOT NULL ALTER TABLE [ActivityAuditEvents] ALTER COLUMN [Comments] nvarchar(max) NOT NULL;
            """);

        await db.Database.ExecuteSqlRawAsync("""
            IF OBJECT_ID('TechnicalAgendaItems', 'U') IS NULL
            BEGIN
                CREATE TABLE [TechnicalAgendaItems] (
                    [Id] uniqueidentifier NOT NULL,
                    [ActivityId] uniqueidentifier NOT NULL,
                    [RequirementId] uniqueidentifier NOT NULL,
                    [ProductId] nvarchar(80) NOT NULL,
                    [ProductType] nvarchar(120) NOT NULL,
                    [TechnicianName] nvarchar(160) NOT NULL,
                    [TechnicianEmail] nvarchar(180) NOT NULL,
                    [StartAt] datetimeoffset NOT NULL,
                    [EndAt] datetimeoffset NOT NULL,
                    [Title] nvarchar(240) NOT NULL,
                    [Notes] nvarchar(2000) NOT NULL DEFAULT(''),
                    [CreatedAt] datetimeoffset NOT NULL,
                    [UpdatedAt] datetimeoffset NULL,
                    [IsDeleted] bit NOT NULL DEFAULT(0),
                    [DeletedAt] datetimeoffset NULL,
                    [DeletedBy] nvarchar(160) NOT NULL DEFAULT(''),
                    CONSTRAINT [PK_TechnicalAgendaItems] PRIMARY KEY ([Id])
                )
            END
            IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TechnicalAgendaItems_ActivityId' AND object_id = OBJECT_ID('TechnicalAgendaItems'))
                CREATE INDEX [IX_TechnicalAgendaItems_ActivityId] ON [TechnicalAgendaItems] ([ActivityId])
            IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TechnicalAgendaItems_TechnicianEmail' AND object_id = OBJECT_ID('TechnicalAgendaItems'))
                CREATE INDEX [IX_TechnicalAgendaItems_TechnicianEmail] ON [TechnicalAgendaItems] ([TechnicianEmail])
            IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TechnicalAgendaItems_StartAt' AND object_id = OBJECT_ID('TechnicalAgendaItems'))
                CREATE INDEX [IX_TechnicalAgendaItems_StartAt] ON [TechnicalAgendaItems] ([StartAt])
            """);
    }

    private static async Task EnsureCatalogReferenceAsync(ActivitiesDbContext db, string idColumn, string type, string nameColumn)
    {
        var sql = $"""
            IF EXISTS (SELECT 1 FROM [Activities] WHERE [{idColumn}] IS NULL)
            BEGIN
                INSERT INTO [CatalogReferences] ([Id], [Type], [Code], [Name], [IsActive], [CreatedAt])
                SELECT NEWID(), '{type}', LEFT([{nameColumn}], 80), [{nameColumn}], 1, SYSDATETIMEOFFSET()
                FROM [Activities] a
                WHERE [{idColumn}] IS NULL
                  AND NOT EXISTS (SELECT 1 FROM [CatalogReferences] c WHERE c.[Type] = '{type}' AND c.[Name] = a.[{nameColumn}])
                GROUP BY [{nameColumn}]

                UPDATE a
                SET [{idColumn}] = c.[Id]
                FROM [Activities] a
                INNER JOIN [CatalogReferences] c ON c.[Type] = '{type}' AND c.[Name] = a.[{nameColumn}]
                WHERE a.[{idColumn}] IS NULL
            END
            """;
        await db.Database.ExecuteSqlRawAsync(sql);
    }
}

public static class ActivitiesSeed
{
    public static async Task RunAsync(ActivitiesDbContext db)
    {
        if (await db.NotificationSettings.AnyAsync()) return;
        db.NotificationSettings.Add(new NotificationSettings { Name = "Power Automate principal" });
        await db.SaveChangesAsync();
    }
}
