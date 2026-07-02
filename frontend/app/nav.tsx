"use client";

import { api, applyBrandVariables, defaultBrandSettings, getSession, logoutSession, t, type BrandSettings } from "./lib";
import { BarChart3, Bell, CheckCircle2, ChevronsDown, ChevronsLeft, ChevronsRight, ChevronsUp, ClipboardList, FileCheck2, History, Inbox, Landmark, ListChecks, LogOut, Palette, Settings, ShieldCheck, UploadCloud, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const items = [
  { href: "/dashboard", label: "Requerimientos", icon: ClipboardList },
  { href: "/activities", label: "Productos", icon: ListChecks },
  { href: "/evidence", label: "Adjuntos", icon: FileCheck2 },
  { href: "/approvals", label: "Aprobaciones", icon: CheckCircle2 },
  { href: "/metrics", label: "Métricas", icon: BarChart3 },
  { href: "/audit", label: "Auditorías", icon: History },
  { href: "/admin", label: "Administración", icon: Landmark },
  { href: "/users", label: "Usuarios", icon: Users },
  { href: "/storage", label: "Archivos", icon: Settings },
  { href: "/initial-import", label: "Carga inicial", icon: UploadCloud },
  { href: "/branding", label: "Manejo Marca", icon: Palette },
  { href: "/notifications", label: "Notificaciones", icon: Bell },
  { href: "/my-notifications", label: "Mis notificaciones", icon: Inbox },
  { href: "/notification-log", label: "Registro notificaciones", icon: History }
];

export function AppNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [name, setName] = useState("Sin sesion");
  const [language, setLanguage] = useState("es");
  const [logo, setLogo] = useState(defaultBrandSettings.logo);
  const [brandTitle, setBrandTitle] = useState("Creamos conexiones que dejan huella");
  const [brandSubtitle, setBrandSubtitle] = useState(defaultBrandSettings.subtitle);
  const [showHeaderTitle, setShowHeaderTitle] = useState(true);
  const [showHeaderSubtitle, setShowHeaderSubtitle] = useState(true);
  const [headerTextAlign, setHeaderTextAlign] = useState<"left" | "center" | "right">("center");
  const [headerTextPosition, setHeaderTextPosition] = useState<"top" | "middle" | "bottom">("middle");
  const [menuMode, setMenuMode] = useState<"horizontal" | "vertical">("horizontal");
  const [menuOrder, setMenuOrder] = useState(defaultBrandSettings.menuOrder);
  const [desktopMenuVisible, setDesktopMenuVisible] = useState(true);
  const [mobileMenuExpanded, setMobileMenuExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [renderTick, setRenderTick] = useState(0);
  const menuExpanded = isMobile ? mobileMenuExpanded : desktopMenuVisible;
  const horizontalDesktopMenu = !isMobile && menuMode === "horizontal";

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    const key = pathname.replace("/", "") || "dashboard";
    const canView = session.user.roles.includes("Administrador") || session.user.screenPermissions.includes(key);
    if (!canView) {
      router.push(firstAllowedPath(session));
      return;
    }

    setName(session.user.name ?? "Sin sesion");
    const saved = window.localStorage.getItem("ui-language") ?? "es";
    setLanguage(saved);
    document.documentElement.lang = saved;
    const mobileQuery = window.matchMedia("(max-width: 980px)");
    const updateMobile = () => setIsMobile(mobileQuery.matches);
    updateMobile();
    mobileQuery.addEventListener("change", updateMobile);
    loadBrand();
    loadUnreadNotifications();
    const notificationTimer = window.setInterval(() => loadUnreadNotifications().catch(() => undefined), 15000);
    const onSettings = () => {
      loadBrand();
      setRenderTick((current) => current + 1);
    };
    window.addEventListener("ui-language-changed", onSettings);
    window.addEventListener("brand-settings-changed", onSettings);
    return () => {
      window.removeEventListener("ui-language-changed", onSettings);
      window.removeEventListener("brand-settings-changed", onSettings);
      mobileQuery.removeEventListener("change", updateMobile);
      window.clearInterval(notificationTimer);
    };
  }, [pathname, router]);

  async function loadBrand() {
    const brand = await api<BrandSettings>("/api/identity/brand-settings").catch(() => defaultBrandSettings);
    const currentBrand = { ...defaultBrandSettings, ...brand };
    applyBrandVariables(currentBrand);
    setLogo(currentBrand.logo);
    setBrandTitle(currentBrand.title);
    setBrandSubtitle(currentBrand.subtitle);
    setShowHeaderTitle(currentBrand.showHeaderTitle);
    setShowHeaderSubtitle(currentBrand.showHeaderSubtitle);
    setHeaderTextAlign(currentBrand.headerTextAlign ?? "center");
    setHeaderTextPosition(currentBrand.headerTextPosition ?? "middle");
    setMenuOrder(currentBrand.menuOrder);
    const session = getSession();
    const preferredMenuMode = session?.user.menuMode ?? currentBrand.menuMode;
    const preferredMenuCollapsed = Boolean(session?.user.menuCollapsed ?? currentBrand.menuCollapsed);
    setMenuMode(preferredMenuMode === "vertical" ? "vertical" : "horizontal");
    setDesktopMenuVisible(preferredMenuMode === "vertical" ? !preferredMenuCollapsed : true);
    setMobileMenuExpanded(!currentBrand.mobileMenuCollapsed);
  }

  async function loadUnreadNotifications() {
    const session = getSession();
    if (!session?.user.email) return;
    const data = await api<{ count: number }>(`/api/notification-records/unread-count?email=${encodeURIComponent(session.user.email)}&name=${encodeURIComponent(session.user.name ?? "")}`).catch(() => ({ count: 0 }));
    setUnreadNotifications(data.count);
  }

  return (
    <>
      <header className="topbar">
        <Link className="brand-link" href="/dashboard">
          <span className="brand-mark">
            <img className="brand-logo" src={logo} alt="Universidad Indoamérica" />
          </span>
        </Link>
        <div className={`brand-title-slot align-${headerTextAlign} position-${headerTextPosition}`}>
          <span className="brand-copy">
            {showHeaderTitle && <strong className="brand-text">{brandTitle}</strong>}
            {showHeaderSubtitle && <small className="brand-subtitle">{brandSubtitle}</small>}
          </span>
        </div>
        <div className="session-box">
          <ShieldCheck size={16} />
          <span>{name}</span>
          <Link className="notification-bubble" href="/my-notifications" title="Ver mis notificaciones">
            <Bell size={15} />
            {unreadNotifications > 0 && <b>{unreadNotifications}</b>}
          </Link>
          <select
            className="language-select"
            value={language}
            onChange={(event) => {
              setLanguage(event.target.value);
              window.localStorage.setItem("ui-language", event.target.value);
              document.documentElement.lang = event.target.value;
              window.dispatchEvent(new Event("ui-language-changed"));
              setRenderTick(renderTick + 1);
            }}
          >
            <option value="es">ES</option>
            <option value="en">EN</option>
          </select>
          <button
            className="icon-button"
            title="Cerrar sesión y volver al login"
            onClick={() => {
              logoutSession();
              window.location.replace("/login");
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>
      <nav className={`navlinks ${menuMode === "vertical" ? "navlinks-vertical" : "navlinks-horizontal"} ${desktopMenuVisible ? "" : "desktop-collapsed"} ${mobileMenuExpanded ? "mobile-expanded" : "mobile-collapsed"}`}>
          <button
            className="icon-button menu-collapse-toggle"
            type="button"
            title={menuExpanded ? (horizontalDesktopMenu ? "Plegar menú hacia arriba" : "Plegar menú hacia la izquierda") : (horizontalDesktopMenu ? "Desplegar menú hacia abajo" : "Desplegar menú hacia la derecha")}
            aria-label={menuExpanded ? "Plegar menú" : "Abrir menú"}
            aria-expanded={menuExpanded}
            onClick={() => isMobile ? setMobileMenuExpanded((expanded) => !expanded) : setDesktopMenuVisible((visible) => !visible)}
          >
            {horizontalDesktopMenu
              ? menuExpanded ? <ChevronsUp size={18} /> : <ChevronsDown size={18} />
              : menuExpanded ? <ChevronsLeft size={18} /> : <ChevronsRight size={18} />}
          </button>
          {orderedItems(menuOrder).map((item) => {
            const Icon = item.icon;
            const session = getSession();
            const key = item.href.replace("/", "");
            if (session && !session.user.screenPermissions.includes(key) && !session.user.roles.includes("Administrador")) return null;
            return (
              <Link key={item.href} href={item.href}>
                <Icon size={16} /> <span>{t(item.label)}</span>
              </Link>
            );
          })}
      </nav>
    </>
  );
}

function orderedItems(value: string) {
  const order = value.split(",").filter(Boolean);
  return [...items].sort((a, b) => {
    const aIndex = order.indexOf(a.href.slice(1));
    const bIndex = order.indexOf(b.href.slice(1));
    return (aIndex < 0 ? Number.MAX_SAFE_INTEGER : aIndex) - (bIndex < 0 ? Number.MAX_SAFE_INTEGER : bIndex);
  });
}

function firstAllowedPath(session: NonNullable<ReturnType<typeof getSession>>) {
  if (session.user.roles.includes("Administrador")) return "/dashboard";
  if (session.user.roles.includes("Tecnico")) return "/activities";
  if (session.user.roles.includes("Aprobador")) return "/approvals";
  if (session.user.roles.includes("Coordinador")) return "/dashboard";
  const first = items.find((item) => session.user.screenPermissions.includes(item.href.replace("/", "")));
  return first?.href ?? "/login";
}
