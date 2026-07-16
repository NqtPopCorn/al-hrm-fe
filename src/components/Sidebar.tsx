import { Link } from 'react-router-dom';
import {
  Users,
  LayoutDashboard,
  Clock,
  DollarSign,
  Briefcase,
  FileText,
  Settings,
  LogOut,
  Building2,
  Shield,
  SendToBack,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Role } from '../types';

export type AppTab =
  | 'dashboard'
  | 'accounts'
  | 'employees'
  | 'departments'
  | 'checkin'
  | 'attendance'
  | 'daily_reports'
  | 'payroll'
  | 'recruitment'
  | 'documents'
  | 'projects'
  | 'handover_record'
  | 'settings';

type NavItem = {
  id: AppTab;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
  hiddenFromMainNav?: boolean;
};

interface SidebarProps {
  currentTab: AppTab;
  role: Role;
  onLogout: () => Promise<void> | void;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Tổng quan',
    icon: LayoutDashboard,
    roles: ['Super Admin', 'HR Admin', 'Manager', 'Employee'],
  },
  {
    id: 'accounts',
    label: 'Tài khoản',
    icon: Shield,
    roles: ['Super Admin'],
  },
  {
    id: 'employees',
    label: 'Nhân viên',
    icon: Users,
    roles: ['Super Admin', 'HR Admin', 'Manager'],
  },
  {
    id: 'departments',
    label: 'Phòng ban',
    icon: Building2,
    roles: ['Super Admin', 'HR Admin', 'Manager'],
  },
  {
    id: 'checkin',
    label: 'Điểm danh',
    icon: Clock,
    roles: ['Super Admin', 'HR Admin', 'Manager', 'Employee'],
  },
  {
    id: 'attendance',
    label: 'Quản lý chấm công',
    icon: Clock,
    roles: ['Super Admin', 'HR Admin', 'Manager'],
  },
  {
    id: 'daily_reports',
    label: 'Quản lý báo cáo cuối ngày',
    icon: FileText,
    roles: ['Super Admin', 'HR Admin', 'Manager'],
  },
  {
    id: 'payroll',
    label: 'Lương',
    icon: DollarSign,
    roles: ['Super Admin', 'HR Admin', 'Employee'],
  },
  {
    id: 'recruitment',
    label: 'Tuyển dụng',
    icon: Briefcase,
    roles: ['Super Admin', 'HR Admin', 'Manager'],
    hiddenFromMainNav: true,
  },
  {
    id: 'documents',
    label: 'Tài liệu',
    icon: FileText,
    roles: ['Super Admin', 'HR Admin', 'Manager', 'Employee'],
  },
  {
    id: 'projects',
    label: 'Dự án',
    icon: Briefcase,
    roles: ['Super Admin', 'HR Admin', 'Manager', 'Employee'],
  },
  {
    id: 'handover_record',
    label: 'Bàn giao',
    icon: SendToBack,
    roles: ['Super Admin', 'HR Admin', 'Manager', 'Employee'],
  },
  {
    id: 'settings',
    label: 'Cài đặt',
    icon: Settings,
    roles: ['Super Admin'],
  },
];

export function getVisibleNavigationItems(role: Role) {
  return navItems.filter(
    item => !item.hiddenFromMainNav && item.roles.includes(role),
  );
}

export function isTabAvailableForRole(tab: AppTab, role: Role) {
  return navItems.some(item => item.id === tab && item.roles.includes(role));
}

export function getDefaultTabForRole(role: Role): AppTab {
  return getVisibleNavigationItems(role)[0]?.id ?? 'dashboard';
}

export default function Sidebar({
  currentTab,
  role,
  onLogout,
}: SidebarProps) {
  const visibleItems = getVisibleNavigationItems(role);

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
          N
        </div>
        <span className="text-lg font-semibold text-white tracking-tight">
          Nova HRMS
        </span>
      </div>

      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        <div className="px-6 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Trình đơn
        </div>
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <Link
              key={item.id}
              to={`/${item.id}`}
              className={cn(
                'w-full flex items-center px-6 py-2.5 transition-colors text-sm',
                isActive
                  ? 'bg-blue-600/10 text-blue-400 border-l-4 border-blue-600 font-medium'
                  : 'hover:bg-slate-800 hover:text-slate-100 border-l-4 border-transparent',
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 mr-3',
                  isActive ? 'text-blue-400' : 'text-slate-400',
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto bg-slate-950">
        <button
          onClick={onLogout}
          className="w-full flex items-center px-3 py-2 transition-colors text-sm font-medium text-slate-400 hover:text-red-400"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
