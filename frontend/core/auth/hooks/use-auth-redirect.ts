"use client";

import { useCallback } from "react";
import { authenticatedRoute } from "../auth.utils";
import type { AuthSession } from "../session";

export function useAuthRedirect(onAuthenticated?: (session: AuthSession) => void) {
  return useCallback((session: AuthSession) => {
    if (onAuthenticated) onAuthenticated(session);
    else window.location.replace(authenticatedRoute(session.user.mustChangePassword, session.user.email));
  }, [onAuthenticated]);
}
