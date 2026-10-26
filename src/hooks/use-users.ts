"use client";

import { fetchUsers } from "@/lib/api/users-client";
import { getLoadErrorMessage } from "@/lib/api-error-message";
import type { AppUser } from "@/types";
import { useCallback, useEffect, useState } from "react";

export function useUsers() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setUsers(await fetchUsers());
    } catch (loadError) {
      setError(getLoadErrorMessage(loadError, "No se pudieron cargar los usuarios."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Reemplaza o suma un usuario sin volver a pedir la lista. */
  const upsertUser = useCallback((user: AppUser) => {
    setUsers((current) =>
      current.some((item) => item.id === user.id)
        ? current.map((item) => (item.id === user.id ? user : item))
        : [...current, user]
    );
  }, []);

  return { users, isLoading, error, refresh, upsertUser };
}
