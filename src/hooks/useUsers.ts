import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userQueryKeys } from '../lib/query-keys';
import {
  PaginatedUsersResponse,
  UserAccountCreatePayload,
  UserAccountUpdatePayload,
  UserListParams,
  userService,
} from '../services/user.service';
import { AccountStatus, Role, UserAccount } from '../types';

interface UseUsersOptions extends UserListParams {
  enabled?: boolean;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unable to load user accounts.';
}

function patchAccountInLists(
  queryClient: ReturnType<typeof useQueryClient>,
  updatedAccount: UserAccount,
) {
  queryClient.setQueriesData<PaginatedUsersResponse<UserAccount>>(
    { queryKey: userQueryKeys.lists() },
    currentData => {
      if (!currentData) {
        return currentData;
      }

      return {
        ...currentData,
        data: currentData.data.map(account =>
          account.id === updatedAccount.id ? updatedAccount : account,
        ),
      };
    },
  );
}

export function useUsers(options: UseUsersOptions = {}) {
  const { enabled = true, search, page, limit } = options;
  const queryClient = useQueryClient();
  const filters = { search, page, limit };

  const usersQuery = useQuery({
    queryKey: userQueryKeys.list(filters),
    queryFn: () => userService.list(filters),
    enabled,
    placeholderData: previousData => previousData,
  });

  const createUserMutation = useMutation({
    mutationFn: (payload: UserAccountCreatePayload) => userService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: UserAccountUpdatePayload;
    }) => userService.update(userId, payload),
    onSuccess: async updatedAccount => {
      patchAccountInLists(queryClient, updatedAccount);
      await queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) =>
      userService.updateRole(userId, role),
    onSuccess: async updatedAccount => {
      patchAccountInLists(queryClient, updatedAccount);
      await queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      userId,
      status,
    }: {
      userId: string;
      status: AccountStatus;
    }) => userService.updateStatus(userId, status),
    onSuccess: async updatedAccount => {
      patchAccountInLists(queryClient, updatedAccount);
      await queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => userService.remove(userId),
    onSuccess: async (_, userId) => {
      queryClient.setQueriesData<PaginatedUsersResponse<UserAccount>>(
        { queryKey: userQueryKeys.lists() },
        currentData => {
          if (!currentData) {
            return currentData;
          }

          const nextData = currentData.data.filter(account => account.id !== userId);
          return {
            ...currentData,
            data: nextData,
            total: Math.max(0, currentData.total - 1),
          };
        },
      );
      await queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
    },
  });

  return {
    users: usersQuery.data?.data ?? [],
    total: usersQuery.data?.total ?? 0,
    totalPages: usersQuery.data?.totalPages ?? 0,
    page: usersQuery.data?.page ?? page ?? 1,
    limit: usersQuery.data?.limit ?? limit ?? 20,
    isLoading: usersQuery.isPending,
    isFetching: usersQuery.isFetching,
    error: usersQuery.error ? getErrorMessage(usersQuery.error) : null,
    createUser: (payload: UserAccountCreatePayload) =>
      createUserMutation.mutateAsync(payload),
    updateUser: (userId: string, payload: UserAccountUpdatePayload) =>
      updateUserMutation.mutateAsync({ userId, payload }),
    updateUserRole: (userId: string, role: Role) =>
      updateRoleMutation.mutateAsync({ userId, role }),
    updateUserStatus: (userId: string, status: AccountStatus) =>
      updateStatusMutation.mutateAsync({ userId, status }),
    deleteUser: (userId: string) => deleteUserMutation.mutateAsync(userId),
    isCreating: createUserMutation.isPending,
    isUpdating: updateUserMutation.isPending,
    isUpdatingRole: updateRoleMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    isDeleting: deleteUserMutation.isPending,
  };
}

export function useUser(userId?: string | null, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  
  const userQuery = useQuery({
    queryKey: [...userQueryKeys.all, userId!],
    queryFn: () => userService.getById(userId!),
    enabled: enabled && !!userId,
  });

  return {
    user: userQuery.data ?? null,
    isLoading: !!userId && userQuery.isPending,
    isFetching: !!userId && userQuery.isFetching,
    error: userQuery.error ? getErrorMessage(userQuery.error) : null,
    refetch: userQuery.refetch,
  };
}
