"use client";

import { useState } from "react";
import { CrudActionButton } from "../../../shared/components/CrudActionButton";
import type { UsersAdministrationWorkspace } from "../hooks/useUsersAdministration";
import type { ManagedUser } from "../models/user.models";
import { UserForm } from "./UserForm";
import { UserList } from "./UserList";

export function UsersAdministration({ workspace }: { workspace: UsersAdministrationWorkspace }) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState("");

  function openEditor(user: ManagedUser | null) {
    setEditing(user);
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditing(null);
  }

  return (
    <section className="content-shell">
      {editorOpen && (
        <UserForm
          key={editing?.id ?? "new"}
          user={editing}
          roles={workspace.roles}
          screens={workspace.screens}
          onSave={workspace.save}
          onClose={closeEditor}
        />
      )}
      <section className="panel">
        <div className="card-head">
          <div>
            <h2>Usuarios</h2>
            <span className="badge" role="status">{workspace.message}</span>
          </div>
          <div className="actions">
            <label className="check-field">
              <input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} />
              Ver inactivos
            </label>
            <CrudActionButton action="create" label="Crear usuario" onClick={() => openEditor(null)} />
            <button className="button secondary" disabled={workspace.isRefreshing} onClick={() => void workspace.refresh().catch(() => undefined)}>
              {workspace.isRefreshing ? "Actualizando" : "Actualizar"}
            </button>
          </div>
        </div>
        <label className="field top-space">
          <span>Buscar usuarios</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, correo, rol, pantalla..." />
        </label>
        <UserList
          users={workspace.users}
          search={search}
          inactive={showInactive}
          loading={workspace.isLoading}
          error={workspace.loadError}
          pendingIds={workspace.pendingIds}
          onRetry={() => void workspace.refresh().catch(() => undefined)}
          onEdit={openEditor}
          onDisable={(id) => void workspace.disable(id)}
        />
      </section>
    </section>
  );
}
