import type { FieldError, FieldPath, UseFormRegister } from "react-hook-form";
import type { ProductFormValues } from "../schemas/product.schema";
import styles from "./ProductForm.module.css";

type SelectOption = { id: string; name: string };

type ProductSelectFieldProps = {
  label: string;
  name: FieldPath<ProductFormValues>;
  options: SelectOption[];
  register: UseFormRegister<ProductFormValues>;
  error?: FieldError;
};

export function ProductSelectField({ label, name, options, register, error }: ProductSelectFieldProps) {
  const errorId = `${name}-error`;

  return (
    <label className="field" htmlFor={name}>
      <span>{label}</span>
      <select id={name} {...register(name)} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined}>
        <option value="">Seleccione...</option>
        {options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
      {error && <span className={styles.fieldError} id={errorId} role="alert">{error.message}</span>}
    </label>
  );
}
