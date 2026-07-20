using BuildingBlocks;
using FluentAssertions;

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

    private static Requirement CreateRequirement() => new(
        "Casa abierta",
        "Marketing",
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
