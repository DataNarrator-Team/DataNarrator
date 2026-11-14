"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Lock,
  ArrowRight,
  AlertCircle,
  Play,
  Eye,
  EyeOff,
  Mail,
  Hash,
  Clock,
  Sparkles,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  FileCheck,
  Quote,
  ShieldCheck,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  Layers,
  HelpCircle,
  FileText,
  X,
  Send,
  CheckCircle2,
  LogIn,
  LogOut,
} from "lucide-react";
import { DecorativeBackground } from "@/components/decorative-background";
import { AppFooter } from "@/components/app-footer";
import { setLoggedIn, saveStoredUserProfile, useAuth } from "@/lib/auth";
import { useTheme, toggleTheme } from "@/lib/theme";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const ENGLISH_CHARS_REGEX = /^[a-zA-Z0-9 _.-]+$/;

// 1. Validation logic
function validateInputs(
  identifier: string,
  password: string,
  email?: string,
  confirmPassword?: string,
  isSignUp?: boolean,
  displayName?: string
) {
  if (!identifier.trim() || !password.trim()) {
    return "Please fill in all required fields.";
  }

  // English-only check on identifier
  if (/[^\x00-\x7F]/.test(identifier)) {
    return "Only English characters are allowed.";
  }

  if (isSignUp) {
    if (!displayName || !displayName.trim()) {
      return "Name is required.";
    }
    if (/[^\x00-\x7F]/.test(displayName)) {
      return "Name must only contain English characters.";
    }
    if (displayName.trim().length < 2) {
      return "Name must be at least 2 characters long.";
    }
    if (!ENGLISH_CHARS_REGEX.test(identifier)) {
      return "Username must only contain English letters, numbers, and basic symbols (_ - .)";
    }
    if (identifier.trim().length < 3) {
      return "Username must be at least 3 characters long.";
    }
    if (!email || !email.trim()) {
      return "Email address is required.";
    }
    if (/[^\x00-\x7F]/.test(email)) {
      return "Email must only contain English characters.";
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return "Please enter a valid email format (e.g. name@domain.com).";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters long.";
    }
  } else {
    if (identifier.includes("@")) {
      if (!EMAIL_REGEX.test(identifier.trim())) {
        return "Please enter a valid email format (e.g. name@domain.com).";
      }
    }
  }

  return null;
}

// 2. Top Navigation Bar (Clean & Focused: Logo + Theme Toggle + Log In / Log Out Buttons)
function LandingNavbar({ onOpenLogin }: { onOpenLogin: () => void }) {
  const { theme } = useTheme();
  const { isLoggedIn, isAdmin, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/70 dark:border-zinc-800/80 bg-white/80 dark:bg-[#181a20]/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition cursor-pointer">
          <div className="relative w-8 h-8 sm:w-9 sm:h-9">
            <Image src="/logo.png" alt="DataNarrator Logo" fill className="object-contain" priority />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#1a3a5c] dark:text-zinc-100">
            Data<span className="text-[#e99842]">Narrator</span>
          </span>
        </Link>

        {/* Right Actions: Theme Toggle + Log In / Workspace & Log Out */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            onClick={() => toggleTheme()}
            aria-label="Toggle theme"
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors shadow-sm cursor-pointer"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link
                href={isAdmin ? "/admin" : "/upload"}
                className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-white text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer ${
                  isAdmin ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20" : "bg-[#4a7ff7] hover:bg-[#3870ec]"
                }`}
              >
                <span>{isAdmin ? "Admin Portal" : "Workspace"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                title="Log out"
                className="inline-flex items-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#4a7ff7] hover:bg-[#3870ec] active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

// 3. Stat Metric Cards
function StatMetrics() {
  return (
    <section className="py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1 */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/70 p-6 sm:p-7 shadow-sm backdrop-blur-sm relative overflow-hidden group hover:border-[#4a7ff7]/40 transition-colors">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              90%
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> -8.2 hrs
            </span>
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-zinc-400">
            less time spent on manual data analysis &amp; report preparation
          </p>
          <div className="mt-5 h-10 w-full flex items-end gap-1.5 pt-2">
            {[45, 60, 35, 75, 50, 85, 30, 95, 20, 15].map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className={`flex-1 rounded-sm transition-all duration-300 ${
                  i >= 7 ? "bg-[#4a7ff7]" : "bg-slate-200 dark:bg-zinc-700"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Card 2 */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/70 p-6 sm:p-7 shadow-sm backdrop-blur-sm relative overflow-hidden group hover:border-[#4a7ff7]/40 transition-colors">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              20%
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Accelerated
            </span>
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-zinc-400">
            faster average customer adoption time across enterprise units
          </p>
          <div className="mt-5 h-10 w-full flex items-end gap-1.5 pt-2">
            {[20, 25, 32, 40, 48, 55, 68, 79, 90, 100].map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className="flex-1 rounded-sm bg-gradient-to-t from-blue-500/40 to-[#4a7ff7] transition-all"
              />
            ))}
          </div>
        </div>

        {/* Card 3 */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/70 p-6 sm:p-7 shadow-sm backdrop-blur-sm relative overflow-hidden group hover:border-[#4a7ff7]/40 transition-colors">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              50K+
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Stories Built
            </span>
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-zinc-400">
            automated narratives &amp; executive dashboards created with zero manual coding
          </p>
          <div className="mt-6 w-full">
            <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-[#4a7ff7] via-purple-500 to-[#e99842] h-full rounded-full w-[88%]" />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 dark:text-zinc-500 mt-1.5 font-medium">
              <span>Goal: 25K Stories</span>
              <span className="text-[#4a7ff7] font-semibold">Delivered: 50K+</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 4. Workflow Feature Showcase (The 3 Narrative Steps)
function WorkflowSteps() {
  return (
    <section id="workflow-section" className="py-10 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-200/60 dark:border-zinc-800/80">
      <div className="text-center max-w-3xl mx-auto mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-[#4a7ff7] border border-blue-200/60 dark:border-blue-800/60 mb-3">
          <Layers className="w-3.5 h-3.5" />
          End-to-End Orchestration
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Turn complex datasets into secure, connected narratives.
        </h2>
        <p className="text-base text-slate-600 dark:text-zinc-400 mt-3">
          From raw spreadsheets and databases to automated executive summaries in three seamless steps.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Step 1 */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/80 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#4a7ff7]">
                Step 01
              </span>
              <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-[#4a7ff7]">
                <FileCheck className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Smart Cleaning &amp; Validation
            </h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400 mt-1 mb-5">
              Unify missing values (null, 0), pick target formats from detected choices, and resolve duplicates via smart naming or merging.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 p-3.5 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#4a7ff7]" />
                <span className="font-semibold text-slate-700 dark:text-zinc-200">raw_metrics_q3.csv</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                Cleaned &amp; Unified
              </span>
            </div>
            <div className="space-y-1 pt-1.5 border-t border-slate-200/60 dark:border-zinc-700/60 text-[10px]">
              <div className="flex justify-between items-center text-slate-600 dark:text-zinc-300">
                <span className="text-amber-800 dark:text-amber-400 font-semibold">• Missing Values:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">Unified with null / 0</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-zinc-300">
                <span className="text-blue-800 dark:text-sky-400 font-semibold">• Wrong Format:</span>
                <span className="font-mono font-bold text-[#4a7ff7]">YYYY-MM-DD Selected</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-zinc-300">
                <span className="text-rose-800 dark:text-rose-400 font-semibold">• Duplicate Rows:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">Renamed &amp; Merged</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/80 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#4a7ff7]">
                Step 02
              </span>
              <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-[#4a7ff7]">
                <BarChart3 className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Visualize Insights
            </h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400 mt-1 mb-5">
              AI selects optimal charts, discovers key correlations, and visualizes trends automatically.
            </p>
          </div>

          {/* Miniature Preview Card (Bar Chart) */}
          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 p-3.5 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-700 dark:text-zinc-200">Monthly Revenue Trend</span>
              <span className="text-[11px] font-bold text-[#4a7ff7] bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-900/40">+28.4%</span>
            </div>
            <div className="h-20 flex items-end gap-2.5 pt-2 px-1">
              {[
                { label: "May", px: 24 },
                { label: "Jun", px: 38 },
                { label: "Jul", px: 32 },
                { label: "Aug", px: 48 },
                { label: "Sep", px: 58 },
                { label: "Oct", px: 68 },
              ].map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col justify-end items-center h-full">
                  <div
                    style={{ height: `${item.px}px` }}
                    className={`w-full rounded-t-md transition-all duration-300 shadow-sm ${
                      idx === 5
                        ? "bg-gradient-to-t from-[#e99842] to-amber-400"
                        : "bg-gradient-to-t from-[#4a7ff7] to-blue-400"
                    }`}
                  />
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 mt-2">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/80 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#4a7ff7]">
                Step 03
              </span>
              <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-[#4a7ff7]">
                <Quote className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Generate Narrative Analysis
            </h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400 mt-1 mb-5">
              Actionable executive synthesis with automated takeaways, ready to share or export to PDF.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 p-3.5 text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-[#4a7ff7] font-semibold text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Executive Synthesis</span>
            </div>
            <p className="text-slate-600 dark:text-zinc-300 italic text-[11px] leading-relaxed line-clamp-2">
              &ldquo;Q3 performance exceeded initial projections by 14.2%, driven by enterprise expansion in North America.&rdquo;
            </p>
            <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-zinc-700/60">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 dark:bg-blue-950/60 text-[#4a7ff7]">
                Confidence: 98%
              </span>
              <span className="text-[10px] text-slate-400">PDF Ready</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 4.5. Bottom Call-to-Action Section (Get Started at the end of the page)
function BottomCtaSection({ onGetStarted }: { onGetStarted: () => void }) {
  const { isLoggedIn, isAdmin } = useAuth();

  return (
    <section className="py-10 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-200/60 dark:border-zinc-800/80">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-blue-50/70 via-white to-white dark:from-blue-950/20 dark:via-zinc-900/50 dark:to-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 p-6 sm:p-10 text-center shadow-lg shadow-blue-500/5">
        {/* Subtle decorative glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#4a7ff7]/10 dark:bg-[#4a7ff7]/15 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#4a7ff7]/10 text-[#4a7ff7] dark:bg-[#4a7ff7]/20 dark:text-[#60a5fa] border border-[#4a7ff7]/20 mb-4 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            Start Your Journey Today
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Ready to Build Your First Data Story?
          </h2>

          <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-zinc-300 leading-relaxed max-w-xl">
            Upload your dataset and experience how DataNarrator transforms raw numbers into executive narratives and interactive charts in seconds.
          </p>

          <div className="mt-6">
            {isLoggedIn ? (
              <Link
                href={isAdmin ? "/admin" : "/upload"}
                className={`px-8 py-4 rounded-xl text-white font-bold text-sm sm:text-base shadow-lg inline-flex items-center gap-2.5 transition-all cursor-pointer ${
                  isAdmin
                    ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/30"
                    : "bg-[#4a7ff7] hover:bg-[#3870ec] shadow-[#4a7ff7]/30"
                }`}
              >
                <span>{isAdmin ? "Go to Admin Panel" : "Go to Workspace"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={onGetStarted}
                className="px-8 py-4 rounded-xl bg-[#4a7ff7] hover:bg-[#3870ec] active:scale-95 text-white font-bold text-sm sm:text-base shadow-lg shadow-[#4a7ff7]/30 flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <p className="mt-5 text-xs text-slate-400 dark:text-zinc-500 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>No credit card required &bull; 100% private &amp; secure</span>
          </p>
        </div>
      </div>
    </section>
  );
}

// 5. Frequently Asked Questions Modal (FAQ Modal)
function FAQModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!isOpen) return null;

  const faqs = [
    {
      q: "How does DataNarrator clean and prepare messy datasets?",
      a: "Our Smart Cleaning Studio handles data normalization in three explicit pillars: (1) Missing Values unification with null, 0, or custom placeholders; (2) Inconsistent Formats resolution by showing all detected formats in each column for you to pick the target standard; and (3) Duplicate Columns handling via AI-suggested renaming for different data or one-click merging for repeated columns.",
    },
    {
      q: "What file formats does DataNarrator support?",
      a: "DataNarrator natively supports CSV, XLSX (Excel), and XLS tabular spreadsheets. Uploaded datasets are automatically parsed with schema validation and data quality diagnostics.",
    },
    {
      q: "How does AI transform raw data into narrative stories?",
      a: "Our engine performs automated statistical computation, discovers correlations and anomalies, generates appropriate visual charts, and composes executive textual synthesis explaining what the data means.",
    },
    {
      q: "Is our enterprise data safe and private?",
      a: "Yes. All uploaded data is encrypted in transit and at rest. Data is isolated to your session, and we never use your proprietary data to train third-party AI models.",
    },
    {
      q: "Can I export stories to PDF or share them with my team?",
      a: "Yes. Generated dashboards and narrative summaries can be customized, downloaded as publication-ready PDFs, or shared with teammates.",
    },
    {
      q: "How can I try DataNarrator right now?",
      a: "You can sign in using our demo credentials (admin / 123456) in the login card above to experience the full workspace immediately.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#4a7ff7] flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Everything you need to know about DataNarrator and how it handles your data.</p>
          </div>
        </div>

        <div className="overflow-y-auto space-y-3 pr-1 leading-relaxed">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/50 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-100 hover:text-[#4a7ff7] dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className="p-1 rounded-md bg-white dark:bg-zinc-700 text-slate-500 dark:text-zinc-400 shrink-0">
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-3.5 pt-1 text-xs text-slate-600 dark:text-zinc-300 leading-relaxed border-t border-slate-200/50 dark:border-zinc-700/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#4a7ff7] hover:bg-[#3870ec] text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// 6. Contact Us Modal
function ContactModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText("support@datanarrator.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSent(true);
    setTimeout(() => {
      setSent(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#4a7ff7] flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Contact Us</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">We are here to help you get the most out of DataNarrator</p>
          </div>
        </div>

        <div className="mb-6 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-zinc-200">Support Email:</span>
            <span className="font-mono text-[#4a7ff7]">support@datanarrator.com</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 text-slate-700 dark:text-zinc-200 font-medium hover:bg-slate-50 text-[11px] transition-colors cursor-pointer"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {sent ? (
          <div className="py-8 text-center text-emerald-600 dark:text-emerald-400 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-10 h-10" />
            <p className="font-semibold text-sm">Thank you! Your message has been received.</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-3.5 text-left text-xs">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex. Alex Morgan"
                className="w-full px-3.5 py-2.5 border rounded-xl outline-none border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 focus:border-[#4a7ff7]"
              />
            </div>
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@company.com"
                className="w-full px-3.5 py-2.5 border rounded-xl outline-none border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 focus:border-[#4a7ff7]"
              />
            </div>
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1">
                Message
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your inquiry or question..."
                className="w-full px-3.5 py-2.5 border rounded-xl outline-none border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 focus:border-[#4a7ff7] resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#4a7ff7] hover:bg-[#3870ec] active:scale-95 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Message</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// 7. Terms & Conditions Modal
function TermsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#4a7ff7] flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Terms &amp; Conditions</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Rules and guidelines for using the DataNarrator platform</p>
          </div>
        </div>

        <div className="overflow-y-auto space-y-4 text-xs text-slate-600 dark:text-zinc-300 pr-2 leading-relaxed">
          <div>
            <h4 className="font-bold text-slate-800 dark:text-zinc-100 mb-1">1. Acceptance of Terms</h4>
            <p>By accessing or utilizing DataNarrator, you agree to comply with and be bound by these terms. If you disagree with any part, you may discontinue use of the platform.</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-zinc-100 mb-1">2. Data Ownership &amp; Privacy</h4>
            <p>You retain 100% full ownership, rights, and intellectual property over any datasets, spreadsheets, or files uploaded to DataNarrator. DataNarrator does not sell, license, or transfer your proprietary data to external parties.</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-zinc-100 mb-1">3. Permitted Platform Use</h4>
            <p>Users must not upload malicious files, violate copyright, or attempt to disrupt the integrity or security of the narrative generation pipeline.</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-zinc-100 mb-1">4. Availability &amp; Warranties</h4>
            <p>DataNarrator is provided &ldquo;as is&rdquo;. While we strive for 99.9% uptime and high accuracy in automated statistical evaluations, users should verify analytical outputs for critical financial or regulatory submissions.</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#4a7ff7] hover:bg-[#3870ec] text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}

// 8. Privacy Policy Modal
function PrivacyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Privacy Policy</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Our commitment to enterprise-grade data protection</p>
          </div>
        </div>

        <div className="overflow-y-auto space-y-4 text-xs text-slate-600 dark:text-zinc-300 pr-2 leading-relaxed">
          <div>
            <h4 className="font-bold text-slate-800 dark:text-zinc-100 mb-1">1. Zero Training Policy</h4>
            <p>Your datasets and resulting stories are strictly private. DataNarrator never uses customer data to train foundation models or share insights across accounts.</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-zinc-100 mb-1">2. Encryption Standards</h4>
            <p>Data transmitted between your browser and our services is secured with TLS 1.3 encryption, and at-rest storage utilizes AES-256 standards.</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-zinc-100 mb-1">3. Local Session Control</h4>
            <p>Authentication and session parameters are safely isolated to your current browser session, giving you full control to terminate sessions at any time.</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#4a7ff7] hover:bg-[#3870ec] text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// 9. Interactive Product Demo Modal
function DemoVideoModal({
  isOpen,
  onClose,
  onTryDemo,
}: {
  isOpen: boolean;
  onClose: () => void;
  onTryDemo: () => void;
}) {
  const [activeStep, setActiveStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "01. Smart Data Cleaning",
      desc: "Interactive 3-pillar cleaning: unify missing values (null, 0), choose target formats from detected options, and resolve duplicate columns by smart rename or merging.",
      badge: "3-Pillar Data Cleaning",
    },
    {
      title: "02. AI Visual Discovery",
      desc: "Our analytical engine identifies key trends and correlations, generating optimal charts automatically.",
      badge: "Auto Visualizations",
    },
    {
      title: "03. Executive Narrative",
      desc: "Transforms complex datasets into human-readable executive summaries with clear insights ready to share or export.",
      badge: "Narrative Synthesis",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#4a7ff7] flex items-center justify-center">
              <Play className="w-4 h-4 fill-[#4a7ff7]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                How DataNarrator Works
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                A quick 3-step walkthrough showing how your datasets transform into stories
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Navigation Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/40 text-xs">
          {steps.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveStep(idx)}
              className={`py-3 px-2 sm:px-4 text-center font-semibold transition-all border-b-2 cursor-pointer ${
                activeStep === idx
                  ? "border-[#4a7ff7] text-[#4a7ff7] bg-white dark:bg-zinc-900"
                  : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
            >
              <span className="block truncate">{s.title}</span>
            </button>
          ))}
        </div>

        {/* Video Simulation Canvas */}
        <div className="p-5 sm:p-6 bg-slate-950 text-white min-h-[260px] sm:min-h-[300px] flex flex-col justify-between relative overflow-hidden">
          {/* Simulated Browser Chrome */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 text-[11px] text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-[10px] text-zinc-500">app.datanarrator.com/demo/cleaning</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#4a7ff7]/20 text-[#4a7ff7]">
              {steps[activeStep].badge}
            </span>
          </div>

          {/* Interactive Screen Content based on step */}
          <div className="py-4 flex-1 flex flex-col items-center justify-center">
            {activeStep === 0 && (
              <div className="w-full max-w-lg p-4 rounded-xl border border-zinc-800 bg-zinc-900/90 shadow-lg text-left space-y-2.5 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-[#e99842]" />
                    <span className="text-xs font-bold text-zinc-200">Interactive Data Cleaning Studio</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                    3 Pillars Configured
                  </span>
                </div>

                {/* 1. Missing Values Simulation */}
                <div className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="text-amber-400 font-bold">• Missing Values: </span>
                    <span className="font-mono text-zinc-300">Discount_Rate (18 empty)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded bg-[#4a7ff7] text-white font-mono font-bold text-[10px]">null ✓</span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400 font-mono text-[10px]">0</span>
                  </div>
                </div>

                {/* 2. Format Error Simulation */}
                <div className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="text-blue-400 font-bold">• Wrong Format: </span>
                    <span className="font-mono text-zinc-300">Order_Date</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded bg-[#4a7ff7] text-white font-mono font-bold text-[10px]">YYYY-MM-DD ✓</span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400 font-mono text-[10px]">DD/MM</span>
                  </div>
                </div>

                {/* 3. Duplicate Columns Simulation */}
                <div className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="text-rose-400 font-bold">• Duplicate Columns: </span>
                    <span className="font-mono text-zinc-300">Postal_Code_Copy</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-zinc-400">Rename:</span>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-700 font-mono text-zinc-200 text-[10px]">Shipping_Zone</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">OK</span>
                    <span className="px-2 py-0.5 rounded bg-[#4a7ff7] text-white font-bold text-[10px]">Merge ✓</span>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 1 && (
              <div className="w-full max-w-md p-5 rounded-xl border border-zinc-800 bg-zinc-900/90 shadow-lg space-y-3 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between text-xs text-zinc-300">
                  <span className="font-semibold">Revenue Growth Trend</span>
                  <span className="text-[#4a7ff7] font-bold">+28.4% YoY</span>
                </div>
                <div className="h-24 flex items-end gap-2.5 pt-2 px-1">
                  {[
                    { label: "May", px: 28 },
                    { label: "Jun", px: 44 },
                    { label: "Jul", px: 38 },
                    { label: "Aug", px: 58 },
                    { label: "Sep", px: 70 },
                    { label: "Oct", px: 85 },
                  ].map((item, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end items-center h-full">
                      <div
                        style={{ height: `${item.px}px` }}
                        className={`w-full rounded-t-md transition-all ${
                          i === 5 ? "bg-[#e99842]" : "bg-[#4a7ff7]"
                        }`}
                      />
                      <span className="text-[10px] text-zinc-400 mt-1.5">{item.label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-zinc-400 text-center">
                  AI engine automatically generates optimal chart types and flags anomalies.
                </p>
              </div>
            )}

            {activeStep === 2 && (
              <div className="w-full max-w-md p-5 rounded-xl border border-zinc-800 bg-zinc-900/90 shadow-lg space-y-3 animate-in fade-in zoom-in-95 text-left">
                <div className="flex items-center gap-2 text-xs text-[#4a7ff7] font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>Executive Narrative Analysis</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed italic border-l-2 border-[#4a7ff7] pl-3 py-1">
                  &ldquo;Overall revenue reached $1.84M in Q3, outperforming initial projections by 14.2% with a strong customer retention rate.&rdquo;
                </p>
                <div className="flex justify-between items-center text-[11px] text-zinc-400 pt-2 border-t border-zinc-800">
                  <span>Export: PDF, Web, Presentation</span>
                  <span className="text-emerald-400 font-semibold">98% Accuracy</span>
                </div>
              </div>
            )}
          </div>

          {/* Description & Step Controls */}
          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <p className="text-zinc-400 max-w-md text-[11px] sm:text-xs">
              {steps[activeStep].desc}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={activeStep === 0}
                onClick={() => setActiveStep((prev: number) => Math.max(0, prev - 1))}
                className="px-2.5 py-1 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 disabled:opacity-40 cursor-pointer text-xs"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={activeStep === steps.length - 1}
                onClick={() => setActiveStep((prev: number) => Math.min(steps.length - 1, prev + 1))}
                className="px-2.5 py-1 rounded-lg bg-[#4a7ff7] text-white disabled:opacity-40 cursor-pointer text-xs font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-zinc-400">
            Want to test it hands-on?
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors font-semibold cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onTryDemo();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-[#4a7ff7] hover:bg-[#3870ec] text-white font-semibold transition-colors shadow-sm cursor-pointer"
            >
              Start now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 10. Clean & Interactive Footer (Contact, Terms, Privacy, FAQ)
function LandingFooter({
  onOpenContact,
  onOpenTerms,
  onOpenPrivacy,
  onOpenFAQ,
}: {
  onOpenContact: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  onOpenFAQ: () => void;
}) {
  return (
    <footer className="w-full border-t border-slate-200/80 dark:border-zinc-800/80 bg-slate-900 text-slate-300 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative w-7 h-7">
            <Image src="/logo.png" alt="DataNarrator" fill className="object-contain" />
          </div>
          <span className="text-base font-bold text-white tracking-tight">
            Data<span className="text-[#e99842]">Narrator</span>
          </span>
        </div>

        {/* Action Links: Contact Us, Terms & Conditions, Privacy Policy, FAQ */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs font-semibold text-slate-400">
          <button
            type="button"
            onClick={onOpenContact}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Contact Us
          </button>
          <button
            type="button"
            onClick={onOpenTerms}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Terms &amp; Conditions
          </button>
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={onOpenFAQ}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Frequently Asked Questions
          </button>
        </div>

        {/* Security & Copyright */}
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>&copy; {new Date().getFullYear()} DataNarrator</span>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted &bull; Secure</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// 10. Input Components
function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon: Icon = User,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const [nonEnglishWarn, setNonEnglishWarn] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (/[^\x00-\x7F]/.test(raw)) {
      setNonEnglishWarn(true);
      const sanitized = raw.replace(/[^\x00-\x7F]/g, "");
      onChange(sanitized);
    } else {
      if (nonEnglishWarn) setNonEnglishWarn(false);
      onChange(raw);
    }
  };

  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5 ml-0.5">
        {label}
      </label>
      <div className="relative flex items-center">
        <Icon className={`absolute left-3.5 w-4 h-4 pointer-events-none transition-colors ${nonEnglishWarn ? "text-rose-400" : "text-slate-400 dark:text-zinc-500"}`} />
        <input
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full pl-10 pr-4 py-2.5 sm:py-3 border rounded-xl text-sm outline-none transition-colors shadow-sm ${
            nonEnglishWarn
              ? "border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 placeholder:text-rose-300"
              : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 text-slate-800 dark:text-zinc-100 focus:border-[#4a7ff7] focus:ring-2 focus:ring-[#4a7ff7]/20 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
          }`}
        />
      </div>
      {nonEnglishWarn && (
        <p className="mt-1.5 text-[11px] font-semibold text-rose-500 flex items-center gap-1 animate-in fade-in">
          <AlertCircle className="size-3 shrink-0" />
          <span>English only </span>
        </p>
      )}
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [show, setShow] = useState(false);
  const [nonEnglishWarn, setNonEnglishWarn] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (/[^\x00-\x7F]/.test(raw)) {
      setNonEnglishWarn(true);
      const sanitized = raw.replace(/[^\x00-\x7F]/g, "");
      onChange(sanitized);
    } else {
      if (nonEnglishWarn) setNonEnglishWarn(false);
      onChange(raw);
    }
  };

  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5 ml-0.5">
        {label}
      </label>
      <div className="relative flex items-center">
        <Lock className={`absolute left-3.5 w-4 h-4 pointer-events-none transition-colors ${nonEnglishWarn ? "text-rose-400" : "text-slate-400 dark:text-zinc-500"}`} />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full pl-10 pr-11 py-2.5 sm:py-3 border rounded-xl text-sm outline-none transition-colors shadow-sm ${
            nonEnglishWarn
              ? "border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 placeholder:text-rose-300"
              : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 text-slate-800 dark:text-zinc-100 focus:border-[#4a7ff7] focus:ring-2 focus:ring-[#4a7ff7]/20 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
          }`}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3.5 text-slate-400 dark:text-zinc-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {nonEnglishWarn && (
        <p className="mt-1.5 text-[11px] font-semibold text-rose-500 flex items-center gap-1 animate-in fade-in">
          <AlertCircle className="size-3 shrink-0" />
          <span>English only </span>
        </p>
      )}
    </div>
  );
}

// 11. Main AuthView Component
export function AuthView({ onSuccess }: { onSuccess?: (role?: "admin" | "user") => void }) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<"contact" | "terms" | "privacy" | "faq" | null>(null);
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isLoginModalOpen) {
        setIsLoginModalOpen(false);
        setError("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoginModalOpen]);

  // ==============================================================================
  // 🟢 START DEMO / SIMULATION CODE [Will be replaced with backend API integration]
  // Quick demo accounts auto-fill helpers (admin / user demo presets)
  // ==============================================================================
  const fillDemoAdmin = () => {
    setIsSignUp(false);
    setIdentifier("admin");
    setPassword("123456");
    setError("");
  };

  const fillDemoUser = () => {
    setIsSignUp(false);
    setIdentifier("user");
    setPassword("123456");
    setError("");
  };

  const fillDemo = fillDemoAdmin;

  const handleTryDemoFromVideo = () => {
    setIsDemoOpen(false);
    setIsLoginModalOpen(true);
    fillDemoAdmin();
  };
  // ==============================================================================
  // 🔴 END DEMO / SIMULATION CODE
  // ==============================================================================

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validateInputs(identifier, password, email, confirmPassword, isSignUp, displayName);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    // ==============================================================================
    // 🟢 START DEMO / SIMULATION CODE [Will be replaced with backend API integration]
    // Simulated authentication network latency & local profile caching
    // Replace with real backend API call: await fetch('/api/auth/login', { ... })
    // ==============================================================================
    setTimeout(() => {
      setLoggedIn(true);

      const trimmedId = identifier.trim().toLowerCase();
      const trimmedEmail = email.trim().toLowerCase();
      const isAdminLogin = trimmedId === "admin" || (!isSignUp && (trimmedId.includes("admin") || trimmedEmail.includes("admin")));
      const userRole: "admin" | "user" = isAdminLogin ? "admin" : "user";

      if (isSignUp) {
        saveStoredUserProfile({
          displayName: displayName.trim(),
          username: identifier.trim(),
          email: email.trim(),
          role: userRole,
        });
      } else {
        const isUserDemo = trimmedId === "user";
        saveStoredUserProfile({
          displayName: isAdminLogin
            ? "System Administrator"
            : isUserDemo
            ? "Demo User"
            : (identifier.trim() || "Shahad Saif"),
          username: identifier.trim(),
          email: isAdminLogin
            ? "admin@datanarrator.ai"
            : (identifier.includes("@") ? identifier.trim() : `${identifier.trim() || "user"}@example.com`),
          role: userRole,
        });
      }

      setLoading(false);
      setIsLoginModalOpen(false);
      if (onSuccess) {
        onSuccess(userRole);
      }
    }, 450);
    // ==============================================================================
    // 🔴 END DEMO / SIMULATION CODE
    // ==============================================================================
  };

  const scrollToFeatures = () => {
    const el = document.getElementById("workflow-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-white dark:bg-[#181a20] text-slate-800 dark:text-zinc-100 flex flex-col overflow-x-hidden transition-colors selection:bg-[#4a7ff7]/20">
      <DecorativeBackground extended />

      {/* Top Navbar (Brand Logo + Theme Toggle + Log In Button) */}
      <LandingNavbar onOpenLogin={() => setIsLoginModalOpen(true)} />

      {/* Hero Section */}
      <main className="relative z-10 flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 sm:pt-10 sm:pb-12 lg:pt-12 lg:pb-14 text-center flex flex-col items-center">
          {/* Product Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200/80 dark:border-blue-800/60 text-[#4a7ff7] text-xs font-semibold mb-4 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-[#4a7ff7] animate-pulse" />
            <span className="font-bold text-slate-800 dark:text-zinc-200">DataNarrator</span>
            <span className="text-slate-300 dark:text-zinc-600">|</span>
            <span>Intelligence Suite 4.0</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15] max-w-4xl">
            Give Your Data {" "}
            <span className="relative inline-block text-[#4a7ff7]">
              a Voice
              <span className="absolute left-0 -bottom-1 w-full h-1.5 sm:h-2 bg-[#4a7ff7]/30 rounded-full" />
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-3.5 text-base sm:text-lg text-slate-600 dark:text-zinc-300 max-w-2xl leading-relaxed">
            Data has a voice, and our system helps make that voice clear by transforming raw analytics into clear, effortless narrative insights.
          </p>

          {/* Status / Sub-pill */}
          <div className="mt-2.5 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Start telling your data story with us today</span>
          </div>

          {/* Hero Actions */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={() => setIsDemoOpen(true)}
              className="px-6 py-3.5 rounded-xl bg-[#4a7ff7] hover:bg-[#3870ec] active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-md shadow-[#4a7ff7]/25 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Watch Demo Video</span>
            </button>
          </div>

          {/* Trust Badges */}
          <div className="mt-8 pt-6 border-t border-slate-200/70 dark:border-zinc-800/80 flex flex-wrap items-center justify-center gap-8 w-full text-xs font-medium text-slate-600 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>End-to-end encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#4a7ff7] shrink-0" />
              <span>Accepts XLSX, CSV, Parquet</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <span>&lt; 3s query turnaround</span>
            </div>
          </div>
        </div>

        {/* 3 Metric Stat Cards */}
        <StatMetrics />

        {/* 3 Workflow Feature Steps */}
        <WorkflowSteps />

        {/* Bottom Call to Action Section (Get Started at the end of the page) */}
        <BottomCtaSection onGetStarted={() => setIsLoginModalOpen(true)} />

      </main>

      {/* Unified App Footer */}
      <AppFooter />

      {/* Interactive Demo Video Modal */}
      <DemoVideoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} onTryDemo={handleTryDemoFromVideo} />

      {/* Interactive Log In / Sign Up Window Modal */}
      {isLoginModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsLoginModalOpen(false);
              setError("");
            }
          }}
        >
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-6 sm:p-8 shadow-2xl backdrop-blur-md animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setIsLoginModalOpen(false);
                setError("");
              }}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Card Title */}
            <div className="text-left mb-6 pr-6">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {isSignUp ? "Sign Up" : "Log In"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                {isSignUp
                  ? "Create an account to start building automated data stories."
                  : "Welcome back! Enter your details to log in to your account."}
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 p-3 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {isSignUp ? (
                <>
                  <TextInput
                    label="Full Name"
                    value={displayName}
                    onChange={setDisplayName}
                    placeholder="ex. Alex Morgan"
                    icon={User}
                  />
                  <TextInput
                    label="Username"
                    value={identifier}
                    onChange={setIdentifier}
                    placeholder="ex. alex_morgan"
                    icon={Hash}
                  />
                  <TextInput
                    label="Work Email"
                    value={email}
                    onChange={setEmail}
                    placeholder="alex@company.com"
                    icon={Mail}
                  />
                </>
              ) : (
                <TextInput
                  label="Email or Username"
                  value={identifier}
                  onChange={setIdentifier}
                  placeholder="Username or email"
                  icon={User}
                />
              )}

              <PasswordInput
                label="Password"
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
              />

              {isSignUp && (
                <PasswordInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="••••••••••••"
                />
              )}

              {/* Remember Me & Forgot Password Row */}
              {!isSignUp && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-zinc-400">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-zinc-700 text-[#4a7ff7] focus:ring-[#4a7ff7]"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => alert("Password reset link has been sent to your email.")}
                    className="text-[#4a7ff7] hover:underline font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* The Single Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#4a7ff7] hover:bg-[#3870ec] active:scale-[0.98] text-white font-semibold rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 mt-2 cursor-pointer"
              >
                <span>
                  {loading
                    ? isSignUp ? "Creating account..." : "Logging in..."
                    : isSignUp
                    ? "Sign Up"
                    : "Log In"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* ============================================================================== */}
            {/* 🟢 START DEMO / SIMULATION CODE [Will be replaced with backend API integration] */}
            {/* Demo Helper Hint with Auto-fill */}
            {/* ============================================================================== */}
            <div className="mt-4 p-2.5 rounded-xl bg-slate-50/90 dark:bg-zinc-800/60 border border-slate-200/70 dark:border-zinc-700/60 space-y-2">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                  Quick Demo Accounts:
                </span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                  Click to auto-fill
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Admin Demo Button */}
                <button
                  type="button"
                  data-testid="demo-admin-btn"
                  onClick={fillDemoAdmin}
                  className="group flex flex-col items-start p-2 rounded-lg bg-white dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-700/80 hover:border-[#4a7ff7] dark:hover:border-[#4a7ff7] transition-all text-left cursor-pointer shadow-xs hover:shadow-sm"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                      Admin
                    </span>
                    <span className="text-[10px] font-semibold text-[#4a7ff7] group-hover:underline">
                      Fill
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-700 dark:text-zinc-300">
                    admin / 123456
                  </span>
                </button>

                {/* User Demo Button */}
                <button
                  type="button"
                  data-testid="demo-user-btn"
                  onClick={fillDemoUser}
                  className="group flex flex-col items-start p-2 rounded-lg bg-white dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-700/80 hover:border-[#4a7ff7] dark:hover:border-[#4a7ff7] transition-all text-left cursor-pointer shadow-xs hover:shadow-sm"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-[#4a7ff7] dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                      User
                    </span>
                    <span className="text-[10px] font-semibold text-[#4a7ff7] group-hover:underline">
                      Fill
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-700 dark:text-zinc-300">
                    user / 123456
                  </span>
                </button>
              </div>
            </div>
            {/* ============================================================================== */}
            {/* 🔴 END DEMO / SIMULATION CODE */}
            {/* ============================================================================== */}

            {/* Footer Switcher */}
            <div className="mt-5 pt-4 border-t border-slate-200/60 dark:border-zinc-800 text-center text-xs text-slate-600 dark:text-zinc-400">
              {isSignUp ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setError("");
                    }}
                    className="text-[#4a7ff7] font-semibold hover:text-[#3870ec] underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Log In
                  </button>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setError("");
                    }}
                    className="text-[#4a7ff7] font-semibold hover:text-[#3870ec] underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default AuthView;

