"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

// Navigation router helper
function navigateBack(router: any, fallbackHref: string) {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push(fallbackHref)
  }
}

// Main BackButton Component
export function BackButton({
  label = "Back to home",
  fallbackHref = "/",
  className = "",
}: {
  label?: string
  fallbackHref?: string
  className?: string
}) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => navigateBack(router, fallbackHref)}
      className={`inline-flex items-center gap-2 rounded-xl border border-slate-200/80 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-zinc-200 shadow-sm backdrop-blur-md transition hover:bg-white dark:hover:bg-zinc-700 hover:text-slate-900 dark:hover:text-zinc-100 active:scale-95 cursor-pointer ${className}`}
    >
      <ArrowLeft className="size-4 text-slate-500 dark:text-zinc-400" />
      <span>{label}</span>
    </button>
  )
}