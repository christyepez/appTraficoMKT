"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { useParams } from "next/navigation";
import { api } from "../../lib";

type SatisfactionForm = {
  requirementCode: string;
  activityOrEvent: string;
  requestedBy: string;
  alreadySubmitted: boolean;
  submittedAt?: string;
};

export default function SatisfactionPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [data, setData] = useState<SatisfactionForm | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api<SatisfactionForm>(`/api/requirements/satisfaction/${encodeURIComponent(token)}`)
      .then(setData)
      .catch(() => setError("El enlace no es válido o el requerimiento todavía no está finalizado."));
  }, [token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    const form = new FormData(event.currentTarget);
    setIsSaving(true);
    setError("");
    try {
      await api(`/api/requirements/satisfaction/${encodeURIComponent(token)}`, {
        method: "POST",
        body: JSON.stringify({
          overallRating: Number(form.get("overallRating")),
          timelinessRating: Number(form.get("timelinessRating")),
          qualityRating: Number(form.get("qualityRating")),
          wouldRecommend: form.get("wouldRecommend") === "on",
          comments: form.get("comments")
        })
      });
      setMessage("Gracias. Su respuesta fue registrada correctamente.");
      setData((current) => current ? { ...current, alreadySubmitted: true } : current);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No fue posible registrar la encuesta.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="login-page satisfaction-page">
      <section className="login-panel satisfaction-panel">
        <div className="brand login-brand">
          <strong>Encuesta de satisfacción</strong>
          <span>Universidad Indoamérica</span>
        </div>
        {error && <p className="alert error">{error}</p>}
        {!data && !error && <p className="hint">Cargando requerimiento...</p>}
        {data && <>
          <div className="satisfaction-summary">
            <strong>{data.requirementCode}</strong>
            <span>{data.activityOrEvent}</span>
          </div>
          {(data.alreadySubmitted || message) ? (
            <div className="satisfaction-success"><CheckCircle2 size={32} /><p>{message || "Esta encuesta ya fue respondida. Gracias por su participación."}</p></div>
          ) : (
            <form className="form" onSubmit={submit}>
              <RatingField name="overallRating" label="Satisfacción general" />
              <RatingField name="timelinessRating" label="Cumplimiento de tiempos" />
              <RatingField name="qualityRating" label="Calidad del resultado" />
              <label className="check-field field-wide"><input name="wouldRecommend" type="checkbox" /> Recomendaría este servicio</label>
              <label className="field field-wide"><span>Comentarios</span><textarea name="comments" maxLength={2000} placeholder="Cuéntenos qué podemos mejorar" /></label>
              <button className="button field-wide" disabled={isSaving}><Send size={16} /> {isSaving ? "Enviando..." : "Enviar respuesta"}</button>
            </form>
          )}
        </>}
      </section>
    </main>
  );
}

function RatingField({ name, label }: { name: string; label: string }) {
  return <label className="field field-wide"><span>{label}</span><select name={name} required defaultValue=""><option value="" disabled>Seleccione una calificación</option>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} - {value === 1 ? "Muy insatisfecho" : value === 5 ? "Muy satisfecho" : ""}</option>)}</select></label>;
}
