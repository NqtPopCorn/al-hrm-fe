import { useEffect, useState } from 'react';
import { CalendarCheck, CalendarDays, CalendarClock, AlertCircle, Edit, CheckCircle, XCircle, Clock, RefreshCcw, Info } from 'lucide-react';
import { User } from '../types';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { workingScheduleRequestService, WorkingScheduleRequest } from '../services/working-schedule-request.service';

const DAYS_OF_WEEK = [
  { label: "Mon", value: "MON" },
  { label: "Tue", value: "TUE" },
  { label: "Wed", value: "WED" },
  { label: "Thu", value: "THU" },
  { label: "Fri", value: "FRI" },
  { label: "Sat", value: "SAT" },
  { label: "Sun", value: "SUN" },
];

interface WorkingScheduleEmployeeProps {
  user: User;
}

export default function WorkingScheduleEmployee({ user }: WorkingScheduleEmployeeProps) {
  const { showToast } = useToast();
  
  const [currentSchedule, setCurrentSchedule] = useState<WorkingScheduleRequest | null>(null);
  const [myRequests, setMyRequests] = useState<WorkingScheduleRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const [effectiveDate, setEffectiveDate] = useState('');
  const [workingDays, setWorkingDays] = useState<string[]>(['MON', 'TUE', 'WED', 'THU', 'FRI']);
  const [selectedRequest, setSelectedRequest] = useState<WorkingScheduleRequest | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const current = await workingScheduleRequestService.getCurrentSchedule();
      setCurrentSchedule(current || null);

      const requests = await workingScheduleRequestService.getMyRequests();
      setMyRequests(Array.isArray(requests) ? requests : []);
    } catch (err) {
      showToast({ type: 'error', message: 'Lỗi khi tải dữ liệu lịch làm việc.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleToggleDay = (dayValue: string) => {
    setWorkingDays(prev => 
      prev.includes(dayValue) 
        ? prev.filter(d => d !== dayValue) 
        : [...prev, dayValue]
    );
  };

  const getDefaultEffectiveDate = () => {
    let date = new Date();
    date.setDate(date.getDate() + 3);
    while (date.getDay() !== 1) { // 1 = Monday
      date.setDate(date.getDate() + 1);
    }
    return date.toISOString().split('T')[0];
  };

  const openRequestModal = () => {
    setEffectiveDate(getDefaultEffectiveDate());
    setWorkingDays(['MON', 'TUE', 'WED', 'THU', 'FRI']);
    setIsRequestModalOpen(true);
  };

  const submitRequest = async () => {
    if (!effectiveDate || workingDays.length === 0) {
      showToast({ type: 'error', message: 'Vui lòng chọn ngày hiệu lực và ít nhất một ngày làm việc.' });
      return;
    }
    try {
      await workingScheduleRequestService.createRequest({
        effectiveDate,
        workingDays,
      });
      showToast({ type: 'success', message: 'Đăng ký lịch làm việc thành công.' });
      setIsRequestModalOpen(false);
      void loadData();
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || 'Lỗi khi tạo yêu cầu.' });
    }
  };

  const openDetailModal = (req: WorkingScheduleRequest) => {
    setSelectedRequest(req);
    setIsDetailModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-500/20"><Clock className="mr-1 h-3 w-3" /> Đang chờ duyệt</span>;
      case 'APPROVED':
        return <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-500/20"><CheckCircle className="mr-1 h-3 w-3" /> Đã được duyệt</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-500/20"><XCircle className="mr-1 h-3 w-3" /> Đã từ chối</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Current Schedule Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-white/20 p-5 rounded-2xl backdrop-blur-md">
              <CalendarCheck className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Lịch Làm Việc Của Bạn</h2>
              <p className="text-blue-100 mt-1.5 text-base opacity-90">
                {currentSchedule ? `Hiệu lực từ ngày: ${new Date(currentSchedule.effectiveDate).toLocaleDateString()}` : 'Bạn chưa có lịch làm việc cố định'}
              </p>
            </div>
          </div>
          
          <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/20">
            <div className="text-sm text-blue-100 mb-2 font-medium">Các ngày làm việc:</div>
            <div className="flex gap-2">
              {DAYS_OF_WEEK.map(day => {
                const isWorking = currentSchedule?.workingDays.includes(day.value);
                return (
                  <div 
                    key={day.value} 
                    className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg text-xs font-bold transition-all ${
                      isWorking 
                        ? 'bg-white text-blue-700 shadow-md transform hover:scale-105' 
                        : 'bg-black/20 text-white/40'
                    }`}
                  >
                    {day.label[0]}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full bg-blue-400/20 blur-3xl"></div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Yêu Cầu Thay Đổi Lịch Làm Việc</h3>
            <p className="mt-1 text-sm text-slate-500">Xem lại lịch sử đăng ký của bạn</p>
          </div>
          <button
            onClick={openRequestModal}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-2"
          >
            <CalendarClock className="w-4 h-4" />
            Đăng ký lịch mới
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày tạo</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày hiệu lực</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Lịch đăng ký</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <RefreshCcw className="h-8 w-8 animate-spin text-slate-400 mb-2" />
                      <p>Đang tải dữ liệu...</p>
                    </div>
                  </td>
                </tr>
              ) : myRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <div className="rounded-full bg-slate-100 p-4 mb-3">
                        <CalendarDays className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-base font-medium text-slate-900">Chưa có yêu cầu nào</p>
                      <p className="mt-1 text-sm">Bạn có thể đăng ký thay đổi lịch làm việc bằng nút phía trên.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                myRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                      {req.effectiveDate}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1.5 flex-wrap">
                        {DAYS_OF_WEEK.map(day => (
                          <span key={day.value} className={`text-xs px-2 py-1 rounded-md ${req.workingDays.includes(day.value) ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-slate-100 text-slate-400'}`}>
                            {day.label[0]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openDetailModal(req)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center justify-center"
                        title="Xem chi tiết"
                      >
                        <Info className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Modal */}
      <Modal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} title="Đăng Ký Lịch Làm Việc Mới">
        <div className="space-y-6">
          <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200/60 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-800">Lưu ý quan trọng</h4>
              <p className="text-xs text-amber-700/90 mt-1 leading-relaxed">
                Ngày hiệu lực mặc định là <strong>Thứ 2 tuần tới</strong>. Bạn cần đăng ký cách ngày hiệu lực <strong>ít nhất 3 ngày</strong> để quản lý có thời gian sắp xếp. Nếu sau 12h không có phản hồi, yêu cầu sẽ tự động được phê duyệt bởi hệ thống.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Ngày hiệu lực áp dụng</label>
            <input 
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Chọn ngày làm việc trong tuần</label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => handleToggleDay(day.value)}
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all ${
                    workingDays.includes(day.value) 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md transform hover:scale-105' 
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-medium uppercase tracking-wider opacity-80">{day.label}</span>
                </button>
              ))}
            </div>
            {workingDays.length === 0 && (
              <p className="text-xs text-red-500 mt-2 font-medium">Vui lòng chọn ít nhất 1 ngày làm việc.</p>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              onClick={() => setIsRequestModalOpen(false)}
              className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
            >
              Hủy bỏ
            </button>
            <button
              onClick={() => void submitRequest()}
              disabled={workingDays.length === 0 || !effectiveDate}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 rounded-xl transition-all shadow-sm hover:shadow"
            >
              Gửi yêu cầu
            </button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Chi Tiết Yêu Cầu">
        {selectedRequest && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Ngày hiệu lực</span>
                <span className="font-bold text-slate-900 text-base">{selectedRequest.effectiveDate}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Trạng thái</span>
                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase block mb-3">Lịch làm việc đã đăng ký</span>
              <div className="flex gap-2 flex-wrap">
                {DAYS_OF_WEEK.map(day => (
                  <div 
                    key={day.value} 
                    className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl text-sm font-bold ${selectedRequest.workingDays.includes(day.value) ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                  >
                    {day.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-5 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase block mb-2">Phản hồi từ quản lý</span>
              {selectedRequest.status === 'PENDING' ? (
                <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700 border border-amber-100 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Yêu cầu của bạn đang chờ được xử lý.
                </div>
              ) : (
                <div className={`rounded-xl p-4 text-sm border min-h-[60px] ${
                  selectedRequest.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-800 border-red-100'
                }`}>
                  {selectedRequest.rejectMessage ? (
                    <p>{selectedRequest.rejectMessage}</p>
                  ) : (
                    <p className="opacity-70 italic">Không có ghi chú thêm.</p>
                  )}
                </div>
              )}
              
              {selectedRequest.reviewerId === 'system' && selectedRequest.status === 'APPROVED' && (
                <p className="text-xs text-blue-600 font-medium mt-3 flex items-center">
                  <Info className="w-3 h-3 mr-1.5" /> Yêu cầu đã được phê duyệt tự động bởi hệ thống do quá thời gian chờ.
                </p>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
