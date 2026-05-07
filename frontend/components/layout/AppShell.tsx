"use client";

import { ReactNode, useState, useCallback, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const stored = window.localStorage.getItem("task-manager-sidebar");
      return stored === "collapsed";
    } catch {
      return false;
    }
  });
  
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "task-manager-sidebar",
        collapsed ? "collapsed" : "expanded",
      );
    } catch {
      // ignore persistence errors
    }
  }, [collapsed]);

  const toggleSidebar = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f8fb]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8f8fb]">
      <Sidebar 
        collapsed={collapsed} 
        mobileOpen={mobileOpen} 
        onCloseMobile={() => setMobileOpen(false)} 
      />
      
      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        <Header 
          onToggleSidebar={toggleSidebar} 
          onOpenMobile={() => setMobileOpen(true)}
          sidebarCollapsed={collapsed} 
        />
        <main className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
