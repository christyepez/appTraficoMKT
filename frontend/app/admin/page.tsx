"use client";

import { AppNav } from "../nav";
import { Approver, NamedCatalog, api, showToast } from "../lib";
import { PaginationControls, paginate, type PaginationState } from "../pagination";
import { Edit3, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type CatalogKind = "faculties" | "campuses" | "careers" | "catalogs" | "approvers";
type CatalogRow = NamedCatalog | Approver | Career;

type Career = NamedCatalog & {
  facultyId: string;
};

const catalogTypes = [
  "EstadoRequerimiento",
  "FormatoEvento",
  "EstadoProducto",
  "TipoProducto",
  "TipoRequerimiento",
  "PublicoObjetivo",
  "CanalDifusion",
  "KpiPrincipal"
];

const catalogGroups: Array<{ kind: CatalogKind; label: string; type?: string }> = [
  { kind: "faculties", label: "Facultades" },
  { kind: "careers", label: "Carreras" },
  { kind: "campuses", label: "Sedes" },
  { kind: "approvers", label: "Aprobadores" },
  ...catalogTypes.map((type) => ({ kind: "catalogs" as const, label: type, type }))
];

function groupLabel(kind: CatalogKind, catalogType: string) {
  if (kind === "faculties") return "Facultades";
  if (kind === "careers") return "Carreras";
  if (kind === "campuses") return "Sedes";
  if (kind === "approvers") return "Aprobadores";
  return catalogType;
}

export default function AdminPage() {
  const [kind, setKind] = useState<CatalogKind>("faculties");
  const [catalogType, setCatalogType] = useState(catalogTypes[0]);
  const [customCatalogType, setCustomCatalogType] = useState("");
  const [items, setItems] = useState<CatalogRow[]>([]);
  const [faculties, setFaculties] = useState<NamedCatalog[]>([]);
  const [message, setMessage] = useState("Seleccione un catálogo y administre su información.");
  const [editing, setEditing] = useState<CatalogRow | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 10 });

  const visibleCatalogGroups = useMemo(() => {
    const hasCustom = catalogGroups.some((group) => group.kind === "catalogs" && group.type === catalogType);
    return hasCustom ? catalogGroups : [...catalogGroups, { kind: "catalogs" as const, label: catalogType, type: catalogType }];
  }, [catalogType]);

  async function load(selected = kind) {
    const url = selected === "catalogs"
      ? `/api/admin/catalogs/by-type/${encodeURIComponent(catalogType)}`
      : `/api/admin/${selected}`;
    const [rows, facultyRows] = await Promise.all([
      api<CatalogRow[]>(url),
      api<NamedCatalog[]>("/api/admin/faculties")
    ]);
    setItems(rows);
    setFaculties(facultyRows);
  }

  useEffect(() => {
    const timer = window.setInterval(() => load().catch(() => undefined), 10000);
    load().catch(() => location.assign("/login"));
    return () => window.clearInterval(timer);
  }, [kind, catalogType]);

  function selectCatalogGroup(group: { kind: CatalogKind; type?: string }) {
    setKind(group.kind);
    if (group.type) setCatalogType(group.type);
    setCustomCatalogType("");
    setEditing(null);
    setIsEditorOpen(false);
  }

  function openEditor(item: CatalogRow | null = null) {
    setEditing(item);
    setCustomCatalogType("");
    setIsEditorOpen(true);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      const effectiveCatalogType = customCatalogType.trim() || catalogType;
      const body = kind === "approvers"
        ? {
            name: form.get("name"),
            email: form.get("email"),
            approvalLevel: Number(form.get("approvalLevel") || 1),
            facultyId: form.get("facultyId") || null,
            campusId: null,
            isActive: form.get("isActive") === "on"
          }
        : kind === "careers"
          ? {
              code: form.get("code"),
              name: form.get("name"),
              facultyId: form.get("facultyId"),
              isActive: form.get("isActive") === "on"
            }
          : {
              type: kind === "catalogs" ? effectiveCatalogType : "General",
              code: form.get("code"),
              name: form.get("name"),
              isActive: form.get("isActive") === "on"
            };

      await api(`/api/admin/${kind}${editing ? `/${editing.id}` : ""}`, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(body)
      });

      setEditing(null);
      setIsEditorOpen(false);
      const currentLabel = groupLabel(kind, effectiveCatalogType);
      setMessage(editing ? `${currentLabel} editado.` : `${currentLabel} creado.`);
      showToast(editing ? "Registro editado correctamente." : "Registro creado correctamente.");
      if (kind === "catalogs" && customCatalogType.trim()) {
        setCatalogType(effectiveCatalogType);
        setCustomCatalogType("");
      }
      await load();
    } finally {
      setIsSaving(false);
    }
  }

  async function disable(id: string) {
    await api(`/api/admin/${kind}/${id}`, { method: "DELETE" });
    showToast("Registro inactivado correctamente.");
    await load();
  }

  function facultyName(id?: string) {
    return faculties.find((faculty) => faculty.id === id)?.name ?? "Sin facultad";
  }

  return (
    <main className="app-shell">
      <AppNav />
      <section className="content-shell">
        {isEditorOpen && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <section className="modal-panel">
              <div className="card-head">
                <h2>{editing ? `Editar ${groupLabel(kind, catalogType)}` : `Crear ${groupLabel(kind, catalogType)}`}</h2>
                <button className="icon-button" type="button" title="Cerrar formulario" disabled={isSaving} onClick={() => setIsEditorOpen(false)}><X size={16} /></button>
              </div>
              <form className="form top-space" onSubmit={save} key={`${kind}-${catalogType}-${editing?.id ?? "new"}`}>
                {kind === "catalogs" && (
                  <>
                    <label className="field">
                      <span>Tipo de catálogo</span>
                      <input name="type" readOnly value={customCatalogType.trim() || catalogType} />
                    </label>
                    <label className="field">
                      <span>Crear nuevo catálogo</span>
                      <input maxLength={80} placeholder="Ej. Carrera" value={customCatalogType} onChange={(event) => setCustomCatalogType(event.target.value)} />
                    </label>
                  </>
                )}
                {kind !== "approvers" && <label className="field"><span>Código</span><input name="code" required pattern="[A-Za-z0-9_-]{2,40}" title="Use letras, números, guion o guion bajo." defaultValue={"code" in (editing ?? {}) ? (editing as NamedCatalog).code : ""} /></label>}
                <label className="field"><span>Nombre</span><input name="name" required defaultValue={editing?.name ?? ""} /></label>
                {kind === "careers" && (
                  <label className="field">
                    <span>Facultad</span>
                    <select name="facultyId" required defaultValue={"facultyId" in (editing ?? {}) ? (editing as Career).facultyId : faculties[0]?.id ?? ""}>
                      <option value="">Seleccione...</option>
                      {faculties.map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.name}</option>)}
                    </select>
                  </label>
                )}
                {kind === "approvers" && <label className="field"><span>Email</span><input name="email" type="email" required defaultValue={"email" in (editing ?? {}) ? (editing as Approver).email : ""} /></label>}
                {kind === "approvers" && (
                  <label className="field">
                    <span>Facultad</span>
                    <select name="facultyId" defaultValue={"facultyId" in (editing ?? {}) ? ((editing as Approver).facultyId ?? "") : ""}>
                      <option value="">Todas</option>
                      {faculties.map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.name}</option>)}
                    </select>
                  </label>
                )}
                {kind === "approvers" && <label className="field"><span>Nivel</span><input name="approvalLevel" type="number" min="1" defaultValue={"approvalLevel" in (editing ?? {}) ? (editing as Approver).approvalLevel : 1} /></label>}
                <label className="check-field field-wide"><input name="isActive" type="checkbox" defaultChecked={editing?.isActive ?? true} /> Activo</label>
                <div className="form-actions">
                  <button className="button" title={editing ? "Guardar cambios del registro" : "Crear registro"} disabled={isSaving}>{editing ? <Save size={16} /> : <Plus size={16} />} {isSaving ? "Guardando" : editing ? "Guardar" : "Crear"}</button>
                  <button className="button secondary" type="button" title="Cancelar edición" disabled={isSaving} onClick={() => setIsEditorOpen(false)}><X size={16} /> Cancelar</button>
                </div>
              </form>
            </section>
          </div>
        )}

        <section className="panel">
          <div className="card-head">
            <div>
              <h2>Administración de catálogos</h2>
              <span className="badge">{message}</span>
            </div>
            <div className="actions">
              <button className="icon-button" title={`Crear ${groupLabel(kind, catalogType)}`} onClick={() => openEditor()}><Plus size={16} /></button>
              <button className="button secondary" title="Actualizar detalle" onClick={() => load()}><RefreshCw size={16} /> Actualizar</button>
            </div>
          </div>

          <div className="catalog-tabs catalog-tabs-horizontal top-space">
            {visibleCatalogGroups.map((group) => {
              const active = kind === group.kind && (group.kind !== "catalogs" || group.type === catalogType);
              return (
                <button className={active ? "tab active" : "tab"} key={`${group.kind}-${group.type ?? group.label}`} type="button" title={`Administrar catálogo ${group.label}`} onClick={() => selectCatalogGroup(group)}>
                  {group.label}
                </button>
              );
            })}
          </div>

          <div className="stack compact-stack top-space">
            {paginate(items, pagination).items.map((item) => (
              <article className="card compact-card" key={item.id}>
                <div className="card-head">
                  <div className="compact-title">
                    <h3>{"code" in item && item.code ? `${item.code} - ${item.name}` : item.name}</h3>
                    <p>
                      {"email" in item ? item.email : "facultyId" in item ? facultyName(item.facultyId) : "type" in item ? item.type : "Catálogo institucional"}
                    </p>
                  </div>
                  <div className="card-meta">
                    <span className="badge">{item.isActive ? "Activo" : "Inactivo"}</span>
                    <div className="actions">
                      <button className="icon-button" title="Editar registro seleccionado" onClick={() => openEditor(item)}><Edit3 size={16} /></button>
                      <button className="icon-button danger" title="Inactivar registro seleccionado" onClick={() => disable(item.id)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
                {("facultyId" in item || "email" in item || "approvalLevel" in item) && (
                <div className="detail-grid compact-detail-grid">
                  {"facultyId" in item && <div className="detail-item"><span>Facultad</span><strong>{facultyName(String(item.facultyId ?? ""))}</strong></div>}
                  {"email" in item && <div className="detail-item"><span>Email</span><strong>{String(item.email ?? "")}</strong></div>}
                  {"approvalLevel" in item && <div className="detail-item"><span>Nivel</span><strong>{String(item.approvalLevel ?? "")}</strong></div>}
                </div>
                )}
              </article>
            ))}
          </div>
          <PaginationControls state={pagination} totalItems={items.length} onChange={setPagination} />
        </section>
      </section>
    </main>
  );
}
