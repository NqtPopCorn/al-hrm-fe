import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { handoverQueryKeys } from '../lib/query-keys';
import {
  adminUpdateSections,
  approveHandover,
  createHandoverDraft,
  getHandoverById,
  getHandovers,
  HandoverSection,
  ManagerReview,
  rejectHandover,
  resetHandover,
  submitHandover,
  updateDraft,
} from '../services/handover.service';

export function useHandovers(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();

  const handoversQuery = useQuery({
    queryKey: handoverQueryKeys.list(),
    queryFn: () => getHandovers(),
    enabled,
    placeholderData: previousData => previousData,
  });

  const createHandoverDraftMutation = useMutation({
    mutationFn: () => createHandoverDraft(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: handoverQueryKeys.lists() });
    },
  });

  return {
    handovers: handoversQuery.data ?? [],
    isLoading: handoversQuery.isPending,
    isFetching: handoversQuery.isFetching,
    error: handoversQuery.error ? (handoversQuery.error as Error).message : null,
    refetch: handoversQuery.refetch,
    createHandoverDraft: () => createHandoverDraftMutation.mutateAsync(),
    isCreating: createHandoverDraftMutation.isPending,
  };
}

export function useHandover(id?: string | null, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();

  const handoverQuery = useQuery({
    queryKey: handoverQueryKeys.detail(id!),
    queryFn: () => getHandoverById(id!),
    enabled: enabled && !!id,
  });

  const invalidateHandover = async () => {
    if (id) {
      await queryClient.invalidateQueries({ queryKey: handoverQueryKeys.detail(id) });
    }
    await queryClient.invalidateQueries({ queryKey: handoverQueryKeys.lists() });
  };

  const updateDraftMutation = useMutation({
    mutationFn: (sections: HandoverSection) => updateDraft(id!, sections),
    onSuccess: async (updatedHandover) => {
      queryClient.setQueryData(handoverQueryKeys.detail(id!), updatedHandover);
      await invalidateHandover();
    },
  });

  const submitHandoverMutation = useMutation({
    mutationFn: () => submitHandover(id!),
    onSuccess: async (updatedHandover) => {
      queryClient.setQueryData(handoverQueryKeys.detail(id!), updatedHandover);
      await invalidateHandover();
    },
  });

  const approveHandoverMutation = useMutation({
    mutationFn: (review: ManagerReview) => approveHandover(id!, review),
    onSuccess: async (updatedHandover) => {
      queryClient.setQueryData(handoverQueryKeys.detail(id!), updatedHandover);
      await invalidateHandover();
    },
  });

  const rejectHandoverMutation = useMutation({
    mutationFn: (review: ManagerReview) => rejectHandover(id!, review),
    onSuccess: async (updatedHandover) => {
      queryClient.setQueryData(handoverQueryKeys.detail(id!), updatedHandover);
      await invalidateHandover();
    },
  });

  const resetHandoverMutation = useMutation({
    mutationFn: () => resetHandover(id!),
    onSuccess: async (updatedHandover) => {
      queryClient.setQueryData(handoverQueryKeys.detail(id!), updatedHandover);
      await invalidateHandover();
    },
  });

  const adminUpdateSectionsMutation = useMutation({
    mutationFn: (sections: HandoverSection) => adminUpdateSections(id!, sections),
    onSuccess: async (updatedHandover) => {
      queryClient.setQueryData(handoverQueryKeys.detail(id!), updatedHandover);
      await invalidateHandover();
    },
  });

  return {
    handover: handoverQuery.data ?? null,
    isLoading: !!id && handoverQuery.isPending,
    isFetching: !!id && handoverQuery.isFetching,
    error: handoverQuery.error ? (handoverQuery.error as Error).message : null,
    refetch: handoverQuery.refetch,
    updateDraft: (sections: HandoverSection) => updateDraftMutation.mutateAsync(sections),
    submitHandover: () => submitHandoverMutation.mutateAsync(),
    approveHandover: (review: ManagerReview) => approveHandoverMutation.mutateAsync(review),
    rejectHandover: (review: ManagerReview) => rejectHandoverMutation.mutateAsync(review),
    resetHandover: () => resetHandoverMutation.mutateAsync(),
    adminUpdateSections: (sections: HandoverSection) => adminUpdateSectionsMutation.mutateAsync(sections),
    isUpdatingDraft: updateDraftMutation.isPending,
    isSubmitting: submitHandoverMutation.isPending,
    isApproving: approveHandoverMutation.isPending,
    isRejecting: rejectHandoverMutation.isPending,
    isResetting: resetHandoverMutation.isPending,
    isAdminUpdating: adminUpdateSectionsMutation.isPending,
  };
}
