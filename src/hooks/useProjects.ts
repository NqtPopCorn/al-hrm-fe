import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectQueryKeys } from '../lib/query-keys';
import {
  CreateProjectPayload,
  ProjectListParams,
  projectService,
  UpdateProjectPayload,
} from '../services/project.service';

export function useProjects(options: ProjectListParams & { enabled?: boolean } = {}) {
  const { enabled = true, page, limit, name, tech, year, scale, category, tags } = options;
  const queryClient = useQueryClient();
  const filters = { page, limit, name, tech, year, scale, category, tags };

  const projectsQuery = useQuery({
    queryKey: projectQueryKeys.list(filters),
    queryFn: () => projectService.list(filters),
    enabled,
    placeholderData: previousData => previousData,
  });

  const createProjectMutation = useMutation({
    mutationFn: (payload: CreateProjectPayload) => projectService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProjectPayload }) =>
      projectService.update(id, payload),
    onSuccess: async (updatedProject, variables) => {
      queryClient.setQueryData(projectQueryKeys.detail(variables.id), updatedProject);
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => projectService.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });
    },
  });

  const saveHistorySnapshotMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { content_snapshot: string; change_note?: string };
    }) => projectService.saveHistorySnapshot(id, payload),
    onSuccess: async (updatedProject, variables) => {
      queryClient.setQueryData(projectQueryKeys.detail(variables.id), updatedProject);
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.detail(variables.id) });
    },
  });

  return {
    projects: projectsQuery.data?.data ?? [],
    total: projectsQuery.data?.total ?? 0,
    isLoading: projectsQuery.isPending,
    isFetching: projectsQuery.isFetching,
    error: projectsQuery.error ? (projectsQuery.error as Error).message : null,
    createProject: (payload: CreateProjectPayload) =>
      createProjectMutation.mutateAsync(payload),
    updateProject: (id: string, payload: UpdateProjectPayload) =>
      updateProjectMutation.mutateAsync({ id, payload }),
    deleteProject: (id: string) => deleteProjectMutation.mutateAsync(id),
    saveHistorySnapshot: (id: string, payload: { content_snapshot: string; change_note?: string }) =>
      saveHistorySnapshotMutation.mutateAsync({ id, payload }),
    isCreating: createProjectMutation.isPending,
    isUpdating: updateProjectMutation.isPending,
    isDeleting: deleteProjectMutation.isPending,
    isSavingSnapshot: saveHistorySnapshotMutation.isPending,
  };
}

export function useProject(id?: string, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  
  const projectQuery = useQuery({
    queryKey: projectQueryKeys.detail(id!),
    queryFn: () => projectService.getById(id!),
    enabled: enabled && !!id,
  });

  return {
    project: projectQuery.data ?? null,
    isLoading: !!id && projectQuery.isPending,
    isFetching: !!id && projectQuery.isFetching,
    error: projectQuery.error ? (projectQuery.error as Error).message : null,
    refetch: projectQuery.refetch,
  };
}
