"use client";

import { CheckCircle2 } from "lucide-react";
import { useSatisfaction } from "../hooks/useSatisfaction";
import { SatisfactionForm } from "./SatisfactionForm";

export function SatisfactionExperience({ token }: { token: string }) {
  const workspace = useSatisfaction(token);
  const terminal = workspace.state === "used" || workspace.state === "submitted";
  return (
    <main className="login-page satisfaction-page">
      <section className="login-panel satisfaction-panel">
        <div className="brand login-brand"><strong>Encuesta de satisfacción</strong><span>Universidad Indoamérica</span></div>
        {workspace.state === "loading" && <p className="hint" role="status">Cargando requerimiento...</p>}
        {(workspace.state === "invalid" || workspace.state === "expired") && <div className="empty" role="status"><strong>{workspace.state === "expired" ? "Enlace vencido" : "Enlace no válido"}</strong><p>{workspace.message}</p></div>}
        {workspace.state === "error" && <div className="error" role="alert"><span>{workspace.message}</span><button className="button secondary" type="button" onClick={() => void workspace.reload()}>Reintentar</button></div>}
        {workspace.context && <div className="satisfaction-summary"><strong>{workspace.context.requirementCode}</strong><span>{workspace.context.activityOrEvent}</span></div>}
        {terminal && <div className="satisfaction-success" role="status"><CheckCircle2 size={32} /><p>{workspace.message || "Esta encuesta ya fue respondida. Gracias por su participación."}</p></div>}
        {workspace.state === "form" && <><SatisfactionForm submitting={workspace.submitting} onSubmit={workspace.submit} />{workspace.message && <p className="alert error" role="alert">{workspace.message}</p>}</>}
      </section>
    </main>
  );
}
