import { X } from "lucide-react";
import type { Activity } from "../../../shared/models/api.models";
import type { Requirement } from "../models/requirement.models";
import { activityStatusLabel } from "../utils/requirement.utils";
import { RequirementDialog } from "./RequirementDialog";

export function RelatedProductsDialog({ requirement, activities, onClose }: { requirement: Requirement; activities: Activity[]; onClose: () => void }) {
  const related = activities.filter((item) => item.requirementId === requirement.id);
  return <RequirementDialog labelledBy="related-products-title" onClose={onClose} wide><div className="card-head"><div className="compact-title"><h2 id="related-products-title">Productos relacionados</h2><p>{requirement.code} - {requirement.activityOrEvent}</p></div><button autoFocus className="icon-button" type="button" aria-label="Cerrar productos relacionados" onClick={onClose}><X size={16} /></button></div>{related.length ? <div className="table-scroll top-space"><table className="data-table related-products-table"><thead><tr><th>Producto</th><th>Responsable</th><th>Entrega</th><th>Estado</th></tr></thead><tbody>{related.map((item) => <tr key={item.id}><td><strong>{item.productId}</strong><span>{item.productType}</span></td><td>{item.productResponsible}</td><td>{item.productDeliveryDate || "Sin fecha"}</td><td><span className="badge">{activityStatusLabel(item.status)}</span></td></tr>)}</tbody></table></div> : <div className="empty top-space">Este requerimiento todavía no tiene productos relacionados.</div>}</RequirementDialog>;
}
