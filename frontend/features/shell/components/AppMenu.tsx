"use client";

import { BarChart3, Bell, CalendarDays, CheckCircle2, ChevronsDown, ChevronsLeft, ChevronsRight, ChevronsUp, ClipboardList, FileCheck2, History, Inbox, Landmark, ListChecks, Palette, Settings, UploadCloud, Users } from "lucide-react";
import Link from "next/link";
import type { AuthSession } from "../../../core/auth/session";
import { translate } from "../../../core/configuration/i18n";
import { orderedNavigation, visibleNavigation, type NavigationItem } from "../../../core/permissions/navigation";

const icons = { dashboard: ClipboardList, activities: ListChecks, agenda: CalendarDays, "agenda-calendar": CalendarDays, "agenda-metrics": BarChart3, evidence: FileCheck2, approvals: CheckCircle2, metrics: BarChart3, audit: History, admin: Landmark, users: Users, storage: Settings, "initial-import": UploadCloud, branding: Palette, notifications: Bell, "my-notifications": Inbox, "notification-log": History };

type Props = {
  session: AuthSession;
  pathname: string;
  language: string;
  menuMode: "horizontal" | "vertical";
  menuOrder: string;
  isMobile: boolean;
  expanded: boolean;
  onToggle: () => void;
};

export function AppMenu({ session, pathname, language, menuMode, menuOrder, isMobile, expanded, onToggle }: Props) {
  const horizontalDesktop = !isMobile && menuMode === "horizontal";
  const items = orderedNavigation(menuOrder, visibleNavigation(session) as NavigationItem[]);
  return (
    <nav aria-label="Navegación principal" className={`navlinks ${menuMode === "vertical" ? "navlinks-vertical" : "navlinks-horizontal"} ${!isMobile && !expanded ? "desktop-collapsed" : ""} ${isMobile && expanded ? "mobile-expanded" : "mobile-collapsed"}`}>
      <button className="icon-button menu-collapse-toggle" type="button" title={expanded ? "Plegar menú" : "Desplegar menú"} aria-label={expanded ? "Plegar menú" : "Abrir menú"} aria-expanded={expanded} onClick={onToggle}>
        {horizontalDesktop ? expanded ? <ChevronsUp size={18} /> : <ChevronsDown size={18} /> : expanded ? <ChevronsLeft size={18} /> : <ChevronsRight size={18} />}
      </button>
      {items.map((item) => {
        const Icon = icons[item.key];
        return <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}><Icon size={16} /><span>{translate(item.label, language)}</span></Link>;
      })}
    </nav>
  );
}
