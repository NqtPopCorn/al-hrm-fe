import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
const Quill = ReactQuill as any;
import 'react-quill-new/dist/quill.snow.css';
import { 
  FileText, 
  Paperclip, 
  Monitor, 
  KeyRound, 
  ListTodo, 
  Save, 
  Send, 
  CheckCircle2,
  Clock,
  User,
  Building2,
  Star,
  Lock,
  ChevronDown,
  Eye,
  Plus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getHandovers, getHandoverById, createHandoverDraft, updateDraft, submitHandover, approveHandover, HandoverRecord as HandoverType } from '../services/handover.service';
import { User as AuthUser } from '../types';
import { useToast } from '../components/Toast';

const modules = {
  toolbar: [
    [{ 'header': [1, 2, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{'list': 'ordered'}, {'list': 'bullet'}],
    ['link'],
    ['clean']
  ],
};
const readOnlyModules = {
  toolbar: false
};

interface HandoverRecordProps {
  user: AuthUser;
  handoverId: string | null;
}

export default function HandoverRecord({ user, handoverId }: HandoverRecordProps) {
  const { showToast } = useToast();
  const [managerRating, setManagerRating] = useState<number>(0);
  const [managerComment, setManagerComment] = useState('');
  
  const [handover, setHandover] = useState<HandoverType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [documentsContent, setDocumentsContent] = useState('');
  const [assetsContent, setAssetsContent] = useState('');
  const [accountsContent, setAccountsContent] = useState('');
  const [tasksContent, setTasksContent] = useState('');

  const isManagerView = user?.role === 'Manager' || user?.role === 'Super Admin';
  const isReadOnly = handover?.status !== 'DRAFT';

  useEffect(() => {
    const fetchHandover = async () => {
      try {
        let record = null;
        if (handoverId) {
          record = await getHandoverById(handoverId);
        } else {
          const data = await getHandovers();
          if (data.length > 0) record = data[0];
        }

        if (record) {
          setHandover(record);
          setDocumentsContent(record.sections?.documents || '');
          setAssetsContent(record.sections?.assets || '');
          setAccountsContent(record.sections?.accounts || '');
          setTasksContent(record.sections?.tasks || '');
          if (record.managerReview) {
            setManagerRating(record.managerReview.rating || 0);
            setManagerComment(record.managerReview.comment || '');
          }
        }
      } catch (error) {
        showToast({ type: 'error', message: 'Không thể tải bản ghi bàn giao.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchHandover();
  }, [showToast]);

  const handleSaveDraft = async () => {
    if (!handover) return;
    const handoverId = handover._id || handover.id;
    if (!handoverId) return;
    
    try {
      await updateDraft(handoverId, {
        documents: documentsContent,
        assets: assetsContent,
        accounts: accountsContent,
        tasks: tasksContent
      });
      showToast({ type: 'success', message: 'Lưu nháp thành công!' });
    } catch (error) {
      showToast({ type: 'error', message: 'Lỗi khi lưu nháp.' });
    }
  };

  const handleSubmit = async () => {
    if (!handover) return;
    const handoverId = handover._id || handover.id;
    if (!handoverId) return;

    try {
      await updateDraft(handoverId, {
        documents: documentsContent,
        assets: assetsContent,
        accounts: accountsContent,
        tasks: tasksContent
      });
      const updated = await submitHandover(handoverId);
      setHandover(updated);
      showToast({ type: 'success', message: 'Gửi quản lý duyệt thành công!' });
    } catch (error) {
      showToast({ type: 'error', message: 'Lỗi khi gửi duyệt.' });
    }
  };

  const handleApprove = async () => {
    if (!handover) return;
    const handoverId = handover._id || handover.id;
    if (!handoverId) return;

    try {
      const updated = await approveHandover(handoverId, {
        rating: managerRating,
        comment: managerComment
      });
      setHandover(updated);
      showToast({ type: 'success', message: 'Phê duyệt thành công!' });
    } catch (error) {
      showToast({ type: 'error', message: 'Lỗi khi phê duyệt.' });
    }
  };
  
  const handleCreateDraft = async () => {
    try {
      setIsLoading(true);
      const newHandover = await createHandoverDraft();
      setHandover(newHandover);
      showToast({ type: 'success', message: 'Tạo bản nháp bàn giao thành công!' });
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi khi tạo bản nháp bàn giao.';
      showToast({ type: 'error', message: errorMessage });
      setIsLoading(false);
    }
  };
  
  if (isLoading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" /></div>;
  if (!handover) {
    if (user?.role === 'Employee') {
      return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[400px] bg-slate-50/50 rounded-xl border border-slate-200 border-dashed m-6">
          <FileText className="w-16 h-16 text-slate-300 mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Chưa có biên bản bàn giao</h2>
          <p className="text-slate-500 mb-6 max-w-md text-center">Bạn hiện chưa có biên bản bàn giao công việc nào. Bạn có thể tạo mới một bản nháp để bắt đầu quá trình bàn giao.</p>
          <button 
            onClick={handleCreateDraft}
            className="flex items-center px-6 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm shadow-blue-600/20"
          >
            <Plus className="w-5 h-5 mr-2" />
            Tạo biên bản bàn giao
          </button>
        </div>
      );
    }
    return <div className="p-8 text-center text-slate-500">Không có bản ghi bàn giao nào.</div>;
  }

  return (
    <div className="flex flex-col max-w-7xl mx-auto pb-12">

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
        
        {/* Header Section */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Biên bản Bàn giao Công việc</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {handover.employeeId?.name} ({handover.employeeId?.code})</span>
                <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {handover.departmentId?.name || 'Chưa xác định'}</span>
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                <Clock className="w-4 h-4 mr-1.5" />
                {handover.status === 'DRAFT' ? 'Bản nháp' : handover.status === 'SUBMITTED' ? 'Chờ duyệt' : 'Đã duyệt'}
              </span>
              <div className="text-xs text-slate-500 text-right">
                <p>Ngày tạo: {new Date(handover.createdAt).toLocaleDateString('vi-VN')}</p>
                {handover.approvedAt && <p>Ngày duyệt: {new Date(handover.approvedAt).toLocaleDateString('vi-VN')}</p>}
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Người bàn giao:</span>
              <span className="font-medium text-slate-900">{handover.employeeId?.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Người tiếp nhận/Quản lý:</span>
              <span className="font-medium text-slate-900">{handover.targetManagerId?.fullName || 'Chưa duyệt'}</span>
            </div>
          </div>
        </div>

        {/* Sections for Employee to Fill */}
        <div className="space-y-6">
          {/* Section 1: Documents */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                1. Tài liệu & File liên quan
              </h2>
              <button className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-md transition-colors">
                <Paperclip className="w-4 h-4" />
              </button>
            </div>
            <div className="p-0 editor-container">
              <Quill 
                theme="snow"
                value={documentsContent}
                onChange={setDocumentsContent}
                readOnly={isReadOnly}
                modules={isReadOnly ? readOnlyModules : modules}
                placeholder="Nhập link tài liệu, thư mục lưu trữ, file thiết kế..."
                className="quill-custom"
              />
            </div>
          </div>

          {/* Section 2: Assets */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-indigo-600" />
                2. Thiết bị & Tài sản công ty
              </h2>
            </div>
            <div className="p-0 editor-container">
              <Quill 
                theme="snow"
                value={assetsContent}
                onChange={setAssetsContent}
                readOnly={isReadOnly}
                modules={isReadOnly ? readOnlyModules : modules}
                placeholder="Liệt kê laptop, màn hình, chìa khóa, thẻ xe..."
                className="quill-custom"
              />
            </div>
          </div>

          {/* Section 3: Accounts */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                3. Mật khẩu & Tài khoản phần mềm
              </h2>
            </div>
            <div className="p-0 editor-container">
              <Quill 
                theme="snow"
                value={accountsContent}
                onChange={setAccountsContent}
                readOnly={isReadOnly}
                modules={isReadOnly ? readOnlyModules : modules}
                placeholder="Danh sách tài khoản tool, server, admin panel..."
                className="quill-custom"
              />
            </div>
          </div>

          {/* Section 4: Pending Tasks */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-emerald-600" />
                4. Công việc dở dang & Tiến độ
              </h2>
            </div>
            <div className="p-0 editor-container">
              <Quill 
                theme="snow"
                value={tasksContent}
                onChange={setTasksContent}
                readOnly={isReadOnly}
                modules={isReadOnly ? readOnlyModules : modules}
                placeholder="Cập nhật tiến độ task hiện tại, ai sẽ là người tiếp nhận..."
                className="quill-custom"
              />
            </div>
          </div>
        </div>

        {/* Employee Action Buttons (Hidden in Manager View ideally, but shown here for UI prototype) */}
        {!isReadOnly && (
          <div className="flex items-center justify-end gap-4 pt-4">
            <button onClick={handleSaveDraft} className="flex items-center px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm shadow-sm">
              <Save className="w-4 h-4 mr-2" />
              Lưu nháp
            </button>
            <button onClick={handleSubmit} className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm">
              <Send className="w-4 h-4 mr-2" />
              Gửi quản lý duyệt
            </button>
          </div>
        )}
      </div>

      {/* Sidebar: Manager Review Section */}
      <div className="w-full lg:w-[380px] flex-shrink-0">
        <div className="sticky top-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-900 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">Đánh giá của Quản lý</h3>
              <p className="text-slate-400 text-sm mt-1">Dành cho người tiếp nhận bàn giao</p>
            </div>
            
            <div className={cn(
              "p-6 space-y-6",
              handover.status === 'DRAFT' && "opacity-50 pointer-events-none"
            )}>
              {/* Star Rating */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Chất lượng bàn giao
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setManagerRating(star)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star 
                        className={cn(
                          "w-8 h-8",
                          star <= managerRating 
                            ? "fill-amber-400 text-amber-400" 
                            : "fill-slate-100 text-slate-300"
                        )} 
                      />
                    </button>
                  ))}
                </div>
                {managerRating > 0 && (
                  <p className="text-xs text-amber-600 mt-2 font-medium">
                    {managerRating === 1 && "Rất kém"}
                    {managerRating === 2 && "Kém"}
                    {managerRating === 3 && "Đạt yêu cầu"}
                    {managerRating === 4 && "Tốt"}
                    {managerRating === 5 && "Xuất sắc"}
                  </p>
                )}
              </div>

              {/* Quality Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Đánh giá chung
                </label>
                <div className="relative">
                  <select className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-700 py-2.5 px-4 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Chọn mức độ...</option>
                    <option value="excellent">Xuất sắc - Bàn giao đầy đủ</option>
                    <option value="good">Tốt - Cần bổ sung vài chi tiết nhỏ</option>
                    <option value="satisfactory">Đạt - Có thể chấp nhận được</option>
                    <option value="needs_improvement">Chưa đạt - Yêu cầu làm lại</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Manager Comments */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nhận xét & Yêu cầu bổ sung
                </label>
                <textarea
                  value={managerComment}
                  onChange={(e) => setManagerComment(e.target.value)}
                  className="w-full min-h-[120px] p-3 text-sm text-slate-700 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
                  placeholder="Nhập nhận xét hoặc các điểm cần nhân sự làm rõ thêm..."
                />
              </div>

              {/* Manager Action Buttons */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                {handover.status === 'SUBMITTED' && isManagerView ? (
                  <button onClick={handleApprove} className="w-full flex items-center justify-center px-4 py-2.5 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm shadow-sm">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Phê duyệt & Chấp nhận
                  </button>
                ) : handover.status === 'APPROVED' ? (
                  <button disabled className="w-full flex items-center justify-center px-4 py-2.5 text-slate-500 bg-slate-100 border border-slate-300 rounded-lg cursor-not-allowed font-medium text-sm shadow-sm">
                    <Lock className="w-4 h-4 mr-2" />
                    Đã Khóa biên bản
                  </button>
                ) : null}
              </div>
              
            </div>
          </div>
          
          {/* Audit Info */}
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-400">
              Biên bản này được lưu trữ tự động sau khi phê duyệt.
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
