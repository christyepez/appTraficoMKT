"use client";

import { api, defaultBrandSettings, showToast, type BrandSettings } from "../lib";
import { ClipboardList, Save } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type NamedCatalog = { id: string; name: string; isActive: boolean; facultyId?: string };

export default function PublicRequirementPage() {
  const [faculties, setFaculties] = useState<NamedCatalog[]>([]);
  const [careers, setCareers] = useState<NamedCatalog[]>([]);
  const [campuses, setCampuses] = useState<NamedCatalog[]>([]);
  const [formats, setFormats] = useState<NamedCatalog[]>([]);
  const [facultyId, setFacultyId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isActive, setIsActive] = useState(true);

  async function load() {
    const [brand, facultyData, careerData, campusData, formatData] = await Promise.all([
      api<BrandSettings>("/api/identity/brand-settings").catch(() => defaultBrandSettings),
      api<NamedCatalog[]>("/api/admin/faculties").catch(() => []),
      api<NamedCatalog[]>("/api/admin/careers").catch(() => []),
      api<NamedCatalog[]>("/api/admin/campuses").catch(() => []),
      api<NamedCatalog[]>("/api/admin/catalogs/by-type/FormatoEvento").catch(() => [])
    ]);
    const currentBrand = { ...defaultBrandSettings, ...brand };
    setIsActive(isPublicFeatureActive(currentBrand.showPublicRequirementFullPage, currentBrand.publicRequirementFullPageActiveFrom, currentBrand.publicRequirementFullPageActiveUntil));
    setFaculties(facultyData.filter((item) => item.isActive));
    setCareers(careerData.filter((item) => item.isActive));
    setCampuses(campusData.filter((item) => item.isActive));
    setFormats(formatData.filter((item) => item.isActive));
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    const form = new FormData(event.currentTarget);
    const faculty = faculties.find((item) => item.id === facultyId);
    const campusId = String(form.get("campusId") ?? "");
    const eventFormatId = String(form.get("eventFormatId") ?? "");
    const careerId = String(form.get("careerId") ?? "");
    const campus = campuses.find((item) => item.id === campusId);
    const eventFormat = formats.find((item) => item.id === eventFormatId);
    const career = careers.find((item) => item.id === careerId);
    setIsSaving(true);
    try {
      await api("/api/requirements", {
        method: "POST",
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
          startTime: form.get("startTime") || null,
          endDate: form.get("endDate"),
          endTime: form.get("endTime") || null,
          eventObjective: form.get("eventObjective"),
          eventFormatId,
          eventFormat: eventFormat?.name ?? "",
          requestDate: new Date().toISOString().slice(0, 10)
        })
      });
      event.currentTarget.reset();
      setFacultyId("");
      showToast("Requerimiento enviado correctamente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="login-page public-requirement-page">
      <section className="login-panel public-form-panel">
        <div className="brand login-brand">
          <strong>Crear requerimiento</strong>
          <span>Formulario público para usuarios funcionales</span>
        </div>
        {!isActive && (
          <div className="empty">
            El formulario público no está activo en este momento.
          </div>
        )}
        {isActive && (
        <form className="form" onSubmit={save}>
          <label className="field"><span>Actividad o evento</span><input name="activityOrEvent" required /></label>
          <label className="field"><span>Correo del solicitante</span><input name="requestedBy" type="email" required placeholder="correo@uti.edu.ec" /></label>
          <label className="field">
            <span>Facultad</span>
            <select required value={facultyId} onChange={(event) => setFacultyId(event.target.value)}>
              <option value="">Seleccione...</option>
              {faculties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Carrera</span>
            <select name="careerId" required disabled={!facultyId}>
              <option value="">Seleccione...</option>
              {careers.filter((item) => !item.facultyId || item.facultyId === facultyId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="field"><span>Sede</span><select name="campusId" required><option value="">Seleccione...</option>{campuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="field"><span>Lugar</span><input name="place" required /></label>
          <label className="field"><span>Fecha inicio</span><input name="startDate" type="date" required /></label>
          <label className="field"><span>Hora inicio</span><input name="startTime" type="time" /></label>
          <label className="field"><span>Fecha fin</span><input name="endDate" type="date" required /></label>
          <label className="field"><span>Hora fin</span><input name="endTime" type="time" /></label>
          <label className="field"><span>Formato</span><select name="eventFormatId" required><option value="">Seleccione...</option>{formats.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="field field-wide"><span>Objetivo del evento</span><textarea name="eventObjective" required /></label>
          <button className="button" disabled={isSaving}><Save size={16} /> {isSaving ? "Enviando" : "Enviar requerimiento"}</button>
        </form>
        )}
        <Link className="button secondary full" href="/login"><ClipboardList size={16} /> Volver al login</Link>
      </section>
    </main>
  );
}

function isPublicFeatureActive(enabled: boolean, from?: string | null, until?: string | null) {
  if (!enabled) return false;
  const now = Date.now();
  const fromTime = from ? new Date(from).getTime() : Number.NEGATIVE_INFINITY;
  const untilTime = until ? new Date(until).getTime() : Number.POSITIVE_INFINITY;
  return now >= fromTime && now <= untilTime;
}
