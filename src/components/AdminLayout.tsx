import { useLocation, Outlet, Navigate } from 'react-router-dom';
import Sidebar, { AppTab, isTabAvailableForRole, getDefaultTabForRole } from './Sidebar';
import Header from './Header';
import { User } from '../types';

interface AdminLayoutProps {
  user: User;
  onLogout: () => Promise<void> | void;
}

const routeTitles: Record<string, string> = {
  dashboard: 'Tổng quan',
  accounts: 'Tài khoản',
  employees: 'Nhân viên',
  departments: 'Phòng ban',
  checkin: 'Điểm danh',
  daily_reports: 'Quản lý báo cáo cuối ngày',
  attendance: 'Quản lý chấm công',
  payroll: 'Lương',
  recruitment: 'Tuyển dụng',
  documents: 'Tài liệu',
  projects: 'Dự án',
  handover_record: 'Bàn giao công việc',
  working_schedule: 'Lịch làm việc',
  settings: 'Cài đặt',
};

export default function AdminLayout({ user, onLogout }: AdminLayoutProps) {
  const location = useLocation();
  const path = location.pathname.split('/')[1] || 'dashboard'; // /dashboard -> dashboard

  const currentTab = path as AppTab;

  // Authorization check for the route
  if (currentTab && !isTabAvailableForRole(currentTab, user.role)) {
    const defaultTab = getDefaultTabForRole(user.role);
    return <Navigate to={`/${defaultTab}`} replace />;
  }

  const title = routeTitles[currentTab] || 'Tổng quan';

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar
        currentTab={currentTab}
        role={user.role}
        onLogout={onLogout}
      />
      <div className="flex-1 flex flex-col ml-64 min-w-0">
        <Header user={user} title={title} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
