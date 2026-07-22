import { FileText } from "lucide-react";
import { evidencePreviewKind } from "../utils/evidence.utils";

type EvidencePreviewProps = {
  fileName: string;
  source: string;
  contentType?: string;
  className?: string;
};

export function EvidencePreview({ fileName, source, contentType = "", className = "" }: EvidencePreviewProps) {
  const kind = evidencePreviewKind(fileName, contentType);
  if (kind === "image") return (
    <div className={`file-preview ${className}`.trim()}>
      {/* eslint-disable-next-line @next/next/no-img-element -- admite URLs blob y orígenes externos dinámicos */}
      <img src={source} alt={fileName} />
    </div>
  );
  if (kind === "pdf") return <div className={`file-preview ${className}`.trim()}><iframe src={source} title={fileName} /></div>;
  return <div className="inline-facts"><span><FileText size={14} /> Vista previa no disponible para este tipo de archivo.</span></div>;
}
