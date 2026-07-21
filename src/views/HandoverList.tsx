import React, { useState, useMemo } from 'react';
import { useHandovers } from '../hooks/useHandovers';
import { User as AuthUser } from '../types';
import { FileSignature, Clock, CheckCircle2, ChevronRight, ChevronLeft, InboxIcon, Search, Filter } from 'lucide-react';
import { cn } from '../lib/utils';

interface HandoverListProps {
  user: AuthUser;
  onSelect: (id: string) => void;
}

export default function HandoverList({ user, onSelect }: HandoverListProps) {
  const { handovers, isLoading, error } = useHandovers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return { 
          label: 'Nháp', 
          icon: FileSignature,
          className: 'bg-slate-100 text-slate-700 border-slate-200',
          iconClassName: 'text-slate-500'
        };
      case 'SUBMITTED':
        return { 
          label: 'Chờ duyệt', 
          icon: Clock,
          className: 'bg-amber-50 text-amber-700 border-amber-200',
          iconClassName: 'text-amber-500'
        };
      case 'APPROVED':
        return { 
          label: 'Đã duyệt', 
          icon: CheckCircle2,
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          iconClassName: 'text-emerald-500'
        };
      default:
        return { 
          label: 'Không rõ', 
          icon: FileSignature,
          className: 'bg-slate-100 text-slate-700 border-slate-200',
          iconClassName: 'text-slate-500'
        };
    }
  };

  const filteredHandovers = useMemo(() => {
    return handovers.filter(record => {
      const matchesSearch = 
        record.employeeId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        record.employeeId?.code?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || record.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [handovers, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredHandovers.length / itemsPerPage);
  const paginatedHandovers = filteredHandovers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 animate-pulse" />
          <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin absolute top-0 left-0" />
        </div>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12 p-6">
      
      {/* Header Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-sky-500 tracking-tight">
          Biên bản bàn giao
        </h2>
        <p className="mt-2 text-slate-500 font-medium">Quản lý và theo dõi tiến trình bàn giao công việc của nhân sự.</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
            placeholder="Tìm theo tên hoặc mã nhân sự..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center text-slate-500 text-sm font-medium">
            <Filter className="h-4 w-4 mr-1.5" />
            Lọc:
          </div>
          <select
            className="block w-full sm:w-48 pl-3 pr-10 py-2 text-base border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-xl transition-all"
            value={statusFilter}
            onChange={handleStatusFilterChange}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="DRAFT">Nháp</option>
            <option value="SUBMITTED">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
          </select>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)]">
        
        {filteredHandovers.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <InboxIcon className="w-10 h-10 text-blue-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Chưa có biên bản nào</h3>
            <p className="text-slate-500 max-w-sm">
              {handovers.length === 0 
                ? 'Hiện tại chưa có biên bản bàn giao công việc nào được tạo trên hệ thống.' 
                : 'Không tìm thấy biên bản nào phù hợp với điều kiện tìm kiếm.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80">
                  <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Nhân sự</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Phòng ban</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Thời gian</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Trạng thái</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {paginatedHandovers.map((record) => {
                  const status = getStatusConfig(record.status);
                  const StatusIcon = status.icon;
                  
                  return (
                    <tr 
                      key={record._id || record.id} 
                      className="group hover:bg-blue-50/40 transition-colors duration-300"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 text-white flex items-center justify-center font-bold shadow-md transform group-hover:scale-110 transition-transform duration-300">
                            {record.employeeId?.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                              {record.employeeId?.name}
                            </div>
                            <div className="text-xs font-medium text-slate-500 mt-0.5">
                              {record.employeeId?.code}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium border border-slate-200/60">
                          {record.departmentId?.name || '---'}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="space-y-1.5">
                          <div className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <span className="w-14 text-slate-400 text-xs font-normal">Tạo:</span>
                            {new Date(record.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                          {record.approvedAt && (
                            <div className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                              <span className="w-14 text-slate-400 text-xs font-normal">Duyệt:</span>
                              <span className="text-emerald-600">{new Date(record.approvedAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm",
                          status.className
                        )}>
                          <StatusIcon className={cn("w-3.5 h-3.5", status.iconClassName)} />
                          {status.label}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => {
                            const id = record._id || record.id;
                            if (id) onSelect(id);
                          }}
                          className="inline-flex items-center justify-center w-9 h-9 text-slate-400 bg-white border border-slate-200 rounded-xl hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-0.5"
                          title="Xem chi tiết"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-8 py-4 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-500">
              Hiển thị <span className="font-semibold text-slate-700">{((currentPage - 1) * itemsPerPage) + 1}</span> đến <span className="font-semibold text-slate-700">{Math.min(currentPage * itemsPerPage, filteredHandovers.length)}</span> trong <span className="font-semibold text-slate-700">{filteredHandovers.length}</span> kết quả
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-500 disabled:hover:border-slate-200 transition-all shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-1 px-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center transition-all",
                      currentPage === i + 1 
                        ? "bg-blue-600 text-white shadow-md" 
                        : "text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-500 disabled:hover:border-slate-200 transition-all shadow-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
