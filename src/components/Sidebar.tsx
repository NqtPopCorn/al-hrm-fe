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
  CalendarDays,
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
  | 'working_schedule'
  | 'salary_advances'
  | 'settings';

type NavItem = {
  id: AppTab;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
  hiddenFromMainNav?: boolean;
  group?: string;
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
    id: 'employees',
    label: 'Nhân viên',
    icon: Users,
    roles: ['Super Admin', 'HR Admin', 'Manager'],
    group: 'Nhân sự',
  },
  {
    id: 'departments',
    label: 'Phòng ban',
    icon: Building2,
    roles: ['Super Admin', 'HR Admin', 'Manager'],
    group: 'Nhân sự',
  },
  {
    id: 'recruitment',
    label: 'Tuyển dụng',
    icon: Briefcase,
    roles: ['Super Admin', 'HR Admin', 'Manager'],
    hiddenFromMainNav: true,
    group: 'Nhân sự',
  },
  {
    id: 'checkin',
    label: 'Điểm danh',
    icon: Clock,
    roles: ['Super Admin', 'HR Admin', 'Manager', 'Employee'],
    group: 'Thời gian làm việc',
  },
  {
    id: 'attendance',
    label: 'Quản lý chấm công',
    icon: Clock,
    roles: ['Super Admin', 'HR Admin', 'Manager'],
    group: 'Thời gian làm việc',
  },
  {
    id: 'working_schedule',
    label: 'Lịch làm việc',
    icon: CalendarDays,
    roles: ['Super Admin', 'HR Admin', 'Manager', 'Employee'],
    group: 'Thời gian làm việc',
  },
  {
    id: 'daily_reports',
    label: 'Quản lý báo cáo',
    icon: FileText,
    roles: ['Super Admin', 'HR Admin', 'Manager'],
    group: 'Thời gian làm việc',
  },
  {
    id: 'payroll',
    label: 'Lương',
    icon: DollarSign,
    roles: ['Super Admin', 'HR Admin', 'Employee'],
    group: 'Tiền lương',
  },
  {
    id: 'salary_advances',
    label: 'Tạm ứng lương',
    icon: DollarSign,
    roles: ['Super Admin', 'HR Admin', 'Employee'],
    group: 'Tiền lương',
  },
  {
    id: 'projects',
    label: 'Dự án',
    icon: Briefcase,
    roles: ['Super Admin', 'HR Admin', 'Manager', 'Employee'],
    group: 'Tài nguyên',
  },
  {
    id: 'documents',
    label: 'Tài liệu',
    icon: FileText,
    roles: ['Super Admin', 'HR Admin', 'Manager', 'Employee'],
    group: 'Tài nguyên',
  },
  {
    id: 'handover_record',
    label: 'Bàn giao',
    icon: SendToBack,
    roles: ['Super Admin', 'HR Admin', 'Manager', 'Employee'],
    group: 'Tài nguyên',
  },
  {
    id: 'accounts',
    label: 'Tài khoản',
    icon: Shield,
    roles: ['Super Admin'],
    group: 'Hệ thống',
  },
  {
    id: 'settings',
    label: 'Cài đặt',
    icon: Settings,
    roles: ['Super Admin'],
    group: 'Hệ thống',
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
  
  // Group items
  const groupedItems = visibleItems.reduce((acc, item) => {
    const groupName = item.group || 'none';
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  // Group order
  const groupOrder = ['none', 'Nhân sự', 'Thời gian làm việc', 'Tiền lương', 'Tài nguyên', 'Hệ thống'];

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

      <nav className="flex-1 py-4 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-500/80">
        <div className="px-6 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Phổ biến
        </div>
        
        {groupOrder.map(groupName => {
          const itemsInGroup = groupedItems[groupName];
          if (!itemsInGroup || itemsInGroup.length === 0) return null;

          return (
            <div key={groupName} className={groupName !== 'none' ? "mt-4" : ""}>
              {groupName !== 'none' && (
                <div className="px-6 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  {groupName}
                </div>
              )}
              {itemsInGroup.map(item => {
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
            </div>
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
