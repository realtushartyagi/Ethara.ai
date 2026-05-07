"use client";

import { useState, useEffect, useCallback } from "react";
import {
  SideDrawer,
  DrawerInput,
  DrawerSelect,
  DrawerTextarea,
} from "@/components/ui/SideDrawer";
import { useProjects, useProjectDetails } from "@/hooks/useData";

interface TaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  editingTask?: any;
  onSubmit: (values: any) => Promise<void>;
  fixedProjectId?: string;
  formKeyPrefix?: string;
}

export function TaskDrawer({
  isOpen,
  onClose,
  editingTask,
  onSubmit,
  fixedProjectId,
  formKeyPrefix = "task",
}: TaskDrawerProps) {
  const { data: projectsData } = useProjects();
  const projects = projectsData?.data || [];

  // Local state to track selected project ID for member filtering
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    fixedProjectId || editingTask?.projectId || ""
  );

  // Fetch project details to get members of the selected project
  const { data: projectDetails } = useProjectDetails(selectedProjectId);
  const members = projectDetails?.members || [];

  // Reset selected project when editingTask changes or fixedProjectId is provided
  useEffect(() => {
    if (fixedProjectId) {
      setSelectedProjectId(fixedProjectId);
    } else if (editingTask) {
      setSelectedProjectId(editingTask.projectId);
    } else {
      setSelectedProjectId("");
    }
  }, [editingTask, fixedProjectId, isOpen]);

  const handleValuesChange = useCallback((name: string, value: any) => {
    if (name === "projectId") {
      setSelectedProjectId(value);
    }
  }, []);

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingTask ? "Edit Task" : "New Task"}
      subtitle={
        editingTask
          ? `Updating: ${editingTask.title}`
          : "Define a new action item."
      }
      formKey={`${formKeyPrefix}-${editingTask?.id || "new"}`}
      onSubmit={onSubmit}
      onValuesChange={handleValuesChange}
    >
      <DrawerInput
        name="title"
        label="Task Title"
        placeholder="e.g., UI Refinement"
        isRequired
        defaultValue={editingTask?.title}
      />

      <div className="grid grid-cols-2 gap-4">
        {!fixedProjectId ? (
          <DrawerSelect
            name="projectId"
            label="Project"
            isRequired
            defaultValue={editingTask?.projectId}
            options={projects.map((p: any) => ({ label: p.name, value: p.id }))}
            // We need a way to listen for changes to projectId
          />
        ) : (
          <input type="hidden" name="projectId" value={fixedProjectId} />
        )}

        <DrawerSelect
          name="priority"
          label="Priority"
          defaultValue={editingTask?.priority || "MEDIUM"}
          options={[
            { label: "Low", value: "LOW" },
            { label: "Medium", value: "MEDIUM" },
            { label: "High", value: "HIGH" },
            { label: "Urgent", value: "URGENT" },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <DrawerSelect
          name="status"
          label="Status"
          defaultValue={editingTask?.status || "TODO"}
          options={[
            { label: "To Do", value: "TODO" },
            { label: "In Progress", value: "IN_PROGRESS" },
            { label: "Done", value: "DONE" },
          ]}
        />
        <DrawerInput
          name="dueDate"
          label="Due Date"
          type="date"
          defaultValue={
            editingTask?.dueDate
              ? new Date(editingTask.dueDate).toISOString().split("T")[0]
              : ""
          }
        />
      </div>

      <DrawerSelect
        name="assignedToId"
        label="Assignee"
        placeholder={selectedProjectId ? "Unassigned" : "Select a project first"}
        defaultValue={editingTask?.assignedToId}
        options={members.map((m: any) => ({ label: m.user?.name || 'Unknown', value: m.user?.id }))}
      />

      <DrawerTextarea
        name="description"
        label="Description"
        placeholder="Context and details…"
        defaultValue={editingTask?.description}
      />

    </SideDrawer>
  );
}
