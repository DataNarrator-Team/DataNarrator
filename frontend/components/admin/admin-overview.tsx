"use client";

import React from "react";
import {
  LayoutDashboard,
  Users,
  Database,
  ShieldCheck,
  Server,
  Cpu,
  HardDrive,
  Activity,
  ArrowUpRight,
  TrendingUp,
  FileCheck,
} from "lucide-react";

export function AdminOverview({ onNavigateToUsers }: { onNavigateToUsers: () => void }) {
  return (
    <div className="p-6 max-w-7xl w-full mx-auto space-y-6 text-left">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#3870ec] via-[#4a7ff7] to-[#1e40af] p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            DataNarrator Intelligence Suite - Operational
          </span>
          <h2 className="text-2xl sm:text-3xl font-black">Welcome to the Admin Portal</h2>
          <p className="mt-2 text-sm text-blue-100 leading-relaxed">
            Monitor real-time user activities, provision user access, review uploaded datasets, and inspect AI computational pipeline health.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={onNavigateToUsers}
              className="px-5 py-2.5 rounded-xl bg-white text-[#4a7ff7] hover:bg-slate-50 font-bold text-xs shadow-md transition cursor-pointer"
            >
              Go to User Management &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* System Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-700 bg-white/75 dark:bg-[#22252c]/90 p-5 shadow-sm backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Storage Consumption</span>
            <HardDrive className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-100">14.8 GB</h3>
            <span className="text-xs text-slate-400">/ 100 GB</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: "15%" }} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-700 bg-white/75 dark:bg-[#22252c]/90 p-5 shadow-sm backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">AI Compute Engine Uptime</span>
            <Cpu className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">99.98%</h3>
            <span className="text-xs text-emerald-500">All systems normal</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: "99%" }} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-700 bg-white/75 dark:bg-[#22252c]/90 p-5 shadow-sm backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Reports Generated This Month</span>
            <FileCheck className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-100">1,248</h3>
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +18.4%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: "74%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
