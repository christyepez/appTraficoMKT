import type { ManagedUser } from "../models/user.models";

export function UserStatusActions({
  user,
  pending,
  onEdit,
  onDisable
}: {
  user: ManagedUser;
  pending: boolean;
  onEdit: (user: ManagedUser) => void;
  onDisable: (id: string) => void;
}) {
  return (
    <div className="actions">
      <button disabled={pending} onClick={() => onEdit(user)}>
        Editar
      </button>
      <button disabled={pending || !user.isActive} onClick={() => onDisable(user.id)}>
        {pending ? "Procesando" : "Inactivar"}
      </button>
    </div>
  );
}
