import { useMemo, useState } from "react";
import { PaginationControls, paginate, type PaginationState } from "../../../app/pagination";
import type { EvidenceItem, Product } from "../models/product.models";
import { matchesProductSearch, normalizeProductStatus } from "../utils/product.utils";
import { ProductCard } from "./ProductCard";
import styles from "../styles/Product.module.css";

type ProductListProps = {
  products: Product[];
  evidence: EvidenceItem[];
  searchTerm: string;
  showCompleted: boolean;
  isInitialLoading: boolean;
  loadError: string;
  pendingProductIds: Set<string>;
  onRetry: () => void;
  onChangeStatus: (productId: string, action: "start" | "submit-approval") => void;
  onAttach: (productId: string) => void;
  onViewEvidence: (productId: string) => void;
  onViewApprovals: (productId: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
};

export function ProductList({ products, evidence, searchTerm, showCompleted, isInitialLoading, loadError, pendingProductIds, onRetry, onChangeStatus, onAttach, onViewEvidence, onViewApprovals, onEdit, onDelete }: ProductListProps) {
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 10 });
  const filtered = useMemo(() => products
    .filter((item) => showCompleted ? normalizeProductStatus(item.status) === "Approved" : normalizeProductStatus(item.status) !== "Approved")
    .filter((item) => matchesProductSearch(item, searchTerm)), [products, searchTerm, showCompleted]);
  const page = paginate(filtered, pagination);

  if (isInitialLoading) return <div className="empty" role="status">Cargando productos…</div>;

  return (
    <>
      {loadError && (
        <div className="empty" role="alert">
          <p>{loadError}</p>
          <button className="button secondary compact" type="button" onClick={onRetry}>Reintentar</button>
        </div>
      )}
      {!loadError && products.length === 0 && <div className="empty">Aún no hay productos registrados.</div>}
      {products.length > 0 && filtered.length === 0 && <div className="empty">No hay productos que coincidan con los filtros seleccionados.</div>}
      {filtered.length > 0 && (
        <>
          <div className={`stack compact-stack top-space ${styles.productList}`}>
            {page.items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                searchTerm={searchTerm}
                evidenceCount={evidence.filter((item) => item.activityId === product.id).length}
                pending={pendingProductIds.has(product.id)}
                onChangeStatus={onChangeStatus}
                onAttach={onAttach}
                onViewEvidence={onViewEvidence}
                onViewApprovals={onViewApprovals}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
          <PaginationControls state={{ ...pagination, page: page.page }} totalItems={filtered.length} onChange={setPagination} />
        </>
      )}
    </>
  );
}
