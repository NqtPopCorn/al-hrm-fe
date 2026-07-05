import React, { useState } from 'react';
import { ApiError } from '../lib/api';
import { authService } from '../services/auth.service';
import { Role, User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoRole, setDemoRole] = useState<Role>('Super Admin');
  const demoLoginEnabled = import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true';

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const user = await authService.login({ email, password });
      onLogin(user);
    } catch (loginError) {
      if (loginError instanceof ApiError) {
        setError(loginError.message);
      } else {
        setError('Không thể đăng nhập vào hệ thống lúc này.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = () => {
    onLogin({
      id: `demo-${demoRole.toLowerCase().replace(/\s+/g, '-')}`,
      email: `demo.${demoRole.toLowerCase().replace(/\s+/g, '')}@nova.com`,
      name: `${demoRole} User`,
      role: demoRole,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="w-12 h-12 bg-blue-600 rounded mx-auto flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-2xl">N</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-semibold text-slate-900 tracking-tight">
          Nexus HRMS
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Đăng nhập để truy cập không gian làm việc
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="name@company.com"
                className="mt-1 block w-full px-3 py-2.5 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="Nhập mật khẩu"
                className="mt-1 block w-full px-3 py-2.5 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                required
              />
            </div>

            <div className="bg-blue-50 text-blue-700 p-4 rounded-lg text-sm border border-blue-100">
              <p className="font-semibold mb-1">Đăng nhập theo backend auth</p>
              <p>
                Frontend hiện ưu tiên dùng cookie session với các API `login`,
                `me`, `refresh`, `logout` để các sprint sau chỉ cần nối domain
                API thật vào.
              </p>
            </div>

            {error ? (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100">
                {error}
              </div>
            ) : null}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                {isSubmitting ? 'Đang đăng nhập...' : 'Vào không gian làm việc'}
              </button>
            </div>
          </form>

          {demoLoginEnabled ? (
            <div className="mt-6 pt-6 border-t border-slate-200 space-y-3">
              <div>
                <label
                  htmlFor="demoRole"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Demo role fallback
                </label>
                <select
                  id="demoRole"
                  value={demoRole}
                  onChange={event => setDemoRole(event.target.value as Role)}
                  className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                >
                  <option value="Super Admin">
                    Quản trị viên (Super Admin)
                  </option>
                  <option value="HR Admin">Nhân sự (HR Admin)</option>
                  <option value="Manager">Quản lý (Manager)</option>
                  <option value="Employee">Nhân viên (Employee)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full flex justify-center py-2.5 px-4 border border-slate-200 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                Vào bằng dữ liệu demo
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
