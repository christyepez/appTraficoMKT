"use client";

import { AppNav } from "../nav";
import { Activity, api, getSession, showToast } from "../lib";
import { CheckCircle2, Eye, FileText, RefreshCw, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

type EvidenceItem = {
  id: string;
  activityId: string;
  fileName: string;
  contentType?: string;
  storageUrl: string;
  uploadedBy: string;
};

type Approval = {
  id: string;
  activityId: string;
  decision: string;
  approvedBy: string;
  comments: string;
  createdAt: string;
};

export default function ApprovalsPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [showApproved, setShowApproved] = useState(false);
  const [attachmentActivityId, setAttachmentActivityId] = useState("");

  async function load() {
    const [data, evs, aps] = await Promise.all([
      api<Activity[]>("/api/activities"),
      api<EvidenceItem[]>("/api/evidence").catch(() => []),
      api<Approval[]>("/api/approvals").catch(() => [])
    ]);
    setActivities(data.filter((item) => showApproved ? item.status === "Approved" : item.status === "PendingApproval"));
    setEvidence(evs);
    setApprovals(aps);
  }

  useEffect(() => {
    const timer = window.setInterval(() => load().catch(() => undefined), 15000);
    load().catch(() => location.assign("/login"));
    return () => window.clearInterval(timer);
  }, [showApproved]);

  async function decide(id: string, decision: "Approved" | "Rejected") {
    const session = getSession();
    await api(`/api/activities/${id}/approvals`, {
      method: "POST",
      body: JSON.stringify({
        decision,
        approvedBy: session?.user.name ?? session?.user.email ?? "Aprobador",
        comments: window.prompt("Comentarios de aprobación", decision === "Approved" ? "Producto aprobado." : "Producto rechazado.") ?? ""
      })
    });
    showToast(decision === "Approved" ? "Producto aprobado correctamente." : "Producto rechazado correctamente.");
    await load();
  }

  return (
    <main className="app-shell">
      <AppNav />
      <section className="content-shell">
        <div className="panel">
          {attachmentActivityId && (
            <div className="modal-backdrop" role="dialog" aria-modal="true">
              <section className="modal-panel">
                <div className="card-head">
                  <div>
                    <h2>Adjuntos del producto</h2>
                    <p>{activities.find((item) => item.id === attachmentActivityId)?.productId ?? "Producto seleccionado"}</p>
                  </div>
                  <span className="badge">{activityStatusLabel(activities.find((item) => item.id === attachmentActivityId)?.status ?? "")}</span>
                  <button className="icon-button" type="button" title="Cerrar adjuntos" onClick={() => setAttachmentActivityId("")}><XCircle size={16} /></button>
                </div>
                <div className="stack compact-stack top-space">
                  {evidence.filter((file) => file.activityId === attachmentActivityId).map((file) => (
                    <article className="card compact-card" key={file.id}>
                      <div className="card-head">
                        <span><FileText size={14} /> {file.fileName}</span>
                        <a className="button secondary compact-button" href={file.storageUrl} target="_blank" rel="noreferrer" title="Abrir adjunto en otra pestaña"><Eye size={14} /> Abrir</a>
                      </div>
                      <EvidencePreview item={file} />
                    </article>
                  ))}
                  {evidence.filter((file) => file.activityId === attachmentActivityId).length === 0 && <div className="empty">Este producto no tiene adjuntos.</div>}
                </div>
              </section>
            </div>
          )}
          <div className="card-head">
            <h2>Aprobaciones</h2>
            <div className="actions">
              <label className="check-field"><input type="checkbox" checked={showApproved} onChange={(event) => setShowApproved(event.target.checked)} /> Ver productos aprobados</label>
              <button className="button secondary" title="Actualizar productos pendientes de aprobación" onClick={load}><RefreshCw size={16} /> Actualizar</button>
            </div>
          </div>
          <div className="stack compact-stack top-space">
            {activities.map((item) => (
              <article className="card compact-card" key={item.id}>
                <div className="card-head">
                  <div className="compact-title">
                    <h3>{item.productId} - {item.productType}</h3>
                    <p>{item.productResponsible} | {item.mainKpi}</p>
                  </div>
                  <div className="card-meta">
                    <span className="badge">{activityStatusLabel(item.status)}</span>
                    <div className="actions">
                      <button className="icon-button success" disabled={item.status !== "PendingApproval"} title="Aprobar producto y disparar notificación configurada" onClick={() => decide(item.id, "Approved")}><CheckCircle2 size={16} /></button>
                      <button className="icon-button danger" disabled={item.status !== "PendingApproval"} title="Rechazar producto y registrar decisión" onClick={() => decide(item.id, "Rejected")}><XCircle size={16} /></button>
                      <button className="icon-button" title="Ver adjuntos del producto" onClick={() => setAttachmentActivityId(item.id)}><Eye size={16} /></button>
                    </div>
                  </div>
                </div>
                <div className="detail-grid compact-detail-grid">
                  <div className="detail-item"><span>Responsable</span><strong>{item.productResponsible}</strong></div>
                  <div className="detail-item"><span>Entrega</span><strong>{item.productDeliveryDate ?? "Sin fecha"}</strong></div>
                  <div className="detail-item"><span>Tipo</span><strong>{item.requirementType}</strong></div>
                  <div className="detail-item"><span>Canal</span><strong>{item.diffusionChannel}</strong></div>
                  <div className="detail-item"><span>KPI</span><strong>{item.mainKpi || "N/A"}</strong></div>
                  <div className="detail-item"><span>Objetivo estratégico</span><strong>{item.strategicObjective || "Sin detalle"}</strong></div>
                </div>
                {approvals.filter((approval) => approval.activityId === item.id).map((approval) => (
                  <div className="inline-facts" key={approval.id}>
                    <span>{approval.decision} por {approval.approvedBy}</span>
                    <span>{formatDate(approval.createdAt)}</span>
                    {approval.comments && <span>{approval.comments}</span>}
                  </div>
                ))}
              </article>
            ))}
            {activities.length === 0 && <div className="empty">No hay productos pendientes de aprobación.</div>}
          </div>
        </div>
      </section>
    </main>
  );
}

function EvidencePreview({ item }: { item: EvidenceItem }) {
  const lowerName = item.fileName.toLowerCase();
  if (/\.(png|jpg|jpeg|gif|webp)$/i.test(lowerName)) return <div className="file-preview"><img src={item.storageUrl} alt={item.fileName} /></div>;
  if (lowerName.endsWith(".pdf")) return <div className="file-preview"><iframe src={item.storageUrl} title={item.fileName} /></div>;
  return <div className="inline-facts"><span><FileText size={14} /> Vista previa no disponible.</span></div>;
}

function formatDate(value?: string) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-EC", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function activityStatusLabel(status: string) {
  const labels: Record<string, string> = {
    Todo: "Por hacer",
    InProgress: "Producto en proceso",
    EvidenceAttached: "Evidencia adjunta",
    PendingApproval: "Pendiente de aprobación",
    Approved: "Aprobado",
    Rejected: "Producto en proceso"
  };
  return labels[status] ?? status;
}
