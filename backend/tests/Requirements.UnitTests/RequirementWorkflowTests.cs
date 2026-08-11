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

        validator.Validate(File("brief.pdf", "application/pdf", [0x25, 0x50, 0x44, 0x46, 0x2D])).IsValid.Should().BeTrue();
        validator.Validate(File("photo.jpg", "image/jpeg", [0xFF, 0xD8, 0xFF, 0xE0])).IsValid.Should().BeTrue();
        validator.Validate(File("image.png", "image/png", [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])).IsValid.Should().BeTrue();
        validator.Validate(File("image.webp", "image/webp", [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])).IsValid.Should().BeTrue();
        validator.Validate(File("fake.pdf", "application/pdf", [1, 2, 3, 4])).IsValid.Should().BeFalse();
        validator.Validate(new FormFile(new MemoryStream([1]), 0, RequirementFileValidator.MaxBytes + 1, "file", "large.pdf") { Headers = new HeaderDictionary(), ContentType = "application/pdf" }).IsValid.Should().BeFalse();
        validator.Validate(File("vector.svg", "image/svg+xml", [1])).IsValid.Should().BeFalse();
        validator.Validate(File("setup.exe", "application/x-msdownload", [1])).IsValid.Should().BeFalse();
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

    [Fact]
    public void Catalog_reference_codes_are_limited_to_database_size()
    {
        var id = Guid.NewGuid();
        var longCode = new string('A', CatalogReferenceWriter.CodeMaxLength + 20);

        var normalized = CatalogReferenceWriter.NormalizeCode(longCode, id);

        normalized.Should().HaveLength(CatalogReferenceWriter.CodeMaxLength);
        normalized.Should().Be(longCode[..CatalogReferenceWriter.CodeMaxLength]);
        CatalogReferenceWriter.NormalizeCode("", id).Should().HaveLength(12);
    }

    [Fact]
    public void Requirement_trims_text_fields_to_database_size()
    {
        var requirement = new Requirement(
            new string('A', Requirement.ActivityOrEventMaxLength + 10),
            new string('B', Requirement.RequestedByMaxLength + 10),
            Guid.NewGuid(),
            new string('C', Requirement.FacultyMaxLength + 10),
            new string('D', Requirement.CareerMaxLength + 10),
            Guid.NewGuid(),
            new string('E', Requirement.CampusMaxLength + 10),
            new string('F', Requirement.PlaceMaxLength + 10),
            DateOnly.FromDateTime(DateTime.UtcNow),
            null,
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            null,
            "Difundir oferta academica",
            Guid.NewGuid(),
            new string('G', Requirement.EventFormatMaxLength + 10),
            DateOnly.FromDateTime(DateTime.UtcNow),
            Guid.NewGuid(),
            new string('H', Requirement.RequesterNameMaxLength + 10),
            new string('I', Requirement.RequesterEmailMaxLength + 10),
            "mixed",
            "Charla con activacion institucional");

        requirement.ActivityOrEvent.Should().HaveLength(Requirement.ActivityOrEventMaxLength);
        requirement.RequestedBy.Should().HaveLength(Requirement.RequestedByMaxLength);
        requirement.Faculty.Should().HaveLength(Requirement.FacultyMaxLength);
        requirement.Career.Should().HaveLength(Requirement.CareerMaxLength);
        requirement.Campus.Should().HaveLength(Requirement.CampusMaxLength);
        requirement.Place.Should().HaveLength(Requirement.PlaceMaxLength);
        requirement.EventFormat.Should().HaveLength(Requirement.EventFormatMaxLength);
        requirement.RequesterName.Should().HaveLength(Requirement.RequesterNameMaxLength);
        requirement.RequesterEmail.Should().HaveLength(Requirement.RequesterEmailMaxLength);
    }

    [Fact]
    public void Completion_recipient_prefers_requester_email_and_falls_back_to_requested_by_email()
    {
        var requirement = CreateRequirement();
        CompletionRecipient.Resolve(requirement).Should().Be("marketing@uti.edu.ec");

        var historical = new Requirement(
            "Casa abierta",
            "historico@uti.edu.ec",
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
            "Solicitante historico",
            "",
            "mixed",
            "Charla con activacion institucional");

        CompletionRecipient.Resolve(historical).Should().Be("historico@uti.edu.ec");
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

    private static FormFile File(string fileName, string contentType, byte[] content) =>
        new(new MemoryStream(content), 0, content.Length, "file", fileName)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType
        };
}
