import { FileText } from "lucide-react";
import { evidencePreviewKind } from "../utils/evidence.utils";
import styles from "../styles/Product.module.css";

type EvidencePreviewProps = {
  fileName: string;
  source: string;
  contentType?: string;
};

export function EvidencePreview({ fileName, source, contentType = "" }: EvidencePreviewProps) {
  const kind = evidencePreviewKind(fileName, contentType);
  if (kind === "image") return (
    <div className={`file-preview ${styles.preview}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- admite URLs blob y orígenes externos dinámicos */}
      <img src={source} alt={fileName} />
    </div>
  );
  if (kind === "pdf") return <div className={`file-preview ${styles.preview}`}><iframe src={source} title={fileName} /></div>;
  return <div className="inline-facts"><span><FileText size={14} /> Vista previa no disponible para este tipo de archivo.</span></div>;
}
