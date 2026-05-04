"use client";

import { useState, useEffect } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { LanguageProvider } from "@/lib/language-context";
import { ThemeProvider } from "@/lib/theme-context";
import { AuthProvider } from "@/lib/auth-context";
import { FavoritesProvider } from "@/lib/favorites-context";
import { CartProvider } from "@/lib/cart-context";
import { Toaster } from "sonner";
import SpinWheelButton from "@/components/spin-wheel-button";
import ChatButton from "@/components/chat-button";
import BottomNav from "@/components/bottom-nav";
import PageWrapper from "@/components/page-wrapper";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen">
        {children}
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <FavoritesProvider>
              <CartProvider>
                <PageWrapper>
                  {children}
                </PageWrapper>
                <Toaster position="top-right" richColors />
                <SpinWheelButton />
                <ChatButton />
                <BottomNav />
              </CartProvider>
            </FavoritesProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </GoogleOAuthProvider>
  );
}
