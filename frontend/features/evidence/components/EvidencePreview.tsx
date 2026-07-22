import { EvidencePreview as SharedEvidencePreview } from "../../../shared/components/EvidencePreview";
import styles from "../styles/Evidence.module.css";

export function EvidencePreview(props: { fileName: string; source: string; contentType?: string }) {
  return <SharedEvidencePreview {...props} className={styles.preview} />;
}
