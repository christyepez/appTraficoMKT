"use client";

import { AppNav } from "../nav";
import { api, getSession, showToast } from "../lib";
import { PaginationControls, paginate, type PaginationState } from "../pagination";
import { Highlight, matchesSearch } from "../search";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

type NotificationRecord = {
  id: string;
  eventType: string;
  title: string;
  message: string;
  recipientEmail: string;
  createdBy: string;
  isAcknowledged: boolean;
  acknowledgedAt?: string;
  createdAt: string;
};

export default function MyNotificationsPage() {
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 10 });
  const [search, setSearch] = useState("");
  const session = getSession();

  async function load() {
    if (!session?.user.email) return;
    setItems(await api<NotificationRecord[]>(`/api/notification-records/by-user?email=${encodeURIComponent(session.user.email)}&name=${encodeURIComponent(session.user.name ?? "")}`));
  }

  useEffect(() => {
    const timer = window.setInterval(() => load().catch(() => undefined), 15000);
    load().catch(() => location.assign("/login"));
    return () => window.clearInterval(timer);
  }, []);

  async function acknowledge(id: string) {
    await api(`/api/notification-records/${id}/ack`, {
      method: "PATCH",
      body: JSON.stringify({ acknowledgedBy: session?.user.email ?? "Usuario" })
    });
    showToast("Notificación marcada como recibida.");
    await load();
  }

  const visibleItems = items.filter((item) => matchesSearch([item.eventType, item.title, item.message, item.createdBy, item.isAcknowledged ? "Recibido" : "Pendiente"], search));

  return (
    <main className="app-shell">
      <AppNav />
      <section className="content-shell">
        <section className="panel">
          <div className="card-head">
            <h2>Mis notificaciones</h2>
            <button className="button secondary" title="Actualizar mis notificaciones" onClick={load}><RefreshCw size={16} /> Actualizar</button>
          </div>
          <label className="field top-space"><span>Buscar notificaciones</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPagination((current) => ({ ...current, page: 1 })); }} placeholder="Título, mensaje, evento, remitente, estado..." /></label>
          <div className="stack compact-stack top-space">
            {paginate(visibleItems, pagination).items.map((item) => (
              <article className="card compact-card" key={item.id}>
                <div className="card-head">
                  <div className="compact-title">
                    <h3><Highlight search={search}>{item.title}</Highlight></h3>
                    <p><Highlight search={search}>{item.message}</Highlight></p>
                  </div>
                  <div className="card-meta">
                    <span className="badge">{item.isAcknowledged ? "Recibido" : "Pendiente"}</span>
                    <button className="icon-button success" disabled={item.isAcknowledged} title="Marcar notificación como recibida" onClick={() => acknowledge(item.id)}><CheckCircle2 size={16} /></button>
                  </div>
                </div>
                <div className="inline-facts">
                  <span><Highlight search={search}>{item.eventType}</Highlight></span>
                  <span>{formatDate(item.createdAt)}</span>
                  <span><Highlight search={search}>{item.createdBy}</Highlight></span>
                </div>
              </article>
            ))}
            {visibleItems.length === 0 && <div className="empty">Sin notificaciones que coincidan con el filtro.</div>}
          </div>
          <PaginationControls state={pagination} totalItems={visibleItems.length} onChange={setPagination} />
        </section>
      </section>
    </main>
  );
}

function formatDate(value?: string) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-EC", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
