"use client";
import { AppShell } from "@/components/layout/AppShell";
import {
  Plus,
  MoreVertical,
  Clock,
  Flag,
  User,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Layout,
  CheckCircle2,
  Circle,
  MoreHorizontal,
} from "lucide-react";
import {
  useTasks,
  useUpdateTask,
  useCreateTask,
  useProjects,
  useDeleteTask,
} from "@/hooks/useData";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";
import { useState, useEffect, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  SideDrawer,
  DrawerInput,
  DrawerSelect,
  DrawerTextarea,
} from "@/components/ui/SideDrawer";
import { TaskDrawer } from "@/components/tasks/TaskDrawer";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useRouter } from "next/navigation";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COLUMNS = [
  { id: "TODO", title: "To Do", color: "text-[#6c757d] bg-[#f1f3f5]", dot: "bg-[#adb5bd]" },
  { id: "IN_PROGRESS", title: "In Progress", color: "text-primary bg-primary/10", dot: "bg-primary" },
  { id: "DONE", title: "Completed", color: "text-success bg-success/10", dot: "bg-success" },
];

const PRIORITY_THEMES: Record<string, string> = {
  URGENT: "bg-danger/10 text-danger",
  HIGH: "bg-warning/10 text-warning",
  MEDIUM: "bg-primary/10 text-primary",
  LOW: "bg-success/10 text-success",
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function KanbanPage() {
  const { isAdmin, user } = useAuth();
  const { data: tasks, isLoading } = useTasks();
  const { data: projects } = useProjects();
  const updateMutation = useUpdateTask();
  const createMutation = useCreateTask();
  const deleteMutation = useDeleteTask();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const task = tasks?.data?.find((t: any) => t.id === draggableId);
    if (task) {
      updateMutation.mutate(
        { id: draggableId, data: { status: destination.droppableId } },
        {
          onSuccess: () => toast.success("Task updated"),
          onError: () => toast.error("Update failed"),
        }
      );
    }
  };

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

  async function handleDelete() {
    if (!taskToDelete) return;
    await deleteMutation.mutateAsync(taskToDelete, {
      onSuccess: () => {
        toast.success("Task deleted");
        setIsConfirmOpen(false);
        setTaskToDelete(null);
      },
    });
  }

  if (isLoading || !mounted) {
    return (
      <AppShell>
        <div className="mx-auto max-w-[1600px] px-6 py-8 space-y-8">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-64 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
          <div className="flex gap-6 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[600px] w-[360px] shrink-0 rounded-3xl" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  const tasksByStatus = (st: string) => tasks?.data?.filter((t: any) => t.status === st) || [];

  return (
    <AppShell>
      <div className="mx-auto flex h-full max-w-[1600px] flex-col px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:mb-10 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#343a40] sm:text-3xl">Board</h1>
            <p className="mt-1 text-xs font-medium text-[#6c757d] sm:text-sm">Manage workflows across your projects.</p>
          </div>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 cursor-pointer sm:w-auto"
          >
            <Plus size={18} />
            New Task
          </button>
        </div>

        {/* Board */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex flex-1 gap-6 overflow-x-auto pb-6 no-scrollbar min-h-[70vh]">
            {COLUMNS.map((col) => {
              const colTasks = tasksByStatus(col.id);
              return (
                <div key={col.id} className="flex w-[85vw] min-w-[85vw] sm:w-auto sm:min-w-[280px] sm:max-w-none sm:flex-1 flex-col rounded-3xl bg-[#f8f9fa] border border-[#eff2f7]">
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${col.dot}`} />
                      <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-[#343a40]">
                        {col.title}
                      </h3>
                      <span className={`rounded-lg px-2 py-0.5 text-[10px] font-extrabold ${col.color}`}>
                        {colTasks.length}
                      </span>
                    </div>
                    <MoreHorizontal size={16} className="text-[#adb5bd] cursor-pointer hover:text-[#6c757d]" />
                  </div>

                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 space-y-4 p-4 transition-colors rounded-b-3xl ${
                          snapshot.isDraggingOver ? "bg-primary/5" : ""
                        }`}
                      >
                        {colTasks.map((t: any, idx: number) => (
                          <Draggable key={t.id} draggableId={t.id} index={idx}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => router.push(`/tasks/${t.id}`)}
                                className={`group relative rounded-2xl border border-[#eff2f7] bg-white p-5 shadow-sm transition-all cursor-pointer ${
                                  snapshot.isDragging ? "rotate-2 scale-105 shadow-2xl z-[100]" : "hover:shadow-md"
                                }`}
                              >
                                {/* Card Header */}
                                <div className="mb-3 flex items-center justify-between">
                                  <span className={`rounded-lg px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider ${PRIORITY_THEMES[t.priority]}`}>
                                    {t.priority}
                                  </span>
                                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-extrabold text-primary border border-white">
                                    {t.assignedTo?.name?.charAt(0) || "U"}
                                  </div>
                                </div>

                                <h4 className="mb-2 text-[13px] font-extrabold leading-snug text-[#343a40] transition-colors group-hover:text-primary">
                                  {t.title}
                                </h4>
                                
                                <div className="mb-4 flex items-center gap-2 text-[10px] font-bold text-[#adb5bd]">
                                  <Layout size={12} />
                                  <span className="truncate">{t.project?.name || "No Project"}</span>
                                </div>

                                {/* Actions */}
                                <div className="mt-4 flex items-center justify-start gap-1.5 opacity-70 transition-opacity group-hover:opacity-100">
                                   
                                   {isAdmin || t.project?.adminId === user?.id ? (
                                     <>
                                       <button 
                                         onClick={(e) => { e.stopPropagation(); setEditingTask(t); setIsDrawerOpen(true); }}
                                         className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-[#eff2f7] text-[#adb5bd] shadow-sm hover:text-[#343a40] transition-all"
                                         title="Edit Task"
                                       >
                                         <Edit size={12} />
                                       </button>
                                       <button 
                                         onClick={(e) => { e.stopPropagation(); setTaskToDelete(t.id); setIsConfirmOpen(true); }}
                                         className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-[#eff2f7] text-[#adb5bd] shadow-sm hover:bg-danger/5 hover:text-danger transition-all"
                                         title="Delete Task"
                                       >
                                         <Trash2 size={12} />
                                       </button>
                                     </>
                                   ) : (
                                     <div className="relative group/tooltip">
                                       <button 
                                         disabled
                                         className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-[#eff2f7] text-[#adb5bd]/30 shadow-sm cursor-not-allowed"
                                       >
                                         <Trash2 size={12} />
                                       </button>
                                       <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#0f2440] px-3 py-1.5 text-[10px] font-bold text-white opacity-0 transition-all group-hover/tooltip:opacity-100 z-[110] shadow-xl">
                                         Only project admins can manage
                                         <span className="absolute left-1/2 top-full -translate-x-1/2 border-[4px] border-transparent border-t-[#0f2440]" />
                                       </span>
                                     </div>
                                   )}
                                </div>

                                <div className="flex items-center justify-between border-t border-[#f8f9fa] pt-4 mt-2">
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#adb5bd]">
                                    <Calendar size={12} />
                                    {t.dueDate ? fmt(new Date(t.dueDate).toISOString()) : "No due date"}
                                  </div>
                                  <div className="flex -space-x-1.5">
                                    <div className="h-5 w-5 rounded-full border-2 border-white bg-[#f1f3f5]" />
                                    <div className="h-5 w-5 rounded-full border-2 border-white bg-primary/10 flex items-center justify-center text-[8px] font-extrabold text-primary">
                                      +1
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>

        {/* Drawer */}
        <TaskDrawer
          isOpen={isDrawerOpen}
          onClose={() => { setIsDrawerOpen(false); setEditingTask(null); }}
          editingTask={editingTask}
          onSubmit={handleDrawerSubmit}
          formKeyPrefix="kanban-board"
        />

        <ConfirmModal
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleDelete}
          title="Delete Task"
          message="Delete this task permanently?"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </AppShell>
  );
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
