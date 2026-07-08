import { useState } from 'react';
import { UserPlus, Calendar as CalendarIcon, Mail, Search, Edit2 } from 'lucide-react';
import { mockCandidates, mockPositions } from '../mockData';
import Modal from '../components/Modal';

export default function Recruitment() {
  const [activeTab, setActiveTab] = useState<'candidates' | 'interviews' | 'templates'>('candidates');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

  const openEditModal = (candidate: any) => {
    setSelectedCandidate(candidate);
    setIsEditModalOpen(true);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex space-x-4">
          <button 
            onClick={() => setActiveTab('candidates')}
            className={`text-sm font-medium pb-4 -mb-4 border-b-2 transition-colors ${activeTab === 'candidates' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Ứng viên
          </button>
          <button 
            onClick={() => setActiveTab('interviews')}
            className={`text-sm font-medium pb-4 -mb-4 border-b-2 transition-colors ${activeTab === 'interviews' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Phỏng vấn
          </button>
          <button 
            onClick={() => setActiveTab('templates')}
            className={`text-sm font-medium pb-4 -mb-4 border-b-2 transition-colors ${activeTab === 'templates' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Mẫu Email
          </button>
        </div>
        
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Thêm ứng viên
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
        {activeTab === 'candidates' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Lọc theo kỹ năng (vd: React, Node) hoặc vị trí..." 
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <button className="px-4 py-2 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">
                Độ khớp từ khóa
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {[
                { label: 'Mới', value: 'New' },
                { label: 'Đang phỏng vấn', value: 'Interviewing' },
                { label: 'Đã đề nghị', value: 'Offered' },
                { label: 'Đã nhận việc', value: 'Hired' }
              ].map(status => (
                <div key={status.value} className="bg-slate-100/50 rounded-lg p-4 border border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">{status.label}</h3>
                  <div className="space-y-3">
                    {mockCandidates.filter(c => c.status === status.value || (status.value === 'Interviewing' && c.status === 'Interviewing')).map(candidate => {
                      const pos = mockPositions.find(p => p.id === candidate.positionId);
                      return (
                        <div key={candidate.id} className="bg-white p-3 rounded shadow-sm border border-slate-200 hover:border-blue-400 transition-colors group relative">
                          <button 
                            onClick={() => openEditModal(candidate)}
                            className="absolute top-2 right-2 text-slate-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <p className="text-sm font-medium text-slate-900 pr-6">{candidate.name}</p>
                          <p className="text-xs text-slate-500 mt-1">{pos?.title}</p>
                          <div className="mt-3 flex flex-wrap gap-1">
                            {candidate.skills.map(skill => (
                              <span key={skill} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'interviews' && (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>Không có lịch phỏng vấn sắp tới.</p>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {['Thư mời phỏng vấn', 'Cảm ơn', 'Từ chối', 'Đề nghị nhận việc', 'Chào mừng nhân viên mới'].map(template => (
              <div key={template} className="bg-white border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center mr-3">
                    <Mail className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800">{template}</h3>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">Mẫu tiêu chuẩn cho các giao tiếp {template.toLowerCase()}. Nhấp để sửa đổi nội dung và các biến.</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Thêm ứng viên mới">
        <form className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Họ và tên</label>
            <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
            <input type="email" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Vị trí</label>
            <select className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none">
              {mockPositions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Kỹ năng (cách nhau bằng dấu phẩy)</label>
            <input type="text" placeholder="vd: React, Node, SQL" className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">
              Hủy
            </button>
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
              Thêm ứng viên
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Chỉnh sửa ứng viên">
        {selectedCandidate && (
          <form className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Họ và tên</label>
              <input type="text" defaultValue={selectedCandidate.name} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
              <input type="email" defaultValue={selectedCandidate.email} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Vị trí</label>
              <select defaultValue={selectedCandidate.positionId} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none">
                {mockPositions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Trạng thái</label>
              <select defaultValue={selectedCandidate.status} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none">
                <option value="New">Mới</option>
                <option value="Interviewing">Đang phỏng vấn</option>
                <option value="Offered">Đã đề nghị</option>
                <option value="Hired">Đã nhận việc</option>
                <option value="Rejected">Đã từ chối</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Kỹ năng (cách nhau bằng dấu phẩy)</label>
              <input type="text" defaultValue={selectedCandidate.skills.join(', ')} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
            </div>
            <div className="pt-4 flex justify-end space-x-3">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">
                Hủy
              </button>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                Lưu thay đổi
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
