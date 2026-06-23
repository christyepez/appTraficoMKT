"use client";

import { AppNav } from "../nav";
import { api, showToast, t } from "../lib";
import { Download, FileSpreadsheet, Plus, RefreshCw, Trash2, UploadCloud, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type ImportResult = {
  faculties: number;
  campuses: number;
  careers: number;
  catalogs: number;
  approvers: number;
  requirements: number;
  products: number;
  users: number;
};

type ImportRun = ImportResult & {
  id: string;
  fileName: string;
  scope: string;
  status: string;
  startedAt: string;
  completedAt: string;
};

const maxFileSize = 50 * 1024 * 1024;

const scopes = [
  { value: "all", label: "Completa" },
  { value: "administration", label: "Administración" },
  { value: "catalogs", label: "Catálogos" },
  { value: "users", label: "Usuarios" },
  { value: "requirements", label: "Requerimientos" },
  { value: "products", label: "Productos" }
];

function templateHref(scopeValue: string) {
  return `/initial-import-template-${scopeValue}.xlsx`;
}

export default function InitialImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [scope, setScope] = useState("all");
  const [isUploading, setIsUploading] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [runs, setRuns] = useState<ImportRun[]>([]);

  async function load() {
    setRuns(await api<ImportRun[]>("/api/admin/initial-import/runs"));
  }

  useEffect(() => {
    const timer = window.setInterval(() => load().catch(() => undefined), 15000);
    load().catch(() => location.assign("/login"));
    return () => window.clearInterval(timer);
  }, []);

  function selectFile(nextFile?: File) {
    if (!nextFile) return;
    if (!nextFile.name.toLowerCase().endsWith(".xlsx")) {
      showToast("Seleccione un archivo Excel .xlsx.", "error");
      return;
    }
    if (nextFile.size > maxFileSize) {
      showToast("El archivo supera el límite de 50 MB.", "error");
      return;
    }
    setFile(nextFile);
    setResult(null);
  }

  function openEditor(selectedScope = scope) {
    setScope(selectedScope);
    setFile(null);
    setResult(null);
    setIsEditorOpen(true);
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      showToast("Seleccione la plantilla de carga inicial.", "error");
      return;
    }

    const form = new FormData();
    form.append("file", file);
    form.append("scope", scope);
    setIsUploading(true);
    try {
      const data = await api<ImportResult>("/api/admin/initial-import", { method: "POST", body: form });
      setResult(data);
      setFile(null);
      setIsEditorOpen(false);
      showToast("Carga inicial procesada correctamente.");
      await load();
    } finally {
      setIsUploading(false);
    }
  }

  async function removeRun(id: string) {
    if (!window.confirm("¿Eliminar lógicamente este registro de carga inicial?")) return;
    await api(`/api/admin/initial-import/runs/${id}`, { method: "DELETE" });
    showToast("Registro de carga inicial eliminado lógicamente.");
    await load();
  }

  return (
    <main className="app-shell">
      <AppNav />
      <section className="content-shell">
        {isEditorOpen && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <section className="modal-panel">
              <div className="card-head">
                <h2>{t("Carga inicial")}</h2>
                <button className="icon-button" type="button" title="Cerrar carga inicial" onClick={() => setIsEditorOpen(false)}><X size={16} /></button>
              </div>
              <form className="form top-space" onSubmit={upload}>
                <label className="field field-wide">
                  <span>Tipo de carga</span>
                  <select value={scope} onChange={(event) => setScope(event.target.value)}>
                    {scopes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </label>
                <div
                  className="upload-drop field-wide"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    selectFile(event.dataTransfer.files[0]);
                  }}
                >
                  <FileSpreadsheet size={28} />
                  <strong>{file ? file.name : "Arrastre la plantilla o seleccione un archivo"}</strong>
                  <span>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Formato .xlsx, máximo 50 MB"}</span>
                  <label className="button secondary compact-button">
                    <UploadCloud size={16} /> Seleccionar
                    <input hidden type="file" accept=".xlsx" onChange={(event) => selectFile(event.target.files?.[0])} />
                  </label>
                </div>
                <div className="form-actions">
                  <button className="button" disabled={isUploading || !file} title="Subir y procesar la carga inicial">
                    {isUploading ? <RefreshCw size={16} /> : <UploadCloud size={16} />}
                    {isUploading ? "Procesando" : "Subir información"}
                  </button>
                  <a className="button secondary" href={templateHref(scope)} title="Descargar plantilla puntual de carga inicial">
                    <Download size={16} /> Plantilla
                  </a>
                </div>
              </form>
            </section>
          </div>
        )}

        <section className="panel">
          <div className="card-head">
            <div>
              <h2>{t("Carga inicial")}</h2>
              <p>Seleccione una opción de carga, use la plantilla y revise el tracking de ejecuciones.</p>
            </div>
            <div className="actions">
              <button className="icon-button" title="Crear nueva carga inicial" onClick={() => openEditor()}><Plus size={16} /></button>
              <a className="button secondary" href={templateHref(scope)} title="Descargar plantilla de la opción seleccionada"><Download size={16} /> Plantilla</a>
              <button className="button secondary" title="Actualizar tracking de cargas" onClick={load}><RefreshCw size={16} /> Actualizar</button>
            </div>
          </div>

          <div className="catalog-tabs catalog-tabs-horizontal top-space">
            {scopes.map((item) => (
              <div className={scope === item.value ? "tab active import-option" : "tab import-option"} key={item.value}>
                <strong>{item.label}</strong>
                <div className="actions">
                  <button className="icon-button" type="button" title={`Cargar ${item.label}`} onClick={() => openEditor(item.value)}><UploadCloud size={16} /></button>
                  <a className="icon-button" href={templateHref(item.value)} title={`Ver plantilla ${item.label}`}><Download size={16} /></a>
                </div>
              </div>
            ))}
          </div>

          {result && (
            <article className="card compact-card top-space">
              <h3>Último resultado</h3>
              <ResultGrid result={result} />
            </article>
          )}

          <div className="stack compact-stack top-space">
            {runs.map((run) => (
              <article className="card compact-card" key={run.id}>
                <div className="card-head">
                  <div className="compact-title">
                    <h3>{run.fileName}</h3>
                    <p>{scopeLabel(run.scope)} | {formatDate(run.completedAt)}</p>
                  </div>
                  <div className="card-meta">
                    <span className="badge">{run.status}</span>
                    <div className="actions">
                      <button className="icon-button danger" title="Eliminar lógicamente este registro de carga" onClick={() => removeRun(run.id)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
                <div className="detail-grid compact-detail-grid">
                  <div className="detail-item"><span>Inicio</span><strong>{formatDate(run.startedAt)}</strong></div>
                  <div className="detail-item"><span>Actualización</span><strong>{formatDate(run.completedAt)}</strong></div>
                </div>
                <ResultGrid result={run} />
              </article>
            ))}
            {runs.length === 0 && (
              <div className="empty-state top-space">
                <FileSpreadsheet size={32} />
                <p>Sin cargas registradas.</p>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function ResultGrid({ result }: { result: ImportResult }) {
  const counts = [
    { label: "Facultades", value: result.faculties },
    { label: "Sedes", value: result.campuses },
    { label: "Carreras", value: result.careers },
    { label: "Catálogos", value: result.catalogs },
    { label: "Aprobadores", value: result.approvers },
    { label: "Requerimientos", value: result.requirements },
    { label: "Productos", value: result.products },
    { label: "Usuarios", value: result.users }
  ];
  const visibleCounts = counts.filter((item) => item.value > 0);
  const items = visibleCounts.length > 0 ? visibleCounts : counts;

  return (
    <div className="detail-grid compact-detail-grid">
      {items.map((item) => (
        <div className="detail-item" key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>
      ))}
    </div>
  );
}

function scopeLabel(value: string) {
  return scopes.find((item) => item.value === value)?.label ?? value;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-EC", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
