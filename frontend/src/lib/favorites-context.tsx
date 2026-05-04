"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { favoritesApi } from "@/lib/api-client";
import { useAuth } from "./auth-context";

interface FavoritesContextType {
  favoritesCount: number;
  refreshFavoritesCount: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoritesCount, setFavoritesCount] = useState(0);
  const { user } = useAuth();

  const refreshFavoritesCount = useCallback(async () => {
    if (!user) {
      setFavoritesCount(0);
      return;
    }
    try {
      const data = await favoritesApi.list();
      const count = Array.isArray(data) ? data.length : (data.results?.length || 0);
      setFavoritesCount(count);
    } catch (error) {
      console.error("Error refreshing favorites count:", error);
    }
  }, [user]);

  useEffect(() => {
    refreshFavoritesCount();
  }, [refreshFavoritesCount]);

  return (
    <FavoritesContext.Provider value={{ favoritesCount, refreshFavoritesCount }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
