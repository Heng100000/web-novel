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
  Loader2,
  LayoutDashboard,
  Sun,
  Moon
} from "lucide-react";
import SearchModal from "./search-modal";
import CartSidebar from "./cart-sidebar";
import { apiClient, getMediaUrl } from "@/lib/api-client";
import { useCart } from "@/lib/cart-context";
import { useFavorites } from "@/lib/favorites-context";
import { useLanguage } from "@/lib/language-context";
import { useTheme } from "@/lib/theme-context";

export default function Navbar() {
  const { cartCount } = useCart();
  const { favoritesCount } = useFavorites();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    { name: t("home"), href: "/", icon: <Home className="size-5" /> },
    { name: t("products"), href: "/books", icon: <Package className="size-5" /> },
    { 
      name: t("discounts"), 
      href: "/discounts", 
      icon: <Tag className="size-5" />, 
      hasPromotionsDropdown: true 
    },
    { name: t("categories"), href: "/categories", icon: <LayoutGrid className="size-5" />, hasCategoriesDropdown: true },
  ];

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${isScrolled
        ? "bg-card-bg py-2 shadow-md border-b border-dim"
        : "bg-card-bg py-4 border-b border-dim"
        }`}
    >
      {!mounted ? null : (
        <>
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
                      style={{ height: "auto" }}
                      priority
                    />
                  </div>

                  {/* Mobile Logo (Icon Only) */}
                  <div className="sm:hidden flex items-center gap-2">
                    <div className="relative size-10 overflow-hidden rounded-xl bg-primary/5 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Image
                        src="/images/logo.png"
                        alt="Logo"
                        width={32}
                        height={32}
                        className="object-contain"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-black text-primary leading-tight">Our Novel</span>
                      <span className="text-[9px] font-bold text-text-dim/60">ហាងលក់សៀវភៅ</span>
                    </div>
                  </div>
                </Link>

                {/* Nav Links (Desktop) */}
                <div className="hidden items-center gap-6 lg:flex">
                  {navLinks.map((link) => (
                    <div key={link.href} className="relative group">
                      <Link
                        href={link.href}
                        className={`flex items-center gap-2.5 text-[17px] font-black transition-all hover:text-primary py-1.5 nav-link-premium ${pathname === link.href ? "text-primary nav-link-active" : "text-text-main"
                          }`}
                      >
                        <span className={`transition-colors ${pathname === link.href ? "text-primary" : "text-text-dim/60 group-hover:text-primary"}`}>
                          {link.icon}
                        </span>
                        <span>{link.name}</span>
                        {(link.hasPromotionsDropdown || link.hasCategoriesDropdown) && <ChevronDown className="size-4 opacity-50 group-hover:rotate-180 transition-transform" />}
                      </Link>

                      {/* Promotions Dropdown */}
                      {link.hasPromotionsDropdown && (
                        <div className="absolute top-full left-0 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
                          <div className="w-56 bg-card-bg rounded-xl shadow-2xl border border-dim overflow-hidden p-1">
                            <Link
                              href="/discounts"
                              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/5 transition-colors group/item"
                            >
                              <Tag className="size-4 text-text-dim/60 group-hover/item:text-primary" />
                              <span className="text-[14px] font-black text-text-main group-hover/item:text-primary">បញ្ចុះតម្លៃទាំងអស់</span>
                            </Link>
                            <Link
                              href="/flash-sale"
                              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-orange-50 transition-colors group/item"
                            >
                              <ShoppingCart className="size-4 text-orange-500" />
                              <span className="text-[14px] font-black text-text-main group-hover/item:text-orange-600">Flash Sale</span>
                            </Link>
                          </div>
                        </div>
                      )}

                      {/* Categories Dropdown */}
                      {link.hasCategoriesDropdown && (
                        <div className="absolute top-full left-0 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
                          <div className="w-64 bg-card-bg rounded-2xl shadow-2xl border border-dim overflow-hidden">
                            <div className="p-3 border-b border-dim bg-bg-soft/50">
                              <p className="text-[10px] font-black text-text-dim uppercase tracking-wider">បញ្ជីប្រភេទផលិតផល</p>
                            </div>
                            <div className="max-h-[320px] overflow-y-auto custom-scrollbar p-1 bg-card-bg">
                              {isCategoriesLoading ? (
                                <div className="p-8 flex flex-col items-center justify-center gap-2">
                                  <Loader2 className="size-6 text-primary animate-spin" />
                                  <p className="text-[10px] font-bold text-text-dim/60">{t("loading")}</p>
                                </div>
                              ) : categories.length > 0 ? (
                                categories.map((category) => (
                                  <Link
                                    key={category.id}
                                    href={`/books?category=${category.slug}`}
                                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-primary/5 transition-colors group/item"
                                  >
                                    <div className="flex flex-col min-w-0">
                                      <p className="text-[14px] font-black text-text-main group-hover/item:text-primary transition-colors truncate">
                                        {language === "km" ? (category.name_km || category.name) : (category.name || category.name_km)}
                                      </p>
                                      {category.books_count !== undefined && (
                                        <p className="text-[10px] font-bold text-text-dim/60">
                                          {category.books_count} សៀវភៅ
                                        </p>
                                      )}
                                    </div>
                                  </Link>
                                ))
                              ) : (
                                <div className="p-10 text-center flex flex-col items-center gap-2">
                                  <div className="size-10 rounded-full bg-bg-soft flex items-center justify-center text-text-dim/30">
                                    <LayoutGrid className="size-5" />
                                  </div>
                                  <p className="text-[10px] font-bold text-text-dim/60">មិនទាន់មានប្រភេទផលិតផល</p>
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
                    className="p-2 text-text-main hover:text-primary transition-colors"
                  >
                    <SearchIcon className="size-6" />
                  </button>
                  <Link href="/wishlist" className="p-2 text-text-main hover:text-primary transition-colors relative">
                    <Heart className="size-6" />
                    {favoritesCount > 0 && (
                      <span className="absolute top-1 right-1 size-4 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                        {favoritesCount}
                      </span>
                    )}
                  </Link>
                  <button
                    onClick={() => setIsCartOpen(true)}
                    className="p-2 text-text-main hover:text-primary transition-colors relative"
                  >
                    <ShoppingCart className="size-6" />
                    {cartCount > 0 && (
                      <span className="absolute top-1 right-1 size-4 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setLanguage(language === "km" ? "en" : "km")}
                    className="p-1 flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <img
                      src={language === "km" ? "/images/khicon.png" : "/images/enicon.png"}
                      alt={language.toUpperCase()}
                      className="size-8 rounded-full object-cover border border-dim shadow-sm"
                    />
                  </button>
                </div>

                {/* User Profile (Desktop) */}
                <div className="relative group hidden md:block ml-1">
                  {user ? (
                    <>
                      <button className="flex items-center justify-center size-10 rounded-xl border border-dim bg-card-bg hover:border-primary/30 transition-all overflow-hidden relative">
                        {user.avatar_url ? (
                          <Image
                            src={getMediaUrl(user.avatar_url)}
                            alt={user.full_name || "User"}
                            fill
                            className="object-cover"
                            sizes="40px"
                            priority
                          />
                        ) : (
                          <User className="size-6 text-text-main" />
                        )}
                      </button>

                      {/* Dropdown - Redesigned to match screenshot */}
                      <div className="absolute right-0 top-full mt-2 w-72 origin-top-right rounded-xl border border-border-dim bg-card-bg p-4 shadow-2xl animate-in fade-in zoom-in-95 group-hover:block hidden z-[60]">
                        <div className="flex flex-col gap-4">
                          {/* Name Row */}
                          <div className="flex items-center justify-between py-1 border-b border-border-dim/30">
                            <span className="text-[14px] font-bold text-text-dim font-kantumruy">{t("name")}:</span>
                            <span className="text-[14px] font-bold text-primary">{user.full_name}</span>
                          </div>

                          {/* Phone Row */}
                          <div className="flex items-center justify-between py-1 border-b border-border-dim/30">
                            <span className="text-[14px] font-bold text-text-dim font-kantumruy">{t("phone")}:</span>
                            <span className="text-[14px] font-bold text-primary">{user.phone || t("no_phone")}</span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 pt-2">
                            <Link
                              href="/profile"
                              className="flex items-center justify-center gap-3 w-full py-3 rounded-lg bg-primary text-white hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                            >
                              <User className="size-5" />
                              <span className="text-[14px] font-bold font-kantumruy">{t("profile")}</span>
                            </Link>

                            {user.role?.name === "Admin" && (
                              <Link
                                href="/dashboard"
                                className="flex items-center justify-center gap-3 w-full py-3 rounded-lg bg-text-main text-app-bg hover:opacity-90 transition-all shadow-lg"
                              >
                                <LayoutDashboard className="size-5" />
                                <span className="text-[14px] font-bold font-kantumruy">{t("dashboard")}</span>
                              </Link>
                            )}

                            <button
                              onClick={logout}
                              className="flex items-center justify-center w-full py-3 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                            >
                              <span className="text-[16px] font-black font-kantumruy">{t("logout")}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      className="flex items-center justify-center size-10 rounded-lg border border-border-dim bg-card-bg hover:border-primary transition-all shadow-sm"
                    >
                      <User className="size-6 text-text-main" />
                    </Link>
                  )}
                </div>

                {/* Mobile Actions */}
                <div className="flex md:hidden items-center gap-2">
                  <Link href="/wishlist" className="size-10 flex items-center justify-center rounded-lg border border-border-dim text-text-main bg-card-bg relative shadow-sm">
                    <Heart className="size-5" />
                    {favoritesCount > 0 && (
                      <span className="absolute -top-1 -right-1 size-4 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-card-bg">
                        {favoritesCount}
                      </span>
                    )}
                  </Link>
                  <button
                    onClick={() => setIsCartOpen(true)}
                    className="size-10 flex items-center justify-center rounded-lg bg-primary text-white shadow-lg shadow-primary/20 relative active:scale-95 transition-all"
                  >
                    <ShoppingCart className="size-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 size-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-primary">
                        {cartCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setLanguage(language === "km" ? "en" : "km")}
                    className="p-0.5 active:scale-95 transition-all"
                  >
                    <img
                      src={language === "km" ? "/images/khicon.png" : "/images/enicon.png"}
                      alt={language.toUpperCase()}
                      className="size-8 rounded-full object-cover border border-border-dim shadow-sm"
                    />
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
        </>
      )}
    </nav>
  );
}
