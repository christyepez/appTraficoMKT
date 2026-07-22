import { FileText } from "lucide-react";
import { evidencePreviewKind } from "../utils/evidence.utils";

type EvidencePreviewProps = {
  fileName: string;
  source: string;
  contentType?: string;
};

export function EvidencePreview({ fileName, source, contentType = "" }: EvidencePreviewProps) {
  const kind = evidencePreviewKind(fileName, contentType);
  if (kind === "image") return <div className="file-preview"><img src={source} alt={fileName} /></div>;
  if (kind === "pdf") return <div className="file-preview"><iframe src={source} title={fileName} /></div>;
  return <div className="inline-facts"><span><FileText size={14} /> Vista previa no disponible para este tipo de archivo.</span></div>;
}
