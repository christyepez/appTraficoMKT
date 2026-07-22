import { CrudActionButton } from "../../../shared/components/CrudActionButton";
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
      <CrudActionButton action="edit" label={`Editar ${user.name}`} disabled={pending} onClick={() => onEdit(user)} />
      <CrudActionButton action="delete" label={`Inactivar ${user.name}`} disabled={pending || !user.isActive} onClick={() => onDisable(user.id)} />
    </div>
  );
}
