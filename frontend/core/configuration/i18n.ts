export const translations: Record<string, Record<string, string>> = {
  en: {
    "Requerimientos": "Requirements", "Productos": "Products", "Agenda técnica": "Technical agenda", "Calendario técnico": "Technical calendar", "Métricas agenda": "Agenda metrics", "Adjuntos": "Attachments", "Aprobaciones": "Approvals", "Métricas": "Metrics", "Auditorías": "Audits", "Administración": "Administration", "Usuarios": "Users", "Archivos": "Files", "Carga inicial": "Initial load", "Marca": "Brand", "Manejo Marca": "Brand Management", "Notificaciones": "Notifications", "Cerrar sesion": "Sign out", "Marca institucional": "Institutional brand", "Configuración de almacenamiento": "Storage settings", "Guardar": "Save", "Crear": "Create", "Editar": "Edit", "Cancelar": "Cancel", "Activo": "Active", "Inactivo": "Inactive", "Configuración de notificaciones": "Notification settings", "Detalle de configuraciones": "Configuration details", "Nombre": "Name", "Proveedor": "Provider", "Ruta local": "Local path", "Usar cloud en producción": "Use cloud in production", "Correo": "Email", "Teams": "Teams", "Webhook": "Webhook", "Vista previa": "Preview", "Título": "Title", "Subtítulo": "Subtitle"
  }
};

export function translate(text: string, language = currentLanguage()) {
  return translations[language]?.[text] ?? text;
}

export function currentLanguage() {
  if (typeof window === "undefined") return "es";
  return window.localStorage.getItem("ui-language") ?? "es";
}

export function setLanguage(language: string) {
  window.localStorage.setItem("ui-language", language);
  document.documentElement.lang = language;
  window.dispatchEvent(new Event("ui-language-changed"));
}
