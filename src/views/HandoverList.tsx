import React, { useEffect, useState } from 'react';
import { getHandovers, HandoverRecord } from '../services/handover.service';
import { User as AuthUser } from '../types';
import { useToast } from '../components/Toast';
import { FileText, Eye, Clock, User, Building2, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface HandoverListProps {
  user: AuthUser;
  onSelect: (id: string) => void;
}

export default function HandoverList({ user, onSelect }: HandoverListProps) {
  const { showToast } = useToast();
  const [handovers, setHandovers] = useState<HandoverRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHandovers = async () => {
      try {
        const data = await getHandovers();
        setHandovers(data);
      } catch (error) {
        showToast({ type: 'error', message: 'Lỗi khi tải danh sách bàn giao.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchHandovers();
  }, [showToast]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Nháp</span>;
      case 'SUBMITTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Chờ duyệt</span>;
      case 'APPROVED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Đã duyệt</span>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Danh sách bàn giao</h2>
            <p className="text-sm text-slate-500">Quản lý biên bản bàn giao công việc của nhân sự</p>
          </div>
        </div>

        {handovers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Không có biên bản bàn giao nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Nhân sự</th>
                  <th className="px-6 py-4">Phòng ban</th>
                  <th className="px-6 py-4">Ngày tạo</th>
                  <th className="px-6 py-4">Ngày duyệt</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {handovers.map((record) => (
                  <tr key={record._id || record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {record.employeeId?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{record.employeeId?.name}</div>
                          <div className="text-xs text-slate-500">{record.employeeId?.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {record.departmentId?.name || '---'}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(record.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      {record.approvedAt ? new Date(record.approvedAt).toLocaleDateString('vi-VN') : '---'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          const id = record._id || record.id;
                          if (id) onSelect(id);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
