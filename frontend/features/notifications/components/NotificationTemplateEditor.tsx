"use client";

import { useState } from "react";
import { defaultNotificationTemplate } from "../models/notification.models";
import styles from "../styles/Notifications.module.css";
import { previewNotificationHtml, sanitizeNotificationHtml } from "../utils/notification.utils";

type NotificationTemplateEditorProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  defaultTemplate?: string;
};

export function NotificationTemplateEditor({
  value,
  onChange,
  label = "Plantilla HTML",
  defaultTemplate = defaultNotificationTemplate
}: NotificationTemplateEditorProps) {
  const [mode, setMode] = useState<"visual" | "html" | "preview">("visual");
  const modes = [
    { id: "visual", label: "Visual" },
    { id: "html", label: "HTML" },
    { id: "preview", label: "Vista previa" }
  ] as const;

  return (
    <section className="field field-wide">
      <span>{label}</span>
      <div className={styles.modeSwitch} role="group" aria-label={`Modo de ${label}`}>
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            className={mode === item.id ? styles.active : ""}
            aria-pressed={mode === item.id}
            onClick={() => setMode(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {mode === "visual" && (
        <div
          key={`visual-${value.length}`}
          className={styles.htmlEditor}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-label={`Editor visual de ${label}`}
          dangerouslySetInnerHTML={{ __html: sanitizeNotificationHtml(value) }}
          onInput={(event) => onChange(event.currentTarget.innerHTML)}
        />
      )}
      {mode === "html" && (
        <textarea
          aria-label={`Codigo HTML de ${label}`}
          rows={12}
          maxLength={8000}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {mode === "preview" && (
        <iframe
          title={`Vista previa segura de ${label}`}
          sandbox=""
          className={styles.preview}
          srcDoc={previewNotificationHtml(value)}
        />
      )}
      <button className="button secondary compact" type="button" onClick={() => onChange(defaultTemplate)}>
        Restaurar plantilla base
      </button>
    </section>
  );
}
