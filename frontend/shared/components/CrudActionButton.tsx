import { Pencil, Plus, Trash2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type CrudAction = "create" | "edit" | "delete";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  action: CrudAction;
  label: string;
};

const icons = { create: Plus, edit: Pencil, delete: Trash2 };

export function CrudActionButton({ action, label, className = "", type = "button", ...props }: Props) {
  const Icon = icons[action];
  const classes = ["icon-button", action === "delete" ? "danger" : "", className].filter(Boolean).join(" ");
  return <button {...props} className={classes} type={type} title={label} aria-label={label}><Icon aria-hidden="true" size={16} /></button>;
}
