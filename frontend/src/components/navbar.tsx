"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Home,
  Package,
  Tag,
  LayoutGrid,
  Search as SearchIcon,
  Heart,
  ShoppingBag,
  User,
  LogOut,
  ChevronDown,
  Menu,
  ShoppingCart,
  Loader2
} from "lucide-react";
import SearchModal from "./search-modal";
import CartSidebar from "./cart-sidebar";
import { apiClient, getMediaUrl } from "@/lib/api-client";
import { useCart } from "@/lib/cart-context";

export default function Navbar() {
  const { cartCount } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [categories, setCategories] = useState<any[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsCategoriesLoading(true);
        const data = await apiClient<any>("/categories/");
        const fetchedCategories = Array.isArray(data) ? data : data.results || [];
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const navLinks = [
    { name: "ទំព័រដើម", href: "/", icon: <Home className="size-5" /> },
    { name: "ផលិតផល", href: "/books", icon: <Package className="size-5" /> },
    { name: "ការបញ្ចុះតម្លៃ", href: "/discounts", icon: <Tag className="size-5" /> },
    { name: "ប្រភេទផលិតផល", href: "/categories", icon: <LayoutGrid className="size-5" />, hasCategoriesDropdown: true },
  ];

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${isScrolled
          ? "bg-white py-2 shadow-md border-b border-zinc-200"
          : "bg-white py-4 border-b border-zinc-200"
        }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              {/* Desktop Logo (Full) */}
              <div className="hidden sm:block">
                <Image
                  src="/images/logo_full.png"
                  alt="Our Novel Logo"
                  width={150}
                  height={40}
                  className="object-contain"
                  priority
                />
              </div>

              {/* Mobile Logo (Icon Only) */}
              <div className="sm:hidden flex items-center gap-2">
                <div className="relative size-10 overflow-hidden rounded-xl bg-[#3b6016]/5 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Image
                    src="/images/logo.png"
                    alt="Logo"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-black text-[#3b6016] leading-tight">Our Novel</span>
                  <span className="text-[9px] font-bold text-zinc-400">ហាងលក់សៀវភៅ</span>
                </div>
              </div>
            </Link>

            {/* Nav Links (Desktop) */}
            <div className="hidden items-center gap-6 lg:flex">
              {navLinks.map((link) => (
                <div key={link.href} className="relative group">
                  <Link
                    href={link.href}
                    className={`flex items-center gap-2.5 text-[17px] font-black transition-all hover:text-[#3b6016] py-1.5 nav-link-premium ${
                        pathname === link.href ? "text-[#3b6016] nav-link-active" : "text-zinc-600"
                      }`}
                  >
                    <span className={`transition-colors ${pathname === link.href ? "text-[#3b6016]" : "text-zinc-400 group-hover:text-[#3b6016]"}`}>
                      {link.icon}
                    </span>
                    <span>{link.name}</span>
                    {(link.hasDropdown || link.hasCategoriesDropdown) && <ChevronDown className="size-4 opacity-50 group-hover:rotate-180 transition-transform" />}
                  </Link>

                  {/* Categories Dropdown */}
                  {link.hasCategoriesDropdown && (
                    <div className="absolute top-full left-0 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
                      <div className="w-64 bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden">
                        <div className="p-3 border-b border-zinc-50 bg-zinc-50/50">
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">បញ្ជីប្រភេទផលិតផល</p>
                        </div>
                        <div className="max-h-[320px] overflow-y-auto custom-scrollbar p-1 bg-white">
                          {isCategoriesLoading ? (
                            <div className="p-8 flex flex-col items-center justify-center gap-2">
                              <Loader2 className="size-6 text-[#3b6016] animate-spin" />
                              <p className="text-[10px] font-bold text-zinc-400">កំពុងទាញយក...</p>
                            </div>
                          ) : categories.length > 0 ? (
                            categories.map((category) => (
                              <Link
                                key={category.id}
                                href={`/books?category=${category.id}`}
                                className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-[#3b6016]/5 transition-colors group/item"
                              >
                                <div className="flex flex-col min-w-0">
                                  <p className="text-[14px] font-black text-zinc-700 group-hover/item:text-[#3b6016] transition-colors truncate">
                                    {category.name_km || category.name}
                                  </p>
                                  {category.books_count !== undefined && (
                                    <p className="text-[10px] font-bold text-zinc-400">
                                      {category.books_count} សៀវភៅ
                                    </p>
                                  )}
                                </div>
                              </Link>
                            ))
                          ) : (
                            <div className="p-10 text-center flex flex-col items-center gap-2">
                              <div className="size-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300">
                                <LayoutGrid className="size-5" />
                              </div>
                              <p className="text-[10px] font-bold text-zinc-400">មិនទាន់មានប្រភេទផលិតផល</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Action Icons (Desktop Only) */}
            <div className="hidden md:flex items-center gap-0.5">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-zinc-600 hover:text-[#3b6016] transition-colors"
              >
                <SearchIcon className="size-6" />
              </button>
              <button className="p-2 flex items-center justify-center">
                <Image src="/images/kh-flag.png" alt="KH" width={22} height={16} className="rounded-sm shadow-sm" />
              </button>
              <Link href="/wishlist" className="p-2 text-zinc-600 hover:text-[#3b6016] transition-colors relative">
                <Heart className="size-6" />
              </Link>
              <button 
                onClick={() => setIsCartOpen(true)}
                className="p-2 text-zinc-600 hover:text-[#3b6016] transition-colors relative"
              >
                <ShoppingCart className="size-6" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 size-4 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>

            {/* User Profile (Desktop) */}
            <div className="relative group hidden md:block ml-1">
              {user ? (
                <>
                  <button className="flex items-center justify-center size-10 rounded-xl border border-zinc-200 bg-white hover:border-[#3b6016]/30 transition-all">
                    <User className="size-6 text-zinc-600" />
                  </button>
                  
                  {/* Dropdown - Redesigned to match screenshot */}
                  <div className="absolute right-0 top-full mt-2 w-72 origin-top-right rounded-xl border border-zinc-100 bg-[#f4f1ea] p-4 shadow-2xl animate-in fade-in zoom-in-95 group-hover:block hidden z-[60]">
                    <div className="flex flex-col gap-4">
                      {/* Name Row */}
                      <div className="flex items-center justify-between py-1 border-b border-zinc-300/30">
                        <span className="text-[14px] font-bold text-zinc-600 font-khmer">ឈ្មោះ:</span>
                        <span className="text-[14px] font-bold text-[#6b4e31]">{user.full_name}</span>
                      </div>
                      
                      {/* Phone Row */}
                      <div className="flex items-center justify-between py-1 border-b border-zinc-300/30">
                        <span className="text-[14px] font-bold text-zinc-600 font-khmer">លេខទូរស័ព្ទ:</span>
                        <span className="text-[14px] font-bold text-[#6b4e31]">{user.phone || 'N/A'}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 pt-2">
                        <Link 
                          href="/dashboard" 
                          className="flex items-center justify-center gap-3 w-full py-3 rounded-lg bg-[#6b4e31] text-white hover:bg-[#5a422a] transition-colors shadow-lg shadow-[#6b4e31]/20"
                        >
                          <User className="size-5" />
                          <span className="text-[14px] font-bold font-khmer">ចូលទៅកាន់ផ្ទាំងគ្រប់គ្រង</span>
                        </Link>
                        
                        <button
                          onClick={logout}
                          className="flex items-center justify-center w-full py-3 rounded-lg bg-[#ff5a5a] text-white hover:bg-[#ff4545] transition-colors shadow-lg shadow-red-500/20"
                        >
                          <span className="text-[16px] font-black font-khmer">ចាកចេញ</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center size-10 rounded-xl border border-zinc-200 bg-white hover:border-[#3b6016] transition-all"
                >
                  <User className="size-6 text-zinc-600" />
                </Link>
              )}
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-2">
              <button className="p-1">
                <Image src="/images/kh-flag.png" alt="KH" width={24} height={18} className="rounded-sm" />
              </button>
              <button 
                onClick={() => setIsCartOpen(true)}
                className="size-10 flex items-center justify-center rounded-lg bg-blue-500 text-white shadow-lg shadow-blue-500/20 relative"
              >
                <ShoppingCart className="size-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 size-5 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </button>
              <button className="size-10 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 bg-white">
                <Menu className="size-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      <CartSidebar 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </nav>
  );
}
