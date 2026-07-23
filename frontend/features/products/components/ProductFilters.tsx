type ProductFiltersProps = {
  searchTerm: string;
  showCompleted: boolean;
  isRefreshing: boolean;
  onSearchChange: (value: string) => void;
  onShowCompletedChange: (value: boolean) => void;
};

export function ProductFilters({ searchTerm, showCompleted, isRefreshing, onSearchChange, onShowCompletedChange }: ProductFiltersProps) {
  return (
    <fieldset className={styles.filters} aria-label="Filtros de productos">
      <legend className={styles.visuallyHidden}>Filtros de productos</legend>
      <label className={`field ${styles.searchField}`}>
        <span>Buscar en seguimiento</span>
        <input value={searchTerm} onChange={(event) => onSearchChange(event.target.value)} placeholder="Buscar por producto, responsable, KPI, canal, estado..." />
      </label>
      <div className="check-group">
        <label className={`check-field ${styles.completedToggle}`}>
          Ver productos finalizados <input type="checkbox" checked={showCompleted} onChange={(event) => onShowCompletedChange(event.target.checked)} />
        </label>
        {isRefreshing && <span className={`badge ${styles.updating}`} role="status">Actualizando productos…</span>}
      </div>
    </fieldset>
  );
}
import styles from "../styles/Product.module.css";
