"use client";

import { AppShell } from "@/components/layout/AppShell";
import {
  CheckSquare,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  Flag,
  Edit,
  Trash2,
  Eye,
  Search,
  X,
  ChevronDown,
  Loader2,
  Layout,
} from "lucide-react";
import { useState, useMemo } from "react";
import {
  SideDrawer,
  DrawerInput,
  DrawerSelect,
  DrawerTextarea,
} from "@/components/ui/SideDrawer";
import { TaskDrawer } from "@/components/tasks/TaskDrawer";
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useProjects,
} from "@/hooks/useData";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Skeleton, TableRowSkeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
] as const;

const PRIORITY_STYLES: Record<string, string> = {
  URGENT: "bg-danger/10 text-danger",
  HIGH: "bg-warning/10 text-warning",
  MEDIUM: "bg-primary/10 text-primary",
  LOW: "bg-success/10 text-success",
};

const STATUS_STYLES: Record<string, { cls: string; icon: React.ReactNode }> = {
  DONE: {
    cls: "bg-success/10 text-success",
    icon: <CheckCircle2 size={13} />,
  },
  IN_PROGRESS: {
    cls: "bg-primary/10 text-primary",
    icon: <Clock size={13} />,
  },
  TODO: {
    cls: "bg-[#f1f3f5] text-[#6c757d]",
    icon: <AlertCircle size={13} />,
  },
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function isOverdue(dueDate: string | null, status: string) {
  if (!dueDate || status === "DONE") return false;
  return new Date(dueDate) < new Date();
}

// ─── Bulk Action Bar ──────────────────────────────────────────────────────────

function BulkBar({
  count,
  onClear,
  onBulkStatus,
  onBulkDelete,
  isLoading,
}: {
  count: number;
  onClear: () => void;
  onBulkStatus: (status: string) => void;
  onBulkDelete: () => void;
  isLoading: boolean;
}) {
  const [statusOpen, setStatusOpen] = useState(false);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 sm:px-4 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-2 whitespace-nowrap">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-extrabold text-white">
          {count}
        </div>
        <span className="text-[12px] sm:text-[13px] font-semibold text-primary">
          task{count !== 1 ? "s" : ""} selected
        </span>
      </div>

      <div className="mx-2 h-4 w-px bg-primary/20" />

      {/* Bulk status change */}
      <div className="relative">
        <button
          onClick={() => setStatusOpen((o) => !o)}
          className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#eff2f7] bg-white px-3 py-1.5 text-[12px] font-bold text-[#343a40] transition-all hover:border-primary/30 hover:text-primary"
        >
          Change Status
          <ChevronDown size={12} />
        </button>
        {statusOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-[#eff2f7] bg-white shadow-xl">
            {[
              { v: "TODO", l: "To Do" },
              { v: "IN_PROGRESS", l: "In Progress" },
              { v: "DONE", l: "Done" },
            ].map(({ v, l }) => (
              <button
                key={v}
                onClick={() => {
                  onBulkStatus(v);
                  setStatusOpen(false);
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-[#343a40] transition-colors hover:bg-[#f8f9fa] hover:text-primary"
              >
                {STATUS_STYLES[v].icon}
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onBulkDelete}
        disabled={isLoading}
        className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-danger/20 bg-danger/5 px-3 py-1.5 text-[12px] font-bold text-danger transition-all hover:bg-danger hover:text-white disabled:opacity-60"
      >
        {isLoading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Trash2 size={12} />
        )}
        Delete Selected
      </button>

      <button
        onClick={onClear}
        className="ml-auto rounded-lg p-1.5 text-[#adb5bd] transition-colors hover:text-[#343a40]"
      >
        <X size={15} />
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const router = useRouter();
  const { isAdmin, user } = useAuth();

  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [projectIdFilter, setProjectIdFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: tasks, isLoading } = useTasks({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    projectId: projectIdFilter || undefined,
  });
  const { data: projects } = useProjects();
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
  const [isBulkStatusLoading, setIsBulkStatusLoading] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (tasks?.data ?? []).filter(
      (t: any) =>
        t.title.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q)
    );
  }, [tasks, search]);

  // ── Selection helpers ──
  const allSelected =
    filtered.length > 0 && filtered.every((t: any) => selected.has(t.id));
  const someSelected = selected.size > 0;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((t: any) => t.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  // ── Bulk actions ──
  async function handleBulkStatus(status: string) {
    setIsBulkStatusLoading(true);
    try {
      await Promise.all(
        [...selected].map((id) => {
          const task = filtered.find((t: any) => t.id === id);
          return updateMutation.mutateAsync({ id, data: { ...task, status } });
        })
      );
      toast.success(`Updated ${selected.size} tasks to ${status.replace("_", " ")}`);
      setSelected(new Set());
    } catch {
      toast.error("Some updates failed");
    } finally {
      setIsBulkStatusLoading(false);
    }
  }

  async function handleBulkDelete() {
    try {
      await Promise.all(
        [...selected].map((id) => deleteMutation.mutateAsync(id))
      );
      toast.success(`Deleted ${selected.size} tasks`);
      setSelected(new Set());
      setIsBulkConfirmOpen(false);
    } catch {
      toast.error("Some deletions failed");
    }
  }

  // ── Single actions ──
  async function handleDrawerSubmit(values: any) {
    if (editingTask) {
      await updateMutation.mutateAsync({ id: editingTask.id, data: values });
      toast.success("Task updated");
    } else {
      await createMutation.mutateAsync(values);
      toast.success("Task created");
    }
    setIsDrawerOpen(false);
    setEditingTask(null);
  }

  function handleDelete() {
    if (!taskToDelete) return;
    deleteMutation.mutate(taskToDelete, {
      onSuccess: () => {
        toast.success("Task deleted");
        setIsConfirmOpen(false);
        setTaskToDelete(null);
      },
      onError: (e: any) => {
        toast.error(e.response?.data?.message ?? "Delete failed");
        setIsConfirmOpen(false);
      },
    });
  }

  function canEdit(task: any) {
    return isAdmin || task.project?.adminId === user?.id;
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-[1400px] px-4 py-8 space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
          <div className="rounded-2xl border border-[#e9ebec] bg-white overflow-hidden">
            <div className="h-12 bg-[#f8f9fa] border-b border-[#e9ebec]" />
            {[...Array(5)].map((_, i) => <TableRowSkeleton key={i} />)}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[1400px] px-4 py-8">

        {/* ── Header ── */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#343a40]">My Tasks</h1>
            <p className="mt-0.5 text-sm text-[#6c757d]">
              {filtered.length} task{filtered.length !== 1 ? "s" : ""}
              {search || statusFilter || priorityFilter ? " match your filters" : " total"}
            </p>
          </div>
          <button
            onClick={() => { 
              if (projects?.data?.length === 0) {
                toast.error("Please create a project first");
                router.push("/projects");
                return;
              }
              setEditingTask(null); 
              setIsDrawerOpen(true); 
            }}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 cursor-pointer"
          >
            <Plus size={17} />
            New Task
          </button>
        </div>

        {/* ── Filter Bar ── */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" />
            <input
              type="text"
              placeholder="Search tasks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-56 rounded-xl border border-[#eff2f7] bg-white pl-9 pr-3 text-sm outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/8"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#adb5bd] hover:text-[#343a40]"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status tabs */}
          <div className="flex items-center gap-1 rounded-xl border border-[#eff2f7] bg-white p-1">
            {STATUS_TABS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`rounded-lg px-3.5 py-1.5 text-[12px] font-bold transition-all ${
                  statusFilter === value
                    ? "bg-primary text-white shadow-sm shadow-primary/20"
                    : "text-[#6c757d] hover:bg-[#f8f9fa]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Priority select */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-9 rounded-xl border border-[#eff2f7] bg-white px-3 text-[12px] font-bold text-[#343a40] outline-none transition-all focus:border-primary/40 cursor-pointer"
          >
            <option value="">Any Priority</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Project select */}
          <select
            value={projectIdFilter}
            onChange={(e) => setProjectIdFilter(e.target.value)}
            className="h-9 max-w-[180px] rounded-xl border border-[#eff2f7] bg-white px-3 text-[12px] font-bold text-[#343a40] outline-none transition-all focus:border-primary/40 cursor-pointer"
          >
            <option value="">All Projects</option>
            {(projects?.data ?? []).map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Clear filters */}
          {(statusFilter || priorityFilter || projectIdFilter || search) && (
            <button
              onClick={() => { setStatusFilter(""); setPriorityFilter(""); setProjectIdFilter(""); setSearch(""); }}
              className="flex items-center gap-1.5 rounded-xl border border-[#eff2f7] bg-white px-3 py-1.5 text-[12px] font-bold text-[#6c757d] transition-all hover:border-danger/30 hover:text-danger"
            >
              <X size={12} />
              Clear
            </button>
          )}
        </div>

        {/* ── Bulk Action Bar ── */}
        {someSelected && (
          <BulkBar
            count={selected.size}
            onClear={() => setSelected(new Set())}
            onBulkStatus={handleBulkStatus}
            onBulkDelete={() => setIsBulkConfirmOpen(true)}
            isLoading={isBulkStatusLoading || deleteMutation.isPending}
          />
        )}

        {/* ── Table ── */}
        <div className="overflow-hidden rounded-2xl border border-[#eff2f7] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#eff2f7] bg-[#f8f9fa]">
                <tr>
                  <th className="w-10 px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="h-4 w-4 cursor-pointer rounded border-[#ced4da] accent-primary"
                    />
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#6c757d]">Task</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#6c757d]">Project</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#6c757d]">Status</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#6c757d]">Priority</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#6c757d]">Assignee</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#6c757d]">Due Date</th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#6c757d]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f5]">
                {filtered.map((task: any) => {
                  const isSelected = selected.has(task.id);
                  const overdue = isOverdue(task.dueDate, task.status);
                  const st = STATUS_STYLES[task.status] ?? STATUS_STYLES.TODO;

                  return (
                    <tr
                      key={task.id}
                      onClick={() => router.push(`/tasks/${task.id}`)}
                      className={`group transition-colors cursor-pointer ${
                        isSelected ? "bg-primary/5" : "hover:bg-[#f8f9fa]"
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(task.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 cursor-pointer rounded border-[#ced4da] accent-primary"
                        />
                      </td>

                      {/* Task name */}
                      <td className="px-4 py-3.5">
                        <p className="max-w-[260px] truncate font-semibold text-[#343a40] transition-colors group-hover:text-primary">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="mt-0.5 max-w-[260px] truncate text-[11px] text-[#adb5bd]">
                            {task.description}
                          </p>
                        )}
                      </td>

                      {/* Project */}
                      <td className="px-4 py-3.5">
                        <span className="rounded-lg bg-[#f1f3f5] px-2.5 py-1 text-[11px] font-bold text-[#6c757d]">
                          {task.project?.name ?? "—"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold ${st.cls}`}>
                          {st.icon}
                          {task.status.replace("_", " ")}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold ${PRIORITY_STYLES[task.priority] ?? ""}`}>
                          <Flag size={10} />
                          {task.priority}
                        </span>
                      </td>

                      {/* Assignee */}
                      <td className="px-4 py-3.5">
                        {task.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-extrabold text-primary">
                              {task.assignedTo.name?.charAt(0)}
                            </div>
                            <span className="text-[12px] font-medium text-[#6c757d]">
                              {task.assignedTo.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[12px] text-[#adb5bd]">Unassigned</span>
                        )}
                      </td>

                      {/* Due date */}
                      <td className="px-4 py-3.5">
                        {task.dueDate ? (
                          <span className={`text-[12px] font-semibold ${overdue ? "text-danger" : "text-[#6c757d]"}`}>
                            {overdue && "⚠ "}
                            {fmt(task.dueDate)}
                          </span>
                        ) : (
                          <span className="text-[12px] text-[#adb5bd]">No date</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/tasks/${task.id}`); }}
                            className="rounded-lg p-1.5 text-[#adb5bd] transition-all hover:bg-primary/10 hover:text-primary"
                            title="View Details"
                          >
                            <Eye size={15} />
                          </button>
                          {canEdit(task) ? (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingTask(task); setIsDrawerOpen(true); }}
                                className="rounded-lg p-1.5 text-[#adb5bd] transition-all hover:bg-[#f1f3f5] hover:text-[#343a40]"
                                title="Edit Task"
                              >
                                <Edit size={15} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setTaskToDelete(task.id); setIsConfirmOpen(true); }}
                                className="rounded-lg p-1.5 text-[#adb5bd] transition-all hover:bg-danger/10 hover:text-danger"
                                title="Delete Task"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          ) : (
                            <div className="relative group/tooltip">
                              <button
                                disabled
                                className="rounded-lg p-1.5 text-[#adb5bd]/30 cursor-not-allowed"
                              >
                                <Trash2 size={15} />
                              </button>
                              <span className="pointer-events-none absolute bottom-full right-0 mb-2 translate-y-1 whitespace-nowrap rounded-lg bg-[#0f2440] px-3 py-1.5 text-[10px] font-bold text-white opacity-0 transition-all group-hover/tooltip:translate-y-0 group-hover/tooltip:opacity-100 z-50 shadow-xl">
                                Only project admins can manage
                                <span className="absolute left-1/2 top-full -translate-x-1/2 border-[4px] border-transparent border-t-[#0f2440]" />
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f1f3f5] text-[#adb5bd]">
                {projects?.data?.length === 0 ? <Layout size={28} /> : <CheckSquare size={28} />}
              </div>
              <h3 className="text-base font-bold text-[#343a40]">
                {projects?.data?.length === 0 
                  ? "Create a Project First"
                  : search || statusFilter || priorityFilter 
                    ? "No tasks match" 
                    : "No tasks yet"}
              </h3>
              <p className="mt-1 mb-4 text-sm text-[#6c757d] max-w-md">
                {projects?.data?.length === 0
                  ? "Tasks belong to projects. You need to create a project before you can assign tasks."
                  : search || statusFilter || priorityFilter
                    ? "Try adjusting your filters"
                    : "Create your first task to get started"}
              </p>
              {projects?.data?.length === 0 && (
                <button
                  onClick={() => router.push("/projects")}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 cursor-pointer"
                >
                  <Plus size={17} />
                  New Project
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Create / Edit Drawer ── */}
        <TaskDrawer
          isOpen={isDrawerOpen}
          onClose={() => { setIsDrawerOpen(false); setEditingTask(null); }}
          editingTask={editingTask}
          onSubmit={handleDrawerSubmit}
          formKeyPrefix="tasks-list"
        />

        {/* Single delete confirm */}
        <ConfirmModal
          isOpen={isConfirmOpen}
          onClose={() => { setIsConfirmOpen(false); setTaskToDelete(null); }}
          onConfirm={handleDelete}
          title="Delete Task"
          message="This task will be permanently removed. This action cannot be undone."
          isLoading={deleteMutation.isPending}
        />

        {/* Bulk delete confirm */}
        <ConfirmModal
          isOpen={isBulkConfirmOpen}
          onClose={() => setIsBulkConfirmOpen(false)}
          onConfirm={handleBulkDelete}
          title={`Delete ${selected.size} Tasks`}
          message={`You're about to permanently delete ${selected.size} task${selected.size !== 1 ? "s" : ""}. This cannot be undone.`}
          isLoading={deleteMutation.isPending}
        />
      </div>
    </AppShell>
  );
}