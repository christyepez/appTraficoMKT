"use client";

import { useAppShell } from "../hooks/useAppShell";
import { AppHeader } from "./AppHeader";
import { AppMenu } from "./AppMenu";

export function AppNav() {
  const shell = useAppShell();
  if (!shell.session) return null;
  const menuMode = shell.session.user.menuMode ?? shell.brand.menuMode;
  const expanded = shell.isMobile ? shell.mobileMenuExpanded : shell.desktopMenuVisible;
  return <><AppHeader brand={shell.brand} userName={shell.session.user.name ?? "Sin sesión"} language={shell.language} unreadNotifications={shell.unreadNotifications} onLanguage={shell.changeLanguage} onLogout={shell.logout} /><AppMenu session={shell.session} pathname={shell.pathname} language={shell.language} menuMode={menuMode === "vertical" ? "vertical" : "horizontal"} menuOrder={shell.brand.menuOrder} isMobile={shell.isMobile} expanded={expanded} onToggle={shell.isMobile ? shell.toggleMobileMenu : shell.toggleDesktopMenu} /></>;
}
