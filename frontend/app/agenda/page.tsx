"use client";

import { AppNav } from "../nav";
import { Activity, api, getSession, showToast } from "../lib";
import { CalendarDays, Edit3, Plus, RefreshCw, Save, Search, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type User = { id: string; name: string; email: string; roles: string[]; isActive: boolean };
type AgendaItem = {
  id: string;
  activityId: string;
  requirementId: string;
  productId: string;
  productType: string;
  technicianName: string;
  technicianEmail: string;
  startAt: string;
  endAt: string;
  title: string;
  notes: string;
};

export default function AgendaPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AgendaItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function load() {
    const session = getSession();
    const [activityData, userData, agendaData] = await Promise.all([
      api<Activity[]>("/api/activities"),
      api<User[]>("/api/identity/users/technicians").catch(() => []),
      api<AgendaItem[]>("/api/agenda").catch(() => [])
    ]);
    const visibleTechnicians = session?.user.roles.includes("Administrador") || session?.user.roles.includes("Coordinador")
      ? userData
      : userData.filter((user) => user.email.toLowerCase() === session?.user.email.toLowerCase());
    const fallback = session ? [{ id: session.user.id, name: session.user.name, email: session.user.email, roles: session.user.roles, isActive: true }] : [];
    const techs = visibleTechnicians.length ? visibleTechnicians : fallback;
    setTechnicians(techs);
    setSelectedTechnician((current) => current || techs[0]?.email || "");
    setActivities(filterActivities(activityData, session));
    setItems(agendaData);
  }

  useEffect(() => {
    load().catch((error) => {
      showToast(error instanceof Error ? error.message : "No se pudo cargar la agenda.", "error");
      if (!getSession()) location.assign("/login");
    });
  }, []);

  const technician = technicians.find((item) => item.email === selectedTechnician);
  const visibleItems = useMemo(() => items
    .filter((item) => !selectedTechnician || item.technicianEmail.toLowerCase() === selectedTechnician.toLowerCase())
    .filter((item) => matchesAgenda(item, search)), [items, selectedTechnician, search]);
  const assignedProducts = activities.filter((item) => !selectedTechnician || item.productResponsible.toLowerCase() === selectedTechnician.toLowerCase());
  const agendaHours = visibleItems.reduce((total, item) => total + Math.max(0, (new Date(item.endAt).getTime() - new Date(item.startAt).getTime()) / 3600000), 0);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    const form = new FormData(event.currentTarget);
    const activity = activities.find((item) => item.id === String(form.get("activityId")));
    const currentTechnician = technicians.find((item) => item.email === String(form.get("technicianEmail")));
    if (!activity || !currentTechnician) {
      showToast("Seleccione técnico y producto.", "error");
      return;
    }
    setIsSaving(true);
    try {
      await api(`/api/agenda${editing ? `/${editing.id}` : ""}`, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({
          activityId: activity.id,
          technicianName: currentTechnician.name,
          technicianEmail: currentTechnician.email,
          startAt: new Date(String(form.get("startAt"))).toISOString(),
          endAt: new Date(String(form.get("endAt"))).toISOString(),
          title: form.get("title") || `${activity.productId} - ${activity.productType}`,
          notes: form.get("notes") || "",
          createdBy: getSession()?.user.email ?? "Sistema"
        })
      });
      showToast(editing ? "Agenda actualizada correctamente." : "Bloque de agenda creado correctamente.");
      setEditing(null);
      setIsEditorOpen(false);
      await load();
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("¿Eliminar este bloque de agenda?")) return;
    await api(`/api/agenda/${id}`, { method: "DELETE" });
    showToast("Bloque eliminado correctamente.");
    await load();
  }

  return (
    <main className="app-shell">
      <AppNav />
      <section className="content-shell tracking-layout">
        <section className="panel">
          <div className="card-head">
            <div>
              <h2>Agenda técnica</h2>
              <p>Planificación de capacidad por técnico, producto y fecha.</p>
            </div>
            <div className="actions">
              <button className="icon-button" type="button" title="Crear bloque de agenda" onClick={() => { setEditing(null); setIsEditorOpen(true); }}><Plus size={16} /></button>
              <button className="button secondary" type="button" title="Actualizar agenda técnica" onClick={load}><RefreshCw size={16} /> Actualizar</button>
            </div>
          </div>
          <div className="agenda-summary top-space">
            <label className="field">
              <span>Técnico</span>
              <select value={selectedTechnician} onChange={(event) => setSelectedTechnician(event.target.value)}>
                {technicians.map((item) => <option key={item.id} value={item.email}>{item.name} - {item.email}</option>)}
              </select>
            </label>
            <div className="detail-item"><span>Productos asignados</span><strong>{assignedProducts.length}</strong></div>
            <div className="detail-item"><span>Bloques agendados</span><strong>{visibleItems.length}</strong></div>
            <div className="detail-item"><span>Horas planificadas</span><strong>{agendaHours.toFixed(1)}</strong></div>
          </div>
          <label className="field top-space">
            <span>Buscar agenda</span>
            <div className="input-with-icon"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Producto, técnico, título, notas..." /></div>
          </label>
        </section>

        <section className="panel top-space">
          <div className="card-head">
            <h2>Detalle de agenda</h2>
            <span className="badge"><CalendarDays size={14} /> {technician?.name ?? "Técnico"}</span>
          </div>
          <div className="stack compact-stack top-space">
            {visibleItems.map((item) => (
              <article className="card compact-card" key={item.id}>
                <div className="card-head">
                  <div className="compact-title">
                    <h3>{item.title}</h3>
                    <p>{item.productId} | {item.productType}</p>
                  </div>
                  <div className="actions">
                    <button className="icon-button" type="button" title="Editar bloque de agenda" onClick={() => { setEditing(item); setIsEditorOpen(true); }}><Edit3 size={16} /></button>
                    <button className="icon-button danger" type="button" title="Eliminar bloque de agenda" onClick={() => remove(item.id)}><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="detail-grid compact-detail-grid">
                  <div className="detail-item"><span>Inicio</span><strong>{formatDateTime(item.startAt)}</strong></div>
                  <div className="detail-item"><span>Fin</span><strong>{formatDateTime(item.endAt)}</strong></div>
                  <div className="detail-item"><span>Duración</span><strong>{durationHours(item)} h</strong></div>
                  <div className="detail-item"><span>Técnico</span><strong>{item.technicianName}</strong></div>
                </div>
                {item.notes && <p className="muted-text">{item.notes}</p>}
              </article>
            ))}
            {visibleItems.length === 0 && <div className="empty">No hay bloques de agenda para el filtro seleccionado.</div>}
          </div>
        </section>

        {isEditorOpen && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <section className="modal-panel">
              <div className="card-head">
                <div>
                  <h2>{editing ? "Editar agenda" : "Nuevo bloque de agenda"}</h2>
                  <p>Relaciona el tiempo con un producto asignado al técnico.</p>
                </div>
                <button className="icon-button" type="button" title="Cerrar agenda" disabled={isSaving} onClick={() => { setEditing(null); setIsEditorOpen(false); }}><X size={16} /></button>
              </div>
              <form className="form top-space" onSubmit={save} key={editing?.id ?? "new"}>
                <label className="field">
                  <span>Técnico</span>
                  <select name="technicianEmail" required defaultValue={editing?.technicianEmail ?? selectedTechnician}>
                    {technicians.map((item) => <option key={item.id} value={item.email}>{item.name} - {item.email}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span>Producto</span>
                  <select name="activityId" required defaultValue={editing?.activityId ?? ""}>
                    <option value="">Seleccione...</option>
                    {activities.map((item) => <option key={item.id} value={item.id}>{item.productId} - {item.productType}</option>)}
                  </select>
                </label>
                <label className="field"><span>Inicio</span><input name="startAt" type="datetime-local" required defaultValue={toDateTimeInput(editing?.startAt)} /></label>
                <label className="field"><span>Fin</span><input name="endAt" type="datetime-local" required defaultValue={toDateTimeInput(editing?.endAt)} /></label>
                <label className="field field-wide"><span>Título</span><input name="title" maxLength={240} defaultValue={editing?.title ?? ""} placeholder="Ej. Diseño de piezas para campaña" /></label>
                <label className="field field-wide"><span>Notas</span><textarea name="notes" maxLength={2000} defaultValue={editing?.notes ?? ""} /></label>
                <div className="form-actions">
                  <button className="button" disabled={isSaving}><Save size={16} /> {isSaving ? "Guardando" : "Guardar"}</button>
                  <button className="button secondary" type="button" disabled={isSaving} onClick={() => { setEditing(null); setIsEditorOpen(false); }}><X size={16} /> Cancelar</button>
                </div>
              </form>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

function filterActivities(activities: Activity[], session: ReturnType<typeof getSession>) {
  if (!session) return [];
  if (session.user.roles.includes("Administrador") || session.user.roles.includes("Coordinador")) return activities;
  const keys = [session.user.email, session.user.name].map((value) => value.toLowerCase());
  return activities.filter((item) => keys.includes(item.productResponsible.toLowerCase()));
}

function matchesAgenda(item: AgendaItem, term: string) {
  const query = term.trim().toLowerCase();
  if (!query) return true;
  return [item.title, item.notes, item.productId, item.productType, item.technicianName, item.technicianEmail].some((value) => value.toLowerCase().includes(query));
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-EC", { dateStyle: "short", timeStyle: "short" });
}

function durationHours(item: AgendaItem) {
  return Math.max(0, (new Date(item.endAt).getTime() - new Date(item.startAt).getTime()) / 3600000).toFixed(1);
}

function toDateTimeInput(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
