"use client";

import { SidebarProvider, useSidebar } from "./sidebar-context";
import { Sidebar, Topbar, Breadcrumbs } from "./nav";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex h-dvh bg-app-bg overflow-hidden" suppressHydrationWarning>
      <Sidebar />
      <div 
        className={`flex flex-1 flex-col transition-all duration-300 ${
          isCollapsed ? "lg:pl-[68px]" : "lg:pl-[280px]"
        }`}
        suppressHydrationWarning
      >
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="space-y-4 w-full">
            <Breadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}
