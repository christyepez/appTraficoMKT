namespace BuildingBlocks;

public abstract class Entity
{
    public Guid Id { get; protected init; } = Guid.NewGuid();
    public DateTimeOffset CreatedAt { get; protected init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; protected set; }
    public bool IsDeleted { get; protected set; }
    public DateTimeOffset? DeletedAt { get; protected set; }
    public string DeletedBy { get; protected set; } = string.Empty;

    protected void Touch() => UpdatedAt = DateTimeOffset.UtcNow;

    protected void DeleteLogically(string deletedBy)
    {
        IsDeleted = true;
        DeletedAt = DateTimeOffset.UtcNow;
        DeletedBy = string.IsNullOrWhiteSpace(deletedBy) ? "Sistema" : deletedBy.Trim();
        Touch();
    }
}

public enum RequirementStatus
{
    Draft = 0,
    InAnalysis = 1,
    InExecution = 2,
    PendingApproval = 3,
    Completed = 4,
    Rejected = 5
}

public enum ActivityStatus
{
    Todo = 0,
    InProgress = 1,
    EvidenceAttached = 2,
    PendingApproval = 3,
    Approved = 4,
    Rejected = 5
}

public enum ApprovalDecision
{
    Pending = 0,
    Approved = 1,
    Rejected = 2
}

public static class WorkflowCatalogIds
{
    public static readonly Guid RequirementDraft = Guid.Parse("33333333-3333-3333-3333-333333333391");
    public static readonly Guid RequirementInAnalysis = Guid.Parse("33333333-3333-3333-3333-333333333393");
    public static readonly Guid RequirementInExecution = Guid.Parse("33333333-3333-3333-3333-333333333394");
    public static readonly Guid RequirementPendingApproval = Guid.Parse("33333333-3333-3333-3333-333333333395");
    public static readonly Guid RequirementCompleted = Guid.Parse("33333333-3333-3333-3333-333333333396");
    public static readonly Guid RequirementRejected = Guid.Parse("33333333-3333-3333-3333-333333333397");

    public static readonly Guid ActivityTodo = Guid.Parse("33333333-3333-3333-3333-333333333392");
    public static readonly Guid ActivityInProgress = Guid.Parse("33333333-3333-3333-3333-333333333398");
    public static readonly Guid ActivityEvidenceAttached = Guid.Parse("33333333-3333-3333-3333-333333333399");
    public static readonly Guid ActivityPendingApproval = Guid.Parse("33333333-3333-3333-3333-3333333333a1");
    public static readonly Guid ActivityApproved = Guid.Parse("33333333-3333-3333-3333-3333333333a2");
    public static readonly Guid ActivityRejected = Guid.Parse("33333333-3333-3333-3333-3333333333a3");

    public static Guid ForRequirement(RequirementStatus status) => status switch
    {
        RequirementStatus.Draft => RequirementDraft,
        RequirementStatus.InAnalysis => RequirementInAnalysis,
        RequirementStatus.InExecution => RequirementInExecution,
        RequirementStatus.PendingApproval => RequirementPendingApproval,
        RequirementStatus.Completed => RequirementCompleted,
        RequirementStatus.Rejected => RequirementRejected,
        _ => RequirementDraft
    };

    public static Guid ForActivity(ActivityStatus status) => status switch
    {
        ActivityStatus.Todo => ActivityTodo,
        ActivityStatus.InProgress => ActivityInProgress,
        ActivityStatus.EvidenceAttached => ActivityEvidenceAttached,
        ActivityStatus.PendingApproval => ActivityPendingApproval,
        ActivityStatus.Approved => ActivityApproved,
        ActivityStatus.Rejected => ActivityRejected,
        _ => ActivityTodo
    };
}

public sealed class Requirement : Entity
{
    public const int ActivityOrEventMaxLength = 240;
    public const int RequestedByMaxLength = 120;
    public const int RequesterNameMaxLength = 160;
    public const int RequesterEmailMaxLength = 180;
    public const int FacultyMaxLength = 160;
    public const int CareerMaxLength = 160;
    public const int CampusMaxLength = 120;
    public const int PlaceMaxLength = 180;
    public const int EventFormatMaxLength = 80;

    private Requirement()
    {
        Code = string.Empty;
        ActivityOrEvent = string.Empty;
        RequestedBy = string.Empty;
        RequesterName = string.Empty;
        RequesterEmail = string.Empty;
        Faculty = string.Empty;
        Career = string.Empty;
        Campus = string.Empty;
        Place = string.Empty;
        EventObjective = string.Empty;
        EventFormat = string.Empty;
        AudienceType = "internal";
        ActivityFormatDescription = string.Empty;
        StatusId = WorkflowCatalogIds.RequirementDraft;
    }

    public Requirement(
        string activityOrEvent,
        string requestedBy,
        Guid facultyId,
        string faculty,
        string career,
        Guid campusId,
        string campus,
        string place,
        DateOnly startDate,
        TimeOnly? startTime,
        DateOnly endDate,
        TimeOnly? endTime,
        string eventObjective,
        Guid eventFormatId,
        string eventFormat,
        DateOnly requestDate,
        Guid? careerId = null,
        string? requesterName = null,
        string? requesterEmail = null,
        string? audienceType = null,
        string? activityFormatDescription = null)
    {
        if (string.IsNullOrWhiteSpace(activityOrEvent)) throw new ArgumentException("Actividad o evento es requerido.", nameof(activityOrEvent));
        if (string.IsNullOrWhiteSpace(requestedBy)) throw new ArgumentException("Solicitante es requerido.", nameof(requestedBy));
        if (facultyId == Guid.Empty) throw new ArgumentException("Facultad es requerida.", nameof(facultyId));
        if (campusId == Guid.Empty) throw new ArgumentException("Sede es requerida.", nameof(campusId));
        if (eventFormatId == Guid.Empty) throw new ArgumentException("Formato del evento es requerido.", nameof(eventFormatId));
        if (endDate < startDate) throw new ArgumentException("La fecha de fin no puede ser menor a la fecha de inicio.", nameof(endDate));

        Code = $"REQ-{DateTimeOffset.UtcNow:yyyyMMddHHmmss}";
        ActivityOrEvent = Limit(activityOrEvent, ActivityOrEventMaxLength);
        RequestedBy = Limit(requestedBy, RequestedByMaxLength);
        RequesterEmail = Limit(string.IsNullOrWhiteSpace(requesterEmail) ? RequestedBy : requesterEmail.Trim().ToLowerInvariant(), RequesterEmailMaxLength);
        RequesterName = Limit(string.IsNullOrWhiteSpace(requesterName) ? RequesterEmail : requesterName, RequesterNameMaxLength);
        FacultyId = facultyId;
        Faculty = Limit(faculty, FacultyMaxLength);
        CareerId = careerId;
        Career = Limit(career, CareerMaxLength);
        CampusId = campusId;
        Campus = Limit(campus, CampusMaxLength);
        Place = Limit(place, PlaceMaxLength);
        StartDate = startDate;
        StartTime = startTime;
        EndDate = endDate;
        EndTime = endTime;
        EventObjective = eventObjective.Trim();
        EventFormatId = eventFormatId;
        EventFormat = Limit(eventFormat, EventFormatMaxLength);
        AudienceType = NormalizeAudienceType(audienceType);
        ActivityFormatDescription = (activityFormatDescription ?? string.Empty).Trim();
        RequestDate = requestDate;
        Status = RequirementStatus.Draft;
        StatusId = WorkflowCatalogIds.ForRequirement(Status);
    }

    public string Code { get; private set; }
    public string ActivityOrEvent { get; private set; }
    public string RequestedBy { get; private set; }
    public string RequesterName { get; private set; }
    public string RequesterEmail { get; private set; }
    public Guid FacultyId { get; private set; }
    public string Faculty { get; private set; }
    public Guid? CareerId { get; private set; }
    public string Career { get; private set; }
    public Guid CampusId { get; private set; }
    public string Campus { get; private set; }
    public string Place { get; private set; }
    public DateOnly StartDate { get; private set; }
    public TimeOnly? StartTime { get; private set; }
    public DateOnly EndDate { get; private set; }
    public TimeOnly? EndTime { get; private set; }
    public string EventObjective { get; private set; }
    public Guid EventFormatId { get; private set; }
    public string EventFormat { get; private set; }
    public string AudienceType { get; private set; }
    public string ActivityFormatDescription { get; private set; }
    public DateOnly RequestDate { get; private set; }
    public RequirementStatus Status { get; private set; }
    public Guid StatusId { get; private set; }
    public bool CanEdit => Status == RequirementStatus.Draft;

    public void Update(
        string activityOrEvent,
        string requestedBy,
        Guid facultyId,
        string faculty,
        string career,
        Guid campusId,
        string campus,
        string place,
        DateOnly startDate,
        TimeOnly? startTime,
        DateOnly endDate,
        TimeOnly? endTime,
        string eventObjective,
        Guid eventFormatId,
        string eventFormat,
        DateOnly requestDate,
        Guid? careerId = null,
        string? requesterName = null,
        string? requesterEmail = null,
        string? audienceType = null,
        string? activityFormatDescription = null)
    {
        if (!CanEdit) throw new InvalidOperationException("Solo se pueden editar requerimientos en borrador.");
        if (string.IsNullOrWhiteSpace(activityOrEvent)) throw new ArgumentException("Actividad o evento es requerido.", nameof(activityOrEvent));
        if (string.IsNullOrWhiteSpace(requestedBy)) throw new ArgumentException("Solicitante es requerido.", nameof(requestedBy));
        if (facultyId == Guid.Empty) throw new ArgumentException("Facultad es requerida.", nameof(facultyId));
        if (campusId == Guid.Empty) throw new ArgumentException("Sede es requerida.", nameof(campusId));
        if (eventFormatId == Guid.Empty) throw new ArgumentException("Formato del evento es requerido.", nameof(eventFormatId));
        if (endDate < startDate) throw new ArgumentException("La fecha de fin no puede ser menor a la fecha de inicio.", nameof(endDate));

        ActivityOrEvent = Limit(activityOrEvent, ActivityOrEventMaxLength);
        RequestedBy = Limit(requestedBy, RequestedByMaxLength);
        RequesterEmail = Limit(string.IsNullOrWhiteSpace(requesterEmail) ? RequestedBy : requesterEmail.Trim().ToLowerInvariant(), RequesterEmailMaxLength);
        RequesterName = Limit(string.IsNullOrWhiteSpace(requesterName) ? RequesterEmail : requesterName, RequesterNameMaxLength);
        FacultyId = facultyId;
        Faculty = Limit(faculty, FacultyMaxLength);
        CareerId = careerId;
        Career = Limit(career, CareerMaxLength);
        CampusId = campusId;
        Campus = Limit(campus, CampusMaxLength);
        Place = Limit(place, PlaceMaxLength);
        StartDate = startDate;
        StartTime = startTime;
        EndDate = endDate;
        EndTime = endTime;
        EventObjective = eventObjective.Trim();
        EventFormatId = eventFormatId;
        EventFormat = Limit(eventFormat, EventFormatMaxLength);
        AudienceType = NormalizeAudienceType(audienceType);
        ActivityFormatDescription = (activityFormatDescription ?? string.Empty).Trim();
        RequestDate = requestDate;
        Touch();
    }

    public void StartAnalysis()
    {
        if (Status != RequirementStatus.Draft) throw new InvalidOperationException("Only draft requirements can start analysis.");
        Status = RequirementStatus.InAnalysis;
        StatusId = WorkflowCatalogIds.ForRequirement(Status);
        Touch();
    }

    public void StartExecution()
    {
        if (Status is not RequirementStatus.InAnalysis and not RequirementStatus.PendingApproval)
            throw new InvalidOperationException("Requirement must be analyzed before execution.");

        Status = RequirementStatus.InExecution;
        StatusId = WorkflowCatalogIds.ForRequirement(Status);
        Touch();
    }

    public void Complete(int totalActivities, int approvedActivities)
    {
        if (totalActivities <= 0) throw new InvalidOperationException("At least one activity is required.");
        if (approvedActivities != totalActivities) throw new InvalidOperationException("All activities must be approved.");

        Status = RequirementStatus.Completed;
        StatusId = WorkflowCatalogIds.ForRequirement(Status);
        Touch();
    }

    public void Reject()
    {
        Status = RequirementStatus.Rejected;
        StatusId = WorkflowCatalogIds.ForRequirement(Status);
        Touch();
    }

    public void SetStatusReference(Guid statusId)
    {
        if (statusId == Guid.Empty) throw new ArgumentException("Estado es requerido.", nameof(statusId));
        StatusId = statusId;
    }

    public void Delete(string deletedBy) => DeleteLogically(deletedBy);

    private static string NormalizeAudienceType(string? value) => value?.Trim().ToLowerInvariant() switch
    {
        "external" => "external",
        "mixed" => "mixed",
        _ => "internal"
    };

    private static string Limit(string value, int maxLength)
    {
        var normalized = value.Trim();
        return normalized.Length <= maxLength ? normalized : normalized[..maxLength];
    }
}

public sealed class TechnicalActivity : Entity
{
    private TechnicalActivity()
    {
        ProductId = string.Empty;
        RequirementType = string.Empty;
        StrategicObjective = string.Empty;
        TargetAudience = string.Empty;
        ProductType = string.Empty;
        DiffusionChannel = string.Empty;
        MainKpi = string.Empty;
        ProductResponsible = string.Empty;
        Observations = string.Empty;
        StatusId = WorkflowCatalogIds.ActivityTodo;
    }

    public TechnicalActivity(
        Guid requirementId,
        string productId,
        Guid requirementTypeId,
        string requirementType,
        string strategicObjective,
        Guid targetAudienceId,
        string targetAudience,
        Guid productTypeId,
        string productType,
        Guid diffusionChannelId,
        string diffusionChannel,
        Guid mainKpiId,
        string mainKpi,
        string productResponsible,
        DateOnly? productDeliveryDate,
        string observations)
    {
        if (requirementId == Guid.Empty) throw new ArgumentException("Id requerimiento es requerido.", nameof(requirementId));
        if (string.IsNullOrWhiteSpace(productId)) throw new ArgumentException("Id producto es requerido.", nameof(productId));
        if (requirementTypeId == Guid.Empty) throw new ArgumentException("Tipo requerimiento es requerido.", nameof(requirementTypeId));
        if (targetAudienceId == Guid.Empty) throw new ArgumentException("Público objetivo es requerido.", nameof(targetAudienceId));
        if (productTypeId == Guid.Empty) throw new ArgumentException("Tipo producto es requerido.", nameof(productTypeId));
        if (diffusionChannelId == Guid.Empty) throw new ArgumentException("Canal difusión es requerido.", nameof(diffusionChannelId));
        if (mainKpiId == Guid.Empty) throw new ArgumentException("KPI principal es requerido.", nameof(mainKpiId));
        if (string.IsNullOrWhiteSpace(productResponsible)) throw new ArgumentException("Responsable producto es requerido.", nameof(productResponsible));

        RequirementId = requirementId;
        ProductId = productId.Trim();
        RequirementTypeId = requirementTypeId;
        RequirementType = requirementType.Trim();
        StrategicObjective = strategicObjective.Trim();
        TargetAudienceId = targetAudienceId;
        TargetAudience = targetAudience.Trim();
        ProductTypeId = productTypeId;
        ProductType = productType.Trim();
        DiffusionChannelId = diffusionChannelId;
        DiffusionChannel = diffusionChannel.Trim();
        MainKpiId = mainKpiId;
        MainKpi = mainKpi.Trim();
        ProductResponsible = productResponsible.Trim();
        ProductDeliveryDate = productDeliveryDate;
        Observations = observations.Trim();
        Status = ActivityStatus.Todo;
        StatusId = WorkflowCatalogIds.ForActivity(Status);
    }

    public Guid RequirementId { get; private set; }
    public string ProductId { get; private set; }
    public Guid RequirementTypeId { get; private set; }
    public string RequirementType { get; private set; }
    public string StrategicObjective { get; private set; }
    public Guid TargetAudienceId { get; private set; }
    public string TargetAudience { get; private set; }
    public Guid ProductTypeId { get; private set; }
    public string ProductType { get; private set; }
    public Guid DiffusionChannelId { get; private set; }
    public string DiffusionChannel { get; private set; }
    public Guid MainKpiId { get; private set; }
    public string MainKpi { get; private set; }
    public string ProductResponsible { get; private set; }
    public DateOnly? ProductDeliveryDate { get; private set; }
    public string Observations { get; private set; }
    public ActivityStatus Status { get; private set; }
    public Guid StatusId { get; private set; }

    public void Update(
        Guid requirementId,
        string productId,
        Guid requirementTypeId,
        string requirementType,
        string strategicObjective,
        Guid targetAudienceId,
        string targetAudience,
        Guid productTypeId,
        string productType,
        Guid diffusionChannelId,
        string diffusionChannel,
        Guid mainKpiId,
        string mainKpi,
        string productResponsible,
        DateOnly? productDeliveryDate,
        string observations)
    {
        if (requirementId == Guid.Empty) throw new ArgumentException("Id requerimiento es requerido.", nameof(requirementId));
        if (string.IsNullOrWhiteSpace(productId)) throw new ArgumentException("Id producto es requerido.", nameof(productId));
        if (requirementTypeId == Guid.Empty) throw new ArgumentException("Tipo requerimiento es requerido.", nameof(requirementTypeId));
        if (targetAudienceId == Guid.Empty) throw new ArgumentException("Público objetivo es requerido.", nameof(targetAudienceId));
        if (productTypeId == Guid.Empty) throw new ArgumentException("Tipo producto es requerido.", nameof(productTypeId));
        if (diffusionChannelId == Guid.Empty) throw new ArgumentException("Canal difusión es requerido.", nameof(diffusionChannelId));
        if (mainKpiId == Guid.Empty) throw new ArgumentException("KPI principal es requerido.", nameof(mainKpiId));
        if (string.IsNullOrWhiteSpace(productResponsible)) throw new ArgumentException("Responsable producto es requerido.", nameof(productResponsible));
        if (Status == ActivityStatus.Approved) throw new InvalidOperationException("Productos aprobados no pueden editarse.");

        RequirementId = requirementId;
        ProductId = productId.Trim();
        RequirementTypeId = requirementTypeId;
        RequirementType = requirementType.Trim();
        StrategicObjective = strategicObjective.Trim();
        TargetAudienceId = targetAudienceId;
        TargetAudience = targetAudience.Trim();
        ProductTypeId = productTypeId;
        ProductType = productType.Trim();
        DiffusionChannelId = diffusionChannelId;
        DiffusionChannel = diffusionChannel.Trim();
        MainKpiId = mainKpiId;
        MainKpi = mainKpi.Trim();
        ProductResponsible = productResponsible.Trim();
        ProductDeliveryDate = productDeliveryDate;
        Observations = observations.Trim();
        Touch();
    }

    public void Start()
    {
        if (Status != ActivityStatus.Todo) throw new InvalidOperationException("Only todo activities can be started.");
        Status = ActivityStatus.InProgress;
        StatusId = WorkflowCatalogIds.ForActivity(Status);
        Touch();
    }

    public void MarkEvidenceAttached()
    {
        if (Status is ActivityStatus.Approved) throw new InvalidOperationException("Approved activities cannot be changed.");
        Status = ActivityStatus.EvidenceAttached;
        StatusId = WorkflowCatalogIds.ForActivity(Status);
        Touch();
    }

    public void SendToApproval()
    {
        if (Status != ActivityStatus.EvidenceAttached) throw new InvalidOperationException("Evidence is required before approval.");
        Status = ActivityStatus.PendingApproval;
        StatusId = WorkflowCatalogIds.ForActivity(Status);
        Touch();
    }

    public void Decide(ApprovalDecision decision)
    {
        if (Status != ActivityStatus.PendingApproval) throw new InvalidOperationException("Activity must be pending approval.");
        Status = decision == ApprovalDecision.Approved ? ActivityStatus.Approved : ActivityStatus.InProgress;
        StatusId = WorkflowCatalogIds.ForActivity(Status);
        Touch();
    }

    public void SetStatusReference(Guid statusId)
    {
        if (statusId == Guid.Empty) throw new ArgumentException("Estado es requerido.", nameof(statusId));
        StatusId = statusId;
    }

    public void Delete(string deletedBy) => DeleteLogically(deletedBy);
}

public sealed class EvidenceItem : Entity
{
    private EvidenceItem()
    {
        FileName = string.Empty;
        ContentType = string.Empty;
        StorageUrl = string.Empty;
        UploadedBy = string.Empty;
    }

    public EvidenceItem(Guid activityId, string fileName, string contentType, string storageUrl, string uploadedBy)
    {
        if (activityId == Guid.Empty) throw new ArgumentException("Activity id is required.", nameof(activityId));
        if (string.IsNullOrWhiteSpace(fileName)) throw new ArgumentException("File name is required.", nameof(fileName));
        if (string.IsNullOrWhiteSpace(storageUrl)) throw new ArgumentException("Storage url is required.", nameof(storageUrl));

        ActivityId = activityId;
        FileName = fileName.Trim();
        ContentType = string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType.Trim();
        StorageUrl = storageUrl.Trim();
        UploadedBy = string.IsNullOrWhiteSpace(uploadedBy) ? "system" : uploadedBy.Trim();
    }

    public Guid ActivityId { get; private set; }
    public string FileName { get; private set; }
    public string ContentType { get; private set; }
    public string StorageUrl { get; private set; }
    public string UploadedBy { get; private set; }

    public void Delete(string deletedBy) => DeleteLogically(deletedBy);
}

public sealed class ActivityApproval : Entity
{
    private ActivityApproval()
    {
        ApprovedBy = string.Empty;
        Comments = string.Empty;
        ApproverEmail = string.Empty;
        RequesterEmail = string.Empty;
        Status = "Pending";
        DecisionSource = "web";
        CorrelationId = string.Empty;
        PowerAutomateRunId = string.Empty;
        NotificationStatus = "NotSent";
        DecidedByEmail = string.Empty;
    }

    public ActivityApproval(Guid activityId, ApprovalDecision decision, string approvedBy, string comments)
    {
        if (activityId == Guid.Empty) throw new ArgumentException("Activity id is required.", nameof(activityId));
        if (string.IsNullOrWhiteSpace(approvedBy)) throw new ArgumentException("Approver is required.", nameof(approvedBy));

        ActivityId = activityId;
        Decision = decision;
        ApprovedBy = approvedBy.Trim();
        Comments = comments.Trim();
        ApproverEmail = approvedBy.Trim().ToLowerInvariant();
        RequesterEmail = string.Empty;
        Status = decision == ApprovalDecision.Pending ? "Pending" : decision.ToString();
        SubmittedAt = CreatedAt;
        DecidedAt = decision == ApprovalDecision.Pending ? null : DateTimeOffset.UtcNow;
        DecisionSource = "legacy";
        CorrelationId = Guid.NewGuid().ToString("N");
        PowerAutomateRunId = string.Empty;
        NotificationStatus = "NotSent";
        DecidedByEmail = decision == ApprovalDecision.Pending ? string.Empty : approvedBy.Trim().ToLowerInvariant();
    }

    public static ActivityApproval Request(Guid activityId, string approverEmail, string requesterEmail, string comments, string source)
    {
        if (activityId == Guid.Empty) throw new ArgumentException("Activity id is required.", nameof(activityId));
        if (string.IsNullOrWhiteSpace(approverEmail)) throw new ArgumentException("Approver email is required.", nameof(approverEmail));

        return new ActivityApproval
        {
            ActivityId = activityId,
            Decision = ApprovalDecision.Pending,
            ApprovedBy = approverEmail.Trim().ToLowerInvariant(),
            ApproverEmail = approverEmail.Trim().ToLowerInvariant(),
            RequesterEmail = requesterEmail.Trim().ToLowerInvariant(),
            Comments = comments.Trim(),
            Status = "Pending",
            SubmittedAt = DateTimeOffset.UtcNow,
            DecisionSource = string.IsNullOrWhiteSpace(source) ? "web" : source.Trim(),
            CorrelationId = Guid.NewGuid().ToString("N")
        };
    }

    public Guid ActivityId { get; private set; }
    public ApprovalDecision Decision { get; private set; }
    public string ApprovedBy { get; private set; }
    public string Comments { get; private set; }
    public string ApproverEmail { get; private set; }
    public string RequesterEmail { get; private set; }
    public string Status { get; private set; }
    public DateTimeOffset SubmittedAt { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? DecidedAt { get; private set; }
    public string DecisionSource { get; private set; }
    public string CorrelationId { get; private set; }
    public string PowerAutomateRunId { get; private set; }
    public string NotificationStatus { get; private set; }
    public string DecidedByEmail { get; private set; }

    public void MarkNotification(string status, string? powerAutomateRunId = null)
    {
        NotificationStatus = string.IsNullOrWhiteSpace(status) ? NotificationStatus : status.Trim();
        PowerAutomateRunId = string.IsNullOrWhiteSpace(powerAutomateRunId) ? PowerAutomateRunId : powerAutomateRunId.Trim();
        Touch();
    }

    public void Decide(ApprovalDecision decision, string decidedByEmail, string comments, string source)
    {
        if (Status != "Pending") throw new InvalidOperationException("Approval request was already answered.");
        if (decision == ApprovalDecision.Pending) throw new ArgumentException("Decision must be approved or rejected.", nameof(decision));
        if (decision == ApprovalDecision.Rejected && string.IsNullOrWhiteSpace(comments)) throw new ArgumentException("Comments are required when rejecting.", nameof(comments));

        Decision = decision;
        Status = decision.ToString();
        ApprovedBy = string.IsNullOrWhiteSpace(decidedByEmail) ? ApproverEmail : decidedByEmail.Trim();
        DecidedByEmail = string.IsNullOrWhiteSpace(decidedByEmail) ? ApproverEmail : decidedByEmail.Trim().ToLowerInvariant();
        Comments = comments.Trim();
        DecisionSource = string.IsNullOrWhiteSpace(source) ? "web" : source.Trim();
        DecidedAt = DateTimeOffset.UtcNow;
        Touch();
    }
}
