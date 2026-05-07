"use client";

import { AppShell } from "@/components/layout/AppShell";
import {
  FolderKanban,
  Plus,
  Search,
  Trash2,
  Edit,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  SideDrawer,
  DrawerInput,
  DrawerTextarea,
} from "@/components/ui/SideDrawer";
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from "@/hooks/useData";
import { useAuth } from "@/context/AuthContext";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PROJECT_COLORS = [
  "#1a3353", "#6366f1", "#0ea5e9", "#f59e0b", 
  "#ec4899", "#8b5cf6", "#0d9488", "#334155"
];

function getProjectColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  canEdit,
  onEdit,
  onDelete,
  onClick,
}: {
  project: any;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}) {
  const color = getProjectColor(project.id);
  const tasks = project._count?.tasks ?? project.tasks?.length ?? 0;
  const done = project.tasks?.filter((t: any) => t.status === "DONE").length ?? 0;
  const inProgress = project.tasks?.filter((t: any) => t.status === "IN_PROGRESS").length ?? 0;
  const members = project.members?.length ?? project._count?.members ?? 0;
  const completion = tasks > 0 ? Math.round((done / tasks) * 100) : 0;

  return (
    <div 
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#eff2f7] bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
    >
      {/* Color top strip */}
      <div className="h-1 w-full" style={{ background: color }} />

      <div className="flex flex-1 flex-col p-5">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-[13px] font-extrabold text-white shadow-sm transition-transform group-hover:scale-105"
            style={{ background: color }}
          >
            {getInitials(project.name)}
          </div>

          {/* Actions — visible on hover */}
          <div className="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {canEdit ? (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="rounded-lg p-1.5 text-[#adb5bd] transition-colors hover:bg-[#f1f3f5] hover:text-[#343a40]"
                  title="Edit Project"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="rounded-lg p-1.5 text-[#adb5bd] transition-colors hover:bg-danger/10 hover:text-danger"
                  title="Delete Project"
                >
                  <Trash2 size={14} />
                </button>
              </>
            ) : (
              <div className="relative group/tooltip">
                <button
                  disabled
                  className="rounded-lg p-1.5 text-[#adb5bd]/30 cursor-not-allowed"
                >
                  <Trash2 size={14} />
                </button>
                <span className="pointer-events-none absolute right-full top-1/2 mr-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#0f2440] px-3 py-1.5 text-[10px] font-bold text-white opacity-0 transition-all group-hover/tooltip:opacity-100 z-50 shadow-xl">
                   Only project admins can manage
                   <span className="absolute left-full top-1/2 -translate-y-1/2 border-[4px] border-transparent border-l-[#0f2440]" />
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Name & description */}
        <div className="mb-4 flex-1">
          <h3 className="text-[15px] font-extrabold text-[#343a40] transition-colors group-hover:text-primary line-clamp-1">
            {project.name}
          </h3>
          <p className="mt-1 text-[12px] leading-relaxed text-[#6c757d] line-clamp-2">
            {project.description || "No description provided."}
          </p>
        </div>

        {/* Task stats row */}
        <div className="mb-3 flex items-center gap-3 text-[11px] font-bold">
          <span className="flex items-center gap-1 text-[#adb5bd]">
            <AlertCircle size={11} />
            {tasks} tasks
          </span>
          {inProgress > 0 && (
            <span className="flex items-center gap-1 text-primary">
              <Clock size={11} />
              {inProgress} active
            </span>
          )}
          {done > 0 && (
            <span className="flex items-center gap-1 text-success">
              <CheckCircle2 size={11} />
              {done} done
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#adb5bd]">Progress</span>
            <span className="text-[11px] font-extrabold" style={{ color }}>{completion}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f1f3f5]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${completion}%`, background: color }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#f1f3f5] pt-4">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#adb5bd]">
            <Users size={12} />
            {members} member{members !== 1 ? "s" : ""}
          </div>
          <button
            onClick={onClick}
            className="flex items-center gap-1 text-[11px] font-bold text-primary transition-all duration-200 hover:underline"
          >
            Open <ArrowRight size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyProjects({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#ced4da] bg-white py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f1f3f5] text-[#adb5bd]">
        <FolderKanban size={28} />
      </div>
      <h3 className="text-base font-bold text-[#343a40]">No projects yet</h3>
      <p className="mt-1 mb-5 text-sm text-[#6c757d]">Create your first project to start managing tasks</p>
      <button
        onClick={onNew}
        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90"
      >
        <Plus size={16} />
        Create Project
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const { isAdmin, user } = useAuth();
  const router = useRouter();

  const { data: projects, isLoading } = useProjects();
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  const [search, setSearch] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<any>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (projects?.data ?? []).filter(
      (p: any) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
    );
  }, [projects, search]);

  async function handleDrawerSubmit(values: any) {
    if (editingProject) {
      await updateMutation.mutateAsync({ id: editingProject.id, data: values });
      toast.success("Project updated");
    } else {
      await createMutation.mutateAsync(values);
      toast.success("Project created");
    }
    setIsDrawerOpen(false);
    setEditingProject(null);
  }

  function handleDelete() {
    if (!projectToDelete) return;
    deleteMutation.mutate(projectToDelete.id, {
      onSuccess: () => {
        toast.success("Project deleted");
        setIsConfirmOpen(false);
        setProjectToDelete(null);
      },
      onError: (e: any) => {
        toast.error(e.response?.data?.message ?? "Delete failed");
        setIsConfirmOpen(false);
      },
    });
  }

  function canEditProject(project: any) {
    return isAdmin || project.adminId === user?.id;
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-[1400px] px-4 py-8 space-y-6">
          <div className="flex justify-between">
            <Skeleton className="h-8 w-40 rounded-xl" />
            <Skeleton className="h-10 w-36 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}
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
            <h1 className="text-xl font-extrabold tracking-tight text-[#343a40]">Projects</h1>
            <p className="mt-0.5 text-sm text-[#6c757d]">
              {filtered.length} project{filtered.length !== 1 ? "s" : ""}
              {search ? " match your search" : " total"}
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative w-full sm:w-auto">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" />
              <input
                type="text"
                placeholder="Search projects…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#eff2f7] bg-white pl-9 pr-3 text-sm outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/8 sm:w-52"
              />
            </div>
            <button
              onClick={() => { setEditingProject(null); setIsDrawerOpen(true); }}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 cursor-pointer sm:w-auto"
            >
              <Plus size={17} />
              New Project
            </button>
          </div>
        </div>

        {/* ── Grid ── */}
        {filtered.length === 0 ? (
          search ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="font-bold text-[#343a40]">No projects match "{search}"</p>
              <button onClick={() => setSearch("")} className="mt-2 text-sm text-primary hover:underline">
                Clear search
              </button>
            </div>
          ) : (
            <EmptyProjects onNew={() => setIsDrawerOpen(true)} />
          )
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((project: any) => (
              <ProjectCard
                key={project.id}
                project={project}
                canEdit={canEditProject(project)}
                onEdit={() => { setEditingProject(project); setIsDrawerOpen(true); }}
                onDelete={() => { setProjectToDelete(project); setIsConfirmOpen(true); }}
                onClick={() => router.push(`/projects/${project.id}`)}
              />
            ))}
          </div>
        )}

        {/* ── Drawer ── */}
        <SideDrawer
          isOpen={isDrawerOpen}
          onClose={() => { setIsDrawerOpen(false); setEditingProject(null); }}
          title={editingProject ? "Edit Project" : "New Project"}
          subtitle={
            editingProject
              ? `Editing: ${editingProject.name}`
              : "Set up a new project for your team."
          }
          formKey={editingProject ? `edit-proj-${editingProject.id}` : "create-project"}
          onSubmit={handleDrawerSubmit}
          submitLabel={editingProject ? "Save Changes" : "Create Project"}
        >
          <DrawerInput
            name="name"
            label="Project Name"
            placeholder="e.g., Website Redesign Q3"
            isRequired
            defaultValue={editingProject?.name}
          />
          <DrawerTextarea
            name="description"
            label="Description"
            placeholder="What is this project about?"
            rows={4}
            defaultValue={editingProject?.description}
          />
        </SideDrawer>

        {/* ── Delete Confirm ── */}
        <ConfirmModal
          isOpen={isConfirmOpen}
          onClose={() => { setIsConfirmOpen(false); setProjectToDelete(null); }}
          onConfirm={handleDelete}
          title="Delete Project"
          message={`"${projectToDelete?.name}" and all its tasks will be permanently deleted. This cannot be undone.`}
          isLoading={deleteMutation.isPending}
        />
      </div>
    </AppShell>
  );
}