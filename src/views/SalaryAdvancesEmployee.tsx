import { useState, useMemo, useEffect } from 'react';
import { useSalaryAdvances } from '../hooks/useSalaryAdvances';
import { usePayroll } from '../hooks/usePayroll';
import { User } from '../types';
import { CheckCircle, XCircle, Clock, Banknote, X, Plus, Wallet, FileText, Sparkles } from 'lucide-react';

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

interface SalaryAdvancesEmployeeProps {
  user: User;
}

export default function SalaryAdvancesEmployee({ user }: SalaryAdvancesEmployeeProps) {
  const { advances, isLoading, createAdvance } = useSalaryAdvances(false);
  const { periods } = usePayroll({ loadPeriods: true });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    periodCode: '',
    amount: '',
    reason: '',
  });

  const latestUnpaidPeriodCode = useMemo(() => {
    const unpaid = periods.filter(p => p.status !== 'PAID' && p.status !== 'CANCELLED');
    unpaid.sort((a, b) => b.code.localeCompare(a.code));
    return unpaid[0]?.code || '';
  }, [periods]);

  useEffect(() => {
    if (isModalOpen) {
      setForm(prev => ({ ...prev, periodCode: latestUnpaidPeriodCode }));
    }
  }, [isModalOpen, latestUnpaidPeriodCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAdvance({
      periodCode: form.periodCode,
      date: new Date().toISOString(),
      amount: Number(form.amount),
      reason: form.reason,
    });
    setIsModalOpen(false);
    setForm({ periodCode: '', amount: '', reason: '' });
  };

  const currentMonthAdvances = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let total = 0;
    advances.forEach(a => {
      const d = new Date(a.date);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear && a.status !== 'REJECTED') {
        total += a.amount;
      }
    });
    return total;
  }, [advances]);

  // Sắp xếp các yêu cầu mới nhất lên đầu
  const sortedAdvances = useMemo(() => {
    return [...advances].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [advances]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          icon: <Clock className="h-5 w-5" />,
          title: 'Chờ xét duyệt',
          color: 'text-amber-600',
          bg: 'bg-amber-100',
          border: 'border-amber-200',
          gradient: 'from-amber-50 to-white',
          progress: 33
        };
      case 'APPROVED':
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          title: 'Đã được duyệt',
          color: 'text-blue-600',
          bg: 'bg-blue-100',
          border: 'border-blue-200',
          gradient: 'from-blue-50 to-white',
          progress: 66
        };
      case 'REJECTED':
        return {
          icon: <XCircle className="h-5 w-5" />,
          title: 'Đã từ chối',
          color: 'text-red-600',
          bg: 'bg-red-100',
          border: 'border-red-200',
          gradient: 'from-red-50 to-white',
          progress: 100
        };
      case 'PAID':
        return {
          icon: <Banknote className="h-5 w-5" />,
          title: 'Đã chi trả',
          color: 'text-emerald-600',
          bg: 'bg-emerald-100',
          border: 'border-emerald-200',
          gradient: 'from-emerald-50 to-white',
          progress: 100
        };
      default:
        return {
          icon: <FileText className="h-5 w-5" />,
          title: 'Không rõ',
          color: 'text-slate-600',
          bg: 'bg-slate-100',
          border: 'border-slate-200',
          gradient: 'from-slate-50 to-white',
          progress: 0
        };
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header with Stats & Actions */}
      <div className="mb-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Tạm ứng lương <Sparkles className="h-6 w-6 text-blue-500" />
          </h1>
          <p className="mt-2 text-slate-500 max-w-2xl text-base">
            Tạo và theo dõi các yêu cầu tạm ứng lương của bạn một cách dễ dàng và nhanh chóng.
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200 flex-1 md:flex-none flex items-center gap-4">
            <div className="rounded-full bg-blue-100 p-3 text-blue-600">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Đã tạm ứng tháng này</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(currentMonthAdvances)}</p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="group relative flex-none md:flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
            <span>Tạo yêu cầu</span>
            <div className="absolute inset-0 -z-10 rounded-2xl bg-blue-600 opacity-20 blur-xl transition-opacity group-hover:opacity-40"></div>
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse h-64">
              <div className="h-12 w-12 rounded-full bg-slate-200 mb-4"></div>
              <div className="h-6 w-1/2 bg-slate-200 rounded mb-4"></div>
              <div className="h-10 w-full bg-slate-200 rounded mb-4"></div>
              <div className="h-2 w-full bg-slate-200 rounded mt-auto"></div>
            </div>
          ))
        ) : sortedAdvances.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-slate-900">Chưa có yêu cầu nào</h3>
            <p className="mt-1 text-slate-500">Bạn chưa tạo yêu cầu tạm ứng lương nào.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" /> Tạo yêu cầu đầu tiên
            </button>
          </div>
        ) : (
          sortedAdvances.map(advance => {
            const status = getStatusInfo(advance.status);
            return (
              <div 
                key={advance.id} 
                className={`relative overflow-hidden rounded-3xl border ${status.border} bg-gradient-to-b ${status.gradient} p-6 shadow-sm transition-all hover:shadow-md group`}
              >
                {/* Background Pattern */}
                <div className="absolute right-0 top-0 -mr-8 -mt-8 opacity-10 transition-transform group-hover:scale-110">
                  {status.icon}
                </div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`inline-flex items-center gap-1.5 rounded-full ${status.bg} px-3 py-1 text-xs font-semibold ${status.color}`}>
                      {status.icon}
                      {status.title}
                    </div>
                    <span className="text-xs font-medium text-slate-500 bg-white/60 px-2 py-1 rounded-md backdrop-blur-sm">
                      {formatDateLabel(advance.date)}
                    </span>
                  </div>

                  <div className="mb-6">
                    <p className="text-sm font-medium text-slate-500 mb-1">Số tiền yêu cầu</p>
                    <p className="text-3xl font-bold text-slate-900">{formatCurrency(advance.amount)}</p>
                  </div>

                  <div className="mb-6 flex-1">
                    <div className="rounded-xl bg-white/60 p-3 text-sm text-slate-700 backdrop-blur-sm border border-slate-100/50 line-clamp-2" title={advance.reason}>
                      {advance.reason || <span className="text-slate-400 italic">Không có lý do</span>}
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-200/50">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
                      <span>Kỳ lương: <strong className="text-slate-700">{advance.periodCode}</strong></span>
                      {advance.status !== 'REJECTED' && <span>Tiến độ</span>}
                    </div>
                    {advance.status !== 'REJECTED' && (
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/50">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            advance.status === 'PAID' ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${status.progress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 px-6 py-8 text-white">
              <h2 className="text-2xl font-bold">Tạo yêu cầu tạm ứng</h2>
              <p className="mt-2 text-blue-100 text-sm">Điền thông tin phiếu tạm ứng lương cho kỳ tiếp theo.</p>
              
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 z-10 rounded-full p-2 text-blue-100 transition-colors hover:bg-white/20 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
              
              {/* Decorative shapes */}
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-white opacity-10 blur-xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 rounded-full bg-white opacity-10 blur-xl pointer-events-none"></div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Kỳ lương áp dụng</label>
                <div className="relative">
                  <input
                    required
                    type="text"
                    readOnly
                    value={form.periodCode}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 cursor-not-allowed font-medium"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <Clock className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Số tiền muốn tạm ứng</label>
                <div className="relative">
                  <input
                    required
                    type="number"
                    min="1000"
                    placeholder="Ví dụ: 5000000"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-medium text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 font-medium text-slate-500 pointer-events-none">
                    VNĐ
                  </div>
                </div>
                {form.amount && (
                  <p className="mt-2 text-sm text-blue-600 font-medium animate-in fade-in">
                    {formatCurrency(Number(form.amount))}
                  </p>
                )}
              </div>
              
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Lý do tạm ứng</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Vui lòng nêu rõ lý do..."
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 resize-none"
                ></textarea>
              </div>
              
              <div className="mt-8 flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5"
                >
                  Gửi yêu cầu ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
