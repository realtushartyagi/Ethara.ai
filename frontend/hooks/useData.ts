import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService, projectService, taskService, authService, userService } from '@/services/api.service';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.getStats,
  });
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getAll,
  });
}

export function useProjectDetails(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getById(id),
    enabled: !!id,
  });
}

export function useProjectTasks(id: string) {
  return useQuery({
    queryKey: ['project-tasks', id],
    queryFn: () => projectService.getTasks(id),
    enabled: !!id,
  });
}

export function useTasks(params?: any) {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => taskService.getAll(params),
  });
}

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: authService.getMe,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
}

// --- PROJECTS ---
export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => projectService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// --- TASKS ---
export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: taskService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => taskService.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(['tasks']);

      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: ['tasks'] }, (old: any) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((task: any) =>
            task.id === id ? { ...task, ...data } : task
          ),
        };
      });

      // Return a context object with the snapshotted value
      return { previousTasks };
    },
    onError: (err, newTodo, context: any) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTasks) {
        queryClient.setQueriesData({ queryKey: ['tasks'] }, context.previousTasks);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the correct data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: taskService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// --- USERS ---
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: userService.getAll,
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
