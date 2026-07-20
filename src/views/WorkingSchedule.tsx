import { useEffect, useState } from 'react';
import { Calendar, CalendarCheck, CalendarDays, CalendarClock, AlertCircle, Edit } from 'lucide-react';
import { User } from '../types';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { workingScheduleRequestService, WorkingScheduleRequest, CreateWorkingScheduleRequestDto } from '../services/working-schedule-request.service';

const DAYS_OF_WEEK = [
  { label: "Mon", value: "MON" },
  { label: "Tue", value: "TUE" },
  { label: "Wed", value: "WED" },
  { label: "Thu", value: "THU" },
  { label: "Fri", value: "FRI" },
  { label: "Sat", value: "SAT" },
  { label: "Sun", value: "SUN" },
];

export default function WorkingSchedule({ user }: { user: User }) {
  const { showToast } = useToast();
  const isAdmin = user.role === 'Super Admin' || user.role === 'HR Admin' || user.role === 'Manager';
  
  const [currentSchedule, setCurrentSchedule] = useState<WorkingScheduleRequest | null>(null);
  const [myRequests, setMyRequests] = useState<WorkingScheduleRequest[]>([]);
  const [allRequests, setAllRequests] = useState<WorkingScheduleRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'MY_REQUESTS' | 'ALL_REQUESTS'>(isAdmin ? 'ALL_REQUESTS' : 'MY_REQUESTS');

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  
  // Form states
  const [effectiveDate, setEffectiveDate] = useState('');
  const [workingDays, setWorkingDays] = useState<string[]>(['MON', 'TUE', 'WED', 'THU', 'FRI']);
  const [selectedRequest, setSelectedRequest] = useState<WorkingScheduleRequest | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (isAdmin) {
        const all = await workingScheduleRequestService.getAllRequests();
        setAllRequests(Array.isArray(all) ? all : []);
      }
      
      const current = await workingScheduleRequestService.getCurrentSchedule();
      setCurrentSchedule(current || null);

      const requests = await workingScheduleRequestService.getMyRequests();
      setMyRequests(Array.isArray(requests) ? requests : []);
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to load working schedule data.' });
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
      showToast({ type: 'error', message: 'Vui lòng chọn ngày hiệu lực và ngày làm việc.' });
      return;
    }
    try {
      await workingScheduleRequestService.createRequest({
        effectiveDate,
        workingDays,
      });
      showToast({ type: 'success', message: 'Tạo yêu cầu thành công.' });
      setIsRequestModalOpen(false);
      void loadData();
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || 'Lỗi khi tạo yêu cầu.' });
    }
  };

  const openReviewModal = (req: WorkingScheduleRequest) => {
    setSelectedRequest(req);
    setReviewNote(req.rejectMessage || '');
    setIsReviewModalOpen(true);
  };

  const reviewRequest = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedRequest) return;
    try {
      await workingScheduleRequestService.reviewRequest(selectedRequest.id, {
        status,
        rejectMessage: reviewNote,
      });
      showToast({ type: 'success', message: `Đã ${status === 'APPROVED' ? 'phê duyệt' : 'từ chối'} yêu cầu.` });
      setIsReviewModalOpen(false);
      void loadData();
    } catch (err: any) {
      showToast({ type: 'error', message: err.response?.data?.message || 'Lỗi khi duyệt yêu cầu.' });
    }
  };

  const renderStatus = (status: string) => {
    if (status === 'APPROVED') return <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-green-100 text-green-700">Approved</span>;
    if (status === 'REJECTED') return <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700">Rejected</span>;
    return <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-700">Pending</span>;
  };

  return (
    <div className="space-y-6">
      {/* Current Schedule Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-4 rounded-xl">
            <CalendarCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Lịch Làm Việc Hiện Tại</h2>
            <p className="text-blue-100 mt-1 text-sm">
              {currentSchedule ? `Hiệu lực từ: ${currentSchedule.effectiveDate}` : 'Chưa có lịch đăng ký'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {DAYS_OF_WEEK.map(day => {
            const isWorking = currentSchedule?.workingDays.includes(day.value);
            return (
              <div 
                key={day.value} 
                className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg text-xs font-bold ${
                  isWorking ? 'bg-white text-blue-700' : 'bg-white/10 text-white/50'
                }`}
              >
                {day.label[0]}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white gap-4">
          <div>
            <h3 className="font-semibold text-sm">Yêu Cầu Thay Đổi Lịch Làm Việc</h3>
            <p className="mt-1 text-xs text-slate-500">Lịch sử đăng ký và xét duyệt</p>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('MY_REQUESTS')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeTab === 'MY_REQUESTS' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Của tôi
                </button>
                <button
                  onClick={() => setActiveTab('ALL_REQUESTS')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeTab === 'ALL_REQUESTS' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Quản lý
                </button>
              </div>
            )}
            <button
              onClick={openRequestModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center"
            >
              <CalendarClock className="w-4 h-4 mr-2" />
              Đăng ký lịch mới
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Ngày tạo</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Ngày hiệu lực</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Ngày làm việc</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(activeTab === 'ALL_REQUESTS' ? allRequests : myRequests)?.map(req => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {req.effectiveDate}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="flex gap-1">
                      {DAYS_OF_WEEK.map(day => (
                        <span key={day.value} className={`text-[10px] px-1.5 py-0.5 rounded ${req.workingDays.includes(day.value) ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                          {day.label[0]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {renderStatus(req.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isAdmin && activeTab === 'ALL_REQUESTS' && req.status === 'PENDING' ? (
                      <button
                        onClick={() => openReviewModal(req)}
                        className="text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center text-xs font-medium"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Duyệt
                      </button>
                    ) : (
                      <button
                        onClick={() => openReviewModal(req)}
                        className="text-slate-600 hover:text-slate-800 transition-colors inline-flex items-center text-xs font-medium"
                      >
                        Chi tiết
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && (activeTab === 'ALL_REQUESTS' ? allRequests : myRequests)?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                    Chưa có yêu cầu nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} title="Đăng Ký Lịch Làm Việc Mới">
        <div className="space-y-4">
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-800">Lưu ý</h4>
              <p className="text-xs text-amber-700 mt-1">
                Ngày hiệu lực mặc định là Thứ 2 tuần tới. Đăng ký phải cách ngày hiệu lực ít nhất 3 ngày để quản lý có thời gian phản hồi. Nếu sau 12h không có phản hồi, yêu cầu sẽ tự động được phê duyệt.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ngày hiệu lực (YYYY-MM-DD)</label>
            <input 
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Ngày làm việc</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => handleToggleDay(day.value)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    workingDays.includes(day.value) 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              onClick={() => setIsRequestModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={() => void submitRequest()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Gửi yêu cầu
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} title="Chi Tiết Yêu Cầu">
        {selectedRequest && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block mb-1">Ngày hiệu lực</span>
                <span className="font-semibold text-slate-900">{selectedRequest.effectiveDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Trạng thái</span>
                {renderStatus(selectedRequest.status)}
              </div>
            </div>

            <div>
              <span className="text-slate-500 block mb-2">Ngày làm việc đăng ký</span>
              <div className="flex gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <span key={day.value} className={`px-3 py-1.5 rounded-md text-xs font-semibold ${selectedRequest.workingDays.includes(day.value) ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                    {day.label}
                  </span>
                ))}
              </div>
            </div>

            {selectedRequest.status !== 'PENDING' ? (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <span className="text-slate-500 block mb-1">Ghi chú duyệt</span>
                <p className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {selectedRequest.rejectMessage || 'Không có ghi chú.'}
                </p>
                {selectedRequest.reviewerId === 'system' && (
                  <p className="text-xs text-amber-600 font-medium mt-2 flex items-center">
                    <CalendarClock className="w-3 h-3 mr-1" /> Đã được tự động duyệt bởi hệ thống sau 12h.
                  </p>
                )}
              </div>
            ) : isAdmin ? (
              <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Lý do từ chối (Tùy chọn)</label>
                  <textarea
                    rows={2}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                    placeholder="Nhập lý do nếu từ chối..."
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => void reviewRequest('REJECTED')}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                  >
                    Từ chối
                  </button>
                  <button
                    onClick={() => void reviewRequest('APPROVED')}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    Phê duyệt
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-4 pt-4 border-t border-slate-200">
                Đang chờ quản lý phê duyệt.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
