"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Package, 
  Tag, 
  Search, 
  User,
  Zap
} from "lucide-react";
import SearchModal from "./search-modal";
import { useLanguage } from "@/lib/language-context";

export default function BottomNav() {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { t } = useLanguage();

  const navItems = [
    { name: t("home"), href: "/", icon: <Home className="size-[22px]" /> },
    { name: t("products"), href: "/books", icon: <Package className="size-[22px]" /> },
    { name: t("flash_sale"), href: "/flash-sale", icon: <Zap className="size-[22px]" /> },
    { name: t("discounts"), href: "/discounts", icon: <Tag className="size-[22px]" /> },
    { name: t("search"), href: "#", icon: <Search className="size-[22px]" />, isSearch: true },
    { name: t("profile"), href: "/profile", icon: <User className="size-[22px]" /> },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 z-50 w-full rounded-t-[10px] border-t border-dim bg-card-bg/95 backdrop-blur-md shadow-[0_-5px_20px_rgba(0,0,0,0.05)] md:hidden">
        <div className="flex items-center justify-around py-1.5 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            
            if (item.isSearch) {
              return (
                <button
                  key={item.name}
                  onClick={() => setIsSearchOpen(true)}
                  className="flex flex-col items-center gap-0.5 text-text-dim/60 active:scale-90 transition-transform"
                >
                  <div className="p-1">
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-bold">{item.name}</span>
                </button>
              );
            }

            // Special handling for Flash Sale icon color
            const isFlashSale = item.href === "/flash-sale";
            const iconColorClass = isFlashSale 
              ? (isActive ? "text-amber-500 fill-amber-500" : "text-text-dim/60") 
              : (isActive ? "text-primary" : "text-text-dim/60");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 transition-all active:scale-90 ${
                  isActive ? (isFlashSale ? "text-amber-600" : "text-primary") : "text-text-dim/60"
                }`}
              >
                <div className={`p-1 ${iconColorClass}`}>
                  {item.icon}
                </div>
                <span className={`text-[10px] ${isActive ? 'font-black' : 'font-bold'}`}>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </>
  );
}
