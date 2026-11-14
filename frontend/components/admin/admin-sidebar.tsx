"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Users,
  LogOut,
  ExternalLink,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeft,
  Inbox,
} from "lucide-react";
import {
  useAuth,
  getAccountDeletionRequests,
  EVENT_DELETION_REQUESTS_CHANGED,
} from "@/lib/auth";
import { useTheme } from "@/lib/theme";

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function AdminSidebar({ activeTab, setActiveTab }: AdminSidebarProps) {
  const router = useRouter();
  const { profile, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [open, setOpen] = useState(true);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    const syncCount = () => {
      const reqs = getAccountDeletionRequests();
      setPendingRequestsCount(reqs.filter((r) => r.status === "pending").length);
    };
    syncCount();
    window.addEventListener(EVENT_DELETION_REQUESTS_CHANGED, syncCount);
    window.addEventListener("storage", syncCount);
    return () => {
      window.removeEventListener(EVENT_DELETION_REQUESTS_CHANGED, syncCount);
      window.removeEventListener("storage", syncCount);
    };
  }, []);

  const navItems = [
    {
      id: "users",
      label: "Manage Users",
      icon: Users,
    },
    {
      id: "requests",
      label: "Deletion Requests",
      icon: Inbox,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : null,
    },
  ];

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <aside
      className={`sticky top-0 z-20 flex h-screen shrink-0 flex-col justify-between border-r border-slate-200/80 bg-white dark:border-zinc-700/60 dark:bg-[#1e2127] transition-all duration-300 select-none ${
        open ? "w-64" : "w-16"
      }`}
    >
      <div className="flex flex-col">
        {/* Header matching user sidebar */}
        <div
          className={`flex items-center py-5 ${
            open ? "justify-between px-5" : "justify-center px-2"
          }`}
        >
          {open && (
            <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition cursor-pointer">
              <div className="relative size-7">
                <Image src="/logo.png" alt="DataNarrator" fill className="object-contain" priority />
              </div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-bold tracking-tight text-[#1a3a5c] dark:text-zinc-100">
                  Data<span className="text-[#e99842]">Narrator</span>
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                  Admin
                </span>
              </div>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
            className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
          >
            {open ? <PanelLeftClose className="size-4" /> : <PanelLeft className="size-4" />}
          </button>
        </div>

        {/* Nav Items with user sidebar theme styling */}
        <nav className="flex flex-col gap-1 px-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                title={item.label}
                className={`flex items-center gap-3 rounded-xl py-2.5 text-sm transition-all cursor-pointer relative ${
                  open ? "px-3.5" : "justify-center px-0"
                } ${
                  isActive
                    ? "bg-[#4a7ff7]/10 font-bold text-[#4a7ff7] dark:bg-[#4a7ff7]/20 dark:text-[#6ba1ff]"
                    : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`size-4 shrink-0 ${
                      isActive ? "text-[#4a7ff7] dark:text-[#6ba1ff]" : "text-slate-400 dark:text-zinc-500"
                    }`}
                  />
                  {!open && item.badge !== null && item.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-1.5 size-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-zinc-800" />
                  )}
                </div>
                {open && <span className="truncate flex-1 text-left">{item.label}</span>}
                {open && item.badge !== null && item.badge !== undefined && (
                  <span className="ml-auto inline-flex items-center justify-center rounded-full text-[10px] font-bold px-2 py-0.5 bg-rose-500 text-white shadow-2xs">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer matching user sidebar with organized modern layout */}
      <div className="border-t border-slate-200/70 dark:border-zinc-700/60 p-2.5 space-y-1.5">
        {/* Admin Profile Card */}
        <div
          title="Admin Profile"
          className={`flex items-center gap-2.5 rounded-2xl border border-slate-200/80 dark:border-zinc-750 bg-slate-50/90 dark:bg-zinc-800/60 hover:bg-slate-100/90 dark:hover:bg-zinc-800 transition cursor-pointer group ${
            open ? "p-2.5" : "justify-center p-2"
          }`}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#4a7ff7]/10 text-[#4a7ff7] dark:bg-[#4a7ff7]/20 dark:text-[#6ba1ff] font-bold text-xs uppercase group-hover:scale-105 transition shadow-2xs">
            {((profile?.displayName || "System Administrator").trim().charAt(0) || "S").toUpperCase()}
          </div>
          {open && (
            <div className="overflow-hidden min-w-0 flex-1 text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate group-hover:text-[#4a7ff7] transition">
                {profile?.displayName || "System Administrator"}
              </p>
              <p className="text-[10px] font-mono text-slate-400 dark:text-zinc-400 truncate">
                @{profile?.username || "admin"}
              </p>
            </div>
          )}
        </div>

        {/* Switch to normal user workspace */}
        <Link
          href="/upload"
          title="Switch to User Workspace"
          className={`flex items-center rounded-xl py-2 px-3 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition cursor-pointer ${
            open ? "justify-between" : "justify-center px-0"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ExternalLink className="size-3.5 text-[#4a7ff7] shrink-0" />
            {open && <span>User Workspace</span>}
          </div>
          {open && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200/60 dark:border-zinc-700/60">
              Switch
            </span>
          )}
        </Link>

        {/* Quick controls: Theme & Log out */}
        {open ? (
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? "Switch to light theme" : "Switch to dark theme"}
              className="flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-medium text-slate-600 dark:text-zinc-300 bg-slate-100/70 hover:bg-slate-200/70 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              {isDark ? (
                <Sun className="size-3.5 text-amber-500 shrink-0" />
              ) : (
                <Moon className="size-3.5 text-amber-500 shrink-0" />
              )}
              <span className="truncate">{isDark ? "Light" : "Dark"}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              title="Log out"
              className="flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50/70 hover:bg-rose-100/80 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 transition cursor-pointer"
            >
              <LogOut className="size-3.5 shrink-0" />
              <span>Log out</span>
            </button>
          </div>
        ) : (
          <div className="space-y-1 pt-1">
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? "Light mode" : "Dark mode"}
              className="flex size-8 mx-auto items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
            >
              {isDark ? <Sun className="size-4 text-amber-500" /> : <Moon className="size-4 text-amber-500" />}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              title="Log out"
              className="flex size-8 mx-auto items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
