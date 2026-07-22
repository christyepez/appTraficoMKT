import { cloneElement, type ReactElement } from "react";

type Props = {
  label: string;
  error?: string;
  wide?: boolean;
  idPrefix?: string;
  errorClassName?: string;
  children: ReactElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }>;
};

export function FormField({ label, error, wide = false, idPrefix = "field", errorClassName = "field-error", children }: Props) {
  const id = `${idPrefix}-${label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
  const errorId = `${id}-error`;
  return (
    <div className={`field${wide ? " field-wide" : ""}`}>
      <label htmlFor={id}><span>{label}</span></label>
      {cloneElement(children, { id, "aria-invalid": Boolean(error) || undefined, "aria-describedby": error ? errorId : undefined })}
      {error && <small id={errorId} className={errorClassName || undefined} role="alert">{error}</small>}
    </div>
  );
}
