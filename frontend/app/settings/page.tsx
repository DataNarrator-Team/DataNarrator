import { AppSidebar } from "@/components/app-sidebar"
import { SettingsWorkspace } from "@/components/settings-workspace"
import { DecorativeBackground } from "@/components/decorative-background"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Settings & Preferences | DataNarrator",
  description: "Customize your profile, AI narrative engine thresholds, and visualization defaults.",
}

export default function SettingsPage() {
  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-white dark:bg-[#181a20]">
      <DecorativeBackground />
      <AppSidebar />
      <SettingsWorkspace />
    </div>
  )
}

