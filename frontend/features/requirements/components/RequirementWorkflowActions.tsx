import { FileCheck2, Play, Search } from "lucide-react";
import type { Requirement, RequirementStatusAction } from "../models/requirement.models";
import { requirementStepState, workflowButtonClass } from "../utils/requirement.utils";

export function RequirementWorkflowActions({ requirement, pending, onChangeStatus }: { requirement: Requirement; pending: boolean; onChangeStatus: (id: string, action: RequirementStatusAction) => void }) {
  const actions: Array<{ action: RequirementStatusAction; title: string; icon: typeof Search }> = [
    { action: "analysis", title: "Cambiar requerimiento a análisis", icon: Search },
    { action: "execution", title: "Cambiar requerimiento a ejecución", icon: Play },
    { action: "complete", title: "Completar si todos los productos están aprobados", icon: FileCheck2 }
  ];
  return <>{actions.map(({ action, title, icon: Icon }) => { const state = requirementStepState(requirement, action); return <button key={action} className={workflowButtonClass(state)} type="button" disabled={pending || state !== "ready"} title={title} aria-label={title} onClick={() => onChangeStatus(requirement.id, action)}><Icon size={16} /></button>; })}</>;
}
