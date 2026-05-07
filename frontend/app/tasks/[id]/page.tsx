"use client";
import { AppShell } from "@/components/layout/AppShell";
import {
  ArrowLeft,
  Calendar,
  Flag,
  Clock,
  Edit,
  Trash2,
  MessageSquare,
  ChevronRight,
  Target,
  History,
  CheckCircle2,
  AlertCircle,
  Zap,
  User2,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";
import { useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useDeleteTask, useUpdateTask } from "@/hooks/useData";
import { TaskDrawer } from "@/components/tasks/TaskDrawer";
import { useQueryClient } from "@tanstack/react-query";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<string, { cls: string; dot: string; label: string }> = {
  URGENT: { cls: "bg-danger/10 text-danger border-danger/30", dot: "bg-danger", label: "Urgent" },
  HIGH:   { cls: "bg-warning/10 text-warning border-warning/30", dot: "bg-warning", label: "High" },
  MEDIUM: { cls: "bg-primary/10 text-primary border-primary/30", dot: "bg-primary", label: "Medium" },
  LOW:    { cls: "bg-success/10 text-success border-success/30", dot: "bg-success", label: "Low" },
};

const STATUS_CONFIG: Record<string, { cls: string; icon: any; label: string; ring: string }> = {
  DONE:        { cls: "bg-success text-white", icon: CheckCircle2, label: "Completed", ring: "ring-success/20" },
  IN_PROGRESS: { cls: "bg-primary text-white", icon: Clock,        label: "In Progress", ring: "ring-primary/20" },
  TODO:        { cls: "bg-[#f1f3f5] text-[#6c757d]", icon: AlertCircle, label: "To Do", ring: "ring-[#dee2e6]" },
};

function fmt(d: string | Date, style: "long" | "short" = "long") {
  return new Date(d).toLocaleDateString(undefined,
    style === "long"
      ? { month: "long", day: "numeric", year: "numeric" }
      : { month: "short", day: "numeric" }
  );
}

function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function isOverdue(dueDate: string, status: string) {
  return status !== "DONE" && new Date(dueDate) < new Date();
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TaskSkeleton() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1100px] px-4 py-8">
        <Skeleton className="mb-8 h-8 w-28 rounded-xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            <Skeleton className="h-72 rounded-3xl" />
            <Skeleton className="h-48 rounded-3xl" />
          </div>
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </div>
    </AppShell>
  );
}

// ─── Property Row ─────────────────────────────────────────────────────────────

function PropRow({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-[#f1f3f5] last:border-0">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f8f9fa] text-[#adb5bd]">
        <Icon size={13} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#adb5bd] mb-0.5">{label}</p>
        <div className="text-[13px] font-bold text-[#343a40]">{children}</div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TaskDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { isAdmin, user } = useAuth();
  const deleteMutation = useDeleteTask();
  const updateMutation = useUpdateTask();
  const queryClient = useQueryClient();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", id],
    queryFn: async () => {
      const resp = await api.get(`/tasks/${id}`);
      return resp.data;
    },
    enabled: !!id,
  });

  async function handleDelete() {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Task deleted");
        router.push("/tasks");
      },
      onError: (e: any) => toast.error(e.response?.data?.message ?? "Delete failed"),
    });
  }

  if (isLoading) return <TaskSkeleton />;

  const pCfg = PRIORITY_CONFIG[task?.priority] ?? PRIORITY_CONFIG.MEDIUM;
  const sCfg = STATUS_CONFIG[task?.status] ?? STATUS_CONFIG.TODO;
  const StatusIcon = sCfg.icon;
  const overdue = task?.dueDate && isOverdue(task.dueDate, task.status);
  const canManage = isAdmin || task?.project?.adminId === user?.id;

  return (
    <AppShell>
      <div className="mx-auto max-w-[1100px] px-4 py-8">

        {/* ── Top Nav ── */}
        <div className="mb-7 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-sm font-bold text-[#adb5bd] transition-colors hover:text-primary"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#eff2f7] bg-white shadow-sm transition-transform group-hover:-translate-x-0.5">
              <ArrowLeft size={15} />
            </span>
            Back
          </button>
          <nav className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#adb5bd]">
            <span className="cursor-pointer hover:text-[#343a40] transition-colors" onClick={() => router.push("/tasks")}>Tasks</span>
            <ChevronRight size={11} />
            <span className="text-[#343a40]">Details</span>
          </nav>
        </div>

        {/* ── Overdue Banner ── */}
        {overdue && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3">
            <AlertCircle size={15} className="shrink-0 text-danger" />
            <p className="text-[13px] font-bold text-danger">
              This task is <span className="font-extrabold">overdue</span> — was due {fmt(task.dueDate, "short")}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_290px]">

          {/* ── Left Column ── */}
          <div className="space-y-5">

            {/* Main Card */}
            <div className="rounded-3xl border border-[#eff2f7] bg-white shadow-sm overflow-hidden">

              {/* Color accent top strip based on priority */}
              <div className={`h-1 w-full ${
                task.priority === "URGENT" ? "bg-danger" :
                task.priority === "HIGH"   ? "bg-warning" :
                task.priority === "MEDIUM" ? "bg-primary" : "bg-success"
              }`} />

              <div className="p-7">
                {/* Badges row */}
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider ${pCfg.cls}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${pCfg.dot}`} />
                    {pCfg.label} Priority
                  </span>
                  <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider ring-2 ${sCfg.cls} ${sCfg.ring}`}>
                    <StatusIcon size={11} />
                    {sCfg.label}
                  </span>
                  <span className="ml-auto text-[10px] font-bold text-[#adb5bd] font-mono">
                    #{task.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>

                {/* Title */}
                <h1 className="mb-3 text-[28px] font-extrabold leading-tight tracking-tight text-[#343a40]">
                  {task.title}
                </h1>

                {/* Description */}
                <p className="text-[14px] leading-relaxed text-[#6c757d]">
                  {task.description || (
                    <span className="italic text-[#adb5bd]">No description provided for this task.</span>
                  )}
                </p>

                {/* Action buttons */}
                {canManage && (
                  <div className="mt-6 flex items-center gap-3 pt-5 border-t border-[#f1f3f5]">
                    <button
                      onClick={() => setIsDrawerOpen(true)}
                      className="flex items-center gap-2 rounded-xl border border-[#eff2f7] bg-white px-4 py-2.5 text-[13px] font-bold text-[#343a40] shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary active:scale-[0.98]"
                    >
                      <Edit size={14} />
                      Edit Task
                    </button>
                    <button
                      onClick={() => setIsConfirmOpen(true)}
                      className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/5 px-4 py-2.5 text-[13px] font-bold text-danger transition-all hover:bg-danger hover:text-white active:scale-[0.98]"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="rounded-3xl border border-[#eff2f7] bg-white p-7 shadow-sm">
              <h3 className="mb-6 flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-widest text-[#343a40]">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <History size={12} />
                </div>
                Activity Timeline
              </h3>

              <div className="relative space-y-0">
                {[
                  {
                    label: "Task created",
                    sub: `Created on ${fmt(task.createdAt, "short")}`,
                    icon: Zap,
                    color: "bg-primary",
                  },
                  task.assignedTo && {
                    label: `Assigned to ${task.assignedTo.name}`,
                    sub: "Team member notified",
                    icon: User2,
                    color: "bg-info",
                  },
                  task.status === "IN_PROGRESS" && {
                    label: "Moved to In Progress",
                    sub: `Updated ${fmt(task.updatedAt, "short")}`,
                    icon: Clock,
                    color: "bg-warning",
                  },
                  task.status === "DONE" && {
                    label: "Task completed ✓",
                    sub: `Completed on ${fmt(task.updatedAt, "short")}`,
                    icon: CheckCircle2,
                    color: "bg-success",
                  },
                ]
                  .filter(Boolean)
                  .map((event: any, i, arr) => (
                    <div key={i} className="relative flex gap-4 pb-6 last:pb-0">
                      {i < arr.length - 1 && (
                        <div className="absolute left-[11px] top-7 h-full w-0.5 bg-[#f1f3f5]" />
                      )}
                      <div className={`z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${event.color} text-white shadow-sm`}>
                        <event.icon size={11} />
                      </div>
                      <div className="pt-0.5">
                        <p className="text-[13px] font-bold text-[#343a40]">{event.label}</p>
                        <p className="mt-0.5 text-[11px] font-semibold text-[#adb5bd]">{event.sub}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Discussion */}
            <div className="rounded-3xl border border-[#eff2f7] bg-white p-7 shadow-sm">
              <h3 className="mb-5 flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-widest text-[#343a40]">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MessageSquare size={12} />
                </div>
                Discussion
              </h3>
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#eff2f7] py-10 text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f8f9fa] text-[#ced4da]">
                  <MessageSquare size={18} />
                </div>
                <p className="text-[13px] font-bold text-[#6c757d]">No comments yet</p>
                <p className="mt-1 text-[11px] text-[#adb5bd]">Collaboration coming soon.</p>
              </div>
            </div>
          </div>

          {/* ── Right Sidebar ── */}
          <div className="space-y-5">

            {/* Properties */}
            <div className="rounded-3xl border border-[#eff2f7] bg-white p-5 shadow-sm">
              <p className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-[#adb5bd]">Properties</p>

              <PropRow icon={Target} label="Project">
                {task.project ? (
                  <button
                    onClick={() => router.push(`/projects/${task.project.id}`)}
                    className="flex items-center gap-1.5 font-extrabold text-primary hover:underline"
                  >
                    {task.project.name}
                    <ExternalLink size={11} />
                  </button>
                ) : (
                  <span className="text-[#adb5bd]">—</span>
                )}
              </PropRow>

              <PropRow icon={Calendar} label="Due Date">
                {task.dueDate ? (
                  <span className={overdue ? "text-danger font-extrabold" : ""}>
                    {fmt(task.dueDate)}
                    {overdue && <span className="ml-1.5 text-[10px] bg-danger/10 text-danger px-1.5 py-0.5 rounded-md font-extrabold">Overdue</span>}
                  </span>
                ) : (
                  <span className="text-[#adb5bd]">No deadline</span>
                )}
              </PropRow>

              <PropRow icon={Flag} label="Priority">
                <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-[11px] font-extrabold ${pCfg.cls}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${pCfg.dot}`} />
                  {pCfg.label}
                </span>
              </PropRow>

              <PropRow icon={Clock} label="Created">
                {fmt(task.createdAt, "short")}
              </PropRow>
            </div>

            {/* Assignee Card */}
            <div className="rounded-3xl border border-[#eff2f7] bg-white p-5 shadow-sm">
              <p className="mb-4 text-[10px] font-extrabold uppercase tracking-widest text-[#adb5bd]">Assignee</p>
              {task.assignedTo ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-[13px] font-extrabold text-primary">
                    {initials(task.assignedTo.name)}
                  </div>
                  <div>
                    <p className="text-[14px] font-extrabold text-[#343a40]">{task.assignedTo.name}</p>
                    <p className="text-[11px] text-[#adb5bd]">{task.assignedTo.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-[#dee2e6] text-[#ced4da]">
                    <User2 size={18} />
                  </div>
                  <p className="text-[13px] font-bold text-[#adb5bd]">Unassigned</p>
                </div>
              )}
            </div>

            {/* Quick Status Widget */}
            <div className="rounded-3xl border border-[#eff2f7] bg-white p-5 shadow-sm">
              <p className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-[#adb5bd]">Status</p>
              <div className="flex flex-col gap-2">
                {(["TODO", "IN_PROGRESS", "DONE"] as const).map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  const Icon = cfg.icon;
                  const isActive = task.status === s;
                  return (
                    <div
                      key={s}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12px] font-bold transition-all ${
                        isActive
                          ? `${cfg.cls} ring-2 ${cfg.ring}`
                          : "bg-[#f8f9fa] text-[#adb5bd]"
                      }`}
                    >
                      <Icon size={13} />
                      {cfg.label}
                      {isActive && (
                        <span className="ml-auto text-[9px] font-extrabold uppercase tracking-widest opacity-70">Current</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Drawer */}
        <TaskDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          editingTask={task}
          onSubmit={async (values) => {
            await updateMutation.mutateAsync({ id, data: values });
            queryClient.invalidateQueries({ queryKey: ["task", id] });
            toast.success("Task updated");
            setIsDrawerOpen(false);
          }}
          formKeyPrefix="task-details"
        />

        <ConfirmModal
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleDelete}
          title="Delete Task"
          message="Are you sure you want to delete this task? This action cannot be undone."
          isLoading={deleteMutation.isPending}
        />
      </div>
    </AppShell>
  );
}