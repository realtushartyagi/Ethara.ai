"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  UserCircle,
  Users as UsersIcon,
  Flower2,
  Kanban,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// ─── Types ───────────────────────────────────────────────────────────────────

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  exact?: boolean; // match exact path instead of startsWith
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

// ─── Nav config ──────────────────────────────────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Menu",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/projects",  label: "Projects",  icon: FolderKanban },
      { href: "/tasks",     label: "My Tasks",  icon: CheckSquare },
      { href: "/kanban",    label: "Kanban",    icon: Kanban },
    ],
  },
  {
    title: "Management",
    items: [
      { href: "/users", label: "Users", icon: UsersIcon, adminOnly: true },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/profile", label: "My Profile", icon: UserCircle },
    ],
  },
];

// ─── Tooltip (portal-free, CSS-driven) ───────────────────────────────────────
// Rendered next to each nav item when sidebar is collapsed.
// Uses CSS group-hover so no JS/state needed — zero flicker.

function CollapsedTooltip({ label }: { label: string }) {
  return (
    <span
      aria-hidden
      className="
        pointer-events-none absolute left-[calc(100%+12px)] top-1/2
        -translate-y-1/2 z-[999]
        whitespace-nowrap rounded-lg
        bg-[#0f2440] px-3 py-1.5
        text-[11px] font-bold text-white
        shadow-xl ring-1 ring-white/10
        opacity-0 scale-95 translate-x-1
        group-hover/item:opacity-100 group-hover/item:scale-100 group-hover/item:translate-x-0
        transition-all duration-200 ease-out
      "
    >
      {label}
      {/* Arrow */}
      <span className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-[#0f2440]" />
    </span>
  );
}

// ─── Nav Item ────────────────────────────────────────────────────────────────

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  return (
    <div className="relative group/item">
      <Link
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={`
          flex items-center rounded-xl transition-all duration-200
          ${collapsed ? "justify-center p-2.5" : "gap-3 px-3.5 py-2.5"}
          ${
            active
              ? "bg-white/12 text-white"
              : "text-white/45 hover:bg-white/7 hover:text-white/90"
          }
        `}
      >
        {/* Active left bar */}
        {active && !collapsed && (
          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.7)]" />
        )}

        <Icon
          size={18}
          strokeWidth={active ? 2.2 : 1.8}
          className={`flex-shrink-0 transition-transform duration-200 group-hover/item:scale-110 ${
            active ? "text-primary" : ""
          }`}
        />

        {!collapsed && (
          <>
            <span className="truncate text-[13px] font-semibold leading-none">
              {item.label}
            </span>
            {active && (
              <span className="ml-auto h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
            )}
          </>
        )}
      </Link>

      {/* Tooltip — only when collapsed */}
      {collapsed && <CollapsedTooltip label={item.label} />}
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed?: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ collapsed = false, mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  // Close mobile sidebar on route change
  useEffect(() => {
    if (mobileOpen) onCloseMobile?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Treat mobile-open as "not collapsed" for layout
  const isExpanded = !collapsed || mobileOpen;

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex h-screen flex-col
          bg-[#1a3353] text-white
          shadow-2xl shadow-black/30
          transition-all duration-300 ease-in-out
          lg:sticky lg:top-0 lg:z-30
          ${isExpanded ? "w-64" : "w-[68px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* ── Logo ── */}
        <div
          className={`flex h-[64px] flex-shrink-0 items-center border-b border-white/[0.06] ${
            isExpanded ? "px-5 gap-3" : "justify-center"
          }`}
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-md shadow-black/20">
            <img src="/icon.svg" alt="Logo" width={17} height={17} />
          </div>

          {isExpanded && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/40 leading-tight">
                Ethara AI
              </span>
              <span className="text-[13px] font-extrabold tracking-tight text-white leading-tight">
                Task Manager
              </span>
            </div>
          )}
        </div>

        {/* ── Nav ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 scrollbar-none">
          {NAV_GROUPS.map((group, gi) => {
            const visible = group.items.filter((i) => !i.adminOnly || isAdmin);
            if (!visible.length) return null;

            return (
              <div key={group.title} className={gi > 0 ? "mt-5" : ""}>
                {isExpanded && (
                  <p className="mb-1.5 px-4 text-[9.5px] font-bold uppercase tracking-[0.15em] text-white/25">
                    {group.title}
                  </p>
                )}

                {/* Divider in collapsed mode instead of label */}
                {!isExpanded && gi > 0 && (
                  <div className="mx-auto mb-3 mt-1 h-px w-8 bg-white/10" />
                )}

                <nav className={`space-y-0.5 ${isExpanded ? "px-3" : "px-2"}`}>
                  {visible.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      active={isActive(item)}
                      collapsed={!isExpanded}
                    />
                  ))}
                </nav>
              </div>
            );
          })}
        </div>

        {/* ── Footer user chip ── */}
        <div className={`flex-shrink-0 border-t border-white/[0.06] p-3 ${isExpanded ? "" : "flex justify-center"}`}>
          <Link
            href="/profile"
            className={`flex items-center rounded-xl transition-all duration-200 hover:bg-white/7 ${
              isExpanded ? "gap-2.5 px-2 py-2" : "p-2"
            }`}
          >
            <div className="h-7 w-7 flex-shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
              <UserCircle size={16} className="text-primary" />
            </div>
            {isExpanded && (
              <span className="text-[12px] font-semibold text-white/60 hover:text-white/90 transition-colors truncate">
                My Profile
              </span>
            )}
          </Link>
        </div>
      </aside>
    </>
  );
}