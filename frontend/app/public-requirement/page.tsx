"use client";

import { api, showToast } from "../lib";
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

  async function load() {
    const [facultyData, careerData, campusData, formatData] = await Promise.all([
      api<NamedCatalog[]>("/api/admin/faculties").catch(() => []),
      api<NamedCatalog[]>("/api/admin/careers").catch(() => []),
      api<NamedCatalog[]>("/api/admin/campuses").catch(() => []),
      api<NamedCatalog[]>("/api/admin/catalogs/by-type/FormatoEvento").catch(() => [])
    ]);
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
          endDate: form.get("endDate"),
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
        <form className="form" onSubmit={save}>
          <label className="field"><span>Actividad o evento</span><input name="activityOrEvent" required /></label>
          <label className="field"><span>Solicitante</span><input name="requestedBy" required placeholder="Nombre o correo institucional" /></label>
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
          <label className="field"><span>Fecha fin</span><input name="endDate" type="date" required /></label>
          <label className="field"><span>Formato</span><select name="eventFormatId" required><option value="">Seleccione...</option>{formats.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="field field-wide"><span>Objetivo del evento</span><textarea name="eventObjective" required /></label>
          <button className="button" disabled={isSaving}><Save size={16} /> {isSaving ? "Enviando" : "Enviar requerimiento"}</button>
        </form>
        <Link className="button secondary full" href="/login"><ClipboardList size={16} /> Volver al login</Link>
      </section>
    </main>
  );
}
