using BuildingBlocks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;

namespace Requirements.UnitTests;

public sealed class RequirementWorkflowTests
{
    [Fact]
    public void Complete_requires_at_least_one_activity()
    {
        var requirement = CreateRequirement();

        var act = () => requirement.Complete(0, 0);

        act.Should().Throw<InvalidOperationException>().WithMessage("At least one activity is required.");
    }

    [Fact]
    public void Requirement_can_only_be_edited_when_draft()
    {
        var requirement = CreateRequirement();

        requirement.CanEdit.Should().BeTrue();
        requirement.StartAnalysis();

        requirement.CanEdit.Should().BeFalse();
        var act = () => requirement.Update(
            "Casa abierta actualizada",
            "marketing@uti.edu.ec",
            Guid.NewGuid(),
            "Ingenieria",
            "Software",
            Guid.NewGuid(),
            "Ambato",
            "Auditorio",
            DateOnly.FromDateTime(DateTime.UtcNow),
            null,
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            null,
            "Difundir oferta academica",
            Guid.NewGuid(),
            "Presencial",
            DateOnly.FromDateTime(DateTime.UtcNow));

        act.Should().Throw<InvalidOperationException>().WithMessage("Solo se pueden editar requerimientos en borrador.");
    }

    [Fact]
    public void Requirement_keeps_requester_fields_compatible_with_requested_by()
    {
        var requirement = CreateRequirement();

        requirement.RequestedBy.Should().Be("marketing@uti.edu.ec");
        requirement.RequesterEmail.Should().Be("marketing@uti.edu.ec");
        requirement.RequesterName.Should().Be("Marketing UTI");
        requirement.AudienceType.Should().Be("mixed");
        requirement.ActivityFormatDescription.Should().Be("Charla con activacion institucional");
    }

    [Fact]
    public void Complete_requires_all_activities_approved()
    {
        var requirement = CreateRequirement();

        var act = () => requirement.Complete(2, 1);

        act.Should().Throw<InvalidOperationException>().WithMessage("All activities must be approved.");
    }

    [Fact]
    public void Activity_requires_evidence_before_approval()
    {
        var activity = CreateActivity();

        var act = activity.SendToApproval;

        act.Should().Throw<InvalidOperationException>().WithMessage("Evidence is required before approval.");
    }

    [Fact]
    public void Activity_can_be_approved_after_evidence_is_attached()
    {
        var activity = CreateActivity();

        activity.Start();
        activity.MarkEvidenceAttached();
        activity.SendToApproval();
        activity.Decide(ApprovalDecision.Approved);

        activity.Status.Should().Be(ActivityStatus.Approved);
    }

    [Fact]
    public void Activity_returns_to_in_progress_when_approval_is_rejected()
    {
        var activity = CreateActivity();

        activity.Start();
        activity.MarkEvidenceAttached();
        activity.SendToApproval();
        activity.Decide(ApprovalDecision.Rejected);

        activity.Status.Should().Be(ActivityStatus.InProgress);
    }

    [Fact]
    public void Requirement_attachment_validator_accepts_only_allowed_files()
    {
        var validator = new RequirementFileValidator();

        validator.Validate(new FormFile(new MemoryStream([1, 2, 3]), 0, 3, "file", "brief.pdf") { Headers = new HeaderDictionary(), ContentType = "application/pdf" }).IsValid.Should().BeTrue();
        validator.Validate(new FormFile(new MemoryStream([1]), 0, RequirementFileValidator.MaxBytes + 1, "file", "large.pdf") { Headers = new HeaderDictionary(), ContentType = "application/pdf" }).IsValid.Should().BeFalse();
        validator.Validate(new FormFile(new MemoryStream([1]), 0, 1, "file", "vector.svg") { Headers = new HeaderDictionary(), ContentType = "image/svg+xml" }).IsValid.Should().BeFalse();
        validator.Validate(new FormFile(new MemoryStream([1]), 0, 1, "file", "setup.exe") { Headers = new HeaderDictionary(), ContentType = "application/x-msdownload" }).IsValid.Should().BeFalse();
    }

    [Fact]
    public void Requirement_upload_token_hash_is_stable_without_exposing_secret()
    {
        var service = new RequirementUploadTokenService();
        var token = service.CreateToken();

        token.Should().NotBeNullOrWhiteSpace();
        service.Hash(token).Should().Be(service.Hash(token));
        service.Hash(token).Should().NotBe(token);
    }

    private static Requirement CreateRequirement() => new(
        "Casa abierta",
        "marketing@uti.edu.ec",
        Guid.NewGuid(),
        "Ingenieria",
        "Software",
        Guid.NewGuid(),
        "Ambato",
        "Auditorio",
        DateOnly.FromDateTime(DateTime.UtcNow),
        null,
        DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
        null,
        "Difundir oferta academica",
        Guid.NewGuid(),
        "Presencial",
        DateOnly.FromDateTime(DateTime.UtcNow),
        Guid.NewGuid(),
        "Marketing UTI",
        "marketing@uti.edu.ec",
        "mixed",
        "Charla con activacion institucional");

    private static TechnicalActivity CreateActivity() => new(
        Guid.NewGuid(),
        "PROD-001",
        Guid.NewGuid(),
        "Pieza grafica",
        "Incrementar postulantes",
        Guid.NewGuid(),
        "Bachilleres",
        Guid.NewGuid(),
        "Arte digital",
        Guid.NewGuid(),
        "Redes sociales",
        Guid.NewGuid(),
        "Alcance",
        "Disenador",
        DateOnly.FromDateTime(DateTime.UtcNow.AddDays(2)),
        "Sin observaciones");
}
