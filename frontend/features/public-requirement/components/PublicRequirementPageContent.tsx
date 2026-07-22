"use client";

import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { PublicRequirementForm } from "./PublicRequirementForm";
import { usePublicRequirementAvailability } from "../hooks/usePublicRequirementAvailability";
import accessStyles from "../../../shared/styles/PublicAccess.module.css";

export function PublicRequirementPageContent() {
  const { availability, error, loading, reload } = usePublicRequirementAvailability();
  return (
    <main className={accessStyles.page}>
      <section className={`${accessStyles.panel} ${accessStyles.publicPanel}`}>
        <div className={`brand ${accessStyles.brand}`}><strong>Crear requerimiento</strong><span>Formulario público para usuarios funcionales</span></div>
        {loading && <div className="loading" role="status">Validando disponibilidad...</div>}
        {!loading && error && <div className="error" role="alert"><span>{error}</span><button className="button secondary" type="button" onClick={() => void reload()}>Reintentar</button></div>}
        {!loading && !error && availability && <PublicRequirementForm availability={availability} />}
        <Link className="button secondary full" href="/login"><ClipboardList size={16} /> Volver al login</Link>
      </section>
    </main>
  );
}
