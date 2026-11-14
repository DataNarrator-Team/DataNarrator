import { AppSidebar } from "@/components/app-sidebar"
import { UploadWorkspace } from "@/components/upload-workspace"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Upload Dataset | DataNarrator",
  description: "Upload and structure your datasets with DataNarrator AI",
}

export default function UploadPage() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] dark:bg-[#181a20]">
      <AppSidebar />
      <UploadWorkspace />
    </div>
  )
}
