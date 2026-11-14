"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  User,
  UserCog,
  Camera,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  DollarSign,
  Hash,
  Palette,
  Sun,
  Moon,
  AlertTriangle,
  Trash2,
  LogOut,
  Check,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Info,
  Clock,
  RotateCcw,
  Send,
} from "lucide-react"
import {
  CHART_PALETTES,
  ChartPaletteKey,
  getStoredPalette,
  saveStoredPalette,
} from "@/lib/chart-palettes"
import {
  applyTheme,
  getStoredTheme,
  EVENT_THEME_CHANGED,
  ThemeMode,
} from "@/lib/theme"
import {
  useAuth,
  userDeleteAccount,
  logout,
} from "@/lib/auth"
import { settingsApi } from "@/lib/api"
import { AppFooter } from "@/components/app-footer"

export function SettingsWorkspace() {
  // --------------------------------------------------------------------------
  // 1. Profile State
  // --------------------------------------------------------------------------
  const { profile, updateProfile } = useAuth()
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [displayName, setDisplayName] = useState(profile?.displayName || "Shahad Saif")
  const [nameError, setNameError] = useState("")
  const [nameNonEnglishWarn, setNameNonEnglishWarn] = useState(false)
  const [username, setUsername] = useState(profile?.username || "shahad_saif")
  const [usernameError, setUsernameError] = useState("")
  const [usernameNonEnglishWarn, setUsernameNonEnglishWarn] = useState(false)
  const [email, setEmail] = useState(profile?.email || "shahad.saif@example.com")
  const [emailError, setEmailError] = useState("")
  const [emailNonEnglishWarn, setEmailNonEnglishWarn] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      if (profile.displayName) setDisplayName(profile.displayName)
      if (profile.username) setUsername(profile.username)
      if (profile.email) setEmail(profile.email)
    }
  }, [profile?.displayName, profile?.username, profile?.email])

  // --------------------------------------------------------------------------
  // 2. Security & Password State
  // --------------------------------------------------------------------------
  const [currentPassword, setCurrentPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [currentPasswordWarn, setCurrentPasswordWarn] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [newPasswordWarn, setNewPasswordWarn] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [confirmPasswordWarn, setConfirmPasswordWarn] = useState(false)
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null)

  // Password strength calculation
  function calculatePasswordStrength(pass: string): {
    score: number
    label: string
    color: string
  } {
    if (!pass) return { score: 0, label: "None", color: "bg-slate-200" }
    let score = 0
    if (pass.length >= 8) score += 1
    if (/[A-Z]/.test(pass)) score += 1
    if (/[0-9]/.test(pass)) score += 1
    if (/[^A-Za-z0-9]/.test(pass)) score += 1

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-rose-500" }
    if (score === 2) return { score: 2, label: "Fair", color: "bg-amber-500" }
    if (score === 3) return { score: 3, label: "Good", color: "bg-blue-500" }
    return { score: 4, label: "Strong & Secure", color: "bg-emerald-500" }
  }

  const passwordStrength = calculatePasswordStrength(newPassword)

  // --------------------------------------------------------------------------
  // 3. Visualization & Formatting State
  // --------------------------------------------------------------------------
  const [currency, setCurrency] = useState<"SAR" | "USD" | "EUR" | "GBP" | "AED" | "KWD">("SAR")
  const [compactNumbers, setCompactNumbers] = useState(true)
  const [palettePreset, setPalettePreset] = useState<ChartPaletteKey>("warm")
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light")
  const [paletteSaved, setPaletteSaved] = useState(false)
  const [previewChartType, setPreviewChartType] = useState<"trend" | "bars" | "donut">("trend")

  // Load the profile from the backend (GET /settings/profile)
  useEffect(() => {
    settingsApi
      .getProfile()
      .then(({ profile: p }) => {
        setDisplayName(p.display_name || p.username)
        setUsername(p.username)
        updateProfile({ displayName: p.display_name || p.username, username: p.username, email: p.email })
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    setPalettePreset(getStoredPalette())
    setThemeMode(getStoredTheme())
    const storedCurrency = localStorage.getItem("datanarrutor_currency_format") as any
    if (storedCurrency && ["SAR", "USD", "EUR", "GBP", "AED", "KWD"].includes(storedCurrency)) {
      setCurrency(storedCurrency)
    }
    const handleThemeChange = () => {
      setThemeMode(getStoredTheme())
    }
    window.addEventListener(EVENT_THEME_CHANGED, handleThemeChange)
    return () => window.removeEventListener(EVENT_THEME_CHANGED, handleThemeChange)
  }, [])

  const activePalette = CHART_PALETTES[palettePreset] || CHART_PALETTES.warm

  function handleSelectPalette(key: ChartPaletteKey) {
    setPalettePreset(key)
    saveStoredPalette(key)
    // "accessible" is a frontend-only palette
    if (key !== "accessible") settingsApi.setChartColor(key).catch(() => {})
    setPaletteSaved(true)
    setTimeout(() => setPaletteSaved(false), 2500)
  }

  function handleToggleTheme() {
    const next = themeMode === "light" ? "dark" : "light"
    setThemeMode(next)
    applyTheme(next)
    settingsApi.setTheme(next).catch(() => {})
    setPaletteSaved(true)
    setTimeout(() => setPaletteSaved(false), 2500)
  }

  // --------------------------------------------------------------------------
  // 4. Account Management State
  // --------------------------------------------------------------------------
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("")

  const [deletePassword, setDeletePassword] = useState("")
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // DELETE /settings/account (requires the current password)
  const handleConfirmUserDelete = () => {
    if (deleteConfirmationText !== "DELETE" || !profile?.username) return
    if (!deletePassword) {
      setDeleteError("Please enter your current password.")
      return
    }
    setDeleteError(null)
    settingsApi
      .deleteAccount(deletePassword)
      .then(() => {
        logout()
        alert("Your account has been deleted. You will now be redirected.")
        window.location.href = "/"
      })
      .catch((err) => setDeleteError(err?.message || "Account could not be deleted."))
  }

  // Quick navigation anchors
  const [activeSection, setActiveSection] = useState("profile")

  // Handlers
  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setAvatarPreview(url)
      // POST /settings/profile/photo
      settingsApi.uploadPhoto(file).catch((err) => alert(err?.message || "Photo upload failed."))
    }
  }

  function handleSaveProfile() {
    let hasError = false

    // 1. Validate Display Name
    const trimmedName = displayName.trim()
    if (!trimmedName) {
      setNameError("Display name cannot be empty")
      hasError = true
    } else if (/[^\x00-\x7F]/.test(trimmedName)) {
      setNameError("Display name must only contain English characters")
      hasError = true
    } else if (trimmedName.length < 2) {
      setNameError("Display name must be at least 2 characters")
      hasError = true
    } else {
      setNameError("")
    }

    // 2. Validate Username
    const trimmedUsername = username.trim()
    if (!trimmedUsername) {
      setUsernameError("Username cannot be empty")
      hasError = true
    } else if (/[^\x00-\x7F]/.test(trimmedUsername) || !/^[a-zA-Z0-9_.-]+$/.test(trimmedUsername)) {
      setUsernameError("Username must only contain English letters, numbers, and basic symbols (_ - .)")
      hasError = true
    } else if (trimmedUsername.length < 3) {
      setUsernameError("Username must be at least 3 characters")
      hasError = true
    } else {
      setUsernameError("")
    }

    if (hasError) return

    // PATCH /settings/profile
    settingsApi
      .updateProfile(trimmedUsername, trimmedName)
      .then(() => {
        updateProfile({
          displayName: trimmedName,
          username: trimmedUsername,
        })
        setProfileSaved(true)
        setTimeout(() => setProfileSaved(false), 3000)
      })
      .catch((err) => setUsernameError(err?.message || "Profile could not be saved."))
  }

  function handleUpdatePassword() {
    if (!currentPassword) {
      setPasswordFeedback("Please provide your current password")
      return
    }
    if (newPassword.length < 8) {
      setPasswordFeedback("New password must be at least 8 characters long")
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback("Passwords do not match")
      return
    }
    // PATCH /settings/password
    settingsApi
      .changePassword(currentPassword, newPassword, confirmPassword)
      .then(() => {
        setPasswordFeedback("success")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setTimeout(() => setPasswordFeedback(null), 3500)
      })
      .catch((err) => setPasswordFeedback(err?.message || "Password could not be updated."))
  }

  return (
    <div className="relative z-10 flex-1 flex flex-col h-full min-w-0 overflow-y-auto">
      <div className="flex-1 px-4 py-8 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-5xl">
        {/* Top Header Section - consistent with workspace header styles */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="size-2 rounded-full bg-[#e99842]" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Preferences & Controls
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              Account & Analysis Settings
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-xl">
              Tailored settings to make automated data storytelling clear, accessible, and intuitive.
            </p>
          </div>

          {/* Quick status pill */}
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-blue-200/80 dark:border-blue-500/30 bg-white/90 dark:bg-zinc-800/90 px-3.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 shadow-2xs sm:self-auto backdrop-blur-sm">
            <Sparkles className="size-3.5 text-[#4a7ff7]" />
            <span>Beginner Guidance Active</span>
          </div>
        </div>

        {/* Tab Navigation Segmented Bar */}
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 dark:border-zinc-700 bg-white dark:bg-[#1e2026] p-2 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveSection("profile")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeSection === "profile"
                ? "bg-[#4a7ff7] text-white shadow-xs"
                : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100"
            }`}
          >
            <User className="size-3.5" />
            <span>Profile</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("security")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeSection === "security"
                ? "bg-[#4a7ff7] text-white shadow-xs"
                : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100"
            }`}
          >
            <Lock className="size-3.5" />
            <span>Security</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("visual")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeSection === "visual"
                ? "bg-[#4a7ff7] text-white shadow-xs"
                : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100"
            }`}
          >
            <Palette className="size-3.5" />
            <span>Visuals & Formatting</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("danger")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeSection === "danger"
                ? "bg-[#4a7ff7] text-white shadow-xs"
                : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100"
            }`}
          >
            <UserCog className="size-3.5" />
            <span>Account Management</span>
          </button>
        </div>

        <div className="transition-all duration-150">
          {/* =================================================================== */}
          {/* Profile & Account Settings Tab View */}
          {/* =================================================================== */}
          {activeSection === "profile" && (
            <section className="rounded-3xl border border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-[#1e2026] p-6 sm:p-8 lg:p-10 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#4a7ff7]">
                    <User className="size-4.5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800 dark:text-zinc-100">Profile & Account Settings</h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Your public identifier and account information used on exported storyboards.
                    </p>
                  </div>
                </div>
              </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Profile Picture */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-[#282b35] p-6 text-center">
                <div className="mb-3">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Profile Avatar"
                      className="size-24 rounded-full object-cover border-4 border-white dark:border-zinc-800 shadow-md"
                    />
                  ) : (
                    <div className="flex size-24 items-center justify-center rounded-full bg-gradient-to-tr from-[#4a7ff7] to-[#82a6fc] text-2xl font-extrabold text-white shadow-md border-4 border-white dark:border-zinc-800">
                      SM
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />

                <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">Profile Photo</h3>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-zinc-500">JPG, PNG or GIF (max 2MB)</p>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#282b35] px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-zinc-700 cursor-pointer"
                >
                  <Camera className="size-3.5 text-slate-500 dark:text-zinc-400" />
                  <span>Upload / Change Photo</span>
                </button>
              </div>

              {/* Editable Fields */}
              <div className="md:col-span-2 space-y-4">
                {/* 1. Display Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    Display Name
                  </label>
                  <div className="relative mt-1.5 flex items-center">
                    <User className={`absolute left-3.5 size-4 pointer-events-none transition-colors ${nameError || nameNonEnglishWarn ? "text-rose-400" : "text-slate-400 dark:text-zinc-500"}`} />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => {
                        const val = e.target.value
                        if (/[^\x00-\x7F]/.test(val)) {
                          setNameNonEnglishWarn(true)
                          const sanitized = val.replace(/[^\x00-\x7F]/g, "")
                          setDisplayName(sanitized)
                        } else {
                          setNameNonEnglishWarn(false)
                          setDisplayName(val)
                          if (nameError) setNameError("")
                        }
                      }}
                      placeholder="e.g. Shahad Saif"
                      className={`w-full rounded-xl border pl-10 pr-3.5 py-2.5 text-xs font-medium text-slate-800 dark:text-zinc-100 transition focus:outline-none focus:ring-2 ${
                        nameError || nameNonEnglishWarn
                          ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/20"
                          : "border-slate-200 dark:border-zinc-700 focus:border-[#4a7ff7] focus:ring-[#4a7ff7]/20 bg-white dark:bg-zinc-800"
                      }`}
                    />
                  </div>
                  {nameNonEnglishWarn ? (
                    <p className="mt-1.5 text-[11px] font-semibold text-rose-500 flex items-center gap-1 animate-in fade-in">
                      <AlertCircle className="size-3 shrink-0" /> English only 
                    </p>
                  ) : nameError ? (
                    <p className="mt-1.5 text-[11px] font-semibold text-rose-500 flex items-center gap-1">
                      <AlertCircle className="size-3 shrink-0" /> {nameError}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-[11px] text-slate-400 dark:text-zinc-500">
                      This is your full display name shown on analytical reports and dashboards.
                    </p>
                  )}
                </div>

                {/* 2. Username */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    Username
                  </label>
                  <div className="relative mt-1.5 flex items-center">
                    <Hash className={`absolute left-3.5 size-4 pointer-events-none transition-colors ${usernameError || usernameNonEnglishWarn ? "text-rose-400" : "text-slate-400 dark:text-zinc-500"}`} />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        const val = e.target.value
                        if (/[^\x00-\x7F]/.test(val)) {
                          setUsernameNonEnglishWarn(true)
                          const sanitized = val.replace(/[^\x00-\x7F]/g, "")
                          setUsername(sanitized)
                        } else {
                          setUsernameNonEnglishWarn(false)
                          setUsername(val)
                          if (usernameError) setUsernameError("")
                        }
                      }}
                      placeholder="e.g. shahad_saif"
                      className={`w-full rounded-xl border pl-10 pr-3.5 py-2.5 text-xs font-medium text-slate-800 dark:text-zinc-100 transition focus:outline-none focus:ring-2 ${
                        usernameError || usernameNonEnglishWarn
                          ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/20"
                          : "border-slate-200 dark:border-zinc-700 focus:border-[#4a7ff7] focus:ring-[#4a7ff7]/20 bg-white dark:bg-zinc-800"
                      }`}
                    />
                  </div>
                  {usernameNonEnglishWarn ? (
                    <p className="mt-1.5 text-[11px] font-semibold text-rose-500 flex items-center gap-1 animate-in fade-in">
                      <AlertCircle className="size-3 shrink-0" /> English only 
                    </p>
                  ) : usernameError ? (
                    <p className="mt-1.5 text-[11px] font-semibold text-rose-500 flex items-center gap-1">
                      <AlertCircle className="size-3 shrink-0" /> {usernameError}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-[11px] text-slate-400 dark:text-zinc-500">
                      Your unique username handle used for signing in and user account identification.
                    </p>
                  )}
                </div>

                {/* 3. Email Address (Permanent / Cannot be changed) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                      Email Address
                    </label>
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-zinc-400 border border-slate-200/60 dark:border-zinc-700/60">
                      <Lock className="size-2.5 text-slate-400 dark:text-zinc-500" />
                      <span>Cannot be changed</span>
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 size-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      readOnly
                      disabled
                      className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-[#282b35] pl-10 pr-10 py-2.5 text-xs font-medium text-slate-500 dark:text-zinc-400 cursor-not-allowed select-none focus:outline-none"
                    />
                    <Lock className="absolute right-3.5 size-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400 dark:text-zinc-500">
                    Your registered email address is permanent and cannot be changed for account security.
                  </p>
                </div>

                {/* Save Profile Button */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer ${
                      profileSaved
                        ? "bg-emerald-600 scale-[1.02]"
                        : "bg-[#4a7ff7] hover:bg-[#3870ec] active:scale-95"
                    }`}
                  >
                    {profileSaved ? (
                      <>
                        <Check className="size-4" />
                        <span>Profile Saved!</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-4" />
                        <span>Save Profile Changes</span>
                      </>
                    )}
                  </button>

                  {profileSaved && (
                    <span className="text-xs font-semibold text-emerald-600 animate-in fade-in">
                      Your author profile was successfully updated.
                    </span>
                  )}
                </div>
              </div>
            </div>
            </section>
          )}

          {/* =================================================================== */}
          {/* Security & Password Tab View */}
          {/* =================================================================== */}
          {activeSection === "security" && (
            <section className="rounded-3xl border border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-[#1e2026] p-6 sm:p-8 lg:p-10 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/50 text-[#e99842]">
                    <Lock className="size-4.5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800 dark:text-zinc-100">Security & Password</h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Keep your account secure with strong credentials and session management.
                    </p>
                  </div>
                </div>
              </div>

            {/* Change Password Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    Current Password
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => {
                        const val = e.target.value
                        if (/[^\x00-\x7F]/.test(val)) {
                          setCurrentPasswordWarn(true)
                          const sanitized = val.replace(/[^\x00-\x7F]/g, "")
                          setCurrentPassword(sanitized)
                        } else {
                          setCurrentPasswordWarn(false)
                          setCurrentPassword(val)
                        }
                      }}
                      placeholder="••••••••"
                      className={`w-full rounded-xl border px-3.5 py-2.5 pr-10 text-xs font-medium text-slate-800 dark:text-zinc-100 transition focus:outline-none focus:ring-2 ${
                        currentPasswordWarn
                          ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/20"
                          : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#282b35] focus:border-[#4a7ff7] focus:ring-[#4a7ff7]/20"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                    >
                      {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {currentPasswordWarn && (
                    <p className="mt-1.5 text-[11px] font-semibold text-rose-500 flex items-center gap-1 animate-in fade-in">
                      <AlertCircle className="size-3 shrink-0" /> English only 
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    New Password
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        const val = e.target.value
                        if (/[^\x00-\x7F]/.test(val)) {
                          setNewPasswordWarn(true)
                          const sanitized = val.replace(/[^\x00-\x7F]/g, "")
                          setNewPassword(sanitized)
                        } else {
                          setNewPasswordWarn(false)
                          setNewPassword(val)
                        }
                      }}
                      placeholder="At least 8 characters"
                      className={`w-full rounded-xl border px-3.5 py-2.5 pr-10 text-xs font-medium text-slate-800 dark:text-zinc-100 transition focus:outline-none focus:ring-2 ${
                        newPasswordWarn
                          ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/20"
                          : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#282b35] focus:border-[#4a7ff7] focus:ring-[#4a7ff7]/20"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                    >
                      {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {newPasswordWarn && (
                    <p className="mt-1.5 text-[11px] font-semibold text-rose-500 flex items-center gap-1 animate-in fade-in">
                      <AlertCircle className="size-3 shrink-0" /> English only 
                    </p>
                  )}

                  {/* Password Strength Meter */}
                  {newPassword && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-semibold text-slate-500 dark:text-zinc-400">Strength:</span>
                        <span className="font-bold text-slate-700 dark:text-zinc-200">{passwordStrength.label}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden flex gap-1">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            passwordStrength.score >= 1 ? passwordStrength.color : "bg-transparent"
                          }`}
                          style={{ width: "25%" }}
                        />
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            passwordStrength.score >= 2 ? passwordStrength.color : "bg-transparent"
                          }`}
                          style={{ width: "25%" }}
                        />
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            passwordStrength.score >= 3 ? passwordStrength.color : "bg-transparent"
                          }`}
                          style={{ width: "25%" }}
                        />
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            passwordStrength.score >= 4 ? passwordStrength.color : "bg-transparent"
                          }`}
                          style={{ width: "25%" }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    Confirm New Password
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        const val = e.target.value
                        if (/[^\x00-\x7F]/.test(val)) {
                          setConfirmPasswordWarn(true)
                          const sanitized = val.replace(/[^\x00-\x7F]/g, "")
                          setConfirmPassword(sanitized)
                        } else {
                          setConfirmPasswordWarn(false)
                          setConfirmPassword(val)
                        }
                      }}
                      placeholder="Repeat new password"
                      className={`w-full rounded-xl border px-3.5 py-2.5 pr-10 text-xs font-medium text-slate-800 dark:text-zinc-100 transition focus:outline-none focus:ring-2 ${
                        confirmPasswordWarn
                          ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/20"
                          : confirmPassword && newPassword === confirmPassword
                          ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-200"
                          : confirmPassword && newPassword !== confirmPassword
                          ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                          : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#282b35] focus:border-[#4a7ff7] focus:ring-[#4a7ff7]/20"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {confirmPasswordWarn && (
                    <p className="mt-1.5 text-[11px] font-semibold text-rose-500 flex items-center gap-1 animate-in fade-in">
                      <AlertCircle className="size-3 shrink-0" /> English only 
                    </p>
                  )}

                  {confirmPassword && (
                    <div className="mt-1.5 text-[11px] font-semibold flex items-center gap-1">
                      {newPassword === confirmPassword ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="size-3" /> Passwords match
                        </span>
                      ) : (
                        <span className="text-rose-500 dark:text-rose-400 flex items-center gap-1">
                          <AlertCircle className="size-3" /> Passwords do not match
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Password Feedback Banner */}
              {passwordFeedback && passwordFeedback !== "success" && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
                  <AlertCircle className="size-4 text-rose-500 shrink-0" />
                  <span>{passwordFeedback}</span>
                </div>
              )}

              {passwordFeedback === "success" && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>Your password has been securely updated!</span>
                </div>
              )}

              <div className="pt-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleUpdatePassword}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 dark:hover:bg-blue-500 cursor-pointer transition active:scale-95"
                >
                  <Lock className="size-3.5" />
                  <span>Update Password</span>
                </button>
              </div>
            </div>
          </section>
          )}

          {/* =================================================================== */}
          {/* Visualization & Formatting Tab View */}
          {/* =================================================================== */}
          {activeSection === "visual" && (
            <section className="rounded-3xl border border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-[#1e2026] p-6 sm:p-8 lg:p-10 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                    <Palette className="size-4.5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800 dark:text-zinc-100">Visualization & Formatting</h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Format how numbers and currencies appear across all charts and metrics.
                    </p>
                  </div>
                </div>
              </div>

            <div className="space-y-6">
              {/* Currency & Compact Numbers */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    Default Currency Format
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => {
                      const val = e.target.value as any
                      setCurrency(val)
                      settingsApi.setCurrency(val).catch(() => {})
                      try {
                        localStorage.setItem("datanarrutor_currency_format", val)
                      } catch {}
                    }}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#282b35] px-3.5 py-2.5 text-xs font-medium text-slate-800 dark:text-zinc-100 focus:border-[#4a7ff7] focus:outline-none focus:ring-2 focus:ring-[#4a7ff7]/20 cursor-pointer"
                  >
                    <option value="SAR">SAR (Saudi Riyal)</option>
                    <option value="USD">USD ($ - US Dollar)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="GBP">GBP (£ - British Pound)</option>
                    <option value="AED">AED (UAE Dirham)</option>
                    <option value="KWD">KWD (Kuwaiti Dinar)</option>
                  </select>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-[#282b35] p-3.5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-100">Compact Number Display</h3>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Show readable units (e.g. <span className="font-bold text-slate-700 dark:text-zinc-200">{compactNumbers ? "150K" : "150,000"}</span>)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !compactNumbers
                      setCompactNumbers(next)
                      settingsApi.setNumberDisplay(next ? "compact" : "full").catch(() => {})
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      compactNumbers ? "bg-[#4a7ff7]" : "bg-slate-200 dark:bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        compactNumbers ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Color Palette Preset Cards */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    Chart Color Palette Preset
                  </label>
                  {paletteSaved && (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                      <Check className="size-3.5" /> Saved & Active across all charts!
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {/* 1. Warm Signature (Royal Blue & Sunset Orange) */}
                  <div
                    onClick={() => handleSelectPalette("warm")}
                    className={`rounded-2xl border p-4 cursor-pointer transition-all ${
                      palettePreset === "warm"
                        ? "border-blue-600 bg-blue-50/40 dark:bg-blue-950/40 ring-2 ring-blue-500/25 shadow-xs"
                        : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#282b35] hover:border-slate-300 dark:hover:border-zinc-600"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="size-4 rounded-full bg-[#2563eb]" />
                      <span className="size-4 rounded-full bg-[#f97316]" />
                      <span className="size-4 rounded-full bg-[#4f46e5]" />
                    </div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">Royal Blue & Orange</h4>
                      {palettePreset === "warm" && <Check className="size-3.5 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
                      High-contrast tech palette with vivid sunset orange highlights.
                    </p>
                  </div>

                  {/* 2. Emerald Forest & Golden Amber */}
                  <div
                    onClick={() => handleSelectPalette("emerald")}
                    className={`rounded-2xl border p-4 cursor-pointer transition-all ${
                      palettePreset === "emerald" || palettePreset === "accessible"
                        ? "border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/40 ring-2 ring-emerald-500/25 shadow-xs"
                        : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#282b35] hover:border-slate-300 dark:hover:border-zinc-600"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="size-4 rounded-full bg-[#059669]" />
                      <span className="size-4 rounded-full bg-[#d97706]" />
                      <span className="size-4 rounded-full bg-[#10b981]" />
                    </div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">Emerald Forest & Gold</h4>
                      {(palettePreset === "emerald" || palettePreset === "accessible") && (
                        <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
                      Nature & growth: deep lush emerald with warm golden amber peaks.
                    </p>
                  </div>

                  {/* 3. Amethyst Violet & Neon Fuchsia */}
                  <div
                    onClick={() => handleSelectPalette("purple")}
                    className={`rounded-2xl border p-4 cursor-pointer transition-all ${
                      palettePreset === "purple"
                        ? "border-purple-600 bg-purple-50/40 dark:bg-purple-950/40 ring-2 ring-purple-500/25 shadow-xs"
                        : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#282b35] hover:border-slate-300 dark:hover:border-zinc-600"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="size-4 rounded-full bg-[#7c3aed]" />
                      <span className="size-4 rounded-full bg-[#ec4899]" />
                      <span className="size-4 rounded-full bg-[#a855f7]" />
                    </div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">Amethyst Violet & Rose</h4>
                      {palettePreset === "purple" && <Check className="size-3.5 text-purple-600 dark:text-purple-400" />}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
                      Modern & creative: electric violet paired with vibrant neon fuchsia.
                    </p>
                  </div>

                  {/* 4. Cyber Teal & Coral Crimson */}
                  <div
                    onClick={() => handleSelectPalette("cool")}
                    className={`rounded-2xl border p-4 cursor-pointer transition-all ${
                      palettePreset === "cool"
                        ? "border-teal-600 bg-teal-50/40 dark:bg-teal-950/40 ring-2 ring-teal-500/25 shadow-xs"
                        : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#282b35] hover:border-slate-300 dark:hover:border-zinc-600"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="size-4 rounded-full bg-[#0d9488]" />
                      <span className="size-4 rounded-full bg-[#e11d48]" />
                      <span className="size-4 rounded-full bg-[#06b6d4]" />
                    </div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">Cyber Teal & Crimson</h4>
                      {palettePreset === "cool" && <Check className="size-3.5 text-teal-600 dark:text-teal-400" />}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
                      Data journalism: deep marine teal baseline with intense coral red accents.
                    </p>
                  </div>
                </div>

                {/* Live Interactive Chart Sample Preview */}
                <div className="mt-4 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-[#282b35] p-4 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-zinc-800 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-3 rounded-full"
                        style={{ backgroundColor: activePalette.primary }}
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                        Live Preview:{" "}
                        <span style={{ color: activePalette.primary }}>
                          {activePalette.name}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 p-0.5 rounded-xl text-[10px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setPreviewChartType("trend")}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                          previewChartType === "trend"
                            ? "bg-slate-900 dark:bg-zinc-700 text-white shadow-2xs font-bold"
                            : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
                        }`}
                      >
                        Trend Line
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewChartType("bars")}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                          previewChartType === "bars"
                            ? "bg-slate-900 dark:bg-zinc-700 text-white shadow-2xs font-bold"
                            : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
                        }`}
                      >
                        Category Bars
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewChartType("donut")}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                          previewChartType === "donut"
                            ? "bg-slate-900 dark:bg-zinc-700 text-white shadow-2xs font-bold"
                            : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
                        }`}
                      >
                        Donut Share
                      </button>
                    </div>
                  </div>

                  {/* Sample Graphic */}
                  <div className="flex items-center justify-center py-2">
                    {previewChartType === "trend" && (
                      <svg viewBox="0 0 460 140" className="w-full max-w-md h-32 overflow-visible">
                        <defs>
                          <linearGradient id="sampleAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={activePalette.gradient.start} stopOpacity="0.32" />
                            <stop offset="100%" stopColor={activePalette.gradient.end} stopOpacity="0.04" />
                          </linearGradient>
                        </defs>
                        <line x1="30" y1="30" x2="430" y2="30" stroke="#94a3b8" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="30" y1="75" x2="430" y2="75" stroke="#94a3b8" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="30" y1="120" x2="430" y2="120" stroke="#94a3b8" strokeOpacity="0.3" strokeWidth="1" />
                        <path
                          d="M 40 100 L 110 80 L 180 90 L 250 55 L 320 65 L 390 25 L 430 35 L 430 120 L 40 120 Z"
                          fill="url(#sampleAreaGrad)"
                        />
                        <path
                          d="M 40 100 L 110 80 L 180 90 L 250 55 L 320 65 L 390 25 L 430 35"
                          fill="none"
                          stroke={activePalette.primary}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx="110" cy="80" r="3.5" fill="#ffffff" stroke={activePalette.primary} strokeWidth="2" />
                        <circle cx="180" cy="90" r="3.5" fill="#ffffff" stroke={activePalette.primary} strokeWidth="2" />
                        <circle cx="250" cy="55" r="3.5" fill="#ffffff" stroke={activePalette.primary} strokeWidth="2" />
                        <circle cx="320" cy="65" r="3.5" fill="#ffffff" stroke={activePalette.primary} strokeWidth="2" />
                        <circle cx="390" cy="25" r="5" fill="#ffffff" stroke={activePalette.secondary} strokeWidth="2.5" />
                        <circle cx="390" cy="25" r="2.5" fill={activePalette.secondary} />
                        <text x="390" y="14" textAnchor="middle" fontSize="9" fill={activePalette.textHighlight} fontWeight="bold">Peak +42%</text>
                      </svg>
                    )}

                    {previewChartType === "bars" && (
                      <div className="w-full max-w-sm space-y-2 py-1">
                        <div className="text-[11px]">
                          <div className="flex justify-between font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                            <span>Primary Channel</span>
                            <span className="font-bold" style={{ color: activePalette.secondary }}>84%</span>
                          </div>
                          <div className="h-2.5 w-full bg-slate-200/70 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-300" style={{ width: "84%", backgroundColor: activePalette.secondary }} />
                          </div>
                        </div>
                        <div className="text-[11px]">
                          <div className="flex justify-between font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                            <span>Secondary Channel</span>
                            <span className="font-bold" style={{ color: activePalette.primary }}>62%</span>
                          </div>
                          <div className="h-2.5 w-full bg-slate-200/70 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-300" style={{ width: "62%", backgroundColor: activePalette.primary }} />
                          </div>
                        </div>
                        <div className="text-[11px]">
                          <div className="flex justify-between font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                            <span>Organic Search</span>
                            <span className="font-bold" style={{ color: activePalette.tertiary }}>45%</span>
                          </div>
                          <div className="h-2.5 w-full bg-slate-200/70 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-300" style={{ width: "45%", backgroundColor: activePalette.tertiary }} />
                          </div>
                        </div>
                      </div>
                    )}

                    {previewChartType === "donut" && (
                      <div className="flex items-center gap-6 py-1">
                        <svg viewBox="0 0 120 120" className="size-24">
                          <circle cx="60" cy="60" r="42" fill="none" stroke="#64748b" strokeOpacity="0.2" strokeWidth="16" />
                          <circle cx="60" cy="60" r="42" fill="none" stroke={activePalette.primary} strokeWidth="16" strokeDasharray="160 264" strokeDashoffset="0" strokeLinecap="round" />
                          <circle cx="60" cy="60" r="42" fill="none" stroke={activePalette.secondary} strokeWidth="16" strokeDasharray="75 264" strokeDashoffset="-165" strokeLinecap="round" />
                          <text x="60" y="64" textAnchor="middle" fontSize="13" fontWeight="bold" fill="currentColor" className="text-slate-800 dark:text-zinc-100">62%</text>
                        </svg>
                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: activePalette.primary }} />
                            <span className="font-semibold text-slate-700 dark:text-zinc-300">Primary Share (62%)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: activePalette.secondary }} />
                            <span className="font-semibold text-slate-700 dark:text-zinc-300">Highlighted Segment (28%)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: activePalette.tertiary }} />
                            <span className="font-semibold text-slate-700 dark:text-zinc-300">Other (10%)</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Theme Mode Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-[#282b35] p-4">
                <div className="flex items-center gap-3">
                  {themeMode === "light" ? (
                    <Sun className="size-5 text-[#e99842]" />
                  ) : (
                    <Moon className="size-5 text-indigo-400" />
                  )}
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-100">
                      Display Theme: <span className="capitalize">{themeMode} Mode</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Toggle between bright clean layout or dark high-contrast dashboard appearance.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleTheme}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#282b35] px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition cursor-pointer"
                >
                  {themeMode === "light" ? (
                    <>
                      <Moon className="size-3.5 text-slate-500 dark:text-zinc-400" />
                      <span>Switch to Dark</span>
                    </>
                  ) : (
                    <>
                      <Sun className="size-3.5 text-[#e99842]" />
                      <span>Switch to Light</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            </section>
          )}

          {/* =================================================================== */}
          {/* Account Management Tab View */}
          {/* =================================================================== */}
          {activeSection === "danger" && (
            <section className="rounded-3xl border border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-[#1e2026] p-6 sm:p-8 lg:p-10 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#4a7ff7]">
                    <UserCog className="size-4.5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800 dark:text-zinc-100">Account Management</h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Irreversible account operations and sign out controls.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Log Out */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-[#282b35] p-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-100">Log Out of DataNarrator</h3>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Sign out of your current session on this computer.
                    </p>
                  </div>
                  <a
                    href="/"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#1e2026] px-4 py-2 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 transition cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
                  >
                    <LogOut className="size-3.5 text-slate-500 dark:text-zinc-400" />
                    <span>Log Out</span>
                  </a>
                </div>

                {/* Delete Account */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-[#282b35] p-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-100">Delete Account &amp; Stored Data</h3>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Permanently delete your profile, all uploaded datasets, and generated visual storyboards.
                    </p>
                  </div>
                  <button
                    type="button"
                    data-testid="delete-account-btn"
                    onClick={() => {
                      setShowDeleteModal(true)
                      setDeleteConfirmationText("")
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Delete Account</span>
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* Delete Account Confirmation Modal */}
      {/* ===================================================================== */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-[#1e2026] p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/50">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">Permanently Delete Account?</h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-600 dark:text-zinc-300 mt-2">
              All your saved datasets, custom column configurations, AI-generated storyboards, and cached analyses will be wiped immediately from our servers.
            </p>

            <div className="mt-4 rounded-xl border border-rose-100 dark:border-rose-950/60 bg-rose-50 dark:bg-rose-950/30 p-3">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                To confirm, type <span className="text-rose-600 dark:text-rose-400 font-mono font-bold">DELETE</span> below:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#282b35] px-3 py-1.5 text-xs font-mono font-bold text-slate-800 dark:text-zinc-100 focus:border-rose-500 focus:outline-none"
              />
              <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mt-3 mb-1">
                Current password:
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#282b35] px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-100 focus:border-rose-500 focus:outline-none"
              />
              {deleteError && (
                <p className="mt-2 text-[11px] font-semibold text-rose-600 dark:text-rose-400">{deleteError}</p>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#282b35] px-4 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                data-testid="confirm-delete-account-btn"
                disabled={deleteConfirmationText !== "DELETE"}
                onClick={handleConfirmUserDelete}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition ${
                  deleteConfirmationText === "DELETE"
                    ? "bg-rose-600 hover:bg-rose-700 cursor-pointer shadow-sm"
                    : "bg-slate-300 cursor-not-allowed opacity-60"
                }`}
              >
                <Trash2 className="size-3.5" />
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      <AppFooter className="mt-auto w-full" />
    </div>
  )
}

export default SettingsWorkspace
