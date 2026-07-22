"use client";

import { Bell, LogOut, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { BrandSettings } from "../../../core/branding/brand-settings";

type Props = {
  brand: BrandSettings;
  userName: string;
  language: string;
  unreadNotifications: number;
  onLanguage: (language: string) => void;
  onLogout: () => void;
};

export function AppHeader({ brand, userName, language, unreadNotifications, onLanguage, onLogout }: Props) {
  return (
    <header className="topbar">
      <Link className="brand-link" href="/dashboard" aria-label="Ir a requerimientos">
        <span className="brand-mark"><Image className="brand-logo" src={brand.logo} alt="Universidad Indoamérica" width={64} height={64} unoptimized /></span>
      </Link>
      <div className={`brand-title-slot align-${brand.headerTextAlign ?? "center"} position-${brand.headerTextPosition ?? "middle"}`}>
        <span className="brand-copy">
          {brand.showHeaderTitle && <strong className="brand-text">{brand.title}</strong>}
          {brand.showHeaderSubtitle && <small className="brand-subtitle">{brand.subtitle}</small>}
        </span>
      </div>
      <div className="session-box" aria-label="Perfil de sesión">
        <ShieldCheck size={16} aria-hidden="true" />
        <span>{userName}</span>
        <Link className="notification-bubble" href="/my-notifications" title="Ver mis notificaciones" aria-label={`Mis notificaciones${unreadNotifications ? `, ${unreadNotifications} pendientes` : ""}`}>
          <Bell size={15} aria-hidden="true" />{unreadNotifications > 0 && <b>{unreadNotifications}</b>}
        </Link>
        <label className="sr-only" htmlFor="shell-language">Idioma</label>
        <select id="shell-language" className="language-select" value={language} onChange={(event) => onLanguage(event.target.value)}><option value="es">ES</option><option value="en">EN</option></select>
        <button className="icon-button" type="button" title="Cerrar sesión y volver al login" aria-label="Cerrar sesión" onClick={onLogout}><LogOut size={16} /></button>
      </div>
    </header>
  );
}
