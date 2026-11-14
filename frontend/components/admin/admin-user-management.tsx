"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserPlus,
  Trash2,
  Eye,
  Edit3,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  ShieldCheck,
  Mail,
  Calendar,
  Database,
  Download,
  KeyRound,
  RefreshCw,
  X,
  UserCheck,
  UserX,
  FileSpreadsheet,
  Activity,
  MoreVertical,
  Check,
  Clock,
  RotateCcw,
} from "lucide-react";
import {
  useAuth,
  getAccountDeletionRequests,
  approveAccountDeletionRequest,
  rejectAccountDeletionRequest,
  EVENT_DELETION_REQUESTS_CHANGED,
} from "@/lib/auth";
import { adminApi, BackendUser } from "@/lib/api";

const AVATAR_COLORS = ["bg-blue-600", "bg-purple-600", "bg-emerald-600", "bg-amber-600", "bg-teal-600", "bg-indigo-600"];

/** Map GET /admin/users rows to the ManagedUser model used by this screen */
function mapBackendUser(u: BackendUser, previous?: ManagedUser): ManagedUser {
  return {
    id: String(u.id),
    name: previous?.name || u.username,
    username: u.username,
    email: u.email,
    role: u.role === "admin" ? "admin" : "user",
    status: previous?.status || "active",
    joinedDate: previous?.joinedDate || "-",
    lastActive: previous?.lastActive || "-",
    datasetsCount: previous?.datasetsCount || 0,
    avatarBg: previous?.avatarBg || AVATAR_COLORS[u.id % AVATAR_COLORS.length],
    deletionReason: previous?.deletionReason,
    deletionRequestedAt: previous?.deletionRequestedAt,
  };
}

export interface ManagedUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "admin" | "user";
  status: "active" | "suspended" | "deletion_requested";
  joinedDate: string;
  lastActive: string;
  datasetsCount: number;
  avatarBg: string;
  deletionReason?: string;
  deletionRequestedAt?: string;
}

// ==============================================================================
// 🟢 START DEMO / SIMULATION CODE [Will be replaced with backend API integration]
// Mock users storage key & initial demo dataset
// ==============================================================================
const STORAGE_KEY_ADMIN_USERS = "datanarrator_admin_managed_users";

const INITIAL_USERS: ManagedUser[] = [
  {
    id: "usr-001",
    name: "System Administrator",
    username: "admin",
    email: "admin@datanarrator.ai",
    role: "admin",
    status: "active",
    joinedDate: "2024-01-10",
    lastActive: "Just now",
    datasetsCount: 24,
    avatarBg: "bg-amber-500",
  },
  {
    id: "usr-002",
    name: "Shahad Saif",
    username: "shahad_saif",
    email: "shahad.saif@example.com",
    role: "user",
    status: "active",
    joinedDate: "2024-02-14",
    lastActive: "15 minutes ago",
    datasetsCount: 12,
    avatarBg: "bg-blue-600",
  },
  {
    id: "usr-003",
    name: "Rayan Al-Harbi",
    username: "rayan_h",
    email: "rayan.harbi@analytics.sa",
    role: "user",
    status: "active",
    joinedDate: "2024-02-28",
    lastActive: "3 hours ago",
    datasetsCount: 19,
    avatarBg: "bg-emerald-600",
  },
  {
    id: "usr-004",
    name: "Nora Al-Otaibi",
    username: "nora_otb",
    email: "nora.otaibi@company.com",
    role: "user",
    status: "active",
    joinedDate: "2024-03-01",
    lastActive: "Yesterday",
    datasetsCount: 7,
    avatarBg: "bg-purple-600",
  },
  {
    id: "usr-005",
    name: "Mona Al-Shehri",
    username: "mona_sh",
    email: "mona.shehri@cloudtech.sa",
    role: "user",
    status: "suspended",
    joinedDate: "2024-03-18",
    lastActive: "2 weeks ago",
    datasetsCount: 1,
    avatarBg: "bg-slate-600",
  },
];
// ==============================================================================
// 🔴 END DEMO / SIMULATION CODE
// ==============================================================================

export function AdminUserManagement({ onNavigateToRequests }: { onNavigateToRequests?: () => void } = {}) {
  const { profile } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals state
  const [viewingUser, setViewingUser] = useState<ManagedUser | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);
  const [reviewingDeletionUser, setReviewingDeletionUser] = useState<ManagedUser | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ==============================================================================
  // 🟢 START DEMO / SIMULATION CODE [Will be replaced with backend API integration]
  // Load from localStorage or use defaults, and overlay pending deletion requests
  // In real backend, this will be an API fetch (e.g. GET /api/admin/users)
  // ==============================================================================
  // Backend: GET /admin/users
  const loadBackendUsers = () =>
    adminApi.listUsers().then(({ users: list }) => {
      setUsers((prev) => {
        const byId = new Map(prev.map((u) => [u.id, u]));
        return list.map((u) => mapBackendUser(u, byId.get(String(u.id))));
      });
    });

  useEffect(() => {
    loadBackendUsers().catch((err) => {
      showToast(err?.message || "Could not load users from the server.", "error");
    });
  }, []);

  useEffect(() => {
    // Demo fallback disabled: users come from the backend (see loadBackendUsers)
    if (true) return;
    const loadAndSyncUsers = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_ADMIN_USERS);
        const baseList: ManagedUser[] = stored ? JSON.parse(stored) : INITIAL_USERS;

        // Cleanse old inactive records, remove Fahad, and normalize role to admin or user
        let migrated: ManagedUser[] = baseList
          .filter(
            (u) =>
              u.username !== "fahad_g" &&
              !u.name?.toLowerCase().includes("fahad")
          )
          .map((u) => ({
            ...u,
            role: (u.role === "admin" ? "admin" : "user") as ManagedUser["role"],
            status: (u.status as any) === "inactive" ? "suspended" : (u.status as ManagedUser["status"]),
          }));

        // Ensure Mona Al-Shehri exists as a suspended user example
        if (!migrated.some((u) => u.username === "mona_sh")) {
          const mona = INITIAL_USERS.find((u) => u.username === "mona_sh");
          if (mona) migrated.push(mona);
        }

        // Overlay deletion requests from shared storage
        const deletionReqs = getAccountDeletionRequests();
        const pendingMap = new Map(
          deletionReqs.filter((r) => r.status === "pending").map((r) => [r.username.toLowerCase(), r])
        );

        migrated = migrated.map((u) => {
          const pending = pendingMap.get(u.username.toLowerCase());
          if (pending) {
            return {
              ...u,
              status: "deletion_requested" as const,
              deletionReason: pending.reason,
              deletionRequestedAt: pending.requestedAt,
            };
          }
          if (u.status === "deletion_requested" && !pending) {
            return {
              ...u,
              status: "active" as const,
              deletionReason: undefined,
              deletionRequestedAt: undefined,
            };
          }
          return u;
        });

        setUsers(migrated);
        localStorage.setItem(STORAGE_KEY_ADMIN_USERS, JSON.stringify(migrated));
      } catch {
        setUsers(INITIAL_USERS);
      }
    };

    loadAndSyncUsers();
    window.addEventListener(EVENT_DELETION_REQUESTS_CHANGED, loadAndSyncUsers);
    window.addEventListener("storage", loadAndSyncUsers);
    return () => {
      window.removeEventListener(EVENT_DELETION_REQUESTS_CHANGED, loadAndSyncUsers);
      window.removeEventListener("storage", loadAndSyncUsers);
    };
  }, []);
  // ==============================================================================
  // 🔴 END DEMO / SIMULATION CODE
  // ==============================================================================

  // Save changes to localStorage
  const updateUsers = (newUsers: ManagedUser[]) => {
    setUsers(newUsers);
    try {
      localStorage.setItem(STORAGE_KEY_ADMIN_USERS, JSON.stringify(newUsers));
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesStatus = statusFilter === "all" || u.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === "active").length;
    const admins = users.filter((u) => u.role === "admin").length;
    const suspended = users.filter((u) => u.status === "suspended").length;
    const deletionRequests = users.filter((u) => u.status === "deletion_requested").length;
    return { total, active, admins, suspended, deletionRequests };
  }, [users]);

  // Handle Deletion Requests Review
  const handleApproveDeletionRequest = (user: ManagedUser) => {
    approveAccountDeletionRequest(user.username);
    // DELETE /admin/users/:id
    adminApi.deleteUser(Number(user.id)).catch((err) => showToast(err?.message || "Delete failed.", "error"));
    const updated = users.filter((u) => u.id !== user.id);
    updateUsers(updated);
    setReviewingDeletionUser(null);
    if (viewingUser && viewingUser.id === user.id) {
      setViewingUser(null);
    }
    showToast(`Account deletion request for "${user.name}" approved. User and data removed.`, "success");
  };

  const handleRejectDeletionRequest = (user: ManagedUser) => {
    rejectAccountDeletionRequest(user.username);
    const updated = users.map((u) =>
      u.id === user.id
        ? { ...u, status: "active" as const, deletionReason: undefined, deletionRequestedAt: undefined }
        : u
    );
    updateUsers(updated);
    setReviewingDeletionUser(null);
    if (viewingUser && viewingUser.id === user.id) {
      setViewingUser({ ...viewingUser, status: "active", deletionReason: undefined, deletionRequestedAt: undefined });
    }
    showToast(`Deletion request for "${user.name}" declined. Account restored to active.`, "info");
  };

  // Handle Add User
  const handleAddUser = (newUser: Omit<ManagedUser, "id" | "joinedDate" | "lastActive" | "datasetsCount" | "avatarBg"> & { password?: string }) => {
    // POST /admin/users
    adminApi
      .addUser(newUser.username, newUser.email, newUser.password || "")
      .then((res: any) => {
        const created = mapBackendUser(res.user, {
          ...(newUser as any),
          joinedDate: new Date().toISOString().split("T")[0],
          lastActive: "Just now",
          datasetsCount: 0,
          avatarBg: AVATAR_COLORS[Number(res.user?.id || 0) % AVATAR_COLORS.length],
        });
        setUsers((prev) => [created, ...prev.filter((u) => u.id !== created.id)]);
        setIsAddModalOpen(false);
        showToast(`User account "${created.name}" created successfully!`, "success");
      })
      .catch((err) => showToast(err?.message || "User could not be created.", "error"));
  };

  // Previous local-only implementation (kept for reference)
  const handleAddUserLocal = (newUser: Omit<ManagedUser, "id" | "joinedDate" | "lastActive" | "datasetsCount" | "avatarBg">) => {
    const exists = users.some(
      (u) => u.username.toLowerCase() === newUser.username.toLowerCase() || u.email.toLowerCase() === newUser.email.toLowerCase()
    );
    if (exists) {
      showToast("Username or email address is already registered!", "error");
      return;
    }

    const colors = ["bg-blue-600", "bg-purple-600", "bg-emerald-600", "bg-amber-600", "bg-teal-600", "bg-indigo-600"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const created: ManagedUser = {
      ...newUser,
      id: `usr-${String(users.length + 1).padStart(3, "0")}`,
      joinedDate: new Date().toISOString().split("T")[0],
      lastActive: "Just now",
      datasetsCount: 0,
      avatarBg: randomColor,
    };

    const updated = [created, ...users];
    updateUsers(updated);
    setIsAddModalOpen(false);
    showToast(`User account "${created.name}" created successfully!`, "success");
  };

  // Handle Edit User
  const handleSaveEdit = (edited: ManagedUser) => {
    const updated = users.map((u) => (u.id === edited.id ? edited : u));
    updateUsers(updated);
    setEditingUser(null);
    if (viewingUser && viewingUser.id === edited.id) {
      setViewingUser(edited);
    }
    showToast(`User details for "${edited.name}" updated successfully!`, "success");
  };

  // Handle Delete User
  const handleConfirmDelete = () => {
    if (!userToDelete) return;

    if (userToDelete.username === "admin") {
      showToast("Cannot delete the primary root system administrator!", "error");
      setUserToDelete(null);
      return;
    }

    // DELETE /admin/users/:id
    const target = userToDelete;
    setUserToDelete(null);
    adminApi
      .deleteUser(Number(target.id))
      .then(() => {
        const updated = users.filter((u) => u.id !== target.id);
        updateUsers(updated);
        if (viewingUser && viewingUser.id === target.id) {
          setViewingUser(null);
        }
        showToast(`User account "${target.name}" permanently deleted!`, "success");
      })
      .catch((err) => showToast(err?.message || "User could not be deleted.", "error"));
  };

  // Toggle user status quickly (active / suspended)
  const handleToggleStatus = (user: ManagedUser) => {
    if (user.username === "admin") {
      showToast("Cannot suspend the root administrator account!", "error");
      return;
    }
    const nextStatus = user.status === "active" ? "suspended" : "active";
    const updated = users.map((u) => (u.id === user.id ? { ...u, status: nextStatus as ManagedUser["status"] } : u));
    updateUsers(updated);
    if (viewingUser && viewingUser.id === user.id) {
      setViewingUser({ ...viewingUser, status: nextStatus as ManagedUser["status"] });
    }
    showToast(`User status for "${user.name}" changed to ${nextStatus}.`, "info");
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = "ID,Name,Username,Email,Role,Status,JoinedDate,DatasetsCount\n";
    const rows = users
      .map((u) => `"${u.id}","${u.name}","${u.username}","${u.email}","${u.role}","${u.status}","${u.joinedDate}",${u.datasetsCount}`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `datanarrator_users_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Users list exported to CSV successfully!", "success");
  };

  return (
    <div className="relative z-10 flex-1 flex flex-col transition-colors text-left">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-semibold transition-all transform animate-in fade-in slide-in-from-bottom-4 ${
            toastMessage.type === "success"
              ? "bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20"
              : toastMessage.type === "error"
              ? "bg-rose-500 text-white border-rose-600 shadow-rose-500/20"
              : "bg-[#4a7ff7] text-white border-blue-600 shadow-blue-500/20"
          }`}
        >
          {toastMessage.type === "success" && <CheckCircle2 className="w-5 h-5 shrink-0" />}
          {toastMessage.type === "error" && <AlertTriangle className="w-5 h-5 shrink-0" />}
          {toastMessage.type === "info" && <Shield className="w-5 h-5 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header Bar matching user WorkspaceHeader */}
      <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/80 px-8 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Admin Portal / User Management
          </span>
          <span className="text-slate-300 dark:text-zinc-700">&bull;</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#4a7ff7]/10 text-[#4a7ff7] dark:bg-[#4a7ff7]/20 dark:text-[#6ba1ff]">
            <Users className="w-3 h-3" />
            <span>5 Accounts</span>
          </span>
        </div>

        {/* Action Buttons: Add user & Export */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 cursor-pointer transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#4a7ff7] hover:bg-[#3870ec] active:scale-95 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add New User</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Quick Stats Grid matching user cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-700 bg-white/75 dark:bg-[#22252c]/90 p-5 shadow-sm backdrop-blur-md flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Total Accounts</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-100 mt-1">{stats.total}</h3>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Registered platform users</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#4a7ff7] border border-blue-100 dark:border-blue-900/40">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-700 bg-white/75 dark:bg-[#22252c]/90 p-5 shadow-sm backdrop-blur-md flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Active Accounts</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-100 mt-1">{stats.active}</h3>
              <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">Ready & authenticated</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-700 bg-white/75 dark:bg-[#22252c]/90 p-5 shadow-sm backdrop-blur-md flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Administrators</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-100 mt-1">{stats.admins}</h3>
              <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">Full privilege roles</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-700 bg-white/75 dark:bg-[#22252c]/90 p-5 shadow-sm backdrop-blur-md flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">Suspended Accounts</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-100 mt-1">{stats.suspended}</h3>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Platform access restricted</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40">
              <UserX className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Pending Deletion Requests Alert Banner */}
        {stats.deletionRequests > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs shrink-0">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <span>{stats.deletionRequests} Account Deletion {stats.deletionRequests === 1 ? "Request" : "Requests"} Pending Approval</span>
                  <span className="size-2 rounded-full bg-amber-500 animate-ping" />
                </h4>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5">
                  Users have submitted account deletion requests. Review their reason and approve or decline.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onNavigateToRequests || (() => setStatusFilter("deletion_requested"))}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold shadow-xs cursor-pointer transition self-start sm:self-auto shrink-0"
            >
              <span>Go to Deletion Requests ({stats.deletionRequests})</span>
            </button>
          </div>
        )}

        {/* Filter and Search Bar matching user cards */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-700 bg-white/75 dark:bg-[#22252c]/90 p-4 shadow-sm backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search box */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or username..."
              className="w-full pr-4 pl-10 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7ff7] dark:focus:ring-blue-500 text-slate-800 dark:text-zinc-100 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role and Status Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-semibold">
              <Filter className="w-3.5 h-3.5" />
              <span>Role:</span>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#4a7ff7] cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrator (Admin)</option>
              <option value="user">Standard User</option>
            </select>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-semibold ml-2">
              <span>Status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#4a7ff7] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="deletion_requested">
                Deletion Requested {stats.deletionRequests > 0 ? `(${stats.deletionRequests})` : ""}
              </option>
            </select>

            {(searchQuery || roleFilter !== "all" || statusFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setRoleFilter("all");
                  setStatusFilter("all");
                }}
                className="text-xs text-[#4a7ff7] hover:underline font-semibold cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Users Table Card matching user workspace */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-700 bg-white/75 dark:bg-[#22252c]/90 shadow-sm backdrop-blur-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 dark:bg-zinc-800/60 border-b border-slate-200/80 dark:border-zinc-700 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">User Account</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Datasets</th>
                  <th className="py-3.5 px-6">Joined Date</th>
                  <th className="py-3.5 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/70">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-zinc-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-slate-300 dark:text-zinc-600" />
                        <p className="font-semibold">No accounts found matching your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const initials = user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase();

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        {/* User Avatar + Info */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`size-10 rounded-full ${user.avatarBg} text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0`}
                            >
                              {initials}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                {user.name}
                                {user.username === "admin" && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    Root Admin
                                  </span>
                                )}
                              </span>
                              <span className="text-xs text-slate-400 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-slate-500 dark:text-zinc-500">@{user.username}</span>
                                <span>&bull;</span>
                                <span>{user.email}</span>
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-4 px-6">
                          {user.role === "admin" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20">
                              <ShieldCheck className="w-3 h-3" />
                              Administrator
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#4a7ff7]/10 text-[#4a7ff7] dark:bg-[#4a7ff7]/20 dark:text-[#6ba1ff] border border-[#4a7ff7]/20">
                              <Users className="w-3 h-3" />
                              Standard User
                            </span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-6">
                          {user.status === "active" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          ) : user.status === "deletion_requested" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs">
                              <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
                              Deletion Requested
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
                              <span className="size-1.5 rounded-full bg-rose-500" />
                              Suspended
                            </span>
                          )}
                        </td>

                        {/* Datasets Count */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-zinc-300">
                            <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                            <span>{user.datasetsCount} datasets</span>
                          </div>
                        </td>

                        {/* Joined Date */}
                        <td className="py-4 px-6 text-xs text-slate-500 dark:text-zinc-400">
                          <div className="flex flex-col">
                            <span className="font-semibold">{user.joinedDate}</span>
                            <span className="text-[11px] text-slate-400 dark:text-zinc-500">Last active: {user.lastActive}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Special: Review Deletion Request Button */}
                            {user.status === "deletion_requested" && (
                              <button
                                type="button"
                                onClick={() => setReviewingDeletionUser(user)}
                                title="Review Deletion Request"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold shadow-2xs cursor-pointer transition mr-1"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Review Request</span>
                              </button>
                            )}

                            {/* 1. View User Details */}
                            <button
                              type="button"
                              onClick={() => setViewingUser(user)}
                              title="View Account Details"
                              className="p-2 rounded-xl text-slate-600 hover:text-[#4a7ff7] hover:bg-blue-50 dark:text-zinc-400 dark:hover:text-[#5aa7dc] dark:hover:bg-blue-950/40 transition cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* 2. Edit User */}
                            <button
                              type="button"
                              onClick={() => setEditingUser(user)}
                              title="Edit User Account"
                              className="p-2 rounded-xl text-slate-600 hover:text-amber-600 hover:bg-amber-50 dark:text-zinc-400 dark:hover:text-amber-400 dark:hover:bg-amber-950/40 transition cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* 3. Delete User Account */}
                            <button
                              type="button"
                              onClick={() => setUserToDelete(user)}
                              disabled={user.username === "admin"}
                              title={user.username === "admin" ? "Root Administrator account cannot be deleted" : "Delete User Account"}
                              className={`p-2 rounded-xl transition cursor-pointer ${
                                user.username === "admin"
                                  ? "text-slate-300 dark:text-zinc-700 cursor-not-allowed opacity-40"
                                  : "text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer matching user card footer */}
          <div className="p-4 bg-slate-50/50 dark:bg-zinc-800/40 border-t border-slate-200/80 dark:border-zinc-700 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
            <span>
              Showing <strong className="text-slate-800 dark:text-zinc-200">{filteredUsers.length}</strong> of{" "}
              <strong className="text-slate-800 dark:text-zinc-200">{users.length}</strong> users
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px]">Synced & persisted locally</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. View User Details Modal                                                 */}
      {/* ========================================================================= */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#1e2127] border border-slate-200 dark:border-zinc-700/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-6">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setViewingUser(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* User Header Profile */}
            <div className="flex items-center gap-4">
              <div
                className={`size-16 rounded-2xl ${viewingUser.avatarBg} text-white font-black text-xl flex items-center justify-center shadow-lg shrink-0`}
              >
                {viewingUser.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()}
              </div>
              <div className="flex flex-col">
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  {viewingUser.name}
                  {viewingUser.username === "admin" && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      System Admin
                    </span>
                  )}
                </h3>
                <span className="text-sm font-mono text-[#4a7ff7] mt-0.5">@{viewingUser.username}</span>
                <span className="text-xs text-slate-400 dark:text-zinc-500">{viewingUser.email}</span>
              </div>
            </div>

            {/* Profile Information Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500">Account ID</span>
                <p className="text-sm font-mono font-bold text-slate-800 dark:text-zinc-200 mt-1">{viewingUser.id}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500">Assigned Role</span>
                <p className="text-sm font-bold text-slate-800 dark:text-zinc-200 mt-1 uppercase">{viewingUser.role}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500">Account Status</span>
                <div className="mt-1">
                  {viewingUser.status === "active" ? (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active & Verified
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Suspended
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500">Uploaded Datasets</span>
                <p className="text-sm font-bold text-[#4a7ff7] mt-1">{viewingUser.datasetsCount} Datasets</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500">Registration Date</span>
                <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 mt-1">{viewingUser.joinedDate}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500">Last Recorded Activity</span>
                <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 mt-1">{viewingUser.lastActive}</p>
              </div>
            </div>

            {/* Quick Actions in View Modal */}
            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleToggleStatus(viewingUser)}
                disabled={viewingUser.username === "admin"}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-bold transition disabled:opacity-40 cursor-pointer text-slate-700 dark:text-zinc-200"
              >
                {viewingUser.status === "active" ? "Suspend Account" : "Activate Account"}
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = viewingUser;
                  setViewingUser(null);
                  setEditingUser(target);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#4a7ff7] hover:bg-[#3870ec] text-white text-xs font-bold transition cursor-pointer"
              >
                Edit Account
              </button>

              {viewingUser.username !== "admin" && (
                <button
                  type="button"
                  onClick={() => {
                    const target = viewingUser;
                    setViewingUser(null);
                    setUserToDelete(target);
                  }}
                  className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                  title="Delete Account"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. Add New User Account Modal                                              */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <AddUserModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddUser}
        />
      )}

      {/* ========================================================================= */}
      {/* 3. Edit User Account Modal                                                */}
      {/* ========================================================================= */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* ========================================================================= */}
      {/* 5. Review Deletion Request Modal                                           */}
      {/* ========================================================================= */}
      {reviewingDeletionUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in text-left">
          <div className="bg-white dark:bg-[#1e2127] border border-amber-200 dark:border-amber-900/60 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-zinc-800 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 shadow-2xs">
                  <AlertTriangle className="size-5.5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Account Deletion Request
                  </h3>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    Submitted by User &bull; Pending Admin Decision
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReviewingDeletionUser(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="size-4.5" />
              </button>
            </div>

            {/* User summary details */}
            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-700/80 bg-slate-50 dark:bg-zinc-800/60 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-zinc-400 font-medium">User Account:</span>
                <span className="font-bold text-slate-900 dark:text-zinc-100">
                  {reviewingDeletionUser.name} (<span className="font-mono text-[#4a7ff7]">@{reviewingDeletionUser.username}</span>)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-zinc-400 font-medium">Email Address:</span>
                <span className="font-mono text-slate-700 dark:text-zinc-300">{reviewingDeletionUser.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-zinc-400 font-medium">Stored Datasets:</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">{reviewingDeletionUser.datasetsCount} datasets</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-zinc-400 font-medium">Requested On:</span>
                <span className="font-semibold text-slate-700 dark:text-zinc-300">
                  {reviewingDeletionUser.deletionRequestedAt ? new Date(reviewingDeletionUser.deletionRequestedAt).toLocaleDateString() : "Recently"}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-700/60">
                <span className="text-slate-500 dark:text-zinc-400 font-medium block mb-1">Stated Reason:</span>
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-700/80 text-slate-800 dark:text-zinc-200 font-medium">
                  {reviewingDeletionUser.deletionReason || "User requested account closure via Settings"}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
              <AlertTriangle className="size-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <p className="text-[11px] leading-relaxed">
                Approving this request will immediately delete the user profile, revoke credentials, and wipe all associated datasets from the servers.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setReviewingDeletionUser(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRejectDeletionRequest(reviewingDeletionUser)}
                className="px-4 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 text-xs font-bold text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 cursor-pointer transition"
              >
                Decline &amp; Restore Active
              </button>
              <button
                type="button"
                onClick={() => handleApproveDeletionRequest(reviewingDeletionUser)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white cursor-pointer transition shadow-sm"
              >
                <Trash2 className="size-3.5" />
                <span>Approve &amp; Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Component: Add User Modal (Add New User)
// -----------------------------------------------------------------------------
function AddUserModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: Omit<ManagedUser, "id" | "joinedDate" | "lastActive" | "datasetsCount" | "avatarBg"> & { password?: string }) => void;
}) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ManagedUser["role"]>("user");
  const [status, setStatus] = useState<ManagedUser["status"]>("active");
  const [tempPassword, setTempPassword] = useState("Temp#Pass2026");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !email.trim()) {
      setError("Please fill out all required fields.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }

    onAdd({
      name: name.trim(),
      username: username.trim().toLowerCase().replace(/\s+/g, "_"),
      email: email.trim().toLowerCase(),
      role,
      status,
      password: tempPassword,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in text-left">
      <div className="bg-white dark:bg-[#1e2127] border border-slate-200 dark:border-zinc-700/80 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#4a7ff7]">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Add New User Account</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500">Create an account and assign roles</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Reem Al-Otaibi"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7ff7] text-slate-800 dark:text-zinc-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                Username *
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="reem_otb"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7ff7] text-slate-800 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as ManagedUser["role"])}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4a7ff7] text-slate-800 dark:text-zinc-100 cursor-pointer"
              >
                <option value="user">Standard User</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="reem@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7ff7] text-slate-800 dark:text-zinc-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                Account Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ManagedUser["status"])}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4a7ff7] text-slate-800 dark:text-zinc-100 cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                Temporary Password
              </label>
              <input
                type="text"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-mono focus:outline-none text-slate-800 dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#4a7ff7] hover:bg-[#3870ec] active:scale-95 text-white text-xs font-bold shadow-md shadow-[#4a7ff7]/25 transition cursor-pointer"
            >
              Save & Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Component: Edit User Modal
// -----------------------------------------------------------------------------
function EditUserModal({
  user,
  isOpen,
  onClose,
  onSave,
}: {
  user: ManagedUser;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: ManagedUser) => void;
}) {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState<ManagedUser["role"]>(user.role);
  const [status, setStatus] = useState<ManagedUser["status"]>(user.status);
  const [email, setEmail] = useState(user.email);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...user,
      name: name.trim(),
      email: email.trim(),
      role,
      status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in text-left">
      <div className="bg-white dark:bg-[#1e2127] border border-slate-200 dark:border-zinc-700/80 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Edit User Account</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500">@{user.username}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7ff7] text-slate-800 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7ff7] text-slate-800 dark:text-zinc-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                Role
              </label>
              <select
                value={role}
                disabled={user.username === "admin"}
                onChange={(e) => setRole(e.target.value as ManagedUser["role"])}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4a7ff7] text-slate-800 dark:text-zinc-100 cursor-pointer disabled:opacity-50"
              >
                <option value="user">Standard User</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                Account Status
              </label>
              <select
                value={status}
                disabled={user.username === "admin"}
                onChange={(e) => setStatus(e.target.value as ManagedUser["status"])}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4a7ff7] text-slate-800 dark:text-zinc-100 cursor-pointer disabled:opacity-50"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-amber-600/25 transition cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
