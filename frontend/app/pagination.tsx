"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export type PaginationState = {
  page: number;
  pageSize: number;
};

export function paginate<T>(items: T[], state: PaginationState) {
  const pageSize = Math.max(1, state.pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(Math.max(1, state.page), totalPages);
  const start = (page - 1) * pageSize;
  return {
    page,
    totalPages,
    totalItems: items.length,
    items: items.slice(start, start + pageSize)
  };
}

export function PaginationControls({
  state,
  totalItems,
  onChange
}: {
  state: PaginationState;
  totalItems: number;
  onChange: (state: PaginationState) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / state.pageSize));
  const page = Math.min(Math.max(1, state.page), totalPages);

  return (
    <div className="pagination-bar">
      <span>{totalItems} registros</span>
      <label>
        Ver
        <select value={state.pageSize} onChange={(event) => onChange({ page: 1, pageSize: Number(event.target.value) })}>
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </label>
      <button className="icon-button" type="button" title="Página anterior" disabled={page <= 1} onClick={() => onChange({ ...state, page: page - 1 })}>
        <ChevronLeft size={16} />
      </button>
      <span>Página {page} de {totalPages}</span>
      <button className="icon-button" type="button" title="Página siguiente" disabled={page >= totalPages} onClick={() => onChange({ ...state, page: page + 1 })}>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
