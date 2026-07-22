"use client";
import { CalendarDays, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { AgendaFilters } from "../../features/agenda/components/AgendaFilters";
import { AgendaForm } from "../../features/agenda/components/AgendaForm";
import { AgendaList } from "../../features/agenda/components/AgendaList";
import { useAgendaWorkspace } from "../../features/agenda/hooks/useAgendaWorkspace";
import type { AgendaItem } from "../../features/agenda/models/agenda.models";
import styles from "../../features/agenda/styles/Agenda.module.css";
import { AppNav } from "../nav";

export default function AgendaPage() {
  const workspace = useAgendaWorkspace(); const [editing, setEditing] = useState<AgendaItem | null>(null); const [editorOpen, setEditorOpen] = useState(false);
  const close = () => { setEditing(null); setEditorOpen(false); };
  return <main className="app-shell"><AppNav /><section className={`content-shell ${styles.workspace}`}>
    {editorOpen && <AgendaForm item={editing} activities={workspace.activities} technicians={workspace.technicians} selectedTechnician={workspace.selectedTechnician} pending={workspace.pendingIds.has(editing?.id ?? "new")} onSave={workspace.save} onClose={close} />}
    <section className="panel"><div className={`card-head ${styles.header}`}><div><h2>Agenda técnica</h2><p>Planificación de capacidad por técnico, producto y fecha.</p></div><div className="actions"><button className="icon-button" type="button" aria-label="Crear bloque de agenda" onClick={() => setEditorOpen(true)}><Plus size={16} /></button><button className="button secondary" type="button" disabled={workspace.isRefreshing} onClick={() => void workspace.refresh().catch(() => undefined)}><RefreshCw size={16} /> {workspace.isRefreshing ? "Actualizando" : "Actualizar"}</button></div></div>{workspace.message && <span className={styles.feedback} role="status">{workspace.message}</span>}<div className={styles.summary}><div className="detail-item"><span>Productos asignados</span><strong>{workspace.assignedProducts}</strong></div><div className="detail-item"><span>Bloques agendados</span><strong>{workspace.items.length}</strong></div><div className="detail-item"><span>Horas planificadas</span><strong>{workspace.agendaHours.toFixed(1)}</strong></div></div><div className={styles.filters}><AgendaFilters technicians={workspace.technicians} selectedTechnician={workspace.selectedTechnician} search={workspace.search} onTechnician={workspace.setSelectedTechnician} onSearch={workspace.setSearch} /></div></section>
    <section className="panel"><div className="card-head"><h2>Detalle de agenda</h2><span className="badge"><CalendarDays size={14} /> {workspace.technicians.find((item) => item.email === workspace.selectedTechnician)?.name ?? "Técnico"}</span></div><AgendaList items={workspace.items} pendingIds={workspace.pendingIds} isLoading={workspace.isLoading} loadError={workspace.loadError} onRetry={() => void workspace.refresh().catch(() => undefined)} onEdit={(item) => { setEditing(item); setEditorOpen(true); }} onDelete={(id) => void workspace.remove(id)} /></section>
  </section></main>;
}
