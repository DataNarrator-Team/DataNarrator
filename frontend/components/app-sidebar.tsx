"use client"

import React, { useState, useRef, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Home,
  Plus,
  FolderKanban,
  Settings,
  LogIn,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Sun,
  Moon,
  ShieldCheck,
} from "lucide-react"
import { useTheme } from "@/lib/theme"
import { useAuth } from "@/lib/auth"

// 1. Navigation links helper
function getNavLinks(pathname: string, isGuest: boolean, isAdmin?: boolean) {
  const links = [
    {
      icon: Home,
      label: "Home",
      href: "/",
      isActive: pathname === "/",
    },
    {
      icon: Plus,
      label: "New project",
      href: isGuest ? "/signin?redirect=/upload" : "/upload",
      isActive: pathname === "/upload",
    },
    {
      icon: FolderKanban,
      label: "My projects",
      href: isGuest ? "/signin?redirect=/projects" : "/projects",
      isActive: pathname === "/projects",
    },
  ];

  if (isAdmin) {
    links.push({
      icon: ShieldCheck,
      label: "Admin Portal",
      href: "/admin",
      isActive: pathname.startsWith("/admin"),
    });
  }

  return links;
}

// 2. Sidebar Header (Brand logo and toggle button)
function SidebarHeader({
  open,
  onToggle,
}: {
  open: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={`flex items-center py-5 ${
        open ? "justify-between px-5" : "justify-center px-2"
      }`}
    >
      {open && (
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition cursor-pointer">
          <div className="relative size-7">
            <Image
              src="/logo.png"
              alt="DataNarrator"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#1a3a5c] dark:text-zinc-100">
            Data<span className="text-[#e99842]">Narrator</span>
          </h1>
        </Link>
      )}

      <button
        type="button"
        onClick={onToggle}
        aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
      >
        {open ? <PanelLeftClose className="size-4" /> : <PanelLeft className="size-4" />}
      </button>
    </div>
  )
}

// 3. Single Navigation Item Link
function SidebarNavItem({
  item,
  open,
}: {
  item: { icon: any; label: string; href: string; isActive: boolean }
  open: boolean
}) {
  const Icon = item.icon

  const handleClick = () => {
    if (item.label.toLowerCase().includes("new project")) {
      window.dispatchEvent(new CustomEvent("datanarrator:new-project"))
    }
  }

  return (
    <Link
      href={item.href}
      onClick={handleClick}
      title={item.label}
      className={`flex items-center gap-3 rounded-xl py-2.5 text-sm transition-all ${
        open ? "px-3.5" : "justify-center px-0"
      } ${
        item.isActive
          ? "bg-[#4a7ff7]/10 font-bold text-[#4a7ff7] dark:bg-[#4a7ff7]/20 dark:text-[#6ba1ff]"
          : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
      }`}
    >
      <Icon
        className={`size-4 shrink-0 ${
          item.isActive ? "text-[#4a7ff7] dark:text-[#6ba1ff]" : "text-slate-400 dark:text-zinc-500"
        }`}
      />
      {open && <span>{item.label}</span>}
    </Link>
  )
}

// 4. Quick Theme Switcher Button
function SidebarThemeToggle({ open }: { open: boolean }) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={`flex w-full items-center gap-3 rounded-xl py-2 text-sm font-semibold transition cursor-pointer text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 ${
        open ? "px-3.5" : "justify-center px-0"
      }`}
    >
      {isDark ? (
        <Sun className="size-4 shrink-0 text-[#e99842]" />
      ) : (
        <Moon className="size-4 shrink-0 text-amber-300" />
      )}
      {open && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
    </button>
  )
}


// 5. Account Authentication Button (Login / Logout)
function SidebarAuthButton({
  isGuest,
  open,
  onLogout,
}: {
  isGuest: boolean
  open: boolean
  onLogout: () => void
}) {
  if (isGuest) {
    return (
      <Link
        href="/signin?redirect=/upload"
        title="Sign in / Log in"
        className={`flex w-full items-center gap-3 rounded-xl py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800 ${
          open ? "px-3.5" : "justify-center px-0"
        }`}
      >
        <LogIn className="size-4 shrink-0 text-slate-500 dark:text-zinc-400" />
        {open && <span>Sign in / Log in</span>}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      title="Log out"
      className={`flex w-full items-center gap-3 rounded-xl py-2.5 text-sm font-semibold text-rose-500 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 cursor-pointer ${
        open ? "px-3.5" : "justify-center px-0"
      }`}
    >
      <LogOut className="size-4 shrink-0" />
      {open && <span>Log out</span>}
    </button>
  )
}

// ============================================================================
// Main Application Sidebar Component
// ============================================================================
export function AppSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { isGuest, isAdmin, profile, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  const navItems = getNavLinks(pathname, isGuest, isAdmin)

  function handleLogout() {
    logout()
    router.push("/signin")
  }

  // Hover expansion timer
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null)

  function clearTimer() {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
  }

  // Mouse enter handler: expand with slight debounce
  function handleMouseEnter() {
    clearTimer()
    hoverTimerRef.current = setTimeout(() => {
      setOpen(true)
    }, 100)
  }

  // Mouse leave handler: collapse with slight debounce
  function handleMouseLeave() {
    clearTimer()
    hoverTimerRef.current = setTimeout(() => {
      setOpen(false)
    }, 100)
  }

  // Clean timer on unmount
  useEffect(() => {
    return () => clearTimer()
  }, [])

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`sticky top-0 z-20 flex h-screen shrink-0 flex-col justify-between border-r border-slate-200/80 bg-white dark:border-zinc-700/60 dark:bg-[#1e2127] transition-all duration-300 select-none ${
        open ? "w-64" : "w-16"
      }`}
    >
      <div className="flex flex-col">
        <SidebarHeader open={open} onToggle={() => setOpen((prev) => !prev)} />

        <nav className="flex flex-col gap-1 px-2.5">
          {navItems.map((item) => (
            <SidebarNavItem key={item.label} item={item} open={open} />
          ))}
        </nav>
      </div>

      <div className="border-t border-slate-200/70 dark:border-zinc-700/60 p-2.5 space-y-1.5">
        {/* User Profile Card inside Sidebar */}
        {!isGuest && (
          <Link
            href="/settings"
            title="Account Profile & Settings"
            className={`flex items-center gap-2.5 rounded-2xl border border-slate-200/80 dark:border-zinc-750 bg-slate-50/90 dark:bg-zinc-800/60 hover:bg-slate-100/90 dark:hover:bg-zinc-800 transition cursor-pointer group ${
              open ? "p-2.5" : "justify-center p-2"
            }`}
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#4a7ff7]/10 text-[#4a7ff7] dark:bg-[#4a7ff7]/20 dark:text-[#6ba1ff] font-bold text-xs uppercase group-hover:scale-105 transition shadow-2xs">
              {((profile?.displayName || "Shahad Saif").trim().charAt(0) || "S").toUpperCase()}
            </div>
            {open && (
              <div className="overflow-hidden min-w-0 text-left flex-1">
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate group-hover:text-[#4a7ff7] transition">
                  {profile?.displayName || "Shahad Saif"}
                </p>
                <p className="text-[10px] font-mono text-slate-400 dark:text-zinc-400 truncate">
                  @{profile?.username || "shahad_saif"}
                </p>
              </div>
            )}
          </Link>
        )}

        {/* Settings button */}
        <Link
          href={isGuest ? "/signin?redirect=/settings" : "/settings"}
          title="Settings"
          className={`flex items-center gap-3 rounded-xl py-2 text-sm transition-all cursor-pointer ${
            open ? "px-3" : "justify-center px-0"
          } ${
            pathname === "/settings"
              ? "bg-[#4a7ff7]/10 font-bold text-[#4a7ff7] dark:bg-[#4a7ff7]/20 dark:text-[#6ba1ff]"
              : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-300 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
          }`}
        >
          <Settings
            className={`size-4 shrink-0 ${
              pathname === "/settings" ? "text-[#4a7ff7] dark:text-[#6ba1ff]" : "text-slate-400 dark:text-zinc-500"
            }`}
          />
          {open && <span className="truncate">Settings</span>}
        </Link>

        {/* Quick controls: Theme & Auth */}
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

            {isGuest ? (
              <Link
                href="/signin?redirect=/upload"
                title="Sign in / Log in"
                className="flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-medium text-slate-700 dark:text-zinc-300 bg-slate-100/70 hover:bg-slate-200/70 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <LogIn className="size-3.5 shrink-0" />
                <span>Log In</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                title="Log out"
                className="flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50/70 hover:bg-rose-100/80 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 transition cursor-pointer"
              >
                <LogOut className="size-3.5 shrink-0" />
                <span>Log out</span>
              </button>
            )}
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
            {isGuest ? (
              <Link
                href="/signin?redirect=/upload"
                title="Sign in"
                className="flex size-8 mx-auto items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <LogIn className="size-4" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                title="Log out"
                className="flex size-8 mx-auto items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
              >
                <LogOut className="size-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}

export default AppSidebar