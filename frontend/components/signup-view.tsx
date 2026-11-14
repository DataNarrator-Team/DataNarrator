"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  FileSpreadsheet,
  Clock,
  Sparkles,
  Sun,
  Moon,
  CheckCircle2,
  X,
  FileText,
} from "lucide-react";
import { DecorativeBackground } from "@/components/decorative-background";
import { AppFooter } from "@/components/app-footer";
import { setLoggedIn, saveStoredUserProfile, registerWithBackend } from "@/lib/auth";
import { useTheme, toggleTheme } from "@/lib/theme";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function SignUpView({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const { theme } = useTheme();

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Modals for Terms & Privacy
  const [activeModal, setActiveModal] = useState<"terms" | "privacy" | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (fullName.trim().length < 2) {
      setError("Full name must be at least 2 characters long.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your work or personal email.");
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Please enter a valid email format (e.g. name@company.com).");
      return;
    }
    if (!password) {
      setError("Please enter a password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreedToTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);
    const username = email.split("@")[0].replace(/[^a-zA-Z0-9_-]/g, "") || "user";
    // Backend registration: POST /register then POST /login
    registerWithBackend({
      username,
      email: email.trim(),
      password,
      displayName: fullName.trim(),
    })
      .then(() => {
        setLoading(false);
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/");
        }
      })
      .catch((err: any) => {
        setLoading(false);
        setError(err?.message || "Could not create your account. Please try again.");
      });
  };

  const handleSocialSignUp = (provider: "Google" | "GitHub") => {
    // The backend has no OAuth provider yet; use email registration instead
    setError(`${provider} sign-up is not available yet. Please register with your email.`);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#f8fafc] dark:bg-[#0f1319] text-slate-800 dark:text-zinc-100 flex flex-col overflow-x-hidden transition-colors selection:bg-[#4a7ff7]/25">
      <DecorativeBackground />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-[#161b22]/80 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 transition-transform group-hover:scale-105">
              <Image src="/logo.png" alt="DataNarrator Logo" fill className="object-contain" priority />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#1a3a5c] dark:text-zinc-100">
              Data<span className="text-[#e99842]">Narrator</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-zinc-300 hover:text-[#4a7ff7] dark:hover:text-blue-400 transition-colors hidden sm:inline-block"
            >
              Sign In
            </Link>
            <button
              onClick={() => toggleTheme()}
              aria-label="Toggle theme"
              className="p-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors shadow-sm cursor-pointer"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="relative z-10 flex-1 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Side: Hero Section with Branding & Trust Badges */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              {/* Product Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200/80 dark:border-blue-800/60 text-[#4a7ff7] text-xs font-semibold mb-6 shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-[#4a7ff7] animate-pulse" />
                <span className="font-bold text-slate-800 dark:text-zinc-200">DataNarrator</span>
                <span className="text-slate-300 dark:text-zinc-600">|</span>
                <span>Intelligence Suite 4.0</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
                Turn Your Data into{" "}
                <span className="relative inline-block text-[#4a7ff7]">
                  Powerful Stories
                  <span className="absolute left-0 -bottom-1 w-full h-1.5 sm:h-2 bg-[#4a7ff7]/30 rounded-full" />
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-zinc-300 max-w-2xl leading-relaxed">
                The ultimate platform to transform raw numbers into actionable, narrative insights. Connect your datasets and let AI build visual, easy-to-understand stories in seconds.
              </p>

              {/* Status Indicator */}
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Start telling your data story with us today</span>
              </div>

              {/* Value Highlight Feature Box */}
              <div className="mt-8 w-full max-w-xl rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-[#161b22]/70 p-5 backdrop-blur-sm shadow-sm space-y-3">
                <div className="flex items-center gap-2.5 text-xs font-bold text-[#4a7ff7] uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-[#4a7ff7]" />
                  <span>Everything Included In Your Free Account</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-zinc-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>3-Pillar Smart Data Cleaning Studio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Instant AI Visual Charts Generation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Automated Executive Narrative Synthesis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Publication-Ready PDF &amp; Web Reports</span>
                  </div>
                </div>
              </div>

              {/* Trust Badges at Bottom */}
              <div className="mt-8 pt-6 border-t border-slate-200/70 dark:border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-xs font-medium text-slate-600 dark:text-zinc-400">
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

            {/* Right Side: Interactive Registration Form Card */}
            <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
              <div className="w-full max-w-md rounded-2xl border border-slate-200/90 dark:border-[#242b35] bg-white dark:bg-[#161b22] p-6 sm:p-8 shadow-xl shadow-slate-200/60 dark:shadow-black/70 backdrop-blur-md relative">
                
                {/* Glowing Accent Top Border */}
                <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-[#4a7ff7] to-transparent opacity-80" />

                {/* Header */}
                <div className="text-left mb-6">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Create an Account
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                    Get started with DataNarrator and turn your data into stories.
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 p-3 text-xs text-rose-600 dark:text-rose-400 animate-in fade-in">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
                  {/* Full Name */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1 ml-0.5">
                      Full Name
                    </label>
                    <div className="relative flex items-center">
                      <User className="absolute left-3.5 w-4 h-4 pointer-events-none text-slate-400 dark:text-zinc-500" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Alex Morgan"
                        className="w-full pl-10 pr-4 py-2.5 sm:py-2.5 border rounded-xl text-xs sm:text-sm outline-none transition-colors shadow-sm border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#0f1319] text-slate-800 dark:text-zinc-100 focus:border-[#4a7ff7] focus:ring-2 focus:ring-[#4a7ff7]/20 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                      />
                    </div>
                  </div>

                  {/* Work / Personal Email */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1 ml-0.5">
                      Work / Personal Email
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3.5 w-4 h-4 pointer-events-none text-slate-400 dark:text-zinc-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@company.com"
                        className="w-full pl-10 pr-4 py-2.5 sm:py-2.5 border rounded-xl text-xs sm:text-sm outline-none transition-colors shadow-sm border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#0f1319] text-slate-800 dark:text-zinc-100 focus:border-[#4a7ff7] focus:ring-2 focus:ring-[#4a7ff7]/20 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1 ml-0.5">
                      Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 w-4 h-4 pointer-events-none text-slate-400 dark:text-zinc-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full pl-10 pr-11 py-2.5 sm:py-2.5 border rounded-xl text-xs sm:text-sm outline-none transition-colors shadow-sm border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#0f1319] text-slate-800 dark:text-zinc-100 focus:border-[#4a7ff7] focus:ring-2 focus:ring-[#4a7ff7]/20 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3.5 text-slate-400 dark:text-zinc-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1 ml-0.5">
                      Confirm Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 w-4 h-4 pointer-events-none text-slate-400 dark:text-zinc-500" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className="w-full pl-10 pr-11 py-2.5 sm:py-2.5 border rounded-xl text-xs sm:text-sm outline-none transition-colors shadow-sm border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#0f1319] text-slate-800 dark:text-zinc-100 focus:border-[#4a7ff7] focus:ring-2 focus:ring-[#4a7ff7]/20 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        className="absolute right-3.5 text-slate-400 dark:text-zinc-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Terms Checkbox */}
                  <div className="pt-1">
                    <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-zinc-400 cursor-pointer select-none leading-snug">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-zinc-700 text-[#4a7ff7] focus:ring-[#4a7ff7] cursor-pointer shrink-0"
                      />
                      <span>
                        I agree to the{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveModal("terms");
                          }}
                          className="text-[#4a7ff7] hover:underline font-medium cursor-pointer"
                        >
                          Terms of Service
                        </button>{" "}
                        and{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveModal("privacy");
                          }}
                          className="text-[#4a7ff7] hover:underline font-medium cursor-pointer"
                        >
                          Privacy Policy
                        </button>
                      </span>
                    </label>
                  </div>

                  {/* Primary CTA Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-[#4a7ff7] hover:bg-[#3870ec] active:scale-[0.98] text-white font-semibold rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-[#4a7ff7]/20 disabled:opacity-50 mt-3 cursor-pointer"
                  >
                    <span>{loading ? "Creating your account..." : "Sign Up →"}</span>
                  </button>
                </form>

                {/* Social / Quick Sign-in Divider */}
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200/70 dark:border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center text-[11px] uppercase">
                    <span className="bg-white dark:bg-[#161b22] px-3 text-slate-400 dark:text-zinc-500 font-semibold tracking-wider">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Social Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSocialSignUp("Google")}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#0f1319] hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-xs font-semibold text-slate-700 dark:text-zinc-200 transition-colors shadow-sm cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSocialSignUp("GitHub")}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#0f1319] hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-xs font-semibold text-slate-700 dark:text-zinc-200 transition-colors shadow-sm cursor-pointer"
                  >
                    <svg className="w-4 h-4 fill-current text-slate-800 dark:text-zinc-100" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      />
                    </svg>
                    <span>GitHub</span>
                  </button>
                </div>

                {/* Bottom Redirect Link */}
                <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-zinc-800 text-center text-xs text-slate-600 dark:text-zinc-400">
                  Already have an account?{" "}
                  <Link
                    href="/"
                    className="text-[#4a7ff7] font-semibold hover:text-[#3870ec] underline underline-offset-2 transition-colors"
                  >
                    Log In
                  </Link>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Unified App Footer */}
      <AppFooter />

      {/* Terms Modal */}
      {activeModal === "terms" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#4a7ff7] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Terms of Service</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Rules and guidelines for using the DataNarrator platform</p>
              </div>
            </div>
            <div className="overflow-y-auto space-y-4 text-xs text-slate-600 dark:text-zinc-300 pr-2 leading-relaxed">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-zinc-100 mb-1">1. Acceptance of Terms</h4>
                <p>By creating an account or accessing DataNarrator, you agree to comply with and be bound by these terms.</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-zinc-100 mb-1">2. Data Ownership &amp; Privacy</h4>
                <p>You retain 100% full ownership, rights, and intellectual property over any datasets, spreadsheets, or files uploaded to DataNarrator.</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-zinc-100 mb-1">3. Permitted Platform Use</h4>
                <p>Users must not upload malicious files, violate copyright, or attempt to disrupt the integrity or security of the narrative generation pipeline.</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 rounded-xl bg-[#4a7ff7] hover:bg-[#3870ec] text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {activeModal === "privacy" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setActiveModal(null)}
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
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 rounded-xl bg-[#4a7ff7] hover:bg-[#3870ec] text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

