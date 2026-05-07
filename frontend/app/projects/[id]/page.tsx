"use client";
import { AppShell } from "@/components/layout/AppShell";
import {
  FolderKanban, ArrowLeft, Calendar, Users, CheckCircle2, Clock,
  AlertCircle, Plus, Edit, Trash2, Search, Target, Layout,
  User, UserPlus, Flag, X, MoreHorizontal, TrendingUp, ChevronRight,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import {
  SideDrawer, DrawerSelect,
} from "@/components/ui/SideDrawer";
import { TaskDrawer } from "@/components/tasks/TaskDrawer";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useProjectDetails, useProjectTasks, useCreateTask, useUpdateTask, useDeleteTask, useUsers,
} from "@/hooks/useData";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import api from "@/lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { cls: string; icon: any; label: string }> = {
  DONE:        { cls: "bg-success/10 text-success",    icon: CheckCircle2, label: "Done" },
  IN_PROGRESS: { cls: "bg-primary/10 text-primary",    icon: Clock,        label: "In Progress" },
  TODO:        { cls: "bg-[#f1f3f5] text-[#6c757d]",  icon: AlertCircle,  label: "To Do" },
};

const PRIORITY_CONFIG: Record<string, { cls: string; dot: string }> = {
  URGENT: { cls: "bg-danger/10 text-danger",   dot: "bg-danger" },
  HIGH:   { cls: "bg-warning/10 text-warning", dot: "bg-warning" },
  MEDIUM: { cls: "bg-primary/10 text-primary", dot: "bg-primary" },
  LOW:    { cls: "bg-success/10 text-success", dot: "bg-success" },
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// Deterministic color per project member
const AVATAR_COLORS = [
  "bg-violet-100 text-violet-600",
  "bg-blue-100 text-blue-600",
  "bg-emerald-100 text-emerald-600",
  "bg-amber-100 text-amber-600",
  "bg-rose-100 text-rose-600",
  "bg-cyan-100 text-cyan-600",
];
function avatarColor(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n += id.charCodeAt(i);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProjectSkeleton() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1400px] px-6 py-8 space-y-6">
        <Skeleton className="h-6 w-28 rounded-lg" />
        <Skeleton className="h-52 rounded-3xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Skeleton className="lg:col-span-8 h-96 rounded-3xl" />
          <Skeleton className="lg:col-span-4 h-96 rounded-3xl" />
        </div>
      </div>
    </AppShell>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl bg-white/70 px-4 py-3 backdrop-blur-sm border border-white/80 shadow-sm">
      <span className={`text-lg font-extrabold ${color}`}>{value}</span>
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#adb5bd]">{label}</span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { isAdmin, user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isMemberDrawerOpen, setIsMemberDrawerOpen] = useState(false);
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<any>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const { data: project, isLoading: projectLoading } = useProjectDetails(id);
  const { data: tasks, isLoading: tasksLoading } = useProjectTasks(id);
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const { data: usersData, isLoading: usersLoading } = useUsers();

  const canManage = isAdmin || project?.adminId === user?.id;

  const addMemberMutation = useMutation({
    mutationFn: async (values: any) => {
      const resp = await api.post(`/projects/${id}/members`, { userId: values.userId });
      return resp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      setIsMemberDrawerOpen(false);
      toast.success("Member invited successfully");
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to add member"),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const resp = await api.delete(`/projects/${id}/members/${userId}`);
      return resp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      setIsRemoveConfirmOpen(false);
      setMemberToRemove(null);
      toast.success("Member removed");
    },
    onError: () => toast.error("Failed to remove member"),
  });

  const allTasks = tasks?.data ?? [];
  const filteredTasks = useMemo(() => {
    return allTasks.filter((t: any) => {
      const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [allTasks, search, statusFilter]);

  async function handleTaskSubmit(values: any) {
    if (editingTask) {
      await updateMutation.mutateAsync({ id: editingTask.id, data: values });
      toast.success("Task updated");
    } else {
      await createMutation.mutateAsync({ ...values, projectId: id });
      toast.success("Task created");
    }
    queryClient.invalidateQueries({ queryKey: ["project-tasks", id] });
    setIsTaskDrawerOpen(false);
    setEditingTask(null);
  }

  async function handleTaskDelete() {
    if (!taskToDelete) return;
    deleteTaskMutation.mutate(taskToDelete, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["project-tasks", id] });
        setTaskToDelete(null);
        setIsDeleteConfirmOpen(false);
        toast.success("Task deleted");
      },
      onError: (e: any) => toast.error(e.response?.data?.message ?? "Delete failed"),
    });
  }

  if (projectLoading || tasksLoading || usersLoading) return <ProjectSkeleton />;

  const allUsers = usersData?.data ?? [];
  const existingMemberIds = new Set(project?.members?.map((m: any) => m.userId) || []);
  const nonMembers = allUsers.filter((u: any) => !existingMemberIds.has(u.id));
  const members = project?.members || [];

  const stats = {
    total: allTasks.length,
    done: allTasks.filter((t: any) => t.status === "DONE").length,
    inProgress: allTasks.filter((t: any) => t.status === "IN_PROGRESS").length,
    todo: allTasks.filter((t: any) => t.status === "TODO").length,
  };
  const rate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  const overdueCount = allTasks.filter((t: any) =>
    t.dueDate && t.status !== "DONE" && new Date(t.dueDate) < new Date()
  ).length;

  const owner = members.find((m: any) => m.userId === project?.adminId);

  return (
    <AppShell>
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">

        {/* ── Back ── */}
        <button
          onClick={() => router.push("/projects")}
          className="group mb-7 flex items-center gap-2 text-sm font-bold text-[#adb5bd] transition-colors hover:text-primary"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#eff2f7] bg-white shadow-sm transition-transform group-hover:-translate-x-0.5">
            <ArrowLeft size={15} />
          </span>
          Back to Projects
        </button>

        {/* ── Hero Card ── */}
        <div className="mb-7 overflow-hidden rounded-[28px] border border-[#eff2f7] bg-white shadow-sm">

          {/* Top gradient accent */}
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-info to-primary/50" />

          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">

              {/* Project identity */}
              <div className="flex items-start gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <FolderKanban size={28} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl font-extrabold tracking-tight text-[#343a40]">
                      {project?.name}
                    </h1>
                    <span className="rounded-lg bg-primary/10 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-primary">
                      {project?.status || "ACTIVE"}
                    </span>
                    {overdueCount > 0 && (
                      <span className="rounded-lg bg-danger/10 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-danger">
                        {overdueCount} Overdue
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 max-w-lg text-[13px] leading-relaxed text-[#6c757d]">
                    {project?.description || "No description set for this project."}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-bold text-[#adb5bd]">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={11} />
                      Started {new Date(project?.createdAt).toLocaleDateString()}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-[#dee2e6]" />
                    <span className="flex items-center gap-1.5">
                      <Users size={11} />
                      {members.length} member{members.length !== 1 ? "s" : ""}
                    </span>
                    {owner && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-[#dee2e6]" />
                        <span className="flex items-center gap-1.5">
                          <User size={11} />
                          {owner.user?.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* CTA buttons */}
              {canManage && (
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    onClick={() => setIsMemberDrawerOpen(true)}
                    className="flex items-center gap-2 rounded-2xl border border-[#eff2f7] bg-white px-4 py-2.5 text-[13px] font-bold text-[#343a40] shadow-sm transition-all hover:border-primary/30 hover:text-primary active:scale-[0.98]"
                  >
                    <UserPlus size={15} />
                    Invite
                  </button>
                  <button
                    onClick={() => { setEditingTask(null); setIsTaskDrawerOpen(true); }}
                    className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-[13px] font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98]"
                  >
                    <Plus size={15} />
                    New Task
                  </button>
                </div>
              )}
            </div>

            {/* Stat Pills + Progress */}
            <div className="mt-6 flex flex-col gap-4 border-t border-[#f1f3f5] pt-6 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex flex-wrap gap-3">
                <StatPill value={stats.todo}       label="To Do"       color="text-[#6c757d]" />
                <StatPill value={stats.inProgress}  label="In Progress" color="text-primary" />
                <StatPill value={stats.done}        label="Done"        color="text-success" />
                {overdueCount > 0 && (
                  <StatPill value={overdueCount} label="Overdue" color="text-danger" />
                )}
              </div>

              {/* Progress bar */}
              <div className="flex-1 min-w-[180px]">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#adb5bd]">Completion</span>
                  <span className="text-[12px] font-extrabold text-[#343a40]">{rate}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#f1f3f5]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-info transition-all duration-700"
                    style={{ width: `${rate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Overdue Alert ── */}
        {overdueCount > 0 && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3">
            <AlertCircle size={15} className="shrink-0 text-danger" />
            <p className="text-[13px] font-bold text-danger">
              <span className="font-extrabold">{overdueCount} task{overdueCount > 1 ? "s are" : " is"} overdue.</span>{" "}
              Review and update due dates.
            </p>
          </div>
        )}

        {/* ── Main 2-col layout ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">

          {/* ── Tasks Panel ── */}
          <div className="rounded-[28px] border border-[#eff2f7] bg-white shadow-sm overflow-hidden">

            {/* Header */}
            <div className="flex flex-wrap items-center gap-3 border-b border-[#f1f3f5] px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CheckCircle2 size={15} />
                </div>
                <span className="text-[14px] font-extrabold text-[#343a40]">Tasks</span>
                <span className="rounded-lg bg-[#f1f3f5] px-2 py-0.5 text-[10px] font-extrabold text-[#6c757d]">
                  {filteredTasks.length}
                  {filteredTasks.length !== allTasks.length && `/${allTasks.length}`}
                </span>
              </div>

              <div className="ml-auto flex items-center gap-2">
                {/* Status filter tabs */}
                <div className="flex rounded-xl border border-[#eff2f7] bg-[#f8f9fa] p-0.5">
                  {(["ALL", "TODO", "IN_PROGRESS", "DONE"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider transition-all ${
                        statusFilter === s
                          ? "bg-white text-[#343a40] shadow-sm"
                          : "text-[#adb5bd] hover:text-[#6c757d]"
                      }`}
                    >
                      {s === "IN_PROGRESS" ? "Active" : s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ")}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#adb5bd]" />
                  <input
                    type="text"
                    placeholder="Search…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 w-36 rounded-xl border border-[#eff2f7] bg-[#f8f9fa] pl-7 pr-3 text-[11px] font-medium outline-none transition-all focus:border-primary/40 focus:bg-white focus:w-48"
                  />
                </div>
              </div>
            </div>

            {/* Task rows */}
            <div className="divide-y divide-[#fafbfc]">
              {filteredTasks.map((t: any) => {
                const st = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.TODO;
                const pc = PRIORITY_CONFIG[t.priority] ?? PRIORITY_CONFIG.MEDIUM;
                const overdue = t.dueDate && t.status !== "DONE" && new Date(t.dueDate) < new Date();
                return (
                  <div
                    key={t.id}
                    className="group flex cursor-pointer items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[#fafbfc]"
                    onClick={() => router.push(`/tasks/${t.id}`)}
                  >
                    {/* Status icon */}
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${st.cls}`}>
                      <st.icon size={13} />
                    </div>

                    {/* Title + meta */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-extrabold text-[#343a40] group-hover:text-primary transition-colors">
                        {t.title}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2.5 text-[10px] font-bold text-[#adb5bd]">
                        {t.assignedTo && (
                          <span className="flex items-center gap-1">
                            <User size={9} />
                            {t.assignedTo.name}
                          </span>
                        )}
                        {t.dueDate && (
                          <span className={`flex items-center gap-1 ${overdue ? "text-danger" : ""}`}>
                            <Calendar size={9} />
                            {overdue && "⚠ "}{fmt(t.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Priority badge */}
                    <span className={`hidden sm:flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${pc.cls}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${pc.dot}`} />
                      {t.priority}
                    </span>

                    {/* Actions */}
                    {canManage && (
                      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingTask(t); setIsTaskDrawerOpen(true); }}
                          className="rounded-lg p-1.5 text-[#adb5bd] transition-colors hover:bg-[#f1f3f5] hover:text-[#343a40]"
                          title="Edit"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setTaskToDelete(t.id); setIsDeleteConfirmOpen(true); }}
                          className="rounded-lg p-1.5 text-[#adb5bd] transition-colors hover:bg-danger/10 hover:text-danger"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Empty state */}
            {filteredTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1f3f5] text-[#ced4da]">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-[14px] font-extrabold text-[#343a40]">
                  {search || statusFilter !== "ALL" ? "No tasks match" : "No tasks yet"}
                </p>
                <p className="mt-1 text-[12px] text-[#adb5bd]">
                  {search || statusFilter !== "ALL"
                    ? "Try clearing your filters"
                    : "Create your first task to get started"}
                </p>
                {!search && statusFilter === "ALL" && canManage && (
                  <button
                    onClick={() => { setEditingTask(null); setIsTaskDrawerOpen(true); }}
                    className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-[12px] font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95"
                  >
                    <Plus size={13} />
                    Create Task
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Right Sidebar ── */}
          <div className="space-y-5">

            {/* Team Members */}
            <div className="rounded-[28px] border border-[#eff2f7] bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#f1f3f5] px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
                    <Users size={14} />
                  </div>
                  <span className="text-[14px] font-extrabold text-[#343a40]">Team</span>
                  <span className="rounded-lg bg-[#f1f3f5] px-2 py-0.5 text-[10px] font-extrabold text-[#6c757d]">
                    {members.length}
                  </span>
                </div>
                {canManage && (
                  <button
                    onClick={() => setIsMemberDrawerOpen(true)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/20 text-primary transition-all hover:bg-primary hover:text-white"
                  >
                    <Plus size={13} />
                  </button>
                )}
              </div>

              <div className="divide-y divide-[#f8f9fa]">
                {members.map((m: any) => {
                  const isOwner = m.userId === project?.adminId;
                  const color = avatarColor(m.userId);
                  return (
                    <div key={m.id} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[#fafbfc]">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold ${color}`}>
                        {initials(m.user?.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-bold text-[#343a40]">{m.user?.name}</p>
                        <p className="truncate text-[10px] text-[#adb5bd]">{m.user?.email}</p>
                      </div>
                      {isOwner ? (
                        <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-primary">
                          Owner
                        </span>
                      ) : canManage ? (
                        <button
                          onClick={() => { setMemberToRemove(m); setIsRemoveConfirmOpen(true); }}
                          className="shrink-0 rounded-lg p-1 text-[#adb5bd] opacity-0 transition-all hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
                        >
                          <X size={12} />
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {canManage && nonMembers.length > 0 && (
                <div className="border-t border-[#f1f3f5] p-4">
                  <button
                    onClick={() => setIsMemberDrawerOpen(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#dee2e6] py-2.5 text-[11px] font-bold text-[#adb5bd] transition-all hover:border-primary/40 hover:text-primary"
                  >
                    <UserPlus size={13} />
                    Invite a team member
                  </button>
                </div>
              )}
            </div>

            {/* Project Info */}
            <div className="rounded-[28px] border border-[#eff2f7] bg-white p-5 shadow-sm">
              <p className="mb-4 text-[10px] font-extrabold uppercase tracking-widest text-[#adb5bd]">Project Info</p>
              <div className="space-y-3.5">
                {[
                  { icon: Layout, label: "Status", value: project?.status || "ACTIVE" },
                  { icon: Calendar, label: "Created", value: new Date(project?.createdAt).toLocaleDateString() },
                  { icon: User, label: "Owner", value: owner?.user?.name || "—" },
                  { icon: Target, label: "Progress", value: `${stats.done}/${stats.total} tasks done` },
                  { icon: TrendingUp, label: "Completion", value: `${rate}%` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f8f9fa] text-[#adb5bd]">
                      <Icon size={12} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#adb5bd]">{label}</p>
                      <p className="text-[12px] font-bold text-[#343a40] truncate">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority breakdown mini chart */}
            {allTasks.length > 0 && (
              <div className="rounded-[28px] border border-[#eff2f7] bg-white p-5 shadow-sm">
                <p className="mb-4 text-[10px] font-extrabold uppercase tracking-widest text-[#adb5bd]">Priority Breakdown</p>
                <div className="space-y-2.5">
                  {(["URGENT", "HIGH", "MEDIUM", "LOW"] as const).map((p) => {
                    const count = allTasks.filter((t: any) => t.priority === p).length;
                    const pct = allTasks.length > 0 ? Math.round((count / allTasks.length) * 100) : 0;
                    const pc = PRIORITY_CONFIG[p];
                    return (
                      <div key={p}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider ${pc.cls.split(" ").filter(c => c.startsWith("text-")).join(" ")}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${pc.dot}`} />
                            {p}
                          </span>
                          <span className="text-[10px] font-bold text-[#adb5bd]">{count}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f1f3f5]">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${pc.dot}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Drawers & Modals ─── */}
        <SideDrawer
          isOpen={isMemberDrawerOpen}
          onClose={() => setIsMemberDrawerOpen(false)}
          title="Invite Member"
          subtitle="Add a collaborator to this project."
          formKey="invite-member"
          onSubmit={addMemberMutation.mutateAsync}
        >
          <DrawerSelect
            name="userId"
            label="Select User"
            placeholder="Search for a user..."
            isRequired
            options={nonMembers.map((u: any) => ({ label: `${u.name} (${u.email})`, value: u.id }))}
          />
        </SideDrawer>

        <TaskDrawer
          isOpen={isTaskDrawerOpen}
          onClose={() => { setIsTaskDrawerOpen(false); setEditingTask(null); }}
          editingTask={editingTask}
          fixedProjectId={id}
          onSubmit={handleTaskSubmit}
        />

        <ConfirmModal
          isOpen={isRemoveConfirmOpen}
          onClose={() => setIsRemoveConfirmOpen(false)}
          onConfirm={() => removeMemberMutation.mutate(memberToRemove?.userId)}
          title="Remove Member"
          message={`Remove ${memberToRemove?.user?.name} from this project?`}
          isLoading={removeMemberMutation.isPending}
        />

        <ConfirmModal
          isOpen={isDeleteConfirmOpen}
          onClose={() => { setIsDeleteConfirmOpen(false); setTaskToDelete(null); }}
          onConfirm={handleTaskDelete}
          title="Delete Task"
          message="This task will be permanently removed. This action cannot be undone."
          isLoading={deleteTaskMutation.isPending}
        />
      </div>
    </AppShell>
  );
}