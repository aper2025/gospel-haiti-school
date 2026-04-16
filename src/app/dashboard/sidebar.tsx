"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  BookOpen,
  ShieldAlert,
  Wallet,
  UserCog,
  Clock,
  BarChart3,
  CalendarDays,
  Settings,
  LogOut,
  Menu,
  X,
  GraduationCap,
} from "lucide-react";
import { useState } from "react";
import type { SessionUser } from "@/lib/auth";
import { signOut } from "@/app/sign-in/actions";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
};

type SidebarProps = {
  user: SessionUser;
  translations: Record<string, string>;
};

export function Sidebar({ user, translations: t }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: NavItem[] = [
    { href: "/dashboard", label: t.dashboard, icon: LayoutDashboard },
    { href: "/dashboard/students", label: t.students, icon: Users },
    { href: "/dashboard/attendance", label: t.attendance, icon: ClipboardCheck },
    { href: "/dashboard/gradebook", label: t.gradebook, icon: BookOpen },
    { href: "/dashboard/behavior", label: t.behavior, icon: ShieldAlert },
    {
      href: "/dashboard/fees",
      label: t.fees,
      icon: Wallet,
      roles: ["DIRECTOR", "ADMIN"],
    },
    {
      href: "/dashboard/staff",
      label: t.staff,
      icon: UserCog,
      roles: ["DIRECTOR", "ADMIN"],
    },
    { href: "/dashboard/time-clock", label: t.timeClock, icon: Clock },
    {
      href: "/dashboard/schedules",
      label: t.schedules,
      icon: CalendarDays,
      roles: ["DIRECTOR", "ADMIN"],
    },
    {
      href: "/dashboard/reports",
      label: t.reports,
      icon: BarChart3,
      roles: ["DIRECTOR", "ADMIN"],
    },
    {
      href: "/dashboard/settings",
      label: t.settings,
      icon: Settings,
      roles: ["DIRECTOR", "ADMIN"],
    },
  ];

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user.role),
  );

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const nav = (
    <nav className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
            <GraduationCap className="h-5 w-5 text-blue-300" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-wide">GHIS</p>
            <p className="text-[10px] text-blue-300/80 uppercase tracking-widest">Portal</p>
          </div>
        </div>
        <div className="mt-5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 px-3 py-2.5">
          <p className="text-sm font-medium text-white truncate">
            {user.email}
          </p>
          <p className="text-xs text-blue-300/80 mt-0.5">{t.roleName}</p>
        </div>
      </div>

      {/* Links */}
      <div className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-white/20 text-white shadow-sm shadow-black/10"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                active ? "text-blue-300" : "text-slate-400 group-hover:text-blue-300"
              }`} />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Sign out */}
      <div className="p-3 mt-auto">
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {t.signOut}
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 rounded-xl bg-slate-900 p-2.5 text-white shadow-lg shadow-slate-900/30 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 transform transition-transform duration-300 ease-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute top-5 right-4 text-slate-400 hover:text-white transition-colors"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        {nav}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-72 lg:shrink-0 bg-slate-900">
        {nav}
      </aside>
    </>
  );
}
