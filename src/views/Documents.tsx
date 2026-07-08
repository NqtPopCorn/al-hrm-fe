import { useState } from 'react';
import { File, Upload, Lock, ShieldAlert } from 'lucide-react';
import { Role } from '../types';
import Modal from '../components/Modal';

export default function Documents({ userRole }: { userRole: Role }) {
  const [activeTab, setActiveTab] = useState<'contracts' | 'sensitive' | 'handover'>('contracts');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const docs = [
    { id: 1, name: 'Hợp đồng lao động - John Doe', type: 'PDF', size: '2.4 MB', date: '2023-01-15' },
    { id: 2, name: 'Thỏa thuận bảo mật - Jane Smith', type: 'PDF', size: '1.1 MB', date: '2023-03-01' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex space-x-4">
          <button 
            onClick={() => setActiveTab('contracts')}
            className={`text-sm font-medium pb-4 -mb-4 border-b-2 transition-colors ${activeTab === 'contracts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Hợp đồng & Chính sách
          </button>
          <button 
            onClick={() => setActiveTab('sensitive')}
            className={`text-sm font-medium pb-4 -mb-4 border-b-2 transition-colors flex items-center ${activeTab === 'sensitive' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Lock className="w-3 h-3 mr-1" /> Dữ liệu nhạy cảm
          </button>
          <button 
            onClick={() => setActiveTab('handover')}
            className={`text-sm font-medium pb-4 -mb-4 border-b-2 transition-colors ${activeTab === 'handover' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Bàn giao
          </button>
        </div>
        
        {['Super Admin', 'HR'].includes(userRole) && (
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
          >
            <Upload className="w-4 h-4 mr-2" />
            Tải lên tài liệu
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
        {activeTab === 'contracts' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {docs.map(doc => (
              <div key={doc.id} className="bg-white border border-slate-200 rounded-xl p-5 flex items-start hover:border-blue-400 transition-colors cursor-pointer shadow-sm">
                <div className="p-3 bg-red-50 text-red-500 rounded-lg mr-4">
                  <File className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 line-clamp-1">{doc.name}</h3>
                  <div className="flex items-center mt-2 text-xs text-slate-500 space-x-2">
                    <span>{doc.type}</span>
                    <span>•</span>
                    <span>{doc.size}</span>
                    <span>•</span>
                    <span>{doc.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'sensitive' && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Truy cập hạn chế</h3>
            <p className="text-sm text-slate-500 mb-6">
              Khu vực này chứa dữ liệu nhạy cảm của nhân viên (CCCD, tài khoản ngân hàng). Quyền truy cập được ghi log chặt chẽ và chỉ giới hạn cho nhân sự được ủy quyền.
            </p>
            {['Super Admin', 'HR'].includes(userRole) ? (
              <button className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                Mở khóa kho bảo mật
              </button>
            ) : (
              <p className="text-sm font-medium text-red-600 bg-red-50 px-4 py-2 rounded border border-red-100">
                Bạn không có quyền xem phần này.
              </p>
            )}
          </div>
        )}

        {activeTab === 'handover' && (
           <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500">
             <File className="w-12 h-12 mx-auto mb-4 text-slate-300" />
             <p>Không có danh sách bàn giao nào.</p>
           </div>
        )}
      </div>

      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Tải lên tài liệu">
        <form className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Tên tài liệu</label>
            <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Loại tài liệu</label>
            <select className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none">
              <option value="Contract">Hợp đồng lao động</option>
              <option value="NDA">Thỏa thuận bảo mật (NDA)</option>
              <option value="ID">CCCD / Hộ chiếu</option>
              <option value="Other">Khác</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nhân viên</label>
            <input type="text" placeholder="Chọn nhân viên..." className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
          </div>
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">Nhấn để tải lên hoặc kéo thả</p>
            <p className="text-xs text-slate-500 mt-1">PDF, DOCX tối đa 10MB</p>
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">
              Hủy
            </button>
            <button type="button" onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
              Tải lên
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
