import type { AuthSession } from "../auth/session";

export const navigationItems = [
  { key: "dashboard", href: "/dashboard", label: "Requerimientos" },
  { key: "activities", href: "/activities", label: "Productos" },
  { key: "agenda", href: "/agenda", label: "Agenda técnica" },
  { key: "agenda-calendar", href: "/agenda-calendar", label: "Calendario técnico" },
  { key: "agenda-metrics", href: "/agenda-metrics", label: "Métricas agenda" },
  { key: "evidence", href: "/evidence", label: "Adjuntos" },
  { key: "approvals", href: "/approvals", label: "Aprobaciones" },
  { key: "metrics", href: "/metrics", label: "Métricas" },
  { key: "audit", href: "/audit", label: "Auditorías" },
  { key: "admin", href: "/admin", label: "Administración" },
  { key: "users", href: "/users", label: "Usuarios" },
  { key: "storage", href: "/storage", label: "Archivos" },
  { key: "initial-import", href: "/initial-import", label: "Carga inicial" },
  { key: "branding", href: "/branding", label: "Manejo Marca" },
  { key: "notifications", href: "/notifications", label: "Notificaciones" },
  { key: "my-notifications", href: "/my-notifications", label: "Mis notificaciones" },
  { key: "notification-log", href: "/notification-log", label: "Registro notificaciones" }
] as const;

export type NavigationItem = (typeof navigationItems)[number];

export function canAccessScreen(session: AuthSession, key: string) {
  return session.user.roles.includes("Administrador") || session.user.screenPermissions.includes(key);
}

export function canAccessPath(session: AuthSession, pathname: string) {
  return canAccessScreen(session, pathname.replace(/^\//, "") || "dashboard");
}

export function visibleNavigation(session: AuthSession) {
  return navigationItems.filter((item) => canAccessScreen(session, item.key));
}

export function orderedNavigation(orderValue: string, items: readonly NavigationItem[] = navigationItems) {
  const order = orderValue.split(",").filter(Boolean);
  return [...items].sort((a, b) => rank(order, a.key) - rank(order, b.key));
}

export function firstAllowedPath(session: AuthSession) {
  if (session.user.roles.includes("Administrador")) return "/dashboard";
  if (session.user.roles.includes("Tecnico")) return "/activities";
  if (session.user.roles.includes("Aprobador")) return "/approvals";
  if (session.user.roles.includes("Coordinador")) return "/dashboard";
  return visibleNavigation(session)[0]?.href ?? "/login";
}

function rank(order: string[], key: string) {
  const index = order.indexOf(key);
  return index < 0 ? Number.MAX_SAFE_INTEGER : index;
}
