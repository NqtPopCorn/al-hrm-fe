import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import WorkingSchedule from './views/WorkingSchedule';
import SalaryAdvances from './views/SalaryAdvances';
import { User } from './types';
import { authService } from './services/auth.service';
import { useToast } from './components/Toast';
import AdminLayout from './components/AdminLayout';
import { getDefaultTabForRole } from './components/Sidebar';

export default function App() {
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isInitializingSession, setIsInitializingSession] = useState(true);

  useEffect(() => {
    const bootstrapSession = async () => {
      try {
        const currentUser = await authService.me();
        setUser(currentUser);
      } catch (error) {
        if (!authService.isAuthError(error)) {
          setIsInitializingSession(false);
          return;
        }

        try {
          await authService.refresh();
          const refreshedUser = await authService.me();
          setUser(refreshedUser);
        } catch {
          setUser(null);
        }
      } finally {
        setIsInitializingSession(false);
      }
    };

    bootstrapSession();
  }, []);

  const handleLogin = (nextUser: User) => {
    setUser(nextUser);
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

  return (
    <BrowserRouter>
      <Routes>
        {!user ? (
          <>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            <Route path="/login" element={<Navigate to={`/${getDefaultTabForRole(user.role)}`} replace />} />
            <Route path="/" element={<Navigate to={`/${getDefaultTabForRole(user.role)}`} replace />} />
            
            <Route path="/" element={<AdminLayout user={user} onLogout={handleLogout} />}>
              <Route path="dashboard" element={<DashboardHome user={user} />} />
              <Route path="accounts" element={<Accounts user={user} />} />
              <Route path="employees" element={<Employees userRole={user.role} />} />
              <Route path="departments" element={<Departments userRole={user.role} />} />
              <Route path="checkin" element={<CheckInOut user={user} />} />
              <Route path="daily_reports" element={<DailyReports user={user} />} />
              <Route path="attendance" element={<Attendance user={user} />} />
              <Route path="payroll" element={<Payroll userRole={user.role} />} />
              <Route path="recruitment" element={<Recruitment />} />
              <Route path="documents" element={<Documents userRole={user.role} />} />
              <Route path="projects" element={<ProjectWrapper />} />
              <Route path="handover_record" element={<HandoverWrapper user={user} />} />
              <Route path="working_schedule" element={<WorkingSchedule user={user} />} />
              <Route path="salary_advances" element={<SalaryAdvances user={user} />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to={`/${getDefaultTabForRole(user.role)}`} replace />} />
            </Route>
            
            <Route path="*" element={<Navigate to={`/${getDefaultTabForRole(user.role)}`} replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}
