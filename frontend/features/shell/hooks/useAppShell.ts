"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSession, logoutSession, type AuthSession } from "../../../core/auth/session";
import { applyBrandVariables, defaultBrandSettings, type BrandSettings } from "../../../core/branding/brand-settings";
import { currentLanguage, setLanguage as persistLanguage } from "../../../core/configuration/i18n";
import { canAccessPath, firstAllowedPath } from "../../../core/permissions/navigation";
import { getCachedShellBrand, getShellBrand, getUnreadNotifications } from "../services/shell.service";

let cachedShellSession: AuthSession | null = null;

export function useAppShell(notificationInterval = 15_000) {
  const router = useRouter();
  const pathname = usePathname();
  const [initialSession] = useState<AuthSession | null>(() => cachedShellSession);
  const [initialBrand] = useState<BrandSettings | null>(() => getCachedShellBrand());
  const resolvedInitialBrand = initialBrand ?? defaultBrandSettings;
  const [session, setSession] = useState<AuthSession | null>(initialSession);
  const [brand, setBrand] = useState<BrandSettings>(resolvedInitialBrand);
  const [isBrandReady, setIsBrandReady] = useState(Boolean(initialBrand));
  const [language, setLanguage] = useState(() => currentLanguage());
  const [isMobile, setIsMobile] = useState(false);
  const [desktopMenuVisible, setDesktopMenuVisible] = useState(() => {
    const mode = initialSession?.user.menuMode ?? resolvedInitialBrand.menuMode;
    const collapsed = Boolean(initialSession?.user.menuCollapsed ?? resolvedInitialBrand.menuCollapsed);
    return mode === "vertical" ? !collapsed : true;
  });
  const [mobileMenuExpanded, setMobileMenuExpanded] = useState(() => !resolvedInitialBrand.mobileMenuCollapsed);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const loadBrand = useCallback(async (currentSession: AuthSession, refresh = false) => {
    try {
      const value = await getShellBrand({ refresh });
      applyBrandVariables(value);
      setBrand(value);
      const mode = currentSession.user.menuMode ?? value.menuMode;
      const collapsed = Boolean(currentSession.user.menuCollapsed ?? value.menuCollapsed);
      setDesktopMenuVisible(mode === "vertical" ? !collapsed : true);
      setMobileMenuExpanded(!value.mobileMenuCollapsed);
    } catch {
      if (!getCachedShellBrand()) applyBrandVariables(defaultBrandSettings);
    } finally {
      setIsBrandReady(true);
    }
  }, []);

  const loadUnread = useCallback(async (currentSession: AuthSession) => {
    try { setUnreadNotifications(await getUnreadNotifications(currentSession)); }
    catch { setUnreadNotifications(0); }
  }, []);

  useEffect(() => {
    const currentSession = getSession();
    if (!currentSession) { cachedShellSession = null; queueMicrotask(() => setSession(null)); router.push("/login"); return; }
    if (!canAccessPath(currentSession, pathname)) { router.push(firstAllowedPath(currentSession)); return; }
    cachedShellSession = currentSession;
    queueMicrotask(() => {
      setSession(currentSession);
      const savedLanguage = currentLanguage();
      setLanguage(savedLanguage);
      document.documentElement.lang = savedLanguage;
    });
    const media = window.matchMedia("(max-width: 980px)");
    const updateMobile = () => setIsMobile(media.matches);
    queueMicrotask(updateMobile);
    media.addEventListener("change", updateMobile);
    queueMicrotask(() => {
      void loadBrand(currentSession);
      void loadUnread(currentSession);
    });
    const timer = window.setInterval(() => void loadUnread(currentSession), notificationInterval);
    const onLanguage = () => setLanguage(currentLanguage());
    const onBrand = () => void loadBrand(currentSession, true);
    window.addEventListener("ui-language-changed", onLanguage);
    window.addEventListener("brand-settings-changed", onBrand);
    return () => {
      media.removeEventListener("change", updateMobile);
      window.removeEventListener("ui-language-changed", onLanguage);
      window.removeEventListener("brand-settings-changed", onBrand);
      window.clearInterval(timer);
    };
  }, [loadBrand, loadUnread, notificationInterval, pathname, router]);

  function changeLanguage(value: string) { persistLanguage(value); setLanguage(value); }
  function logout() { cachedShellSession = null; logoutSession(); window.location.replace("/login"); }
  return { session, brand, isBrandReady, language, pathname, isMobile, desktopMenuVisible, mobileMenuExpanded, unreadNotifications, changeLanguage, logout, toggleDesktopMenu: () => setDesktopMenuVisible((value) => !value), toggleMobileMenu: () => setMobileMenuExpanded((value) => !value) };
}
