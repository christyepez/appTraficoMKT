import { CalendarClock, ClipboardList, Image, ListOrdered, LogIn, Menu, MousePointer2, Palette, Type } from "lucide-react";
import type { BrandSettings } from "../models/branding.models";
import styles from "../styles/Branding.module.css";

export type BrandCategory = "text" | "colors" | "buttons" | "typography" | "header" | "menu" | "agenda" | "forms" | "images" | "login";

const categories = [
  { id: "text", title: "Textos", description: "Título, subtítulo y formato enriquecido.", icon: Type },
  { id: "colors", title: "Colores", description: "Paleta visual de la aplicación.", icon: Palette },
  { id: "buttons", title: "Botones", description: "Acciones principales, secundarias y estados.", icon: MousePointer2 },
  { id: "typography", title: "Tipografía", description: "Fuente y disposición de los textos.", icon: Type },
  { id: "header", title: "Cabecera", description: "Color y degradado institucional.", icon: Menu },
  { id: "menu", title: "Menú", description: "Presentación, plegado y orden de rutas.", icon: ListOrdered },
  { id: "agenda", title: "Agenda", description: "Jornada y ventana de replanificación.", icon: CalendarClock },
  { id: "forms", title: "Formularios", description: "Campos administrados por el sistema.", icon: ClipboardList },
  { id: "images", title: "Logo e imágenes", description: "Logo principal e icono del asistente.", icon: Image },
  { id: "login", title: "Login público", description: "Accesos, períodos y robot Puma.", icon: LogIn }
] as const;

export function BrandCategoryGrid({ settings, onSelect }: { settings: BrandSettings; onSelect: (category: BrandCategory) => void }) {
  return <div className={styles.categoryGrid}>{categories.map((category) => { const Icon = category.icon; return <button className={styles.categoryCard} type="button" key={category.id} onClick={() => onSelect(category.id)} aria-label={`Configurar ${category.title}`}><Icon aria-hidden="true" size={22}/><strong>{category.title}</strong><span>{category.description}</span><em>{categorySummary(category.id, settings)}</em></button>; })}</div>;
}

export function categoryTitle(category: BrandCategory) {
  return categories.find((item) => item.id === category)?.title ?? "Marca";
}

function categorySummary(category: BrandCategory, settings: BrandSettings) {
  const summaries: Record<BrandCategory, string> = {
    text: `${settings.showHeaderTitle ? settings.title : "Título oculto"} · ${settings.showHeaderSubtitle ? settings.subtitle : "Subtítulo oculto"}`,
    colors: `Fondo ${settings.background} · Acento ${settings.accent}`,
    buttons: `Principal ${settings.useGradient ? "con degradado" : settings.primary}`,
    typography: `${settings.fontFamily.split(",")[0]} · ${settings.headerTextAlign}`,
    header: settings.headerUseGradient ? "Degradado activo" : settings.headerColor,
    menu: `${settings.menuMode} · ${settings.menuCollapsed ? "plegado" : "expandido"}`,
    agenda: `${settings.workdayStartTime}–${settings.workdayEndTime} · ${settings.replanningWindowDays} días`,
    forms: settings.showProductIdField ? "Id de producto visible" : "Id de producto oculto",
    images: settings.logo.startsWith("data:") ? "Logo cargado" : "URL configurada",
    login: [settings.showPublicRequirementForm ? "Requerimiento" : "", settings.showPublicRequirementFullPage ? "Formulario" : "", settings.showLoginChatbot ? "Robot" : ""].filter(Boolean).join(" · ") || "Opciones ocultas"
  };
  return summaries[category];
}
