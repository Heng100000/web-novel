"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Package, 
  Tag, 
  Search, 
  User 
} from "lucide-react";
import SearchModal from "./search-modal";

export default function BottomNav() {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navItems = [
    { name: "ទំព័រដើម", href: "/", icon: <Home className="size-7" /> },
    { name: "ផលិតផល", href: "/books", icon: <Package className="size-7" /> },
    { name: "ការបញ្ចុះតម្លៃ", href: "/discounts", icon: <Tag className="size-7" /> },
    { name: "ស្វែងរក", href: "#", icon: <Search className="size-7" />, isSearch: true },
    { name: "ប្រវត្តិរូប", href: "/profile", icon: <User className="size-7" /> },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 z-50 w-full rounded-t-[12px] border-t-2 border-[#2b4510] bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.1)] md:hidden">
        <div className="flex items-center justify-around py-3 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            
            if (item.isSearch) {
              return (
                <button
                  key={item.name}
                  onClick={() => setIsSearchOpen(true)}
                  className="flex flex-col items-center gap-1 text-zinc-400"
                >
                  <div className="p-1 rounded-xl">
                    {item.icon}
                  </div>
                  <span className="text-[12px] font-black">{item.name}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 transition-colors ${
                  isActive ? "text-[#3b6016]" : "text-zinc-400"
                }`}
              >
                <div className="p-1 transition-all">
                  {item.icon}
                </div>
                <span className="text-[12px] font-black">{item.name}</span>
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
