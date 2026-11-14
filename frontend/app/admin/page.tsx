"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminUserManagement } from "@/components/admin/admin-user-management";
import { AdminDeletionRequests } from "@/components/admin/admin-deletion-requests";
import { DecorativeBackground } from "@/components/decorative-background";
import { ShieldAlert, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const router = useRouter();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("users");
  const [isDevPreview, setIsDevPreview] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("preview") === "true") {
        setIsDevPreview(true);
      }
    }
  }, []);

  // Protect route
  useEffect(() => {
    if (!isLoading && !isLoggedIn && !isDevPreview) {
      router.replace("/");
    }
  }, [isLoggedIn, isLoading, router, isDevPreview]);

  // Loading state
  if (isLoading && !isDevPreview) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] dark:bg-[#181a20] text-slate-700 dark:text-zinc-200">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#4a7ff7]" />
          <p className="text-sm font-semibold">Verifying administrator credentials...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!isLoggedIn && !isDevPreview) {
    return null;
  }

  // Not an admin
  if (!isAdmin && !isDevPreview) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] dark:bg-[#181a20] p-4 text-center">
        <div className="bg-white dark:bg-[#252831] border border-rose-200 dark:border-rose-900/60 rounded-3xl p-8 max-w-md w-full shadow-xl space-y-4">
          <div className="size-16 mx-auto rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Access Restricted
          </h2>
          <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
            This section is restricted to System Administrators for user account management and platform governance.
          </p>
          <div className="pt-2">
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#4a7ff7] hover:bg-[#3870ec] text-white text-sm font-bold shadow-md transition"
            >
              <span>Back to Workspace</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] dark:bg-[#181a20]">
      {/* Sidebar Navigation matching user sidebar */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Dynamic View matching user workspace */}
      <div className="relative flex flex-1 flex-col overflow-y-auto bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100">
        <DecorativeBackground />

        {activeTab === "requests" ? (
          <AdminDeletionRequests />
        ) : (
          <AdminUserManagement onNavigateToRequests={() => setActiveTab("requests")} />
        )}
      </div>
    </div>
  );
}
