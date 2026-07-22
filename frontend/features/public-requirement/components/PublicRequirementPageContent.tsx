"use client";

import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { PublicRequirementForm } from "./PublicRequirementForm";
import { usePublicRequirementAvailability } from "../hooks/usePublicRequirementAvailability";

export function PublicRequirementPageContent() {
  const { availability, error, loading, reload } = usePublicRequirementAvailability();
  return (
    <main className="login-page public-requirement-page">
      <section className="login-panel public-form-panel">
        <div className="brand login-brand"><strong>Crear requerimiento</strong><span>Formulario público para usuarios funcionales</span></div>
        {loading && <div className="loading" role="status">Validando disponibilidad...</div>}
        {!loading && error && <div className="error" role="alert"><span>{error}</span><button className="button secondary" type="button" onClick={() => void reload()}>Reintentar</button></div>}
        {!loading && !error && availability && <PublicRequirementForm availability={availability} />}
        <Link className="button secondary full" href="/login"><ClipboardList size={16} /> Volver al login</Link>
      </section>
    </main>
  );
}
