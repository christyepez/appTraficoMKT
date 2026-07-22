export type SessionUser = {
  id: string;
  name: string;
  email: string;
  roles: string[];
  screenPermissions: string[];
  menuMode?: "horizontal" | "vertical";
  menuCollapsed?: boolean;
  mustChangePassword?: boolean;
};

export type AuthSession = {
  accessToken: string;
  expiresAt: string;
  user: SessionUser;
};

const sessionKey = "requirements-session";

function defaultScreensForRoles(roles: string[]) {
  if (roles.includes("Administrador")) return ["dashboard", "activities", "agenda", "agenda-calendar", "agenda-metrics", "evidence", "approvals", "metrics", "audit", "admin", "users", "storage", "initial-import", "branding", "notifications", "my-notifications", "notification-log"];
  if (roles.includes("Coordinador")) return ["dashboard", "activities", "agenda", "agenda-calendar", "agenda-metrics", "evidence", "approvals", "metrics", "audit", "my-notifications"];
  const screens = new Set(["dashboard"]);
  if (roles.includes("Tecnico")) {
    ["activities", "agenda", "agenda-calendar", "agenda-metrics", "evidence", "my-notifications"].forEach((screen) => screens.add(screen));
  }
  if (roles.includes("Aprobador")) {
    screens.add("approvals");
    screens.add("my-notifications");
  }
  if (roles.includes("Auditor")) {
    ["activities", "agenda", "agenda-calendar", "agenda-metrics", "evidence", "approvals", "metrics", "audit"].forEach((screen) => screens.add(screen));
  }
  return Array.from(screens);
}

export const sessionStorageAdapter = {
  read(): AuthSession | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(sessionKey);
    if (!raw) return null;
    try {
      const session = JSON.parse(raw) as AuthSession;
      if (session.expiresAt && new Date(session.expiresAt).getTime() <= Date.now()) {
        this.clear();
        return null;
      }
      const roles = session.user?.roles ?? [];
      return {
        ...session,
        user: {
          id: session.user?.id ?? "",
          name: session.user?.name ?? "Usuario",
          email: session.user?.email ?? "",
          roles,
          screenPermissions: session.user?.screenPermissions ?? defaultScreensForRoles(roles),
          menuMode: session.user?.menuMode === "vertical" ? "vertical" : "horizontal",
          menuCollapsed: Boolean(session.user?.menuCollapsed),
          mustChangePassword: Boolean(session.user?.mustChangePassword)
        }
      };
    } catch {
      this.clear();
      return null;
    }
  },
  write(session: AuthSession) {
    window.sessionStorage.removeItem("requirements-explicit-logout");
    window.localStorage.removeItem(sessionKey);
    window.localStorage.removeItem("requirements-last-toast");
    window.localStorage.setItem(sessionKey, JSON.stringify(session));
    window.dispatchEvent(new Event("requirements-session-changed"));
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(sessionKey);
    window.localStorage.removeItem("requirements-last-toast");
    window.sessionStorage.removeItem("msal-state");
    window.sessionStorage.removeItem("msal-code-verifier");
    window.dispatchEvent(new Event("requirements-session-changed"));
  },
  logout() {
    window.sessionStorage.setItem("requirements-explicit-logout", "1");
    this.clear();
  }
};

export const getSession = () => sessionStorageAdapter.read();
export const saveSession = (session: AuthSession) => sessionStorageAdapter.write(session);
export const clearSession = () => sessionStorageAdapter.clear();
export const logoutSession = () => sessionStorageAdapter.logout();
