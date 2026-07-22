"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SatisfactionContext, SatisfactionPayload, SatisfactionState } from "../models/satisfaction.models";
import { SatisfactionServiceError } from "../models/satisfaction.models";
import { getSatisfactionContext, submitSatisfaction } from "../services/satisfaction.service";

export function useSatisfaction(token: string, loadContext = getSatisfactionContext, sendResponse = submitSatisfaction) {
  const [context, setContext] = useState<SatisfactionContext | null>(null);
  const [state, setState] = useState<SatisfactionState>("loading");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const sending = useRef(false);

  const reload = useCallback(async () => {
    setState("loading");
    setMessage("");
    try {
      const value = await loadContext(token);
      setContext(value);
      setState(value.alreadySubmitted ? "used" : "form");
    } catch (reason) {
      const result = stateFromError(reason);
      setState(result.state);
      setMessage(result.message);
    }
  }, [loadContext, token]);

  useEffect(() => { queueMicrotask(() => void reload()); }, [reload]);

  const submit = useCallback(async (payload: SatisfactionPayload) => {
    if (sending.current || state !== "form") return false;
    sending.current = true;
    setSubmitting(true);
    setMessage("");
    try {
      await sendResponse(token, payload);
      setState("submitted");
      setMessage("Gracias. Su respuesta fue registrada correctamente.");
      return true;
    } catch (reason) {
      const result = stateFromError(reason);
      if (result.state === "used" || result.state === "invalid" || result.state === "expired") setState(result.state);
      setMessage(result.message);
      return false;
    } finally {
      sending.current = false;
      setSubmitting(false);
    }
  }, [sendResponse, state, token]);

  return { context, state, message, submitting, reload, submit };
}

function stateFromError(reason: unknown): { state: SatisfactionState; message: string } {
  if (reason instanceof SatisfactionServiceError) {
    if (reason.code === "invalid" || reason.code === "expired" || reason.code === "used") return { state: reason.code, message: reason.message };
    return { state: "error", message: reason.message };
  }
  return { state: "error", message: "No fue posible procesar la encuesta. Intente nuevamente." };
}
