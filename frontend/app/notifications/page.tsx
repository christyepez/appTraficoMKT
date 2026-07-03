"use client";

import { AppNav } from "../nav";
import { api, showToast, t } from "../lib";
import { PaginationControls, paginate, type PaginationState } from "../pagination";
import { Highlight, matchesSearch } from "../search";
import { Bold, Code2, Edit3, Eye, FileCode2, Heading2, Italic, Link2, Pilcrow, Plus, RefreshCw, Save, Trash2, Type, Underline, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

type NotificationSettings = {
  id: string;
  name: string;
  emailEnabled: boolean;
  emailTo: string;
  teamsEnabled: boolean;
  teamsChannel: string;
  powerAutomateWebhookUrl: string;
  htmlTemplate: string;
  isActive: boolean;
};

const empty: NotificationSettings = {
  id: "",
  name: "Power Automate principal",
  emailEnabled: true,
  emailTo: "",
  teamsEnabled: true,
  teamsChannel: "",
  powerAutomateWebhookUrl: "",
  htmlTemplate: `<h2>Producto aprobado</h2>
<table>
  <tr><td><strong>Id producto</strong></td><td>{{productId}}</td></tr>
  <tr><td><strong>Tipo producto</strong></td><td>{{productType}}</td></tr>
  <tr><td><strong>Responsable</strong></td><td>{{productResponsible}}</td></tr>
  <tr><td><strong>Aprobado por</strong></td><td>{{approvedBy}}</td></tr>
  <tr><td><strong>Comentarios</strong></td><td>{{comments}}</td></tr>
</table>`,
  isActive: true
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationSettings[]>([]);
  const [editing, setEditing] = useState<NotificationSettings>(empty);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 10 });
  const [search, setSearch] = useState("");
  const [templateMode, setTemplateMode] = useState<"visual" | "html" | "preview">("visual");
  const [editorSection, setEditorSection] = useState<"config" | "template">("config");
  const visualEditorRef = useRef<HTMLDivElement>(null);

  async function load() {
    setItems(await api<NotificationSettings[]>("/api/notification-settings"));
  }

  useEffect(() => {
    const timer = window.setInterval(() => load().catch(() => undefined), 10000);
    load().catch(() => location.assign("/login"));
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (templateMode === "visual" && visualEditorRef.current && visualEditorRef.current.innerHTML !== editing.htmlTemplate) {
      visualEditorRef.current.innerHTML = editing.htmlTemplate;
    }
  }, [templateMode, editorSection, editing.id, isEditorOpen]);

  function syncVisualEditor() {
    window.requestAnimationFrame(() => {
      if (visualEditorRef.current) visualEditorRef.current.innerHTML = editing.htmlTemplate || empty.htmlTemplate;
    });
  }

  function openEditor(item: NotificationSettings | null = null, section: "config" | "template" = "config") {
    setEditing(item ? { ...empty, ...item, htmlTemplate: item.htmlTemplate || empty.htmlTemplate } : empty);
    setTemplateMode("visual");
    setEditorSection(section);
    setIsEditorOpen(true);
  }

  function applyVisualFormat(command: string, value?: string) {
    visualEditorRef.current?.focus();
    document.execCommand(command, false, value);
    if (visualEditorRef.current) setEditing((current) => ({ ...current, htmlTemplate: visualEditorRef.current?.innerHTML ?? current.htmlTemplate }));
  }

  function insertLink() {
    const url = window.prompt("URL del enlace", "https://");
    if (url) applyVisualFormat("createLink", url);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      await api<NotificationSettings>(`/api/notification-settings${editing.id ? `/${editing.id}` : ""}`, {
        method: editing.id ? "PUT" : "POST",
        body: JSON.stringify(editing)
      });
      showToast(editing.id ? "Configuración de notificaciones editada." : "Configuración de notificaciones creada.");
      setIsEditorOpen(false);
      setEditing(empty);
      await load();
    } finally {
      setIsSaving(false);
    }
  }

  async function removeSettings(id: string) {
    if (!window.confirm("¿Eliminar lógicamente esta configuración de notificaciones? Quedará inactiva.")) return;
    await api(`/api/notification-settings/${id}`, { method: "DELETE" });
    showToast("Configuración de notificaciones eliminada lógicamente.");
    await load();
  }

  const visibleItems = items.filter((item) => matchesSearch([item.name, item.emailTo, item.teamsChannel, item.powerAutomateWebhookUrl, item.isActive ? "Activo" : "Inactivo"], search));

  return (
    <main className="app-shell">
      <AppNav />
      <section className="content-shell">
        {isEditorOpen && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <section className="modal-panel">
              <div className="card-head">
                <h2>{editing.id ? "Editar notificación" : "Crear notificación"}</h2>
                <button className="icon-button" type="button" title="Cerrar formulario" disabled={isSaving} onClick={() => setIsEditorOpen(false)}><X size={16} /></button>
              </div>
              <form className="form top-space" onSubmit={save}>
                <div className="editor-section-tabs field-wide" role="tablist" aria-label="Sección de notificación">
                  <button className={editorSection === "config" ? "active" : ""} type="button" role="tab" aria-selected={editorSection === "config"} onClick={() => setEditorSection("config")}>Configuración</button>
                  <button className={editorSection === "template" ? "active" : ""} type="button" role="tab" aria-selected={editorSection === "template"} onClick={() => { setEditorSection("template"); syncVisualEditor(); }}><FileCode2 size={16} /> Plantilla HTML</button>
                </div>
                {editorSection === "config" && <>
                  <label className="field"><span>{t("Nombre")}</span><input required maxLength={120} value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /></label>
                  <label className="field field-wide"><span>Webhook Power Automate</span><input type="url" placeholder="https://prod-..." value={editing.powerAutomateWebhookUrl} onChange={(event) => setEditing({ ...editing, powerAutomateWebhookUrl: event.target.value })} /></label>
                  <label className="check-field field-wide"><input type="checkbox" checked={editing.emailEnabled} onChange={(event) => setEditing({ ...editing, emailEnabled: event.target.checked })} /> Enviar correo</label>
                  {editing.emailEnabled && <label className="field field-wide"><span>Correos destino</span><input type="email" multiple placeholder="correo@dominio.com" value={editing.emailTo} onChange={(event) => setEditing({ ...editing, emailTo: event.target.value })} /></label>}
                  <label className="check-field field-wide"><input type="checkbox" checked={editing.teamsEnabled} onChange={(event) => setEditing({ ...editing, teamsEnabled: event.target.checked })} /> Enviar Teams</label>
                  {editing.teamsEnabled && <label className="field"><span>Canal Teams</span><input maxLength={300} value={editing.teamsChannel} onChange={(event) => setEditing({ ...editing, teamsChannel: event.target.value })} /></label>}
                </>}
                {editorSection === "template" && <div className="field field-wide">
                  <span>Plantilla HTML</span>
                  <div className="template-mode-switch" role="group" aria-label="Modo de edición de plantilla">
                    <button className={templateMode === "visual" ? "active" : ""} type="button" aria-pressed={templateMode === "visual"} onClick={() => { setTemplateMode("visual"); syncVisualEditor(); }}><Type size={16} /> Visual</button>
                    <button className={templateMode === "html" ? "active" : ""} type="button" aria-pressed={templateMode === "html"} onClick={() => setTemplateMode("html")}><Code2 size={16} /> HTML</button>
                    <button className={templateMode === "preview" ? "active" : ""} type="button" aria-pressed={templateMode === "preview"} onClick={() => setTemplateMode("preview")}><Eye size={16} /> Vista previa</button>
                  </div>
                  {templateMode === "visual" && <>
                    <div className="toolbar rich-html-toolbar" role="toolbar" aria-label="Formato de plantilla">
                      <button className="icon-button" type="button" title="Negrita" onClick={() => applyVisualFormat("bold")}><Bold size={16} /></button>
                      <button className="icon-button" type="button" title="Cursiva" onClick={() => applyVisualFormat("italic")}><Italic size={16} /></button>
                      <button className="icon-button" type="button" title="Subrayado" onClick={() => applyVisualFormat("underline")}><Underline size={16} /></button>
                      <button className="icon-button" type="button" title="Convertir en título" onClick={() => applyVisualFormat("formatBlock", "h2")}><Heading2 size={16} /></button>
                      <button className="icon-button" type="button" title="Convertir en párrafo" onClick={() => applyVisualFormat("formatBlock", "p")}><Pilcrow size={16} /></button>
                      <button className="icon-button" type="button" title="Insertar enlace" onClick={insertLink}><Link2 size={16} /></button>
                      <button className="button secondary compact" type="button" title="Restaurar plantilla por defecto" onClick={() => { setEditing({ ...editing, htmlTemplate: empty.htmlTemplate }); if (visualEditorRef.current) visualEditorRef.current.innerHTML = empty.htmlTemplate; }}>Plantilla base</button>
                    </div>
                    <div ref={visualEditorRef} className="rich-html-editor" contentEditable suppressContentEditableWarning role="textbox" aria-label="Editor visual de plantilla" onInput={(event) => setEditing({ ...editing, htmlTemplate: event.currentTarget.innerHTML })} />
                  </>}
                  {templateMode === "html" && <textarea aria-label="Código HTML de plantilla" rows={12} maxLength={8000} value={editing.htmlTemplate} onChange={(event) => setEditing({ ...editing, htmlTemplate: event.target.value })} />}
                  {templateMode === "preview" && <div className="html-preview template-preview" dangerouslySetInnerHTML={{ __html: previewHtml(editing.htmlTemplate) }} />}
                </div>}
                <label className="check-field field-wide"><input type="checkbox" checked={editing.isActive} onChange={(event) => setEditing({ ...editing, isActive: event.target.checked })} /> Activo</label>
                <div className="form-actions">
                  <button className="button" title="Guardar configuración de notificaciones" disabled={isSaving}>{editing.id ? <Save size={16} /> : <Plus size={16} />} {isSaving ? "Guardando" : editing.id ? "Guardar" : "Crear"}</button>
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
              <button className="icon-button" title="Crear configuración de notificaciones" onClick={() => openEditor()}><Plus size={16} /></button>
              <button className="button secondary" title="Crear o configurar una plantilla HTML" onClick={() => openEditor(null, "template")}><FileCode2 size={16} /> Plantilla HTML</button>
              <button className="button secondary" title="Actualizar detalle de configuraciones" onClick={load}><RefreshCw size={16} /> Actualizar</button>
            </div>
          </div>
          <label className="field top-space"><span>Buscar configuraciones</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPagination((current) => ({ ...current, page: 1 })); }} placeholder="Nombre, correo, Teams, webhook, estado..." /></label>
          <div className="stack compact-stack top-space">
            {paginate(visibleItems, pagination).items.map((item) => (
              <article className="card compact-card" key={item.id}>
                <div className="card-head">
                  <div className="compact-title">
                    <h3><Highlight search={search}>{item.name}</Highlight></h3>
                    <p>{item.powerAutomateWebhookUrl ? "Power Automate configurado" : "Webhook pendiente"}</p>
                  </div>
                  <div className="card-meta">
                    <span className="badge">{item.isActive ? "Activo" : "Inactivo"}</span>
                    <div className="actions">
                      <button className="icon-button" title="Editar configuración de notificaciones" onClick={() => openEditor(item)}><Edit3 size={16} /></button>
                      <button className="icon-button" title="Editar plantilla HTML" onClick={() => openEditor(item, "template")}><FileCode2 size={16} /></button>
                      <button className="icon-button danger" title="Eliminar lógicamente la configuración de notificaciones" onClick={() => removeSettings(item.id)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
                <div className="detail-grid compact-detail-grid">
                  <div className="detail-item"><span>Correo</span><strong><Highlight search={search}>{item.emailEnabled ? item.emailTo || "Habilitado" : "Deshabilitado"}</Highlight></strong></div>
                  <div className="detail-item"><span>Teams</span><strong><Highlight search={search}>{item.teamsEnabled ? item.teamsChannel || "Habilitado" : "Deshabilitado"}</Highlight></strong></div>
                  <div className="detail-item"><span>Webhook</span><strong>{item.powerAutomateWebhookUrl ? "Configurado" : "N/A"}</strong></div>
                </div>
              </article>
            ))}
          </div>
          <PaginationControls state={pagination} totalItems={visibleItems.length} onChange={setPagination} />
        </section>
      </section>
    </main>
  );
}

function previewHtml(template: string) {
  return (template || empty.htmlTemplate)
    .replaceAll("{{productId}}", "PROD-001")
    .replaceAll("{{productType}}", "Arte post")
    .replaceAll("{{requirementType}}", "Institucional")
    .replaceAll("{{productResponsible}}", "Equipo creativo")
    .replaceAll("{{diffusionChannel}}", "Instagram")
    .replaceAll("{{mainKpi}}", "Alcance")
    .replaceAll("{{approvedBy}}", "Aprobador principal")
    .replaceAll("{{comments}}", "Producto aprobado para publicación.");
}
