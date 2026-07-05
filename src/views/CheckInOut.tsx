import { useState } from 'react';
import { Clock, MapPin, CheckCircle, AlertCircle, Edit3, FileText, Eye } from 'lucide-react';
import JoditEditor from 'jodit-react';
import { mockAttendance, mockShiftConfig, mockEmployees, mockReports } from '../mockData';
import { Role } from '../types';
import Modal from '../components/Modal';

export default function CheckInOut({ userRole }: { userRole: Role }) {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [viewMode, setViewMode] = useState<'personal' | 'reports'>('personal');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [reports, setReports] = useState(mockReports.filter(r => r.employeeId === 'e1'));
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [viewingReport, setViewingReport] = useState<any>(null);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);

  const handleAdjustClick = (record: any) => {
    setSelectedRecord(record);
    setIsAdjustModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Giờ hiện tại</h2>
          <div className="text-4xl font-mono text-blue-600 mb-6 tracking-tight">
            {currentTime}
          </div>
          
          <div className="flex space-x-3 w-full">
            <button 
              onClick={() => {
                if (isCheckedIn) {
                  setIsReportModalOpen(true);
                } else {
                  setIsCheckedIn(true);
                }
              }}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-all flex justify-center items-center text-sm ${
                !isCheckedIn 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <Clock className="w-5 h-5 mr-2" />
              {isCheckedIn ? 'Check Out & Báo Cáo' : 'Check In'}
            </button>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-100 w-full text-left">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Chi tiết ca làm việc</h4>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Bắt đầu:</span>
                <span className="font-mono">{mockShiftConfig.startTime}</span>
              </div>
              <div className="flex justify-between">
                <span>Kết thúc:</span>
                <span className="font-mono">{mockShiftConfig.endTime}</span>
              </div>
              <div className="flex justify-between">
                <span>Nghỉ trưa:</span>
                <span className="font-mono">{mockShiftConfig.breakStartTime} - {mockShiftConfig.breakEndTime}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col col-span-1 md:col-span-2">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
            <h3 className="font-semibold text-sm">Lịch sử cá nhân</h3>
            
            <div className="flex bg-slate-100 p-1 rounded-md">
              <button 
                onClick={() => setViewMode('personal')}
                className={`px-3 py-1.5 text-xs font-medium rounded ${viewMode === 'personal' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Lịch sử chấm công
              </button>
              <button 
                onClick={() => setViewMode('reports')}
                className={`px-3 py-1.5 text-xs font-medium rounded flex items-center ${viewMode === 'reports' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <FileText className="w-3.5 h-3.5 mr-1" />
                Báo cáo của tôi
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-0 h-[500px]">
            {viewMode === 'reports' ? (
              <div className="p-6">
                <div className="space-y-4">
                  {reports.map(report => (
                    <div key={report.id} className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
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
                  ))}
                  {reports.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                      <p>Bạn chưa có báo cáo nào</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Ngày</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Check In</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Check Out</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Vị trí</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Trạng thái</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mockAttendance.filter(r => r.employeeId === 'e1').map(record => (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
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
                          className="text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center text-xs font-medium"
                        >
                          Yêu cầu sửa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)} title="Yêu cầu sửa đổi chấm công">
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Lý do</label>
              <textarea 
                rows={3} 
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                placeholder="Vui lòng giải thích lý do yêu cầu sửa đổi..."
              ></textarea>
            </div>

            <div className="pt-4 flex justify-end space-x-3">
              <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">
                Hủy
              </button>
              <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                Gửi yêu cầu
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Báo cáo cuối ngày" maxWidth="max-w-4xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nội dung báo cáo công việc hôm nay:</label>
            <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
              <JoditEditor
                value={reportContent}
                config={{
                  readonly: false,
                  height: 300,
                  toolbarAdaptive: false,
                }}
                onBlur={newContent => setReportContent(newContent)}
                onChange={newContent => {}}
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={() => {
                setIsReportModalOpen(false);
                setEditingReportId(null);
                setReportContent('');
              }} 
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              Bỏ qua
            </button>
            <button 
              type="button" 
              onClick={() => {
                if (editingReportId) {
                  setReports(reports.map(r => r.id === editingReportId ? { ...r, content: reportContent, updatedAt: new Date().toISOString() } : r));
                } else {
                  const newReport = {
                    id: 'r' + Date.now(),
                    employeeId: 'e1',
                    date: new Date().toISOString().split('T')[0],
                    content: reportContent,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  };
                  setReports([newReport, ...reports]);
                }
                setIsReportModalOpen(false);
                if (isCheckedIn && !editingReportId) {
                  setIsCheckedIn(false);
                }
                setReportContent('');
                setEditingReportId(null);
              }} 
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              {editingReportId ? 'Lưu thay đổi' : 'Gửi báo cáo & Check Out'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!viewingReport} onClose={() => setViewingReport(null)} title="Chi tiết báo cáo" maxWidth="max-w-4xl">
        {viewingReport && (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm text-slate-500 mb-2">
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
              <button 
                type="button" 
                onClick={() => {
                  setEditingReportId(viewingReport.id);
                  setReportContent(viewingReport.content);
                  setIsReportModalOpen(true);
                  setViewingReport(null);
                }} 
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                <Edit3 className="w-4 h-4 mr-1 inline" />
                Chỉnh sửa
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
