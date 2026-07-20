"use client";

import { AppNav } from "../nav";
import { api, showToast } from "../lib";
import { PaginationControls, paginate, type PaginationState } from "../pagination";
import { Highlight } from "../search";
import { Edit3, Plus, RefreshCw, Save, ShieldCheck, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  authProvider: string;
  allowMicrosoftLogin: boolean;
  roles: string[];
  screenPermissions: string[];
  menuMode: "horizontal" | "vertical";
  menuCollapsed: boolean;
  isActive: boolean;
};

const screenLabels: Record<string, string> = {
  dashboard: "Requerimientos",
  activities: "Productos",
  agenda: "Agenda técnica",
  "agenda-calendar": "Calendario técnico",
  "agenda-metrics": "Métricas agenda",
  evidence: "Adjuntos",
  approvals: "Aprobaciones",
  metrics: "Métricas",
  audit: "Auditorías",
  admin: "Administración",
  users: "Usuarios",
  storage: "Archivos",
  "initial-import": "Carga inicial",
  branding: "Manejo Marca",
  notifications: "Notificaciones",
  "my-notifications": "Mis notificaciones",
  "notification-log": "Registro notificaciones"
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [screens, setScreens] = useState<string[]>([]);
  const [message, setMessage] = useState("Usuarios y perfiles.");
  const [editing, setEditing] = useState<User | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [selectedRole, setSelectedRole] = useState("Solicitante");
  const [selectedScreens, setSelectedScreens] = useState<string[]>(["dashboard"]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 10 });

  async function load() {
    const [userData, roleData, screenData] = await Promise.all([
      api<User[]>("/api/identity/users"),
      api<string[]>("/api/identity/roles"),
      api<string[]>("/api/identity/screens")
    ]);
    setUsers(userData);
    setRoles(roleData);
    setScreens(screenData);
  }

  useEffect(() => {
    const timer = window.setInterval(() => load().catch(() => undefined), 10000);
    load().catch(() => location.assign("/login"));
    return () => window.clearInterval(timer);
  }, []);

  function openEditor(user: User | null = null) {
    setEditing(user);
    setSelectedRole(user?.roles[0] ?? roles[0] ?? "Solicitante");
    setSelectedScreens(user?.screenPermissions ?? defaultScreensForRole(roles[0] ?? "Solicitante"));
    setIsEditorOpen(true);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    const form = new FormData(event.currentTarget);
    if (selectedScreens.length === 0) {
      showToast("Debe asignar al menos una pantalla visible.", "error");
      return;
    }
    setIsSaving(true);
    try {
      await api<User>(`/api/identity/users${editing ? `/${editing.id}` : ""}`, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
          ...(!editing ? { authProvider: form.get("authProvider") } : {}),
          allowMicrosoftLogin: form.get("allowMicrosoftLogin") === "on",
          roles: [selectedRole],
          screenPermissions: selectedScreens,
          facultyId: null,
          campusId: null,
          menuMode: form.get("menuMode"),
          menuCollapsed: form.get("menuCollapsed") === "on",
          isActive: form.get("isActive") === "on"
        })
      });
      setEditing(null);
      setIsEditorOpen(false);
      setMessage(editing ? "Usuario editado." : "Usuario creado.");
      showToast(editing ? "Usuario editado correctamente." : "Usuario creado correctamente.");
      await load();
    } finally {
      setIsSaving(false);
    }
  }

  function changeRole(role: string) {
    setSelectedRole(role);
    setSelectedScreens(defaultScreensForRole(role));
  }

  const visibleUsers = users.filter((user) => showInactive ? !user.isActive : user.isActive).filter((user) => matchesUserSearch(user, searchTerm));

  async function removeUser(id: string) {
    if (!window.confirm("¿Eliminar lógicamente este usuario? El usuario quedará inactivo.")) return;
    await api(`/api/identity/users/${id}`, { method: "DELETE" });
    showToast("Usuario eliminado lógicamente.");
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
                <h2>{editing ? "Editar usuario" : "Crear usuario"}</h2>
                <button className="icon-button" type="button" title="Cerrar formulario" disabled={isSaving} onClick={() => setIsEditorOpen(false)}><X size={16} /></button>
              </div>
              <form className="form top-space" onSubmit={save} key={editing?.id ?? "new"}>
                <label className="field"><span>Nombre</span><input name="name" required defaultValue={editing?.name ?? ""} /></label>
                <label className="field"><span>Email</span><input name="email" type="email" required defaultValue={editing?.email ?? ""} /></label>
                <label className="field">
                  <span>{editing ? "Nueva clave temporal" : "Clave inicial"}</span>
                  <input
                    name="password"
                    type="text"
                    minLength={8}
                    defaultValue={editing ? "" : "User123!"}
                    required={!editing}
                    placeholder={editing ? "Dejar vacío para no cambiar" : "Clave inicial"}
                    autoComplete="new-password"
                  />
                </label>
                <label className="field">
                  <span>Proveedor</span>
                  <select name="authProvider" defaultValue={editing?.authProvider ?? "Local"} disabled={!!editing}>
                    <option value="Local">Local</option>
                    <option value="Microsoft">Microsoft</option>
                  </select>
                </label>
                <label className="check-field field-wide"><input name="allowMicrosoftLogin" type="checkbox" defaultChecked={editing?.allowMicrosoftLogin ?? false} /> Permitir ingreso por Office 365</label>
                <label className="field">
                  <span>Menú del usuario</span>
                  <select name="menuMode" defaultValue={editing?.menuMode ?? "horizontal"}>
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                  </select>
                </label>
                <label className="check-field"><input name="menuCollapsed" type="checkbox" defaultChecked={editing?.menuCollapsed ?? false} /> Menú vertical plegado</label>
                <label className="field">
                  <span>Perfil</span>
                  <select name="role" value={selectedRole} onChange={(event) => changeRole(event.target.value)}>{roles.map((role) => <option key={role} value={role}>{role}</option>)}</select>
                </label>
                <div className="field field-wide">
                  <span>Pantallas visibles</span>
                  <div className="checkbox-grid">
                    {screens.map((screen) => (
                      <label className="check-field" key={screen}>
                        <input
                          name="screenPermissions"
                          value={screen}
                          type="checkbox"
                          checked={selectedScreens.includes(screen)}
                          onChange={(event) => setSelectedScreens((current) => event.target.checked ? [...new Set([...current, screen])] : current.filter((item) => item !== screen))}
                        />
                        {screenLabels[screen] ?? screen}
                      </label>
                    ))}
                  </div>
                </div>
                <label className="check-field field-wide"><input name="isActive" type="checkbox" defaultChecked={editing?.isActive ?? true} /> Activo</label>
                <div className="form-actions">
                  <button className="button" title={editing ? "Guardar cambios del usuario" : "Crear usuario"} disabled={isSaving}>{editing ? <Save size={16} /> : <Plus size={16} />} {isSaving ? "Guardando" : editing ? "Guardar" : "Crear"}</button>
                  <button className="button secondary" type="button" title="Cancelar edición" disabled={isSaving} onClick={() => setIsEditorOpen(false)}><X size={16} /> Cancelar</button>
                </div>
              </form>
            </section>
          </div>
        )}

        <section className="panel">
          <div className="card-head">
            <div>
              <h2>Usuarios</h2>
              <span className="badge">{message}</span>
            </div>
            <div className="actions">
              <label className="check-field"><input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} /> Ver inactivos</label>
              <button className="icon-button" title="Crear usuario" onClick={() => openEditor()}><Plus size={16} /></button>
              <button className="button secondary" title="Actualizar usuarios, roles y pantallas" onClick={load}><RefreshCw size={16} /> Actualizar</button>
            </div>
          </div>
          <label className="field top-space">
            <span>Buscar usuarios</span>
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar por nombre, correo, rol, pantalla..." />
          </label>
          <div className="stack compact-stack top-space">
            {paginate(visibleUsers, pagination).items.map((user) => (
              <article className="card compact-card" key={user.id}>
                <div className="card-head">
                  <div className="compact-title">
                    <h3>{highlight(user.name, searchTerm)}</h3>
                    <p>{highlight(`${user.email} - ${user.authProvider} ${user.allowMicrosoftLogin ? "| Office 365 activo" : "| Office 365 bloqueado"}`, searchTerm)}</p>
                    <p>{user.menuMode === "vertical" ? "Menú vertical" : "Menú horizontal"}{user.menuCollapsed ? " | plegado" : ""}</p>
                  </div>
                  <div className="card-meta">
                    <span className="badge">{user.isActive ? "Activo" : "Inactivo"}</span>
                    <div className="actions">
                      <button className="icon-button" title="Editar usuario, roles y pantallas visibles" onClick={() => openEditor(user)}><Edit3 size={16} /></button>
                      <button className="icon-button danger" title="Eliminar lógicamente el usuario" onClick={() => removeUser(user.id)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
                <div className="inline-facts">
                  {user.roles.map((role) => <span className="badge" key={role}><ShieldCheck size={14} /> {role}</span>)}
                  {user.screenPermissions.slice(0, 6).map((screen) => <span key={screen}>{screenLabels[screen] ?? screen}</span>)}
                  {user.screenPermissions.length > 6 && <span>+{user.screenPermissions.length - 6} pantallas</span>}
                </div>
              </article>
            ))}
          </div>
          <PaginationControls state={pagination} totalItems={visibleUsers.length} onChange={setPagination} />
        </section>
      </section>
    </main>
  );
}

function matchesUserSearch(user: User, term: string) {
  const query = term.trim().toLowerCase();
  if (!query) return true;
  return [user.name, user.email, user.authProvider, user.roles.join(" "), user.screenPermissions.join(" "), user.isActive ? "Activo" : "Inactivo"]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function highlight(text: string, term: string) {
  return <Highlight search={term}>{text}</Highlight>;
}

function defaultScreensForRole(role: string) {
  if (role === "Administrador") return ["dashboard", "activities", "agenda", "agenda-calendar", "agenda-metrics", "evidence", "approvals", "metrics", "audit", "admin", "users", "storage", "initial-import", "branding", "notifications", "my-notifications", "notification-log"];
  if (role === "Coordinador") return ["dashboard", "activities", "agenda", "agenda-calendar", "agenda-metrics", "evidence", "approvals", "metrics", "audit", "my-notifications"];
  if (role === "Tecnico") return ["dashboard", "activities", "agenda", "agenda-calendar", "agenda-metrics", "evidence", "my-notifications"];
  if (role === "Aprobador") return ["dashboard", "approvals", "my-notifications"];
  if (role === "Auditor") return ["dashboard", "activities", "agenda", "agenda-calendar", "agenda-metrics", "evidence", "approvals", "metrics", "audit"];
  return ["dashboard"];
}
