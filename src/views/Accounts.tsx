import { FormEvent, useEffect, useState } from 'react';
import { Edit2, Plus, Search, ShieldBan, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { useUsers } from '../hooks/useUsers';
import {
  UserAccountCreatePayload,
  UserAccountUpdatePayload,
} from '../services/user.service';
import { AccountStatus, Role, User, UserAccount } from '../types';

type AccountFormState = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  avatar: string;
  role: Role;
  status: AccountStatus;
};

const roleOptions: Role[] = [
  'Employee',
  'Manager',
  'HR Admin',
  'Super Admin',
];

const statusOptions: AccountStatus[] = [
  'active',
  'inactive',
  'pending_verification',
  'banned',
];

function createEmptyAccountForm(): AccountFormState {
  return {
    email: '',
    password: '',
    fullName: '',
    phone: '',
    avatar: '',
    role: 'Employee',
    status: 'active',
  };
}

function createAccountForm(account: UserAccount): AccountFormState {
  return {
    email: account.email,
    password: '',
    fullName: account.fullName,
    phone: account.phone ?? '',
    avatar: account.avatar ?? '',
    role: account.role,
    status: account.status,
  };
}

function toCreatePayload(form: AccountFormState): UserAccountCreatePayload {
  return {
    email: form.email.trim(),
    password: form.password,
    fullName: form.fullName.trim(),
    phone: form.phone.trim() || undefined,
    avatar: form.avatar.trim() || undefined,
    role: form.role,
    status: form.status,
  };
}

function toUpdatePayload(form: AccountFormState): UserAccountUpdatePayload {
  return {
    email: form.email.trim(),
    fullName: form.fullName.trim(),
    phone: form.phone.trim() || undefined,
    avatar: form.avatar.trim() || undefined,
    password: form.password.trim() || undefined,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function formatStatusLabel(status: AccountStatus) {
  switch (status) {
    case 'active':
      return 'Active';
    case 'inactive':
      return 'Inactive';
    case 'pending_verification':
      return 'Pending verification';
    default:
      return 'Banned';
  }
}

function formatDate(value?: string) {
  if (!value) {
    return 'N/A';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'N/A';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
}

function isSelfProtectedAction(account: UserAccount, currentUser: User) {
  return account.id === currentUser.id;
}

export default function Accounts({ user }: { user: User }) {
  const { showToast } = useToast();
  const isSuperAdmin = user.role === 'Super Admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [formState, setFormState] = useState<AccountFormState>(
    createEmptyAccountForm(),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);
  const [roleEditingAccount, setRoleEditingAccount] = useState<UserAccount | null>(
    null,
  );
  const [statusEditingAccount, setStatusEditingAccount] =
    useState<UserAccount | null>(null);
  const [accountPendingDelete, setAccountPendingDelete] =
    useState<UserAccount | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>('Employee');
  const [selectedStatus, setSelectedStatus] = useState<AccountStatus>('active');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const {
    users,
    total,
    totalPages,
    isLoading,
    isFetching,
    error,
    createUser,
    updateUser,
    updateUserRole,
    updateUserStatus,
    deleteUser,
    isCreating,
    isUpdating,
    isUpdatingRole,
    isUpdatingStatus,
    isDeleting,
  } = useUsers({
    enabled: isSuperAdmin,
    search: searchQuery.trim() || undefined,
    page,
    limit,
  });

  useEffect(() => {
    setPage(1);
  }, [searchQuery, limit]);

  const closeCreateModal = () => {
    if (isCreating) {
      return;
    }

    setIsCreateModalOpen(false);
    setFormState(createEmptyAccountForm());
    setFormError(null);
  };

  const closeEditModal = () => {
    if (isUpdating) {
      return;
    }

    setIsEditModalOpen(false);
    setEditingAccount(null);
    setFormState(createEmptyAccountForm());
    setFormError(null);
  };

  const closeRoleModal = () => {
    if (isUpdatingRole) {
      return;
    }

    setRoleEditingAccount(null);
    setSelectedRole('Employee');
    setRoleError(null);
  };

  const closeStatusModal = () => {
    if (isUpdatingStatus) {
      return;
    }

    setStatusEditingAccount(null);
    setSelectedStatus('active');
    setStatusError(null);
  };

  const closeDeleteModal = () => {
    if (isDeleting) {
      return;
    }

    setAccountPendingDelete(null);
    setDeleteError(null);
  };

  const openCreateModal = () => {
    setFormState(createEmptyAccountForm());
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (account: UserAccount) => {
    setEditingAccount(account);
    setFormState(createAccountForm(account));
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const openRoleModal = (account: UserAccount) => {
    setRoleEditingAccount(account);
    setSelectedRole(account.role);
    setRoleError(null);
  };

  const openStatusModal = (account: UserAccount) => {
    setStatusEditingAccount(account);
    setSelectedStatus(account.status);
    setStatusError(null);
  };

  const openDeleteModal = (account: UserAccount) => {
    setAccountPendingDelete(account);
    setDeleteError(null);
  };

  const handleCreateAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setFormError(null);
      const createdAccount = await createUser(toCreatePayload(formState));
      closeCreateModal();
      showToast({
        type: 'success',
        message: `Đã tạo tài khoản ${createdAccount.email} thành công.`,
      });
    } catch (nextError) {
      setFormError(getErrorMessage(nextError, 'Unable to create account.'));
    }
  };

  const handleUpdateAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingAccount) {
      return;
    }

    try {
      setFormError(null);
      const updatedAccount = await updateUser(
        editingAccount.id,
        toUpdatePayload(formState),
      );
      closeEditModal();
      showToast({
        type: 'success',
        message: `Đã cập nhật tài khoản ${updatedAccount.email}.`,
      });
    } catch (nextError) {
      setFormError(getErrorMessage(nextError, 'Unable to update account.'));
    }
  };

  const handleUpdateRole = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!roleEditingAccount) {
      return;
    }

    try {
      setRoleError(null);
      const updatedAccount = await updateUserRole(
        roleEditingAccount.id,
        selectedRole,
      );
      closeRoleModal();
      showToast({
        type: 'success',
        message: `Đã đổi role của ${updatedAccount.email} sang ${selectedRole}.`,
      });
    } catch (nextError) {
      setRoleError(getErrorMessage(nextError, 'Unable to update role.'));
    }
  };

  const handleUpdateStatus = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!statusEditingAccount) {
      return;
    }

    try {
      setStatusError(null);
      const updatedAccount = await updateUserStatus(
        statusEditingAccount.id,
        selectedStatus,
      );
      closeStatusModal();
      showToast({
        type: 'success',
        message: `Đã cập nhật trạng thái của ${updatedAccount.email}.`,
      });
    } catch (nextError) {
      setStatusError(getErrorMessage(nextError, 'Unable to update status.'));
    }
  };

  const handleDeleteAccount = async () => {
    if (!accountPendingDelete) {
      return;
    }

    try {
      setDeleteError(null);
      await deleteUser(accountPendingDelete.id);
      const deletedEmail = accountPendingDelete.email;
      closeDeleteModal();
      showToast({
        type: 'success',
        message: `Đã xóa tài khoản ${deletedEmail}.`,
      });
    } catch (nextError) {
      setDeleteError(getErrorMessage(nextError, 'Unable to delete account.'));
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Tài khoản</h2>
        </div>
        <div className="p-6 bg-slate-50/40">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-medium text-amber-900">
              Khu vực này chỉ dành cho Super Admin.
            </p>
            <p className="mt-2 text-sm text-amber-800">
              Bạn không có quyền quản lý tài khoản hệ thống.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            User accounts
          </h2>
          {isFetching ? (
            <p className="mt-1 text-xs font-medium text-blue-600">
              Syncing latest account data...
            </p>
          ) : null}
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add account
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="Search by name or email"
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-600">Rows</label>
              <select
                value={limit}
                onChange={event => setLimit(Number(event.target.value))}
                className="px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {error ? (
            <div className="p-6">
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            </div>
          ) : null}

          {isLoading ? (
            <div className="px-6 py-16 text-center text-sm text-slate-500">
              Loading accounts...
            </div>
          ) : users.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-slate-500">
              No user accounts matched the current filters.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                        Full name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {users.map(account => {
                      const isSelf = isSelfProtectedAction(account, user);

                      return (
                        <tr key={account.id}>
                          <td className="px-6 py-4 text-sm font-medium text-slate-800 whitespace-nowrap">
                            {account.fullName}
                            {isSelf ? (
                              <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                                You
                              </span>
                            ) : null}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                            {account.email}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                            {account.phone || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                            {account.role}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                              {formatStatusLabel(account.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                            {formatDate(account.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditModal(account)}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => openRoleModal(account)}
                                disabled={isSelf}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                title={
                                  isSelf
                                    ? 'You cannot change your own role here.'
                                    : undefined
                                }
                              >
                                Role
                              </button>
                              <button
                                type="button"
                                onClick={() => openStatusModal(account)}
                                disabled={isSelf}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                title={
                                  isSelf
                                    ? 'You cannot disable your own account here.'
                                    : undefined
                                }
                              >
                                <ShieldBan className="h-3.5 w-3.5" />
                                Status
                              </button>
                              <button
                                type="button"
                                onClick={() => openDeleteModal(account)}
                                disabled={isSelf}
                                className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                                title={
                                  isSelf
                                    ? 'You cannot delete your own account.'
                                    : undefined
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Showing {users.length} of {total} accounts
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage(currentPage => Math.max(1, currentPage - 1))}
                    disabled={page <= 1}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-slate-600">
                    Page {page} / {Math.max(1, totalPages)}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPage(currentPage =>
                        Math.min(Math.max(1, totalPages), currentPage + 1),
                      )
                    }
                    disabled={page >= Math.max(1, totalPages)}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        title="Create account"
        maxWidth="max-w-2xl"
      >
        <form className="space-y-4" onSubmit={handleCreateAccount}>
          {formError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {formError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Full name
              </label>
              <input
                required
                type="text"
                value={formState.fullName}
                onChange={event =>
                  setFormState(currentForm => ({
                    ...currentForm,
                    fullName: event.target.value,
                  }))
                }
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Email
              </label>
              <input
                required
                type="email"
                value={formState.email}
                onChange={event =>
                  setFormState(currentForm => ({
                    ...currentForm,
                    email: event.target.value,
                  }))
                }
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Password
              </label>
              <input
                required
                type="password"
                value={formState.password}
                onChange={event =>
                  setFormState(currentForm => ({
                    ...currentForm,
                    password: event.target.value,
                  }))
                }
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Phone
              </label>
              <input
                type="text"
                value={formState.phone}
                onChange={event =>
                  setFormState(currentForm => ({
                    ...currentForm,
                    phone: event.target.value,
                  }))
                }
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Role
              </label>
              <select
                value={formState.role}
                onChange={event =>
                  setFormState(currentForm => ({
                    ...currentForm,
                    role: event.target.value as Role,
                  }))
                }
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              >
                {roleOptions.map(role => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Status
              </label>
              <select
                value={formState.status}
                onChange={event =>
                  setFormState(currentForm => ({
                    ...currentForm,
                    status: event.target.value as AccountStatus,
                  }))
                }
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {formatStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Avatar URL
              </label>
              <input
                type="url"
                value={formState.avatar}
                onChange={event =>
                  setFormState(currentForm => ({
                    ...currentForm,
                    avatar: event.target.value,
                  }))
                }
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeCreateModal}
              disabled={isCreating}
              className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isCreating ? 'Saving...' : 'Create account'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title="Edit account"
        maxWidth="max-w-2xl"
      >
        {editingAccount ? (
          <form className="space-y-4" onSubmit={handleUpdateAccount}>
            {formError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {formError}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Full name
                </label>
                <input
                  required
                  type="text"
                  value={formState.fullName}
                  onChange={event =>
                    setFormState(currentForm => ({
                      ...currentForm,
                      fullName: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Email
                </label>
                <input
                  required
                  type="email"
                  value={formState.email}
                  onChange={event =>
                    setFormState(currentForm => ({
                      ...currentForm,
                      email: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  New password
                </label>
                <input
                  type="password"
                  value={formState.password}
                  onChange={event =>
                    setFormState(currentForm => ({
                      ...currentForm,
                      password: event.target.value,
                    }))
                  }
                  placeholder="Leave blank to keep current password"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Phone
                </label>
                <input
                  type="text"
                  value={formState.phone}
                  onChange={event =>
                    setFormState(currentForm => ({
                      ...currentForm,
                      phone: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={formState.avatar}
                  onChange={event =>
                    setFormState(currentForm => ({
                      ...currentForm,
                      avatar: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={isUpdating}
                className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isUpdating ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        isOpen={!!roleEditingAccount}
        onClose={closeRoleModal}
        title="Change role"
      >
        {roleEditingAccount ? (
          <form className="space-y-4" onSubmit={handleUpdateRole}>
            {roleError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {roleError}
              </div>
            ) : null}

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <span className="font-medium">{roleEditingAccount.email}</span>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Role
              </label>
              <select
                value={selectedRole}
                onChange={event => setSelectedRole(event.target.value as Role)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              >
                {roleOptions.map(role => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeRoleModal}
                disabled={isUpdatingRole}
                className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingRole}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isUpdatingRole ? 'Saving...' : 'Update role'}
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        isOpen={!!statusEditingAccount}
        onClose={closeStatusModal}
        title="Change status"
      >
        {statusEditingAccount ? (
          <form className="space-y-4" onSubmit={handleUpdateStatus}>
            {statusError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {statusError}
              </div>
            ) : null}

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <span className="font-medium">{statusEditingAccount.email}</span>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={event =>
                  setSelectedStatus(event.target.value as AccountStatus)
                }
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {formatStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeStatusModal}
                disabled={isUpdatingStatus}
                className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingStatus}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isUpdatingStatus ? 'Saving...' : 'Update status'}
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        isOpen={!!accountPendingDelete}
        onClose={closeDeleteModal}
        title="Delete account"
      >
        {accountPendingDelete ? (
          <div className="space-y-4">
            {deleteError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {deleteError}
              </div>
            ) : null}

            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <p>
                This will permanently delete{' '}
                <span className="font-medium">{accountPendingDelete.email}</span>.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteAccount()}
                disabled={isDeleting}
                className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {isDeleting ? 'Deleting...' : 'Delete account'}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
