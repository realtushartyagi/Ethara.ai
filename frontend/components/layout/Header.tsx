"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize,
  ChevronDown,
  LogOut,
  User,
  Settings as SettingsIcon,
  Menu,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type HeaderProps = {
  onToggleSidebar?: () => void;
  onOpenMobile?: () => void;
  sidebarCollapsed?: boolean;
};

export function Header({ onToggleSidebar, onOpenMobile, sidebarCollapsed }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <header className="flex h-[70px] items-center justify-between border-b border-[#eff2f7] bg-white px-4 md:px-8 shadow-sm z-10 transition-all">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={onOpenMobile}
          className="inline-flex lg:hidden h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-[#f8f8fb] text-[#6c757d] transition-all hover:text-primary"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden lg:inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#e9ebec] bg-white text-[#6c757d] transition-all hover:bg-[#f8f8fb] hover:text-primary"
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen size={20} />
            ) : (
              <PanelLeftClose size={20} />
            )}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Full Screen Toggle */}
        <button
          type="button"
          onClick={toggleFullScreen}
          className="hidden md:flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-[#74788d] transition-all hover:bg-[#f8f8fb] hover:text-primary"
          aria-label="Toggle full screen"
        >
          <Maximize size={18} />
        </button>

        {/* Notifications */}
        <div className="relative group/tooltip flex items-center">
          <button
            type="button"
            className="relative h-10 w-10 cursor-pointer flex items-center justify-center rounded-full text-[#74788d] transition-all hover:bg-[#f8f8fb] hover:text-primary"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-danger border border-white"></span>
          </button>
          <span className="pointer-events-none absolute top-full left-1/2 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#0f2440] px-3 py-1.5 text-[10px] font-bold text-white opacity-0 transition-all group-hover/tooltip:opacity-100 z-50 shadow-xl">
            Coming soon
            <span className="absolute left-1/2 bottom-full -translate-x-1/2 border-[4px] border-transparent border-b-[#0f2440]" />
          </span>
        </div>

        {/* Profile Avatar & Name */}
        <div ref={menuRef} className="relative ml-2">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((prev) => !prev)}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 transition-all hover:bg-[#f8f8fb]"
          >
            <div className="h-9 w-9 rounded-full border-2 border-[#eff2f7] bg-[#1a3353] flex items-center justify-center text-white overflow-hidden shadow-sm">
              <img
                src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=1a3353&color=fff`}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="hidden md:flex items-center gap-1.5 ml-0.5">
              <span className="text-sm font-bold text-[#343a40]">{user?.name || 'User'}</span>
              <ChevronDown size={14} className={`text-[#74788d] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {open && (
            <div className="absolute right-0 z-50 mt-1 w-44 rounded-lg border border-[#eff2f7] bg-white py-1 text-sm shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-[#f8f8fb] mb-1">
                <p className="text-[10px] font-semibold text-[#adb5bd] uppercase tracking-wider">Welcome {user?.name?.split(' ')[0]}!</p>
              </div>
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-[#495057] transition-colors hover:bg-[#f8f8fb] hover:text-primary"
                onClick={() => {
                  setOpen(false);
                  router.push("/profile");
                }}
              >
                <User size={16} className="text-[#74788d]" />
                <span>Profile Settings</span>
              </button>

              <div className="my-1 border-t border-[#eff2f7]" />

              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-danger transition-colors hover:bg-danger/5"
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
              >
                <LogOut size={16} />
                <span className="font-semibold">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
