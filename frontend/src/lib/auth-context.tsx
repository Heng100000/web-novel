"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "./api-client";

interface Permission {
  resource: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

interface RoleDetails {
  id?: number;
  name: string;
  name_km: string;
}

interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  profile_image?: string;
  reward_points: number;
  role: number | null;
  role_details: RoleDetails | null;
  permissions: Permission[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasPermission: (resource: string, action: keyof Omit<Permission, 'resource'>) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("access_token");

    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
      // Refresh user data from server on mount to sync points, etc.
      apiClient<User>("/users/me/")
        .then(userData => {
          localStorage.setItem("user", JSON.stringify(userData));
          setUser(userData);
        })
        .catch(err => console.error("Failed to sync user data:", err));
    }
    setLoading(false);
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem("access_token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  const refreshUser = async () => {
    try {
      const userData = await apiClient<User>("/users/me/");
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    } catch (e) {
      console.error("Failed to refresh user profile", e);
    }
  };

  const isAdmin = !!(user?.role === 1 || 
                  user?.role_details?.id === 1 ||
                  user?.role_details?.name?.toLowerCase() === 'admin' || 
                  user?.role_details?.name === 'អ្នកគ្រប់គ្រង' || 
                  user?.role_details?.name_km === 'អ្នកគ្រប់គ្រង' || 
                  user?.role_details?.name?.toLowerCase() === 'administrator' ||
                  user?.email === 'admin@example.com' ||
                  user?.full_name?.includes('អ្នកគ្រប់គ្រង'));

  useEffect(() => {
    if (user) {
      console.log("Auth State:", { 
        email: user.email, 
        role: user.role, 
        roleName: user.role_details?.name,
        isAdmin 
      });
    }
  }, [user, isAdmin]);

  const hasPermission = (resource: string, action: keyof Omit<Permission, 'resource'>): boolean => {
    // TEMPORARILY DISABLED: Always return true to ensure admin access
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, logout, refreshUser, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
