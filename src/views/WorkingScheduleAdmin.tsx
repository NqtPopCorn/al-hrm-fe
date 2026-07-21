import { useEffect, useState, useMemo } from 'react';
import { CalendarCheck, CalendarClock, Edit, Check, X, Filter, BarChart3, Clock, RefreshCcw, CheckCircle, XCircle } from 'lucide-react';
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

function getInitials(name?: string) {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

interface WorkingScheduleAdminProps {
  user: User;
}

export default function WorkingScheduleAdmin({ user }: WorkingScheduleAdminProps) {
  const { showToast } = useToast();
  
  const [allRequests, setAllRequests] = useState<WorkingScheduleRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [monthFilter, setMonthFilter] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WorkingScheduleRequest | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const all = await workingScheduleRequestService.getAllRequests();
      setAllRequests(Array.isArray(all) ? all : []);
    } catch (err) {
      showToast({ type: 'error', message: 'Lỗi khi tải dữ liệu lịch làm việc.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const requestsInMonth = useMemo(() => {
    return allRequests.filter(req => {
      const reqMonth = typeof req.createdAt === 'string' 
        ? req.createdAt.substring(0, 7) 
        : new Date(req.createdAt).toISOString().substring(0, 7);
      return reqMonth === monthFilter;
    });
  }, [allRequests, monthFilter]);

  const filteredRequests = useMemo(() => {
    return requestsInMonth.filter(req => statusFilter === 'ALL' || req.status === statusFilter);
  }, [requestsInMonth, statusFilter]);

  const stats = useMemo(() => {
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    requestsInMonth.forEach(req => {
      if (req.status === 'PENDING') pendingCount++;
      else if (req.status === 'APPROVED') approvedCount++;
      else if (req.status === 'REJECTED') rejectedCount++;
    });

    return { pendingCount, approvedCount, rejectedCount, total: requestsInMonth.length };
  }, [requestsInMonth]);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-500/20"><Clock className="mr-1 h-3 w-3" /> Chờ duyệt</span>;
      case 'APPROVED':
        return <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-500/20"><CheckCircle className="mr-1 h-3 w-3" /> Đã duyệt</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-500/20"><XCircle className="mr-1 h-3 w-3" /> Từ chối</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header section with gradient */}
      <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 to-indigo-800 p-8 text-white shadow-lg">
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quản lý Lịch Làm Việc</h1>
            <p className="mt-2 text-indigo-200 max-w-2xl text-lg">
              Theo dõi và xét duyệt các yêu cầu thay đổi lịch làm việc của nhân viên.
            </p>
          </div>
          <div className="hidden sm:block bg-white/20 p-4 rounded-xl">
            <CalendarCheck className="w-12 h-12 text-white" />
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/5 blur-3xl"></div>
        <div className="absolute bottom-0 right-32 w-48 h-48 rounded-full bg-indigo-500/20 blur-3xl"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-xl p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Chờ xét duyệt</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.pendingCount}</p>
            </div>
            <div className="rounded-xl bg-amber-100 p-3 text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-xl p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Đã duyệt</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.approvedCount}</p>
            </div>
            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-xl p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Từ chối</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.rejectedCount}</p>
            </div>
            <div className="rounded-xl bg-red-100 p-3 text-red-600">
              <XCircle className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-xl p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Tổng số yêu cầu</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600">
              <BarChart3 className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Month Picker */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="bg-white rounded-xl p-1.5 inline-flex shadow-sm border border-slate-200">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                statusFilter === status
                  ? 'text-indigo-700 bg-indigo-50/80 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {status === 'ALL' && 'Tất cả'}
              {status === 'PENDING' && 'Chờ duyệt'}
              {status === 'APPROVED' && 'Đã duyệt'}
              {status === 'REJECTED' && 'Từ chối'}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">Tháng:</label>
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-white shadow-sm"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-900 text-sm">Nhân viên</th>
                <th className="px-6 py-4 font-semibold text-slate-900 text-sm">Ngày tạo</th>
                <th className="px-6 py-4 font-semibold text-slate-900 text-sm">Ngày hiệu lực</th>
                <th className="px-6 py-4 font-semibold text-slate-900 text-sm">Ngày làm việc</th>
                <th className="px-6 py-4 font-semibold text-slate-900 text-sm">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-slate-900 text-sm text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <RefreshCcw className="h-8 w-8 animate-spin text-slate-400 mb-2" />
                      <p>Đang tải dữ liệu...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <div className="rounded-full bg-slate-100 p-3 mb-3">
                        <Filter className="h-6 w-6 text-slate-400" />
                      </div>
                      <p className="text-base font-medium text-slate-900">Không tìm thấy yêu cầu nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 text-sm font-bold text-indigo-700 shadow-sm">
                          {getInitials(req.employee?.fullName)}
                        </div>
                        {req.employee?.fullName ? (
                          <div>
                            <div className="font-semibold text-slate-900">{req.employee.fullName}</div>
                            <div className="text-xs font-normal text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-0.5">{req.employee.code}</div>
                          </div>
                        ) : (
                          <div className="text-slate-500">{req.employeeId?.slice(0,8) || 'N/A'}...</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {req.effectiveDate}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="flex gap-1 min-w-[160px]">
                        {DAYS_OF_WEEK.map(day => (
                          <span key={day.value} className={`text-[10px] px-1.5 py-0.5 rounded ${req.workingDays.includes(day.value) ? 'bg-indigo-100 text-indigo-700 font-medium' : 'bg-slate-100 text-slate-400'}`}>
                            {day.label[0]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {req.status === 'PENDING' ? (
                        <button
                          onClick={() => openReviewModal(req)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Duyệt
                        </button>
                      ) : (
                        <button
                          onClick={() => openReviewModal(req)}
                          className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          Chi tiết
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} title="Chi Tiết Yêu Cầu">
        {selectedRequest && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 text-lg font-bold text-indigo-700 shadow-sm border border-indigo-50">
                {getInitials(selectedRequest.employee?.fullName)}
              </div>
              <div>
                <div className="text-base font-bold text-slate-900">
                  {selectedRequest.employee?.fullName || 'Không rõ'}
                </div>
                <div className="text-xs font-medium text-slate-500 bg-slate-100 inline-flex px-2 py-0.5 rounded mt-1">
                  Mã NV: {selectedRequest.employee?.code || selectedRequest.employeeId?.slice(0,8)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Ngày hiệu lực</span>
                <span className="font-semibold text-slate-900 text-base">{selectedRequest.effectiveDate}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Trạng thái</span>
                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase block mb-2">Lịch làm việc yêu cầu</span>
              <div className="flex gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <div 
                    key={day.value} 
                    className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg text-sm font-bold ${selectedRequest.workingDays.includes(day.value) ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                  >
                    {day.label}
                  </div>
                ))}
              </div>
            </div>

            {selectedRequest.status !== 'PENDING' ? (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <span className="text-xs font-semibold text-slate-500 uppercase block mb-2">Ghi chú duyệt</span>
                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700 border border-slate-100 min-h-[60px]">
                  {selectedRequest.rejectMessage || 'Không có ghi chú.'}
                </div>
                {selectedRequest.reviewerId === 'system' && (
                  <p className="text-xs text-amber-600 font-medium mt-3 flex items-center">
                    <CalendarClock className="w-3 h-3 mr-1" /> Đã được tự động duyệt bởi hệ thống sau 12h.
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Lý do từ chối (Tùy chọn)</label>
                  <textarea
                    rows={3}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                    placeholder="Nhập lý do nếu từ chối..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => void reviewRequest('REJECTED')}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-all shadow-sm"
                  >
                    <X className="h-4 w-4" />
                    Từ chối
                  </button>
                  <button
                    onClick={() => void reviewRequest('APPROVED')}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-sm"
                  >
                    <Check className="h-4 w-4" />
                    Phê duyệt
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
