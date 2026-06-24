"use client";

import { AppNav } from "../nav";
import { api } from "../lib";
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

  async function load() {
    setItems(await api<NotificationRecord[]>("/api/notification-records"));
  }

  useEffect(() => {
    const timer = window.setInterval(() => load().catch(() => undefined), 15000);
    load().catch(() => location.assign("/login"));
    return () => window.clearInterval(timer);
  }, []);

  const visible = items.filter((item) => [item.eventType, item.title, item.message, item.recipientEmail, item.createdBy].join(" ").toLowerCase().includes(search.trim().toLowerCase()));

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
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Evento, destinatario, título..." />
          </label>
          <div className="stack compact-stack top-space">
            {visible.map((item) => (
              <article className="card compact-card" key={item.id}>
                <div className="card-head">
                  <div className="compact-title">
                    <h3>{item.title}</h3>
                    <p>{item.message}</p>
                  </div>
                  <span className="badge">{item.isAcknowledged ? "Recibido" : "Pendiente"}</span>
                </div>
                <div className="inline-facts">
                  <span>{item.eventType}</span>
                  <span>{item.recipientEmail}</span>
                  <span>{formatDate(item.createdAt)}</span>
                  {item.acknowledgedAt && <span>Recibido: {formatDate(item.acknowledgedAt)}</span>}
                </div>
              </article>
            ))}
            {visible.length === 0 && <div className="empty">Sin registros.</div>}
          </div>
        </section>
      </section>
    </main>
  );
}

function formatDate(value?: string) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-EC", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
