"use client";

import { AppNav } from "../nav";
import { api, showToast, t } from "../lib";
import { Edit3, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type StorageSettings = {
  id: string;
  name: string;
  provider: "Local" | "Blob" | "Ftp";
  localPath: string;
  blobConnectionString: string;
  blobContainer: string;
  ftpHost: string;
  ftpUser: string;
  ftpPassword: string;
  isProductionCloudEnabled: boolean;
  isActive: boolean;
};

const emptySettings: StorageSettings = {
  id: "",
  name: "Configuración local",
  provider: "Local",
  localPath: "uploads",
  blobConnectionString: "",
  blobContainer: "evidencias",
  ftpHost: "",
  ftpUser: "",
  ftpPassword: "",
  isProductionCloudEnabled: false,
  isActive: true
};

export default function StoragePage() {
  const [settings, setSettings] = useState<StorageSettings[]>([]);
  const [editing, setEditing] = useState<StorageSettings>(emptySettings);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function load() {
    setSettings(await api<StorageSettings[]>("/api/storage-settings/all"));
  }

  useEffect(() => {
    const timer = window.setInterval(() => load().catch(() => undefined), 10000);
    load().catch(() => location.assign("/login"));
    return () => window.clearInterval(timer);
  }, []);

  function openEditor(item: StorageSettings | null = null) {
    setEditing(item ?? emptySettings);
    setIsEditorOpen(true);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      await api<StorageSettings>(`/api/storage-settings${editing.id ? `/${editing.id}` : ""}`, {
        method: editing.id ? "PUT" : "POST",
        body: JSON.stringify(editing)
      });
      showToast(editing.id ? "Configuración de archivos editada." : "Configuración de archivos creada.");
      setIsEditorOpen(false);
      setEditing(emptySettings);
      await load();
    } finally {
      setIsSaving(false);
    }
  }

  async function removeSettings(id: string) {
    if (!window.confirm("¿Eliminar lógicamente esta configuración de archivos? Quedará inactiva.")) return;
    await api(`/api/storage-settings/${id}`, { method: "DELETE" });
    showToast("Configuración de archivos eliminada lógicamente.");
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
                <h2>{editing.id ? "Editar configuración de archivos" : "Crear configuración de archivos"}</h2>
                <button className="icon-button" type="button" title="Cerrar formulario" disabled={isSaving} onClick={() => setIsEditorOpen(false)}><X size={16} /></button>
              </div>
              <form className="form top-space" onSubmit={save}>
                <label className="field"><span>{t("Nombre")}</span><input required maxLength={120} value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /></label>
                <label className="field"><span>{t("Proveedor")}</span><select value={editing.provider} onChange={(event) => setEditing({ ...editing, provider: event.target.value as StorageSettings["provider"] })}><option>Local</option><option>Blob</option><option>Ftp</option></select></label>
                {editing.provider === "Local" && <label className="field field-wide"><span>{t("Ruta local")}</span><input required value={editing.localPath} onChange={(event) => setEditing({ ...editing, localPath: event.target.value })} /></label>}
                {editing.provider === "Blob" && (
                  <>
                    <label className="field field-wide"><span>Blob connection string</span><input required value={editing.blobConnectionString} onChange={(event) => setEditing({ ...editing, blobConnectionString: event.target.value })} /></label>
                    <label className="field"><span>Blob container</span><input required pattern="[a-z0-9-]{3,63}" title="Solo minúsculas, números y guiones, entre 3 y 63 caracteres." value={editing.blobContainer} onChange={(event) => setEditing({ ...editing, blobContainer: event.target.value })} /></label>
                  </>
                )}
                {editing.provider === "Ftp" && (
                  <>
                    <label className="field"><span>FTP host</span><input required value={editing.ftpHost} onChange={(event) => setEditing({ ...editing, ftpHost: event.target.value })} /></label>
                    <label className="field"><span>FTP usuario</span><input required value={editing.ftpUser} onChange={(event) => setEditing({ ...editing, ftpUser: event.target.value })} /></label>
                    <label className="field"><span>FTP clave</span><input required type="password" value={editing.ftpPassword} onChange={(event) => setEditing({ ...editing, ftpPassword: event.target.value })} /></label>
                  </>
                )}
                <label className="check-field field-wide"><input type="checkbox" checked={editing.isProductionCloudEnabled} onChange={(event) => setEditing({ ...editing, isProductionCloudEnabled: event.target.checked })} /> {t("Usar cloud en producción")}</label>
                <label className="check-field field-wide"><input type="checkbox" checked={editing.isActive} onChange={(event) => setEditing({ ...editing, isActive: event.target.checked })} /> {t("Activo")}</label>
                <div className="form-actions">
                  <button className="button" title={editing.id ? "Guardar cambios de la configuración" : "Crear configuración de archivos"} disabled={isSaving}>{editing.id ? <Save size={16} /> : <Plus size={16} />} {isSaving ? "Guardando" : editing.id ? "Guardar" : "Crear"}</button>
                  <button className="button secondary" type="button" title="Cancelar edición" disabled={isSaving} onClick={() => setIsEditorOpen(false)}><X size={16} /> Cancelar</button>
                </div>
              </form>
            </section>
          </div>
        )}

        <section className="panel">
          <div className="card-head">
            <h2>{t("Detalle de configuraciones")}</h2>
            <div className="actions">
              <button className="icon-button" title="Crear configuración de archivos" onClick={() => openEditor()}><Plus size={16} /></button>
              <button className="button secondary" title="Actualizar detalle de configuraciones de archivo" onClick={load}><RefreshCw size={16} /> Actualizar</button>
            </div>
          </div>
          <div className="stack compact-stack top-space">
            {settings.map((item) => (
              <article className="card compact-card" key={item.id}>
                <div className="card-head">
                  <div className="compact-title">
                    <h3>{item.name}</h3>
                    <p>{item.provider} | {item.isProductionCloudEnabled ? "Cloud prod habilitado" : "Cloud prod deshabilitado"}</p>
                  </div>
                  <div className="card-meta">
                    <span className="badge">{item.isActive ? "Activo" : "Inactivo"}</span>
                    <div className="actions">
                      <button className="icon-button" title="Editar configuración de archivo" onClick={() => openEditor(item)}><Edit3 size={16} /></button>
                      <button className="icon-button danger" title="Eliminar lógicamente la configuración de archivos" onClick={() => removeSettings(item.id)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
                <div className="detail-grid compact-detail-grid">
                  <div className="detail-item"><span>Local</span><strong>{item.localPath || "N/A"}</strong></div>
                  <div className="detail-item"><span>Blob</span><strong>{item.blobContainer || "N/A"}</strong></div>
                  <div className="detail-item"><span>FTP</span><strong>{item.ftpHost || "N/A"}</strong></div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
