"use client";

import { AppNav } from "../nav";
import { api } from "../lib";
import { PaginationControls, paginate, type PaginationState } from "../pagination";
import { Highlight, matchesSearch } from "../search";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

type NotificationRecord = {
  id: string;
  eventType: string;
  title: string;
  message: string;
  recipientEmail: string;
  createdBy: string;
  isAcknowledged: boolean;
  acknowledgedBy: string;
  acknowledgedAt?: string;
  createdAt: string;
};

export default function NotificationLogPage() {
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 10 });

  async function load() {
    setItems(await api<NotificationRecord[]>("/api/notification-records"));
  }

  useEffect(() => {
    const timer = window.setInterval(() => load().catch(() => undefined), 15000);
    load().catch(() => location.assign("/login"));
    return () => window.clearInterval(timer);
  }, []);

  const visible = items.filter((item) => matchesSearch([item.eventType, item.title, item.message, item.recipientEmail, item.createdBy, item.isAcknowledged ? "Recibido" : "Pendiente"], search));

  return (
    <main className="app-shell">
      <AppNav />
      <section className="content-shell">
        <section className="panel">
          <div className="card-head">
            <h2>Registro de notificaciones</h2>
            <button className="button secondary" title="Actualizar registro de notificaciones" onClick={load}><RefreshCw size={16} /> Actualizar</button>
          </div>
          <label className="field top-space">
            <span>Buscar</span>
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPagination((current) => ({ ...current, page: 1 })); }} placeholder="Evento, destinatario, título..." />
          </label>
          <div className="stack compact-stack top-space">
            {paginate(visible, pagination).items.map((item) => (
              <article className="card compact-card" key={item.id}>
                <div className="card-head">
                  <div className="compact-title">
                    <h3><Highlight search={search}>{item.title}</Highlight></h3>
                    <p><Highlight search={search}>{item.message}</Highlight></p>
                  </div>
                  <span className="badge">{item.isAcknowledged ? "Recibido" : "Pendiente"}</span>
                </div>
                <div className="inline-facts">
                  <span><Highlight search={search}>{item.eventType}</Highlight></span>
                  <span><Highlight search={search}>{item.recipientEmail}</Highlight></span>
                  <span>{formatDate(item.createdAt)}</span>
                  {item.acknowledgedAt && <span>Recibido: {formatDate(item.acknowledgedAt)}</span>}
                </div>
              </article>
            ))}
            {visible.length === 0 && <div className="empty">Sin registros.</div>}
          </div>
          <PaginationControls state={pagination} totalItems={visible.length} onChange={setPagination} />
        </section>
      </section>
    </main>
  );
}

function formatDate(value?: string) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-EC", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
