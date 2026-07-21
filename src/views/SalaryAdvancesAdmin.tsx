import { useState, useMemo } from 'react';
import { useSalaryAdvances } from '../hooks/useSalaryAdvances';
import { User } from '../types';
import { CheckCircle, XCircle, Clock, Banknote, Eye, Check, X, Filter, BarChart3, TrendingUp, RefreshCcw } from 'lucide-react';
import Modal from '../components/Modal';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN');
}

function getInitials(name?: string) {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

interface SalaryAdvancesAdminProps {
  user: User;
}

export default function SalaryAdvancesAdmin({ user }: SalaryAdvancesAdminProps) {
  const isAdmin = true;
  const { advances, isLoading, updateStatus } = useSalaryAdvances(isAdmin);
  
  const [selectedAdvance, setSelectedAdvance] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [monthFilter, setMonthFilter] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [isVietQRModalOpen, setIsVietQRModalOpen] = useState(false);
  const [advanceToPay, setAdvanceToPay] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNote, setPaymentNote] = useState<string>('');

  const advancesInMonth = useMemo(() => {
    return advances.filter(a => {
      const advanceMonth = typeof a.date === 'string' 
        ? a.date.substring(0, 7) 
        : new Date(a.date).toISOString().substring(0, 7);
      return advanceMonth === monthFilter;
    });
  }, [advances, monthFilter]);

  const filteredAdvances = useMemo(() => {
    return advancesInMonth.filter(a => statusFilter === 'ALL' || a.status === statusFilter);
  }, [advancesInMonth, statusFilter]);

  // Thống kê
  const stats = useMemo(() => {
    let pendingCount = 0;
    let pendingAmount = 0;
    let approvedAmount = 0;
    let paidAmount = 0;

    advancesInMonth.forEach(a => {
      if (a.status === 'PENDING') {
        pendingCount++;
        pendingAmount += a.amount;
      } else if (a.status === 'APPROVED') {
        approvedAmount += a.amount;
      } else if (a.status === 'PAID') {
        paidAmount += a.amount;
      }
    });

    return { pendingCount, pendingAmount, approvedAmount, paidAmount };
  }, [advancesInMonth]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-500/20"><Clock className="mr-1 h-3 w-3" /> Chờ duyệt</span>;
      case 'APPROVED':
        return <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-500/20"><CheckCircle className="mr-1 h-3 w-3" /> Đã duyệt</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-500/20"><XCircle className="mr-1 h-3 w-3" /> Từ chối</span>;
      case 'PAID':
        return <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-500/20"><Banknote className="mr-1 h-3 w-3" /> Đã chi trả</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header section with gradient */}
      <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white shadow-lg">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Tạm ứng</h1>
          <p className="mt-2 text-slate-300 max-w-2xl text-lg">
            Theo dõi, xét duyệt và thanh toán các yêu cầu tạm ứng lương từ nhân viên.
          </p>
        </div>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/5 blur-3xl"></div>
        <div className="absolute bottom-0 right-32 w-48 h-48 rounded-full bg-blue-500/20 blur-3xl"></div>
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
          <div className="mt-4 flex items-center text-sm">
            <span className="text-slate-500">Tổng tiền: <span className="font-medium text-amber-700">{formatCurrency(stats.pendingAmount)}</span></span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-xl p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Đã duyệt (Chờ chi trả)</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(stats.approvedAmount)}</p>
            </div>
            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-xl p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Đã chi trả</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(stats.paidAmount)}</p>
            </div>
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-xl p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Tổng số yêu cầu</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{advancesInMonth.length}</p>
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
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'PAID'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                statusFilter === status
                  ? 'text-blue-700 bg-blue-50/80 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {status === 'ALL' && 'Tất cả'}
              {status === 'PENDING' && 'Chờ duyệt'}
              {status === 'APPROVED' && 'Đã duyệt'}
              {status === 'REJECTED' && 'Từ chối'}
              {status === 'PAID' && 'Đã chi trả'}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">Tháng:</label>
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white shadow-sm"
          />
        </div>
      </div>


      {/* Data Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-900">Nhân viên</th>
                <th className="px-6 py-4 font-semibold text-slate-900">Kỳ lương</th>
                <th className="px-6 py-4 font-semibold text-slate-900">Ngày yêu cầu</th>
                <th className="px-6 py-4 text-right font-semibold text-slate-900">Số tiền</th>
                <th className="px-6 py-4 font-semibold text-slate-900">Lý do</th>
                <th className="px-6 py-4 font-semibold text-slate-900">Trạng thái</th>
                <th className="px-6 py-4 text-right font-semibold text-slate-900">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <RefreshCcw className="h-8 w-8 animate-spin text-slate-400 mb-2" />
                      <p>Đang tải dữ liệu...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredAdvances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <div className="rounded-full bg-slate-100 p-3 mb-3">
                        <Filter className="h-6 w-6 text-slate-400" />
                      </div>
                      <p className="text-base font-medium text-slate-900">Không tìm thấy yêu cầu nào</p>
                      <p className="mt-1 text-sm">Không có dữ liệu phù hợp với bộ lọc hiện tại.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAdvances.map(advance => (
                  <tr key={advance.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 text-sm font-bold text-indigo-700 shadow-sm">
                          {getInitials(advance.employee?.fullName)}
                        </div>
                        {advance.employee?.fullName ? (
                          <div>
                            <div className="font-semibold text-slate-900">{advance.employee.fullName}</div>
                            <div className="text-xs font-normal text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-0.5">{advance.employee.code}</div>
                          </div>
                        ) : (
                          <div className="text-slate-500">{advance.employeeId.slice(0,8)}...</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{advance.periodCode}</td>
                    <td className="px-6 py-4 text-slate-500">{formatDateLabel(advance.date)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-slate-900">{formatCurrency(advance.amount)}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate" title={advance.reason}>
                      {advance.reason}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(advance.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          title="Xem chi tiết"
                          onClick={() => setSelectedAdvance(advance)}
                          className="rounded-lg p-2 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {advance.status === 'PENDING' && (
                          <>
                            <button
                              title="Duyệt yêu cầu"
                              onClick={() => updateStatus(advance.id, { status: 'APPROVED' })}
                              className="rounded-lg p-2 text-blue-600 transition-all hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              title="Từ chối yêu cầu"
                              onClick={() => updateStatus(advance.id, { status: 'REJECTED' })}
                              className="rounded-lg p-2 text-red-600 transition-all hover:bg-red-50 hover:text-red-700 hover:shadow-sm"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {advance.status === 'APPROVED' && (
                          <button
                            title="Thanh toán VietQR"
                            onClick={() => {
                              setAdvanceToPay(advance);
                              setPaymentAmount(advance.amount);
                              setPaymentNote(`Thanh toan tam ung ky ${advance.periodCode} cho ${advance.employee?.code || advance.employeeId.slice(0,8)}`);
                              setIsVietQRModalOpen(true);
                            }}
                            className="rounded-lg p-2 text-emerald-600 transition-all hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-sm"
                          >
                            <Banknote className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedAdvance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 transition-all">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 px-6 py-5 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Chi tiết tạm ứng</h2>
              <div className="mt-2">{getStatusBadge(selectedAdvance.status)}</div>
              <button
                onClick={() => setSelectedAdvance(null)}
                className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-white hover:text-slate-700 hover:shadow-sm"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 text-xl font-bold text-indigo-700 shadow-sm border border-indigo-50">
                  {getInitials(selectedAdvance.employee?.fullName)}
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900">
                    {selectedAdvance.employee?.fullName || 'Không rõ'}
                  </div>
                  <div className="text-sm font-medium text-slate-500 bg-slate-100 inline-flex px-2 py-0.5 rounded mt-1">
                    Mã NV: {selectedAdvance.employee?.code || selectedAdvance.employeeId.slice(0,8)}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div>
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Kỳ lương</span>
                  <span className="mt-1 block font-medium text-slate-900">{selectedAdvance.periodCode}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày gửi</span>
                  <span className="mt-1 block font-medium text-slate-900">{formatDateLabel(selectedAdvance.date)}</span>
                </div>
              </div>
              
              <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50">
                <span className="block text-xs font-semibold text-blue-600/70 uppercase tracking-wider">Số tiền yêu cầu</span>
                <span className="mt-1 block text-3xl font-bold text-blue-700">{formatCurrency(selectedAdvance.amount)}</span>
              </div>
              
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Lý do</span>
                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700 border border-slate-100 min-h-[80px]">
                  {selectedAdvance.reason}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-200">
              <div className="flex gap-2">
                {selectedAdvance.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => {
                        updateStatus(selectedAdvance.id, { status: 'APPROVED' });
                        setSelectedAdvance({ ...selectedAdvance, status: 'APPROVED' });
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-all hover:shadow"
                    >
                      <Check className="h-4 w-4" /> Duyệt yêu cầu
                    </button>
                    <button
                      onClick={() => {
                        updateStatus(selectedAdvance.id, { status: 'REJECTED' });
                        setSelectedAdvance({ ...selectedAdvance, status: 'REJECTED' });
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 shadow-sm transition-all"
                    >
                      <X className="h-4 w-4" /> Từ chối
                    </button>
                  </>
                )}
                {selectedAdvance.status === 'APPROVED' && (
                  <button
                    onClick={() => {
                      setAdvanceToPay(selectedAdvance);
                      setPaymentAmount(selectedAdvance.amount);
                      setPaymentNote(`Thanh toan tam ung ky ${selectedAdvance.periodCode} cho ${selectedAdvance.employee?.code || selectedAdvance.employeeId.slice(0,8)}`);
                      setIsVietQRModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 shadow-sm transition-all hover:shadow"
                  >
                    <Banknote className="h-4 w-4" /> Thanh toán VietQR
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedAdvance(null)}
                className="rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VietQR Modal */}
      {isVietQRModalOpen && advanceToPay && (
        <Modal
          isOpen={isVietQRModalOpen}
          onClose={() => setIsVietQRModalOpen(false)}
          title="Thanh toán tạm ứng qua VietQR"
        >
          <div className="space-y-4">
            {!advanceToPay.employee?.bankSnapshot?.bankId || !advanceToPay.employee?.bankSnapshot?.bankAccountNumber ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 flex items-start gap-3">
                <Clock className="h-5 w-5 shrink-0 mt-0.5" />
                <p>Nhân viên này chưa cập nhật đầy đủ thông tin ngân hàng. Vui lòng cập nhật trong hồ sơ nhân viên trước.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-center py-4 bg-slate-50 rounded-xl border border-slate-100">
                  <img
                    src={`https://img.vietqr.io/image/${advanceToPay.employee.bankSnapshot.bankId}-${advanceToPay.employee.bankSnapshot.bankAccountNumber}-compact2.png?amount=${paymentAmount}&addInfo=${encodeURIComponent(paymentNote)}&accountName=${encodeURIComponent(advanceToPay.employee.bankSnapshot.bankAccountName || '')}`}
                    alt="VietQR"
                    className="w-64 h-64 object-contain rounded-xl border border-slate-200 shadow-sm bg-white p-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Số tiền thanh toán</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 pl-3 pr-12 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-medium"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                      VNĐ
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Nội dung chuyển khoản</label>
                  <input
                    type="text"
                    value={paymentNote}
                    onChange={e => setPaymentNote(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                  <button
                    onClick={() => setIsVietQRModalOpen(false)}
                    className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    disabled={paymentAmount <= 0}
                    onClick={async () => {
                      try {
                        const updated = await updateStatus(advanceToPay.id, { status: 'PAID' });
                        if (selectedAdvance?.id === advanceToPay.id) {
                          setSelectedAdvance(updated);
                        }
                        setIsVietQRModalOpen(false);
                      } catch (err) {
                        // Error is handled by hook
                      }
                    }}
                    className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60 shadow-sm transition-all hover:shadow"
                  >
                    Xác nhận đã thanh toán
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
