import { Shield, Mail, Clock, MapPin } from 'lucide-react';
import { mockShiftConfig } from '../mockData';

export default function Settings() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mr-3">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Cấu hình ca làm việc</h2>
            <p className="text-xs text-slate-500">Quản lý giờ làm việc tiêu chuẩn</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Giờ bắt đầu</label>
              <input type="time" defaultValue={mockShiftConfig.startTime} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Giờ kết thúc</label>
              <input type="time" defaultValue={mockShiftConfig.endTime} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Bắt đầu nghỉ trưa</label>
              <input type="time" defaultValue={mockShiftConfig.breakStartTime} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Kết thúc nghỉ trưa</label>
              <input type="time" defaultValue={mockShiftConfig.breakEndTime} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Số ngày làm tối thiểu / tháng</label>
            <input type="number" defaultValue={mockShiftConfig.minWorkingDaysPerMonth} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
          </div>
          <button className="w-full bg-blue-600 text-white py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
            Lưu cài đặt ca làm việc
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg mr-3">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Cấu hình Email</h2>
            <p className="text-xs text-slate-500">Cài đặt tên miền email công ty</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Tên miền chính</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-200 bg-slate-50 text-slate-500 sm:text-sm">
                @
              </span>
              <input type="text" defaultValue="nova.com" className="flex-1 block w-full min-w-0 rounded-none rounded-r-md px-3 py-2 border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Cấp phát tự động</h4>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-slate-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" defaultChecked />
              <span className="ml-2 text-sm text-slate-600">Tự động tạo email cho nhân viên mới</span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-orange-50 text-orange-600 rounded-lg mr-3">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Địa điểm làm việc</h2>
            <p className="text-xs text-slate-500">Định nghĩa mạng văn phòng & GPS</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Địa chỉ IP văn phòng</label>
            <input type="text" defaultValue="192.168.1.100" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="VD: 203.0.113.0" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Wi-Fi SSID</label>
              <input type="text" defaultValue="Nova_Corporate_5G" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Bán kính GPS (m)</label>
              <input type="number" defaultValue={100} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
            </div>
          </div>
          <button className="w-full bg-slate-100 text-slate-700 py-2 rounded-md text-sm font-medium hover:bg-slate-200 transition-colors border border-slate-200">
            Thêm địa điểm
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:col-span-2">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg mr-3">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Quyền truy cập vai trò</h2>
            <p className="text-xs text-slate-500">Quản lý chức năng truy cập cho từng vai trò</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-y border-slate-200">
                <th className="p-3 font-medium">Chức năng</th>
                <th className="p-3 font-medium text-center">Super Admin</th>
                <th className="p-3 font-medium text-center">HR</th>
                <th className="p-3 font-medium text-center">Quản lý</th>
                <th className="p-3 font-medium text-center">Nhân viên</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {['Danh bạ nhân viên', 'Chấm công (Cá nhân)', 'Bảng lương (Toàn bộ)', 'Bảng lương (Cá nhân)', 'Tuyển dụng', 'Tài liệu nhạy cảm'].map((module, i) => (
                <tr key={module} className="hover:bg-slate-50">
                  <td className="p-3 text-sm font-medium text-slate-700">{module}</td>
                  <td className="p-3 text-center"><input type="checkbox" defaultChecked disabled className="rounded text-blue-600" /></td>
                  <td className="p-3 text-center"><input type="checkbox" defaultChecked={i !== 2} className="rounded text-blue-600" /></td>
                  <td className="p-3 text-center"><input type="checkbox" defaultChecked={i === 0 || i === 1 || i === 3 || i === 4} className="rounded text-blue-600" /></td>
                  <td className="p-3 text-center"><input type="checkbox" defaultChecked={i === 0 || i === 1 || i === 3} className="rounded text-blue-600" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
