"use client"

import React, { useEffect } from "react"
import { AlertCircle, X } from "lucide-react"

// 1. Modal Backdrop Component
function ModalBackdrop({ onClick }: { onClick: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
      onClick={onClick}
    />
  )
}

// 2. Error Modal Dialog Content
function ErrorModalContent({
  title,
  message,
  onClose,
}: {
  title: string
  message: string
  onClose: () => void
}) {
  return (
    <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-6 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close modal"
        className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer"
      >
        <X className="size-4" />
      </button>

      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-rose-100 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-500 shadow-inner">
          <AlertCircle className="size-6" />
        </div>

        <div className="flex-1 pr-4">
          <h3 className="text-base font-bold tracking-tight text-slate-800 dark:text-zinc-100">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
            {message}
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-[#4a7ff7] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3870ec] active:scale-95 cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  )
}

// ==========================================
// 3. Primary Error Modal Export
// ==========================================
export function ErrorModal({
  isOpen,
  title = "Upload Error",
  message,
  onClose,
}: {
  isOpen: boolean
  title?: string
  message: string
  onClose: () => void
}) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <ModalBackdrop onClick={onClose} />
      <ErrorModalContent title={title} message={message} onClose={onClose} />
    </div>
  )
}

export default ErrorModal