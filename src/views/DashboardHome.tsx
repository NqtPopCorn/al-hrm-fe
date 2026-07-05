import { Users, Briefcase, Clock, Calendar, ShieldCheck, Server } from 'lucide-react';
import { mockEmployees, mockAttendance } from '../mockData';

export default function DashboardHome() {
  const presentToday = mockAttendance.filter(a => a.status === 'VALID').length;
  const wfhToday = mockAttendance.filter(a => a.type === 'WFH').length;
  const lateToday = mockAttendance.filter(a => a.status === 'LATE').length;

  const stats = [
    { label: 'Tổng nhân viên', value: mockEmployees.length.toString(), icon: Users, trend: '+2 tháng này', color: 'text-slate-900', bg: 'text-slate-500', trendColor: 'text-emerald-600' },
    { label: 'Đi làm hôm nay', value: presentToday.toString(), icon: Clock, trend: '85% nhân sự', color: 'text-blue-600', bg: 'text-slate-500', trendColor: 'text-slate-500' },
    { label: 'Làm tại nhà (WFH)', value: wfhToday.toString(), icon: Briefcase, trend: '15% nhân sự', color: 'text-purple-600', bg: 'text-slate-500', trendColor: 'text-slate-500' },
    { label: 'Đi trễ', value: lateToday.toString(), icon: Calendar, trend: '-1 so với hôm qua', color: 'text-amber-500', bg: 'text-slate-500', trendColor: 'text-slate-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <div className={`mt-2 text-xs ${stat.trendColor}`}>{stat.trend}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
          <h3 className="font-semibold mb-4 text-sm">Hoạt động gần đây (Audit Log)</h3>
          <div className="space-y-4 flex-1">
            <div className="flex items-start pb-4 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 mr-4"></div>
              <div>
                <p className="text-sm font-medium text-slate-700">Alice Williams chuyển sang vòng "Phỏng vấn"</p>
                <p className="text-xs text-slate-500 mt-1">2 giờ trước</p>
              </div>
            </div>
            <div className="flex items-start pb-4 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500 mr-4"></div>
              <div>
                <p className="text-sm font-medium text-slate-700">Jane Smith đã tải lên hợp đồng mới</p>
                <p className="text-xs text-slate-500 mt-1">5 giờ trước</p>
              </div>
            </div>
            <div className="flex items-start pb-4 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="w-2 h-2 mt-2 rounded-full bg-purple-500 mr-4"></div>
              <div>
                <p className="text-sm font-medium text-slate-700">Bảng lương tháng đã được tạo để xét duyệt</p>
                <p className="text-xs text-slate-500 mt-1">1 ngày trước</p>
              </div>
            </div>
          </div>
          <button className="mt-4 w-full py-2 border border-slate-200 rounded text-xs hover:bg-slate-50 font-medium text-slate-600 transition-colors">
            Xem toàn bộ Audit Log
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
          <h3 className="font-semibold mb-4 text-sm">Nhiệm vụ Onboarding & Bàn giao</h3>
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <input type="checkbox" className="rounded border-slate-300" defaultChecked disabled />
              <span className="text-sm line-through text-slate-400">Tạo email công ty (John Doe)</span>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" className="rounded border-slate-300" />
              <span className="text-sm text-slate-700">Bàn giao thiết bị (Mike Johnson)</span>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" className="rounded border-slate-300" />
              <span className="text-sm text-slate-700">Gửi email chào mừng nhân viên mới</span>
            </div>
          </div>
          <button className="mt-4 w-full py-2 bg-slate-100 rounded text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors">
            Quản lý nhiệm vụ
          </button>
        </div>
      </div>

      <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <span className="flex items-center gap-1"><Server className="w-3.5 h-3.5" /> Hệ thống: <span className="text-green-600 font-bold ml-1">Bình thường</span></span>
          <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Bảo mật: <span className="text-blue-600 ml-1">Đã mã hóa dữ liệu</span></span>
          <span>Phiên bản: MVP v1.0.4</span>
        </div>
        <div className="font-medium text-slate-600">
          IP Gateway: 192.168.1.100 (Chính)
        </div>
      </div>
    </div>
  );
}
