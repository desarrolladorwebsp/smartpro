"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { parseBoardCardIds, parseClientBoardPreferencePatch, type ClientBoardPreferences, type ClientBoardPreferencePatch } from "@/lib/clients/board-preferences";

export function useClientBoardPreferences(initial: ClientBoardPreferences, userId: string, legacyKey: string) {
  const key = `smartpro:crm:pending:v1:${userId}`;
  const [preferences, setPreferences] = useState(initial);
  const [saveFailed, setSaveFailed] = useState(false);
  const current = useRef(initial);
  const pending = useRef<ClientBoardPreferencePatch>({});
  const saving = useRef(false);
  const lastBackup = useRef<string | null>(null);

  const backup = useCallback(() => {
    try {
      if (Object.keys(pending.current).length) {
        const snapshot = JSON.stringify(pending.current);
        window.localStorage.setItem(key, snapshot);
        lastBackup.current = snapshot;
      } else if (lastBackup.current && window.localStorage.getItem(key) === lastBackup.current) {
        window.localStorage.removeItem(key);
        lastBackup.current = null;
      }
    } catch {
      // Saving through the account still works when browser storage is unavailable.
    }
  }, [key]);

  const save = useCallback(async () => {
    if (saving.current) return;
    saving.current = true;
    try {
      while (Object.keys(pending.current).length) {
        const patch = pending.current;
        const response = await fetch("/api/clients/board-preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, patch }),
          keepalive: true,
        });
        if (!response.ok) throw new Error("No se pudo guardar la configuración.");
        const remaining = { ...pending.current };
        for (const field of Object.keys(patch) as (keyof ClientBoardPreferencePatch)[]) {
          if (remaining[field] === patch[field]) delete remaining[field];
        }
        pending.current = remaining;
        backup();
      }
      setSaveFailed(false);
    } catch {
      setSaveFailed(true);
    } finally {
      saving.current = false;
    }
  }, [backup, userId]);

  const update = useCallback((patch: ClientBoardPreferencePatch) => {
    current.current = { ...current.current, ...patch };
    setPreferences(current.current);
    pending.current = { ...pending.current, ...patch };
    backup();
    void save();
  }, [backup, save]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      let restored: ClientBoardPreferencePatch = {};
      try {
        const snapshot = window.localStorage.getItem(key);
        if (snapshot) restored = parseClientBoardPreferencePatch(JSON.parse(snapshot));
        if (current.current.collapsed === null && !restored.collapsed) {
          const legacy = window.localStorage.getItem(legacyKey);
          const cards = legacy ? parseBoardCardIds(JSON.parse(legacy)) : undefined;
          if (cards) restored.collapsed = cards;
        }
      } catch {
        // Corrupt or unavailable browser storage has no effect on server preferences.
      }
      if (Object.keys(restored).length) update({ ...restored, ...pending.current });
    });
    return () => { cancelled = true; };
  }, [key, legacyKey, update]);

  return { preferences, current, update, saveFailed, retry: save };
}
