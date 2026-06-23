"use client";

import { api, applyBrandVariables, clearSession, defaultBrandSettings, getSession, t, type BrandSettings } from "./lib";
import { BarChart3, Bell, CheckCircle2, ClipboardList, FileCheck2, History, Landmark, ListChecks, LogOut, Palette, Settings, ShieldCheck, UploadCloud, Users } from "lucide-react";
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
  { href: "/notifications", label: "Notificaciones", icon: Bell }
];

export function AppNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [name, setName] = useState("Sin sesion");
  const [language, setLanguage] = useState("es");
  const [logo, setLogo] = useState(defaultBrandSettings.logo);
  const [brandTitle, setBrandTitle] = useState("Creamos conexiones que dejan huella");
  const [headerTextAlign, setHeaderTextAlign] = useState<"left" | "center" | "right">("center");
  const [headerTextPosition, setHeaderTextPosition] = useState<"top" | "middle" | "bottom">("middle");
  const [menuMode, setMenuMode] = useState<"horizontal" | "vertical">("horizontal");
  const [menuCollapsed, setMenuCollapsed] = useState(false);
  const [renderTick, setRenderTick] = useState(0);

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
    loadBrand();
    const onSettings = () => {
      loadBrand();
      setRenderTick((current) => current + 1);
    };
    window.addEventListener("ui-language-changed", onSettings);
    window.addEventListener("brand-settings-changed", onSettings);
    return () => {
      window.removeEventListener("ui-language-changed", onSettings);
      window.removeEventListener("brand-settings-changed", onSettings);
    };
  }, [pathname, router]);

  async function loadBrand() {
    const brand = await api<BrandSettings>("/api/identity/brand-settings").catch(() => defaultBrandSettings);
    const currentBrand = { ...defaultBrandSettings, ...brand };
    applyBrandVariables(currentBrand);
    setLogo(currentBrand.logo);
    setBrandTitle(currentBrand.title);
    setHeaderTextAlign(currentBrand.headerTextAlign ?? "center");
    setHeaderTextPosition(currentBrand.headerTextPosition ?? "middle");
    const session = getSession();
    const preferredMenuMode = session?.user.menuMode ?? currentBrand.menuMode;
    setMenuMode(preferredMenuMode === "vertical" ? "vertical" : "horizontal");
    setMenuCollapsed(preferredMenuMode === "vertical" ? Boolean(session?.user.menuCollapsed ?? currentBrand.menuCollapsed) : false);
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
          <span className="brand-text">{brandTitle}</span>
        </div>
        <div className="session-box">
          <ShieldCheck size={16} />
          <span>{name}</span>
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
              clearSession();
              router.push("/login");
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>
      <nav className={`navlinks ${menuMode === "vertical" ? "navlinks-vertical" : "navlinks-horizontal"} ${menuMode === "vertical" && menuCollapsed ? "collapsed" : ""}`}>
          {items.map((item) => {
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

function firstAllowedPath(session: NonNullable<ReturnType<typeof getSession>>) {
  if (session.user.roles.includes("Administrador")) return "/dashboard";
  if (session.user.roles.includes("Tecnico")) return "/activities";
  if (session.user.roles.includes("Aprobador")) return "/approvals";
  if (session.user.roles.includes("Coordinador")) return "/dashboard";
  const first = items.find((item) => session.user.screenPermissions.includes(item.href.replace("/", "")));
  return first?.href ?? "/login";
}
