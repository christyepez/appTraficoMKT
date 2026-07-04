"use client";

import { AppNav } from "../nav";
import { Activity, NamedCatalog, Requirement, api, getSession, showToast } from "../lib";
import { PaginationControls, paginate, type PaginationState } from "../pagination";
import { Highlight } from "../search";
import { Edit3, Eye, FileCheck2, Play, Plus, RefreshCw, Save, Search, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

export default function DashboardPage() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<Requirement | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [faculties, setFaculties] = useState<NamedCatalog[]>([]);
  const [careers, setCareers] = useState<(NamedCatalog & { facultyId: string })[]>([]);
  const [campuses, setCampuses] = useState<NamedCatalog[]>([]);
  const [eventFormats, setEventFormats] = useState<NamedCatalog[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 10 });

  async function load() {
    const session = getSession();
    const [reqs, acts, facultyData, careerData, campusData, eventFormatData] = await Promise.all([
      api<Requirement[]>("/api/requirements"),
      api<Activity[]>("/api/activities").catch(() => []),
      api<NamedCatalog[]>("/api/admin/faculties").catch(() => []),
      api<(NamedCatalog & { facultyId: string })[]>("/api/admin/careers").catch(() => []),
      api<NamedCatalog[]>("/api/admin/campuses").catch(() => []),
      api<NamedCatalog[]>("/api/admin/catalogs/by-type/FormatoEvento").catch(() => [])
    ]);
    const visibleRequirements = filterRequirementsForSession(reqs, acts, session);
    const visibleRequirementIds = new Set(visibleRequirements.map((item) => item.id));
    setRequirements(visibleRequirements);
    setActivities(acts.filter((item) => visibleRequirementIds.has(item.requirementId)));
    setFaculties(facultyData.filter((item) => item.isActive));
    setCareers(careerData.filter((item) => item.isActive));
    setCampuses(campusData.filter((item) => item.isActive));
    setEventFormats(eventFormatData.filter((item) => item.isActive));
  }

  useEffect(() => {
    const timer = window.setInterval(() => load().catch(() => undefined), 15000);
    const refresh = () => load().catch(() => undefined);
    const refreshWhenVisible = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    load().catch(() => location.assign("/login"));
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      const facultyId = String(form.get("facultyId") ?? "");
      const campusId = String(form.get("campusId") ?? "");
      const eventFormatId = String(form.get("eventFormatId") ?? "");
      const careerId = String(form.get("careerId") ?? "");
      const faculty = faculties.find((item) => item.id === facultyId);
      const campus = campuses.find((item) => item.id === campusId);
      const eventFormat = eventFormats.find((item) => item.id === eventFormatId);
      const career = careers.find((item) => item.id === careerId);
      await api<Requirement>(`/api/requirements${editing ? `/${editing.id}` : ""}`, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({
          activityOrEvent: form.get("activityOrEvent"),
          requestedBy: form.get("requestedBy"),
          facultyId,
          faculty: faculty?.name ?? "",
          career: career?.name ?? "",
          campusId,
          campus: campus?.name ?? "",
          place: form.get("place"),
          startDate: form.get("startDate"),
          endDate: form.get("endDate"),
          eventObjective: form.get("eventObjective"),
          eventFormatId,
          eventFormat: eventFormat?.name ?? "",
          requestDate: form.get("requestDate")
        })
      });
      event.currentTarget.reset();
      setEditing(null);
      setIsEditorOpen(false);
      setMessage(editing ? "Requerimiento editado y tracking actualizado." : "Requerimiento creado y tracking actualizado.");
      showToast(editing ? "Requerimiento editado correctamente." : "Requerimiento creado correctamente.");
      await load();
    } finally {
      setIsSaving(false);
    }
  }

  async function patch(url: string) {
    await api(url, { method: "PATCH" });
    showToast("Estado actualizado correctamente.");
    await load();
  }

  async function removeRequirement(id: string) {
    if (!window.confirm("¿Eliminar este requerimiento? También se eliminarán lógicamente sus productos asociados.")) return;
    await api(`/api/requirements/${id}`, { method: "DELETE" });
    showToast("Requerimiento eliminado correctamente.");
    await load();
  }

  return (
    <main className="app-shell">
      <AppNav />
      <section className="content-shell tracking-layout">
        {isEditorOpen && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <section className="modal-panel">
              <div className="card-head">
                <h2>{editing ? "Editar requerimiento" : "Registro de requerimiento"}</h2>
                <button className="icon-button" type="button" title="Cerrar formulario" disabled={isSaving} onClick={() => { setEditing(null); setIsEditorOpen(false); }}><X size={16} /></button>
              </div>
          <form className="form" onSubmit={save} key={editing?.id ?? "new"}>
            <label className="field"><span>Actividad o evento</span><input name="activityOrEvent" required defaultValue={editing?.activityOrEvent ?? ""} /></label>
            <label className="field"><span>Correo del solicitante</span><input name="requestedBy" type="email" required defaultValue={editing?.requestedBy ?? ""} /></label>
            <label className="field">
              <span>Facultad</span>
              <select name="facultyId" required value={selectedFacultyId} onChange={(event) => setSelectedFacultyId(event.target.value)}>
                <option value="">Seleccione...</option>
                {faculties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Carrera</span>
              <select key={`${selectedFacultyId}-${editing?.id ?? "new"}`} name="careerId" required defaultValue={careers.find((item) => item.facultyId === selectedFacultyId && item.name === editing?.career)?.id ?? ""} disabled={!selectedFacultyId}>
                <option value="">Seleccione...</option>
                {careers.filter((item) => item.facultyId === selectedFacultyId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Sede</span>
              <select name="campusId" required defaultValue={editing?.campusId ?? ""}>
                <option value="">Seleccione...</option>
                {campuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="field"><span>Lugar</span><input name="place" required defaultValue={editing?.place ?? ""} /></label>
            <label className="field"><span>Fecha de inicio</span><input name="startDate" type="date" required defaultValue={editing?.startDate ?? ""} /></label>
            <label className="field"><span>Fecha de fin</span><input name="endDate" type="date" required defaultValue={editing?.endDate ?? ""} /></label>
            <label className="field field-wide"><span>Objetivo del evento</span><textarea name="eventObjective" required defaultValue={editing?.eventObjective ?? ""} /></label>
            <label className="field">
              <span>Formato del evento</span>
              <select name="eventFormatId" required defaultValue={editing?.eventFormatId ?? ""}>
                <option value="">Seleccione...</option>
                {eventFormats.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="field"><span>Fecha de solicitud</span><input name="requestDate" type="date" required defaultValue={editing?.requestDate ?? ""} /></label>
            <div className="form-actions">
              <button className="button" title={editing ? "Guardar cambios del requerimiento" : "Crear nuevo requerimiento"} disabled={isSaving}>{editing ? <Save size={16} /> : <Plus size={16} />} {isSaving ? "Guardando" : editing ? "Guardar" : "Crear"}</button>
              <button className="button secondary" type="button" title="Cancelar edición" disabled={isSaving} onClick={() => { setEditing(null); setIsEditorOpen(false); }}><X size={16} /> Cancelar</button>
            </div>
          </form>
            </section>
          </div>
        )}
        {selectedRequirement && (
          <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="related-products-title">
            <section className="modal-panel modal-panel-wide">
              <div className="card-head">
                <div className="compact-title">
                  <h2 id="related-products-title">Productos relacionados</h2>
                  <p>{selectedRequirement.code} - {selectedRequirement.activityOrEvent}</p>
                </div>
                <button className="icon-button" type="button" title="Cerrar productos relacionados" onClick={() => setSelectedRequirement(null)}><X size={16} /></button>
              </div>
              <div className="table-scroll top-space">
                <table className="data-table related-products-table">
                  <thead><tr><th>Producto</th><th>Responsable</th><th>Entrega</th><th>Estado</th></tr></thead>
                  <tbody>
                    {activities.filter((item) => item.requirementId === selectedRequirement.id).map((item) => (
                      <tr key={item.id}>
                        <td><strong>{item.productId}</strong><span>{item.productType}</span></td>
                        <td>{item.productResponsible}</td>
                        <td>{item.productDeliveryDate}</td>
                        <td><span className="badge">{activityStatusLabel(item.status)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {activities.every((item) => item.requirementId !== selectedRequirement.id) && <div className="empty top-space">Este requerimiento todavía no tiene productos relacionados.</div>}
            </section>
          </div>
        )}
        <section className="panel">
          <div className="card-head">
            <h2>Seguimiento de requerimientos</h2>
            <div className="actions">
              <button className="icon-button" title="Crear nuevo requerimiento" onClick={() => { setEditing(null); setSelectedFacultyId(""); setIsEditorOpen(true); }}><Plus size={16} /></button>
              <button className="button secondary" title="Actualizar seguimiento de requerimientos" onClick={load}><RefreshCw size={16} /> Actualizar</button>
            </div>
          </div>
          {message && <span className="badge">{message}</span>}
          <label className="field top-space">
            <span>Buscar en seguimiento</span>
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar por código, actividad, solicitante, facultad, carrera..." />
          </label>
          <label className="check-field top-space"><input type="checkbox" checked={showCompleted} onChange={(event) => setShowCompleted(event.target.checked)} /> Ver requerimientos finalizados</label>
          <div className="stack compact-stack top-space">
            {paginate(requirements.filter((item) => showCompleted ? isFinalRequirement(item.status) : !isFinalRequirement(item.status)).filter((item) => matchesRequirementSearch(item, searchTerm)), pagination).items.map((item) => (
              <article className="card compact-card" key={item.id}>
                <div className="card-head">
                  <div className="compact-title">
                    <h3>{highlight(`${item.code} - ${item.activityOrEvent}`, searchTerm)}</h3>
                    <p>{highlight(`${item.requestedBy} | ${item.faculty} | ${item.career}`, searchTerm)}</p>
                  </div>
                  <div className="card-meta">
                    <span className="badge">{requirementStatusLabel(item.status)}</span>
                    <div className="actions">
                      <button className="icon-button" title="Ver productos relacionados" onClick={() => setSelectedRequirement(item)}><Eye size={16} /></button>
                      {!isFinalRequirement(item.status) && <>
                        <button className={workflowButtonClass(requirementStepState(item, "analysis"))} disabled={requirementStepState(item, "analysis") !== "ready"} title="Cambiar requerimiento a análisis" onClick={() => patch(`/api/requirements/${item.id}/analysis`)}><Search size={16} /></button>
                        <button className={workflowButtonClass(requirementStepState(item, "execution"))} disabled={requirementStepState(item, "execution") !== "ready"} title="Cambiar requerimiento a ejecución" onClick={() => patch(`/api/requirements/${item.id}/execution`)}><Play size={16} /></button>
                        <button className={workflowButtonClass(requirementStepState(item, "complete"))} disabled={requirementStepState(item, "complete") !== "ready"} title="Completar requerimiento si todos los productos están aprobados" onClick={() => patch(`/api/requirements/${item.id}/complete`)}><FileCheck2 size={16} /></button>
                        <button className="icon-button" title="Editar datos del requerimiento" onClick={() => { setEditing(item); setSelectedFacultyId(item.facultyId); setIsEditorOpen(true); }}><Edit3 size={16} /></button>
                        <button className="icon-button danger" title="Eliminar lógicamente el requerimiento y sus productos" onClick={() => removeRequirement(item.id)}><Trash2 size={16} /></button>
                      </>}
                    </div>
                  </div>
                </div>
                <div className="inline-facts">
                  <span>{item.campus} - {item.place}</span>
                  <span>{item.startDate} a {item.endDate}</span>
                </div>
              </article>
            ))}
          </div>
          <PaginationControls state={pagination} totalItems={requirements.filter((item) => showCompleted ? isFinalRequirement(item.status) : !isFinalRequirement(item.status)).filter((item) => matchesRequirementSearch(item, searchTerm)).length} onChange={setPagination} />
        </section>
      </section>
    </main>
  );
}

function filterRequirementsForSession(requirements: Requirement[], activities: Activity[], session: ReturnType<typeof getSession>) {
  if (!session || session.user.roles.some((role) => ["Administrador", "Coordinador", "Auditor"].includes(role))) return requirements;
  const userKeys = [session.user.name, session.user.email].map((value) => value.toLowerCase());
  const assignedRequirementIds = new Set(
    activities
      .filter((item) => userKeys.includes(item.productResponsible.toLowerCase()))
      .map((item) => item.requirementId)
  );
  if (session.user.roles.includes("Tecnico")) return requirements.filter((item) => assignedRequirementIds.has(item.id));
  return requirements.filter((item) => userKeys.includes(item.requestedBy.toLowerCase()) || assignedRequirementIds.has(item.id));
}

type StepState = "pending" | "ready" | "done";

function requirementStepState(item: Requirement, step: "analysis" | "execution" | "complete"): StepState {
  const order = ["Draft", "InAnalysis", "InExecution", "PendingApproval", "Completed", "Rejected"];
  const current = order.indexOf(item.status);
  if (step === "analysis") return current <= 0 ? "ready" : "done";
  if (step === "execution") {
    if (current <= 0) return "pending";
    return current === 1 ? "ready" : "done";
  }
  if (current < 2) return "pending";
  return current === 2 || current === 3 ? "ready" : "done";
}

function isFinalRequirement(status: string) {
  return ["Completed", "Rejected"].includes(status);
}

function requirementStatusLabel(status: string) {
  const labels: Record<string, string> = {
    Draft: "Borrador",
    InAnalysis: "En análisis",
    InExecution: "En ejecución",
    PendingApproval: "Pendiente de aprobación",
    Completed: "Finalizado",
    Rejected: "Finalizado rechazado"
  };
  return labels[status] ?? status;
}

function activityStatusLabel(status: string) {
  const labels: Record<string, string> = {
    Todo: "Por hacer",
    InProgress: "En progreso",
    EvidenceAttached: "Evidencia adjunta",
    PendingApproval: "Pendiente de aprobación",
    Approved: "Aprobado",
    Rejected: "Rechazado"
  };
  return labels[status] ?? status;
}

function workflowButtonClass(state: StepState) {
  if (state === "done") return "icon-button success";
  if (state === "ready") return "icon-button warning";
  return "icon-button pending";
}

function matchesRequirementSearch(item: Requirement, term: string) {
  const query = term.trim().toLowerCase();
  if (!query) return true;
  return [item.code, item.activityOrEvent, item.requestedBy, item.faculty, item.career, item.campus, item.place, item.status]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function highlight(text: string, term: string) {
  return <Highlight search={term}>{text}</Highlight>;
}
