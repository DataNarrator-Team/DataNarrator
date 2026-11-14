"use client";

import React, { useState, useEffect } from "react";
import {
  Inbox,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  UserX,
  FileSpreadsheet,
  Mail,
  Calendar,
  ShieldAlert,
  Search,
  Filter,
  Check,
} from "lucide-react";
import {
  AccountDeletionRequest,
  getAccountDeletionRequests,
  approveAccountDeletionRequest,
  rejectAccountDeletionRequest,
  EVENT_DELETION_REQUESTS_CHANGED,
} from "@/lib/auth";

export function AdminDeletionRequests() {
  const [requests, setRequests] = useState<AccountDeletionRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "info" } | null>(null);

  const showToast = (text: string, type: "success" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ==============================================================================
  // 🟢 START DEMO / SIMULATION CODE [Will be replaced with backend API integration]
  // In real backend, requests will be fetched and mutated via API endpoints (e.g. GET/POST /api/admin/deletion-requests)
  // ==============================================================================
  const syncRequests = () => {
    setRequests(getAccountDeletionRequests());
  };

  useEffect(() => {
    syncRequests();
    window.addEventListener(EVENT_DELETION_REQUESTS_CHANGED, syncRequests);
    window.addEventListener("storage", syncRequests);
    return () => {
      window.removeEventListener(EVENT_DELETION_REQUESTS_CHANGED, syncRequests);
      window.removeEventListener("storage", syncRequests);
    };
  }, []);

  const handleApprove = (req: AccountDeletionRequest) => {
    approveAccountDeletionRequest(req.username);
    syncRequests();
    showToast(`Account deletion for "${req.userDisplayName}" approved. All data permanently purged.`, "success");
  };

  const handleRestore = (req: AccountDeletionRequest) => {
    rejectAccountDeletionRequest(req.username);
    syncRequests();
    showToast(`Account for "${req.userDisplayName}" restored. User can log in again.`, "info");
  };
  // ==============================================================================
  // 🔴 END DEMO / SIMULATION CODE
  // ==============================================================================

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.userDisplayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;

  return (
    <div className="relative z-10 flex-1 flex flex-col transition-colors text-left">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-semibold transition-all transform animate-in fade-in slide-in-from-bottom-4 ${
            toastMessage.type === "success"
              ? "bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20"
              : "bg-[#4a7ff7] text-white border-blue-600 shadow-blue-500/20"
          }`}
        >
          {toastMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <RotateCcw className="w-5 h-5 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/80 px-8 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Admin Portal / Deletion Requests
          </span>
          <span className="text-slate-300 dark:text-zinc-700">&bull;</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
            <Inbox className="w-3 h-3" />
            <span>{pendingCount} Pending</span>
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-700 bg-white/75 dark:bg-[#22252c]/90 p-5 shadow-sm backdrop-blur-md flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">All Request</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-100 mt-1">{requests.length}</h3>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Account deletions requested by users</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#4a7ff7] border border-blue-100 dark:border-blue-900/40">
              <Inbox className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-700 bg-white/75 dark:bg-[#22252c]/90 p-5 shadow-sm backdrop-blur-md flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Pending Request</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-100 mt-1">{pendingCount}</h3>
              <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">Awaiting administrator action</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-700 bg-white/75 dark:bg-[#22252c]/90 p-5 shadow-sm backdrop-blur-md flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Approved Request</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-100 mt-1">{approvedCount}</h3>
              <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">Data completely wiped</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-700 bg-white/75 dark:bg-[#22252c]/90 shadow-sm backdrop-blur-md overflow-hidden">
          <div className="p-4 border-b border-slate-200/80 dark:border-zinc-700 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search requests by user or email..."
                className="w-full pr-4 pl-10 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#4a7ff7] text-slate-800 dark:text-zinc-100"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-300">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#4a7ff7] cursor-pointer"
              >
                <option value="all">All Request ({requests.length})</option>
                <option value="pending">Pending Request ({pendingCount})</option>
                <option value="approved">Approved Request ({approvedCount})</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 dark:bg-zinc-800/60 border-b border-slate-200/80 dark:border-zinc-700 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">User Account</th>
                  <th className="py-3.5 px-6">Email Address</th>
                  <th className="py-3.5 px-6">Deletion Timestamp</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-center">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/70">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-14 text-center text-slate-400 dark:text-zinc-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500/80" />
                        <p className="font-bold text-slate-700 dark:text-zinc-200">No Deletion Requests Found</p>
                        <p className="text-xs text-slate-400 dark:text-zinc-500">
                          When users delete their accounts from Settings, their requests will appear here for audit and permanent data purging.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => {
                    const initials = req.userDisplayName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase();

                    return (
                      <tr key={req.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-rose-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                              {initials}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {req.userDisplayName}
                              </span>
                              <span className="text-xs font-mono text-slate-400 dark:text-zinc-400">
                                @{req.username}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6 text-xs font-mono text-slate-600 dark:text-zinc-300">
                          {req.email}
                        </td>

                        <td className="py-4 px-6 text-xs text-slate-500 dark:text-zinc-400">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-700 dark:text-zinc-200">
                              {new Date(req.requestedAt).toLocaleDateString()}
                            </span>
                            <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                              {new Date(req.requestedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          {req.status === "pending" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                              <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
                              Pending Purge
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
                              <Check className="size-3 text-emerald-500" />
                              Approved &amp; Purged
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            {req.status === "pending" ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleRestore(req)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 cursor-pointer transition shadow-2xs"
                                  title="Restore user account to active status"
                                >
                                  <RotateCcw className="size-3.5 text-blue-500" />
                                  <span>Restore Account</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleApprove(req)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-xs cursor-pointer transition"
                                  title="Permanently purge user account and all data"
                                >
                                  <Trash2 className="size-3.5" />
                                  <span>Approve &amp; Purge Data</span>
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400 dark:text-zinc-500 font-semibold italic">
                                Action Completed
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDeletionRequests;

