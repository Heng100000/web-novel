"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconDashboard,
  IconBooks,
  IconLogout,
  IconSearch,
  IconBell,
  IconTags,
  IconPen,
  IconMenu,
  IconChevronRight,
  IconEvents,
  IconOrders,
  IconCart,
  IconUsers,
  IconShield,
  IconTicket
} from "../dashboard-icons";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "./theme-toggle";
import { NotificationDrawer } from "./notification-drawer";
import { NotificationDropdown } from "./notification-dropdown";
import { useSidebar } from "./sidebar-context";
import { apiClient } from "@/lib/api-client";


function getInitials(name: string) {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name[0].toUpperCase();
}

function NavItem({
  href,
  icon: Icon,
  children
}: {
  href: string;
  icon: any;
  children: React.ReactNode
}) {
  const pathname = usePathname();
  // Active if exact match or if it's a sub-route (e.g. /dashboard/books/create should highlight /dashboard/books)
  const isActive = href === "/dashboard"
    ? pathname === "/dashboard"
    : pathname.startsWith(href);
  const { isCollapsed, closeMobileSidebar } = useSidebar();

  return (
    <div className="relative flex items-center justify-center">
      <Link
        href={href}
        onClick={closeMobileSidebar}
        onMouseEnter={(e) => {
          if (!isCollapsed) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const tooltip = e.currentTarget.querySelector(".fixed-tooltip") as HTMLElement;
          if (tooltip) {
            tooltip.style.top = `${rect.top + (rect.height / 2)}px`;
          }
        }}
        className={`relative flex items-center transition-all duration-300 group ${isCollapsed
            ? "justify-center h-11 w-11 rounded-xl mx-auto"
            : "w-full gap-3.5 rounded-xl px-3.5 py-2.5"
          } ${isActive
            ? "bg-primary text-white font-bold shadow-lg shadow-primary/20 ring-1 ring-primary/30"
            : "text-text-dim hover:bg-primary/5 hover:text-primary dark:hover:text-emerald-500 font-bold"
          }`}
      >
        <Icon className={`size-[20px] shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-white" : "text-text-dim/70 group-hover:text-primary dark:group-hover:text-emerald-500"}`} />
        {!isCollapsed && (
          <span className="truncate text-[15px] font-bold tracking-tight">
            {children}
          </span>
        )}

        {/* Tooltip for collapsed state - Using fixed positioning and JS update to follow scroll */}
        {isCollapsed && (
          <div className="fixed-tooltip fixed left-[76px] -translate-y-1/2 z-[9999] hidden whitespace-nowrap rounded-lg bg-zinc-900/95 dark:bg-zinc-800/95 backdrop-blur-md px-3 py-2 text-[11px] font-black uppercase tracking-wider text-white shadow-2xl group-hover:block animate-in fade-in slide-in-from-left-2 duration-200 ring-1 ring-white/10 pointer-events-none">
            {children}
            {/* Tooltip Arrow */}
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 size-2 rotate-45 bg-zinc-900/95 dark:bg-zinc-800/95 border-l border-b border-white/10" />
          </div>
        )}
      </Link>
    </div>
  );
}

function NavGroup({
  title,
  children,
  isOpen,
  onToggle
}: {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const { isCollapsed } = useSidebar();

  return (
    <div className={`flex flex-col transition-all duration-300 ${isCollapsed ? "gap-2" : "gap-1"}`}>
      {!isCollapsed && (
        <button
          onClick={onToggle}
          className="group flex w-full items-center justify-between px-4 pb-2 pt-6 transition-all hover:opacity-80"
        >
          <span className="text-[11px] font-black uppercase tracking-[0.15em] text-text-dim/60">
            {title}
          </span>
          <IconChevronRight
            className={`size-3 transition-all duration-500 ${isOpen ? "rotate-90 text-primary" : "text-text-dim/40"}`}
          />
        </button>
      )}
      {isCollapsed && <div className="mx-auto h-px w-8 bg-grayborde my-2" />}

      <div
        className={`grid ${
          isCollapsed 
            ? "grid-rows-[1fr] opacity-100 mt-2" 
            : isOpen 
              ? "grid-rows-[1fr] opacity-100 mt-2 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]" 
              : "grid-rows-[0fr] opacity-0 mt-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
        }`}
      >
        <div className={isCollapsed ? "" : "overflow-hidden"}>
          <div className={`${
            isCollapsed 
              ? "flex flex-col items-center" 
              : isOpen
                ? "translate-y-0 opacity-100 scale-100 transition-all duration-500 ease-out transform"
                : "-translate-y-4 opacity-0 scale-95 transition-all duration-500 ease-out transform"
          } space-y-1`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}



export function Sidebar() {
  const { user, isAdmin, logout, hasPermission } = useAuth();
  const { isCollapsed, isMobileOpen, closeMobileSidebar } = useSidebar();
  const pathname = usePathname();

  // Expanded groups state
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    management: true,
    marketing: true,
    access: true
  });

  const [searchQuery, setSearchQuery] = useState("");

  // Menu structure data
  const MENU_GROUPS = [
    {
      id: "management",
      title: "ការគ្រប់គ្រងមាតិកា",
      items: [
        { href: "/dashboard/books", label: "សៀវភៅរឿង", icon: IconBooks, resource: "books" },
        { href: "/dashboard/authors", label: "អ្នកនិពន្ធ", icon: IconPen, resource: "authors" },
        { href: "/dashboard/categories", label: "ប្រភេទសៀវភៅ", icon: IconTags, resource: "categories" },
      ]
    },
    {
      id: "marketing",
      title: "ការលក់ និងការបញ្ជាទិញ",
      items: [
        { href: "/dashboard/events", label: "ការផ្សព្វផ្សាយ", icon: IconEvents, resource: "events" },
        { href: "/dashboard/coupons", label: "ប័ណ្ណបញ្ចុះតម្លៃ", icon: IconTicket, resource: "coupons" },
        { href: "/dashboard/add-to-cart", label: "កញ្ចប់ទិញទំនិញ", icon: IconOrders, resource: "cart" },
        { href: "/dashboard/orders", label: "ប្រវត្តិនៃការបញ្ជាទិញ", icon: IconCart, resource: "orders" },
      ]
    },
    {
      id: "access",
      title: "ការគ្រប់គ្រងការចូលប្រើប្រាស់",
      items: [
        { href: "/dashboard/users", label: "អ្នកប្រើប្រាស់", icon: IconUsers, resource: "users" },
        { href: "/dashboard/roles", label: "តួនាទី និងសិទ្ធិ", icon: IconShield, resource: "roles" },
      ]
    }
  ];

  // Role-based Filtering + Search Filtering
  const filteredGroups = MENU_GROUPS.map(group => {
    const filteredItems = group.items.filter(item => {
      // 1. Check Search Query
      const matchesSearch = item.label.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });

    return { ...group, items: filteredItems };
  }).filter(group => group.items.length > 0);

  // Show dashboard item based on search
  const showDashboard = searchQuery === "" || "ផ្ទាំងគ្រប់គ្រង".includes(searchQuery);

  // Load expanded state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar_expanded");
      if (saved) {
        setExpanded(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load sidebar state", e);
    }
  }, []);

  // Toggle group helper with persistence
  const toggleGroup = (id: string) => {
    setExpanded(prev => {
      const newState = { ...prev, [id]: !prev[id] };
      localStorage.setItem("sidebar_expanded", JSON.stringify(newState));
      return newState;
    });
  };

  useEffect(() => {
    if (isMobileOpen) {
      closeMobileSidebar();
    }
  }, [pathname, isMobileOpen, closeMobileSidebar]);

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-[100] bg-zinc-900/40 backdrop-blur-md lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-[110] flex flex-col border-r border-grayborde bg-card-bg transition-all duration-300 ease-in-out lg:translate-x-0 ${isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full shadow-none"
          } ${isCollapsed ? "lg:w-[68px]" : "lg:w-[280px]"}`}
      >
        {/* Brand Section */}
        <div className={`flex h-16 items-center shrink-0 border-b border-grayborde transition-all duration-300 ${isCollapsed ? "justify-center px-0" : "px-6"}`}>
          <Link href="/dashboard" className="flex items-center">
            {isCollapsed ? (
              <img src="/images/logo.png" alt="Logo" className="size-10 object-contain" />
            ) : (
              <img src="/images/logo_full.png" alt="NovelAdmin" className="h-10 w-auto object-contain" />
            )}
          </Link>
        </div>

        {/* Search Bar Section */}
        {!isCollapsed && (
          <div className="px-4 pt-4">
            <div className="relative group">
              <div className="flex h-10 w-full items-center overflow-hidden rounded-xl border border-border-dim/50 bg-bg-soft/30 transition-all focus-within:border-primary shadow-sm">
                <div className="flex aspect-square h-full items-center justify-center border-r border-border-dim/30 px-2.5 text-text-dim/50 group-focus-within:text-primary transition-colors">
                  <IconSearch className="size-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ស្វែងរកម៉ឺនុយ..."
                  className="h-full w-full bg-transparent px-3 text-[13px] font-bold text-text-main outline-none placeholder:text-text-dim/30 placeholder:font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="flex aspect-square h-full items-center justify-center px-2 text-text-dim/40 hover:text-text-main transition-colors"
                  >
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Content */}
        <nav className={`flex-1 pt-6 pb-6 overflow-y-auto scrollbar-sidebar transition-all duration-300 flex flex-col ${isCollapsed ? "pl-[4px] px-0 space-y-6 items-center" : "px-3 space-y-1"}`}>
          {showDashboard && <div className="px-1"><NavItem href="/dashboard" icon={IconDashboard}>ផ្ទាំងគ្រប់គ្រង</NavItem></div>}

          {filteredGroups.map(group => (
            <NavGroup
              key={group.id}
              title={group.title}
              isOpen={expanded[group.id] || searchQuery !== ""}
              onToggle={() => toggleGroup(group.id)}
            >
              <div className={isCollapsed ? "" : "px-1"}>
                {group.items.map(item => (
                  <NavItem key={item.href} href={item.href} icon={item.icon}>{item.label}</NavItem>
                ))}
              </div>
            </NavGroup>
          ))}
        </nav>

        {/* Bottom Section: Integrated Profile & Actions */}
        <div className="p-4 border-t border-grayborde bg-bg-soft/30">
          <div className="flex flex-col gap-1">
            {!isCollapsed ? (
              <div className="mb-2 px-3 py-3 flex items-center gap-3 rounded-xl hover:bg-bg-soft transition-colors group cursor-default">
                <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-sm font-black text-white shadow-lg shadow-primary/20">
                  {getInitials(user?.full_name || "")}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-[15px] font-bold text-text-main leading-tight">{user?.full_name || "អ្នកគ្រប់គ្រង"}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-black text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full ring-1 ring-amber-500/20">
                      {user?.reward_points || 0} ពិន្ទុ
                    </span>
                    <Link href="/dashboard/settings" className="text-[11px] font-black uppercase tracking-widest text-primary dark:text-emerald-500 hover:underline">គ្រប់គ្រង</Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="size-11 mx-auto mb-2 rounded-xl bg-primary flex items-center justify-center text-[11px] font-black text-white shadow-md ring-2 ring-white">
                {getInitials(user?.full_name || "")}
              </div>
            )}

            <button
              onClick={logout}
              className={`flex items-center transition-all duration-300 group ${isCollapsed
                  ? "justify-center h-11 w-11 mx-auto rounded-xl"
                  : "w-full gap-3.5 rounded-xl px-3.5 py-2.5"
                } text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-700 active:scale-95`}
            >
              <IconLogout className="size-5 shrink-0" />
              {!isCollapsed && <span className="text-[15px] font-bold">ចាកចេញ</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}


export function Breadcrumbs() {
  const pathname = usePathname();

  // Simple breadcrumb generator
  const breadcrumbs = pathname
    .split("/")
    .filter(Boolean)
    .filter(part => isNaN(Number(part))) // Filter out numeric IDs
    .map((part, i, arr) => {
      const href = "/" + arr.slice(0, i + 1).join("/");
      const label = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ");
      return { label, href };
    })
    .slice(1);

  if (breadcrumbs.length === 0) return null;

  return (
    <nav className="flex items-center gap-2 overflow-hidden py-2">
      <Link href="/dashboard" className="text-sm font-bold uppercase tracking-widest text-text-dim hover:text-primary transition-colors">បណ្ណាល័យ</Link>
      {breadcrumbs.map((bc, i) => {
        // Localized labels for breadcrumbs
        const labelMap: Record<string, string> = {
          'Books': 'សៀវភៅ',
          'Authors': 'អ្នកនិពន្ធ',
          'Categories': 'ប្រភេទ',
          'Events': 'ការផ្សព្វផ្សាយ',
          'Coupons': 'ប័ណ្ណបញ្ចុះតម្លៃ',
          'Add to cart': 'កញ្ចប់ទំនិញ',
          'Orders': 'ការបញ្ជាទិញ',
          'Users': 'អ្នកប្រើប្រាស់',
          'Roles': 'តួនាទី',
          'Create': 'បង្កើតថ្មី',
          'Edit': 'កែប្រែ'
        };
        const khLabel = labelMap[bc.label] || bc.label;

        return (
          <div key={bc.href} className="flex items-center gap-2">
            <IconChevronRight className="size-2.5 text-text-dim/60" />
            <Link
              href={bc.href}
              className={`text-sm font-bold uppercase tracking-widest truncate max-w-[150px] transition-colors ${i === breadcrumbs.length - 1 ? "text-text-main" : "text-text-main/60 hover:text-primary"}`}
            >
              {khLabel}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}

export function Topbar() {
  const { user } = useAuth();
  const { isCollapsed, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res: any = await apiClient("/notifications/");
      const notifications = Array.isArray(res) ? res : res.results || [];
      const count = notifications.filter((n: any) => !n.is_read).length;
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    // Refresh every minute
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Also refresh when dropdown closes (in case user marked all as read)
  useEffect(() => {
    if (!isNotificationOpen) {
      fetchUnreadCount();
    }
  }, [isNotificationOpen, fetchUnreadCount]);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-grayborde bg-card-bg/95 px-4 backdrop-blur-md lg:px-8">
      <div className="flex flex-1 items-center gap-4">
        {/* Toggle Button */}
        <button
          onClick={toggleMobileSidebar}
          className="lg:hidden flex size-9 items-center justify-center rounded-lg bg-bg-soft text-text-dim transition-all hover:bg-bg-soft hover:text-text-main active:scale-95"
        >
          <IconMenu className="size-5" />
        </button>

        <button
          onClick={toggleSidebar}
          className="hidden lg:flex size-9 items-center justify-center rounded-lg bg-bg-soft/50 text-text-dim transition-all hover:bg-bg-soft hover:text-text-main active:scale-95"
        >
          <IconMenu className="size-4.5" />
        </button>

        {/* Breadcrumbs removed from Topbar */}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-full max-w-[280px] hidden md:block group">
          <div className="flex h-10 w-full items-center overflow-hidden rounded-full border border-grayborde bg-card-bg transition-all focus-within:border-primary dark:focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-primary/5 shadow-sm">
            <div className="flex aspect-square h-full items-center justify-center border-r border-grayborde/80 px-3 text-text-dim group-focus-within:text-primary dark:group-focus-within:text-emerald-500">
              <IconSearch className="size-4.5" />
            </div>
            <input
              type="search"
              placeholder="ស្វែងរកសៀវភៅ..."
              className="h-full w-full bg-transparent px-4 text-xs font-semibold text-text-main outline-none placeholder:text-text-main/40 placeholder:font-medium"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">

          <ThemeToggle />

          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className={`relative flex size-10 items-center justify-center rounded-xl transition-all duration-200 active:scale-95 group ${isNotificationOpen
                  ? "bg-primary text-white shadow-md"
                  : "bg-surface-1 dark:bg-zinc-900 border border-border-dim/60 text-text-dim hover:text-primary dark:text-zinc-400 dark:hover:text-emerald-500 hover:border-primary/40 active:scale-95 shadow-sm"
                }`}
            >
              <IconBell className={`size-5 transition-transform duration-300 ${isNotificationOpen ? "scale-110" : "group-hover:scale-110"}`} />

              {unreadCount > 0 && (
                <div className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white ring-2 ring-card-bg">
                  {unreadCount}
                </div>
              )}
            </button>

            <NotificationDropdown
              isOpen={isNotificationOpen}
              onClose={() => setIsNotificationOpen(false)}
            />
          </div>
        </div>
      </div>

      <NotificationDrawer
        isOpen={false} // Disabled for now in favor of dropdown
        onClose={() => setIsNotificationOpen(false)}
      />
    </header>
  );
}
