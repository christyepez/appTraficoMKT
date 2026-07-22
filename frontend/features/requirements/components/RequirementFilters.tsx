import styles from "../styles/Requirements.module.css";

type Props = { search: string; showCompleted: boolean; refreshing: boolean; onSearch: (value: string) => void; onShowCompleted: (value: boolean) => void };

export function RequirementFilters({ search, showCompleted, refreshing, onSearch, onShowCompleted }: Props) {
  return (
    <fieldset aria-label="Filtros de requerimientos">
      <legend className={styles.visuallyHidden}>Filtros de requerimientos</legend>
      <label className="field top-space"><span>Buscar en seguimiento</span><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Código, actividad, solicitante, facultad, carrera…" /></label>
      <label className="check-field top-space"><input type="checkbox" checked={showCompleted} onChange={(event) => onShowCompleted(event.target.checked)} /> Ver requerimientos finalizados</label>
      {refreshing && <span className="badge" role="status">Actualizando requerimientos…</span>}
    </fieldset>
  );
}
