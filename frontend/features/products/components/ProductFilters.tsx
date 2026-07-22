type ProductFiltersProps = {
  searchTerm: string;
  showCompleted: boolean;
  isRefreshing: boolean;
  onSearchChange: (value: string) => void;
  onShowCompletedChange: (value: boolean) => void;
};

export function ProductFilters({ searchTerm, showCompleted, isRefreshing, onSearchChange, onShowCompletedChange }: ProductFiltersProps) {
  return (
    <div aria-label="Filtros de productos">
      <label className="field top-space">
        <span>Buscar en seguimiento</span>
        <input value={searchTerm} onChange={(event) => onSearchChange(event.target.value)} placeholder="Buscar por producto, responsable, KPI, canal, estado..." />
      </label>
      <label className="check-field top-space">
        <input type="checkbox" checked={showCompleted} onChange={(event) => onShowCompletedChange(event.target.checked)} /> Ver productos finalizados
      </label>
      {isRefreshing && <span className="badge top-space" role="status">Actualizando productos…</span>}
    </div>
  );
}
