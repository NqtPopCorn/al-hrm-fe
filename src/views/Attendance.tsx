import { useState } from 'react';
import { Clock, MapPin, CheckCircle, AlertCircle, Edit3, FileText, Eye } from 'lucide-react';
import { mockAttendance, mockEmployees, mockReports } from '../mockData';
import { Role } from '../types';
import Modal from '../components/Modal';

export default function Attendance({ userRole }: { userRole: Role }) {
  const [viewMode, setViewMode] = useState<'company' | 'requests' | 'reports'>('company');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [viewingReport, setViewingReport] = useState<any>(null);

  const mockRequests = [
    { id: 1, employeeId: 'E001', date: '2026-06-30', reason: 'Quên chấm công lúc về', checkIn: '08:00', checkOut: '17:30', status: 'Pending', requestedAt: '2026-06-30 17:40' },
    { id: 2, employeeId: 'E002', date: '2026-06-29', reason: 'Đi gặp khách hàng, không check-in được', checkIn: '08:30', checkOut: '18:00', status: 'Approved', requestedAt: '2026-06-29 10:00', approver: 'Alice (HR)', approvedAt: '2026-06-29 11:30', approvalReason: 'Đã xác nhận với khách hàng' },
  ];

  const handleAdjustClick = (record: any) => {
    setSelectedRecord(record);
    setIsAdjustModalOpen(true);
  };

  const handleApproveClick = (req: any) => {
    setSelectedRequest(req);
    setIsApproveModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col col-span-1 md:col-span-3 h-[calc(100vh-10rem)]">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
            <h3 className="font-semibold text-sm">Quản lý chấm công công ty</h3>
            
            <div className="flex bg-slate-100 p-1 rounded-md">
              <button 
                onClick={() => setViewMode('company')}
                className={`px-3 py-1.5 text-xs font-medium rounded ${viewMode === 'company' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Danh sách chấm công
              </button>
              <button 
                onClick={() => setViewMode('requests')}
                className={`px-3 py-1.5 text-xs font-medium rounded ${viewMode === 'requests' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Yêu cầu ngoại lệ
              </button>
              <button 
                onClick={() => setViewMode('reports')}
                className={`px-3 py-1.5 text-xs font-medium rounded flex items-center ${viewMode === 'reports' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <FileText className="w-3.5 h-3.5 mr-1" />
                Báo cáo nhân viên
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-0">
            {viewMode === 'reports' ? (
              <div className="p-6">
                <div className="space-y-4">
                  {mockReports.map(report => {
                    const emp = mockEmployees.find(e => e.id === report.employeeId);
                    return (
                      <div key={report.id} className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-slate-800">{emp?.name || report.employeeId}</h4>
                            <p className="text-xs text-slate-500">Báo cáo ngày {report.date} - Lần sửa cuối: {new Date(report.updatedAt).toLocaleString()}</p>
                          </div>
                          <button 
                            onClick={() => setViewingReport(report)}
                            className="text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center text-xs font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Xem chi tiết
                          </button>
                        </div>
                        <div className="prose prose-sm prose-slate max-w-none text-slate-600 line-clamp-3 bg-slate-50 p-3 rounded border border-slate-100" dangerouslySetInnerHTML={{ __html: report.content }}></div>
                      </div>
                    );
                  })}
                  {mockReports.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                      <p>Chưa có báo cáo nào</p>
                    </div>
                  )}
                </div>
              </div>
            ) : viewMode === 'requests' ? (
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Nhân viên</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Ngày</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Lý do điều chỉnh</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Trạng thái</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mockRequests.map(req => {
                    const emp = mockEmployees.find(e => e.id === req.employeeId);
                    return (
                      <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{emp?.name || req.employeeId}</td>
                        <td className="px-6 py-4 text-sm font-medium">{req.date}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate" title={req.reason}>{req.reason}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            req.status === 'Approved' ? 'bg-green-100 text-green-700' :
                            req.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleApproveClick(req)}
                            className="text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center text-xs font-medium"
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Nhân viên</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Ngày</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Check In</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Check Out</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Vị trí</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Trạng thái</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mockAttendance.map(record => {
                    const emp = mockEmployees.find(e => e.id === record.employeeId);
                    return (
                      <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{emp?.name}</td>
                        <td className="px-6 py-4 text-sm font-medium">{record.date}</td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-600">{record.checkIn || '--:--'}</td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-600">{record.checkOut || '--:--'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-slate-600">
                            <MapPin className="w-4 h-4 mr-1 text-slate-400" />
                            {record.type}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            record.status === 'VALID' ? 'bg-green-100 text-green-700' :
                            record.status === 'LATE' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {record.status === 'VALID' ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleAdjustClick(record)}
                            className="text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center text-xs font-medium"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Điều chỉnh
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)} title="Điều chỉnh chấm công">
        {selectedRecord && (
          <form className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 text-sm text-slate-700">
              <div className="flex justify-between mb-1">
                <span className="font-medium">Ngày:</span>
                <span>{selectedRecord.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Trạng thái hiện tại:</span>
                <span>{selectedRecord.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Giờ Check In</label>
                <input type="time" defaultValue={selectedRecord.checkIn} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Giờ Check Out</label>
                <input type="time" defaultValue={selectedRecord.checkOut} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Lý do điều chỉnh</label>
              <textarea 
                rows={3} 
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                placeholder="Lý do điều chỉnh..."
              ></textarea>
            </div>

            <div className="pt-4 flex justify-end space-x-3">
              <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">
                Hủy
              </button>
              <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                Lưu điều chỉnh
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={isApproveModalOpen} onClose={() => setIsApproveModalOpen(false)} title="Chi tiết yêu cầu ngoại lệ">
        {selectedRequest && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-700 space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Nhân viên:</span>
                <span>{mockEmployees.find(e => e.id === selectedRequest.employeeId)?.name || selectedRequest.employeeId}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Ngày điều chỉnh:</span>
                <span>{selectedRequest.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Giờ Check In đề xuất:</span>
                <span className="font-mono">{selectedRequest.checkIn || '--:--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Giờ Check Out đề xuất:</span>
                <span className="font-mono">{selectedRequest.checkOut || '--:--'}</span>
              </div>
              <div className="pt-2 mt-2 border-t border-slate-200">
                <span className="font-medium block mb-1">Lý do của nhân viên:</span>
                <p className="text-slate-600 bg-white p-2 rounded border border-slate-100">{selectedRequest.reason}</p>
              </div>
              <div className="text-xs text-slate-500 mt-2 text-right">
                Đã gửi lúc: {selectedRequest.requestedAt}
              </div>
            </div>

            {selectedRequest.status !== 'Pending' && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800 space-y-2">
                <h4 className="font-semibold text-blue-900 mb-2 border-b border-blue-200 pb-1">Lịch sử phê duyệt (Audit Log)</h4>
                <div className="flex justify-between">
                  <span className="font-medium">Người duyệt:</span>
                  <span>{selectedRequest.approver}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Thời gian duyệt:</span>
                  <span>{selectedRequest.approvedAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Trạng thái:</span>
                  <span className="font-bold">{selectedRequest.status}</span>
                </div>
                {selectedRequest.approvalReason && (
                  <div className="pt-2 mt-2 border-t border-blue-200/50">
                    <span className="font-medium block mb-1">Ghi chú của người duyệt:</span>
                    <p className="bg-white/50 p-2 rounded">{selectedRequest.approvalReason}</p>
                  </div>
                )}
              </div>
            )}

            {selectedRequest.status === 'Pending' ? (
              <form className="space-y-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Ghi chú phê duyệt/từ chối</label>
                  <textarea 
                    rows={2} 
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                    placeholder="Nhập lý do phê duyệt hoặc từ chối..."
                  ></textarea>
                </div>
                <div className="flex justify-end space-x-3">
                  <button type="button" onClick={() => setIsApproveModalOpen(false)} className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors border border-red-200">
                    Từ chối
                  </button>
                  <button type="button" onClick={() => setIsApproveModalOpen(false)} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors">
                    Phê duyệt
                  </button>
                </div>
              </form>
            ) : (
              <div className="pt-4 flex justify-end">
                <button type="button" onClick={() => setIsApproveModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">
                  Đóng
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={!!viewingReport} onClose={() => setViewingReport(null)} title="Chi tiết báo cáo" maxWidth="max-w-4xl">
        {viewingReport && (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm text-slate-500 mb-2">
              <span>Bởi: <span className="font-medium text-slate-800">{mockEmployees.find(e => e.id === viewingReport.employeeId)?.name || viewingReport.employeeId}</span></span>
              <span>Ngày: {viewingReport.date}</span>
            </div>
            
            <div className="prose prose-sm prose-slate max-w-none text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100" dangerouslySetInnerHTML={{ __html: viewingReport.content }}></div>
            
            <div className="pt-4 flex justify-end space-x-3">
              <button 
                type="button" 
                onClick={() => setViewingReport(null)} 
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
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
