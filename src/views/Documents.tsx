import { useState, useEffect } from 'react';
import { File as FileIcon, Upload, Search, Filter, Eye, Edit, Trash2 } from 'lucide-react';
import { Role } from '../types';
import Modal from '../components/Modal';
import { ContractService } from '../services/contract.service';
import { FileService } from '../services/file.service';
import { employeeService } from '../services/employee.service';

export default function Documents({ userRole }: { userRole: Role }) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Form state (Upload)
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [employeeId, setEmployeeId] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  
  // Form state (Shared for Upload / Edit)
  const [selectedContractId, setSelectedContractId] = useState('');
  const [contractType, setContractType] = useState('PROBATION');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('DRAFT');

  useEffect(() => {
    loadContracts();
  }, []);

  useEffect(() => {
    if ((isUploadModalOpen || isEditModalOpen) && employees.length === 0) {
      loadEmployees();
    }
  }, [isUploadModalOpen, isEditModalOpen, employees.length]);

  const loadEmployees = async () => {
    try {
      const res = await employeeService.list({ limit: 1000 });
      setEmployees(res.data);
    } catch (e) {
      console.error('Failed to load employees:', e);
    }
  };

  const loadContracts = async () => {
    try {
      setIsLoading(true);
      const data = await ContractService.getAll();
      setContracts(data);
    } catch (e) {
      console.error('Failed to load contracts:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !employeeId || !startDate || !endDate) return;
    try {
      const fileRes = await FileService.upload(uploadFile, { fileType: 'Contract', isPrivate: true });
      await ContractService.create({
        employeeId,
        fileId: fileRes.file._id,
        contractType,
        status: 'DRAFT',
        startDate,
        endDate
      });
      setIsUploadModalOpen(false);
      resetForm();
      loadContracts();
    } catch (e) {
      console.error('Upload failed:', e);
      alert('Không thể tải lên tài liệu. Vui lòng kiểm tra lại.');
    }
  };

  const handleEdit = async () => {
    if (!selectedContractId || !startDate || !endDate) return;
    try {
      await ContractService.update(selectedContractId, {
        contractType,
        status,
        startDate,
        endDate
      });
      setIsEditModalOpen(false);
      resetForm();
      loadContracts();
    } catch (e) {
      console.error('Update failed:', e);
      alert('Không thể cập nhật hợp đồng.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa hợp đồng này không? (Xóa mềm)')) return;
    try {
      await ContractService.delete(id);
      loadContracts();
    } catch (e) {
      console.error('Delete failed:', e);
      alert('Không thể xóa hợp đồng.');
    }
  };

  const openEditModal = (contract: any) => {
    setSelectedContractId(contract._id);
    setContractType(contract.contractType);
    setStatus(contract.status);
    setStartDate(contract.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : '');
    setEndDate(contract.endDate ? new Date(contract.endDate).toISOString().split('T')[0] : '');
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setUploadFile(null);
    setEmployeeId('');
    setEmployeeSearch('');
    setStartDate('');
    setEndDate('');
    setContractType('PROBATION');
    setStatus('DRAFT');
    setSelectedContractId('');
  };

  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleViewContract = async (id: string) => {
    try {
      const res = await ContractService.getById(id);
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5513';
      
      // If backend provides a direct preview URL from Cloudinary, use it for iframe
      // otherwise fallback to the backend stream with ?mode=inline
      const pUrl = res.previewUrl && res.previewUrl.startsWith('http') 
        ? res.previewUrl 
        : apiUrl + res.signedUrl;
        
      setPreviewUrl(pUrl);
      setDownloadUrl(apiUrl + res.signedUrl); // Download always goes through backend for attachment headers
    } catch (e) {
      console.error('View contract failed:', e);
      alert('Bạn không có quyền xem tài liệu này hoặc lỗi hệ thống.');
    }
  };

  const getStatusDisplay = (contract: any) => {
    const now = new Date();
    const start = new Date(contract.startDate);
    const end = new Date(contract.endDate);
    const isActive = contract.status === 'CONFIRMED' && now >= start && now <= end;

    if (isActive) return <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-[10px] font-medium border border-green-200">Active</span>;
    if (contract.status === 'DRAFT') return <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200">Draft</span>;
    if (contract.status === 'TERMINATED') return <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded text-[10px] font-medium border border-red-200">Terminated</span>;
    return <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200">{contract.status}</span>;
  };

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.employeeId?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.employeeId?.code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || c.contractType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <h2 className="text-lg font-semibold text-slate-800">Quản lý Hợp đồng</h2>
        
        {['Super Admin', 'HR'].includes(userRole) && (
          <button 
            onClick={() => { resetForm(); setIsUploadModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
          >
            <Upload className="w-4 h-4 mr-2" />
            Tải lên tài liệu
          </button>
        )}
      </div>

      {/* Toolbar: Search and Filter */}
      <div className="px-6 py-3 border-b border-slate-200 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mã nhân viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
        </div>
        <div className="flex space-x-3">
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-9 pr-8 py-2 border border-slate-200 rounded-md text-sm appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="DRAFT">Draft</option>
              <option value="CONFIRMED">Confirmed / Active</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="pl-9 pr-8 py-2 border border-slate-200 rounded-md text-sm appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
            >
              <option value="ALL">Tất cả loại hợp đồng</option>
              <option value="PROBATION">Thử việc (PROBATION)</option>
              <option value="OFFICIAL">Chính thức (OFFICIAL)</option>
              <option value="PART_TIME">Bán thời gian (PART_TIME)</option>
              <option value="FREELANCE">Cộng tác viên (FREELANCE)</option>
              <option value="INTERNSHIP">Thực tập (INTERNSHIP)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500">
            <FileIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Không có hợp đồng nào</h3>
            <p>Thử thay đổi bộ lọc hoặc tải lên hợp đồng mới.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContracts.map(contract => (
              <div 
                key={contract._id} 
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-400 transition-colors shadow-sm relative group"
              >
                <div className="flex items-start">
                  <div className="p-3 bg-red-50 text-red-500 rounded-lg mr-4 cursor-pointer" onClick={() => handleViewContract(contract._id)}>
                    <FileIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleViewContract(contract._id)}>
                    <h3 className="text-sm font-semibold text-slate-800 truncate">{contract.contractType} Contract</h3>
                    <div className="mt-1 text-xs text-slate-600 truncate">
                      {contract.employeeId?.fullName} <span className="text-slate-400">({contract.employeeId?.code})</span>
                    </div>
                    <div className="flex items-center mt-3 space-x-2">
                      {getStatusDisplay(contract)}
                      <span className="text-[11px] text-slate-400">
                        {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                {['Super Admin', 'HR'].includes(userRole) && (
                  <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-100 shadow-sm rounded-md overflow-hidden">
                    <button 
                      onClick={() => handleViewContract(contract._id)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-50"
                      title="Xem / Tải xuống"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => openEditModal(contract)}
                      className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-slate-50 border-l border-slate-100"
                      title="Chỉnh sửa Meta data"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(contract._id)}
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-50 border-l border-slate-100"
                      title="Xóa mềm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Tải lên tài liệu mới">
        <form className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Loại hợp đồng</label>
            <select 
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            >
              <option value="PROBATION">Thử việc (PROBATION)</option>
              <option value="OFFICIAL">Chính thức (OFFICIAL)</option>
              <option value="PART_TIME">Bán thời gian (PART_TIME)</option>
              <option value="FREELANCE">Cộng tác viên (FREELANCE)</option>
              <option value="INTERNSHIP">Thực tập (INTERNSHIP)</option>
            </select>
          </div>
          <div className="relative">
            <label className="block text-xs font-medium text-slate-700 mb-1">Nhân viên</label>
            <input 
              type="text" 
              placeholder="VD: Nguyễn Văn A (hoặc gõ mã NV để tìm)" 
              value={employeeSearch}
              onFocus={() => setShowEmployeeDropdown(true)}
              onBlur={() => setTimeout(() => setShowEmployeeDropdown(false), 200)}
              onChange={(e) => {
                setEmployeeSearch(e.target.value);
                setShowEmployeeDropdown(true);
                setEmployeeId(''); // reset if user modifies
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
            />
            {showEmployeeDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {employees
                  .filter(emp => emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) || emp.code.toLowerCase().includes(employeeSearch.toLowerCase()))
                  .map(emp => (
                  <div 
                    key={emp.id} 
                    onClick={() => {
                      setEmployeeId(emp.id);
                      setEmployeeSearch(`${emp.name} - ${emp.code}`);
                      setShowEmployeeDropdown(false);
                    }}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 last:border-0"
                  >
                    <div className="font-medium">{emp.name}</div>
                    <div className="text-xs text-slate-500">{emp.code}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Ngày bắt đầu</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Ngày kết thúc</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
              />
            </div>
          </div>
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
            <input 
              type="file" 
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              accept=".pdf"
            />
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">
              {uploadFile ? uploadFile.name : 'Nhấn để tải lên hoặc kéo thả'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Chỉ chấp nhận file PDF tối đa 10MB</p>
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">
              Hủy
            </button>
            <button 
              type="button" 
              onClick={handleUpload}
              disabled={!uploadFile || !employeeId || !startDate || !endDate}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tải lên
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Meta Data Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Chỉnh sửa Meta Data">
        <form className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Loại hợp đồng</label>
            <select 
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            >
              <option value="PROBATION">Thử việc (PROBATION)</option>
              <option value="OFFICIAL">Chính thức (OFFICIAL)</option>
              <option value="PART_TIME">Bán thời gian (PART_TIME)</option>
              <option value="FREELANCE">Cộng tác viên (FREELANCE)</option>
              <option value="INTERNSHIP">Thực tập (INTERNSHIP)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Trạng thái</label>
            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            >
              <option value="DRAFT">Draft</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Ngày bắt đầu</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Ngày kết thúc</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">
              Hủy
            </button>
            <button 
              type="button" 
              onClick={handleEdit}
              disabled={!startDate || !endDate}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal isOpen={!!previewUrl} onClose={() => setPreviewUrl(null)} title="Xem trước tài liệu" maxWidth="max-w-4xl">
        {previewUrl && (
          <div className="flex flex-col h-[70vh]">
            <iframe 
              src={previewUrl} 
              className="flex-1 w-full border border-slate-200 rounded-md bg-slate-100"
              title="Document Preview"
            />
            <div className="pt-4 flex justify-end space-x-3">
              <button type="button" onClick={() => setPreviewUrl(null)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md">
                Đóng
              </button>
              <button 
                type="button" 
                onClick={() => window.open(downloadUrl || previewUrl, '_blank')} 
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center"
              >
                Tải xuống
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
