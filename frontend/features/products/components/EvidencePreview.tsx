import { EvidencePreview as SharedEvidencePreview } from "../../../shared/components/EvidencePreview";
import styles from "../styles/Product.module.css";

type EvidencePreviewProps = {
  fileName: string;
  source: string;
  contentType?: string;
};

export function EvidencePreview({ fileName, source, contentType = "" }: EvidencePreviewProps) {
  return <SharedEvidencePreview fileName={fileName} source={source} contentType={contentType} className={styles.preview} />;
}
