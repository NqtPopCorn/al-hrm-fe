import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { Bell, Search } from 'lucide-react';

import { User } from '../types';

interface HeaderProps {
  user: User | null;
  title: string;
}

export default function Header({ user, title }: HeaderProps) {
  const activeQueries = useIsFetching();
  const activeMutations = useIsMutating();
  const isSyncing = activeQueries > 0 || activeMutations > 0;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
      <h1 className="text-xl font-semibold text-slate-900">{title}</h1>

      <div className="flex items-center space-x-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tim kiem..."
            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-64"
          />
        </div>

        {isSyncing ? (
          <div className="hidden lg:flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            Syncing data...
          </div>
        ) : null}

        <button className="relative text-slate-500 hover:text-slate-700 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center pl-6 border-l border-slate-200">
          <div className="text-right mr-3 hidden md:block">
            <p className="text-sm font-medium text-slate-900">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.role}</p>
          </div>
          <div className="w-9 h-9 rounded bg-slate-200 flex items-center justify-center text-slate-600 font-medium text-sm">
            {user?.name.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
}
