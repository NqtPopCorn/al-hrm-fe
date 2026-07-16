import { useEffect, useState } from 'react';
import Sidebar, {
  AppTab,
  getDefaultTabForRole,
  isTabAvailableForRole,
} from './components/Sidebar';
import Header from './components/Header';
import Login from './views/Login';
import DashboardHome from './views/DashboardHome';
import Accounts from './views/Accounts';
import Employees from './views/Employees';
import Departments from './views/Departments';
import CheckInOut from './views/CheckInOut';
import DailyReports from './views/DailyReports';
import Attendance from './views/Attendance';
import Payroll from './views/Payroll';
import Recruitment from './views/Recruitment';
import Documents from './views/Documents';
import Settings from './views/Settings';
import ProjectWrapper from './views/ProjectWrapper';
import HandoverWrapper from './views/HandoverWrapper';
import { User } from './types';
import { authService } from './services/auth.service';
import { useToast } from './components/Toast';

export default function App() {
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<AppTab>('dashboard');
  const [isInitializingSession, setIsInitializingSession] = useState(true);

  useEffect(() => {
    const bootstrapSession = async () => {
      try {
        const currentUser = await authService.me();
        setUser(currentUser);
        setCurrentTab(getDefaultTabForRole(currentUser.role));
      } catch (error) {
        if (!authService.isAuthError(error)) {
          setIsInitializingSession(false);
          return;
        }

        try {
          await authService.refresh();
          const refreshedUser = await authService.me();
          setUser(refreshedUser);
          setCurrentTab(getDefaultTabForRole(refreshedUser.role));
        } catch {
          setUser(null);
        }
      } finally {
        setIsInitializingSession(false);
      }
    };

    bootstrapSession();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (!isTabAvailableForRole(currentTab, user.role)) {
      setCurrentTab(getDefaultTabForRole(user.role));
    }
  }, [currentTab, user]);

  const handleLogin = (nextUser: User) => {
    setUser(nextUser);
    setCurrentTab(getDefaultTabForRole(nextUser.role));
    showToast({
      type: 'success',
      message: `Chào mừng trở lại, ${nextUser.name}! 👋`,
    });
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Reset local state even when the server session is already gone.
    } finally {
      setUser(null);
      setCurrentTab('dashboard');
      showToast({ type: 'info', message: 'Đã đăng xuất thành công.' });
    }
  };

  if (isInitializingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
          <p className="mt-4 text-sm text-slate-500">
            Đang khôi phục phiên đăng nhập...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardHome user={user} />;
      case 'accounts':
        return <Accounts user={user} />;
      case 'employees':
        return <Employees userRole={user.role} />;
      case 'departments':
        return <Departments userRole={user.role} />;
      case 'checkin':
        return <CheckInOut user={user} />;
      case 'daily_reports':
        return <DailyReports user={user} />;
      case 'attendance':
        return <Attendance user={user} />;
      case 'payroll':
        return <Payroll userRole={user.role} />;
      case 'recruitment':
        return <Recruitment />;
      case 'documents':
        return <Documents userRole={user.role} />;
      case 'projects':
        return <ProjectWrapper />;
      case 'handover_record':
        return <HandoverWrapper user={user} />;
      case 'settings':
        return <Settings />;
      default:
        return <DashboardHome user={user} />;
    }
  };

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Tổng quan';
      case 'accounts':
        return 'Tài khoản';
      case 'employees':
        return 'Nhân viên';
      case 'departments':
        return 'Phòng ban';
      case 'checkin':
        return 'Điểm danh';
      case 'daily_reports':
        return 'Quản lý báo cáo cuối ngày';
      case 'attendance':
        return 'Quản lý chấm công';
      case 'payroll':
        return 'Lương';
      case 'recruitment':
        return 'Tuyển dụng';
      case 'documents':
        return 'Tài liệu';
      case 'projects':
        return 'Dự án';
      case 'handover_record':
        return 'Bàn giao công việc';
      case 'settings':
        return 'Cài đặt';
      default:
        return 'Tổng quan';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        role={user.role}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col ml-64 min-w-0">
        <Header user={user} title={getPageTitle()} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-8">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
}
