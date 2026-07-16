import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  FileImage,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Edit,
  History,
  Save,
  X,
  Trash2,
  Paperclip,
  Loader2,
  AlertCircle,
  Download,
  Eye
} from 'lucide-react';
import JoditEditor from 'jodit-react';
import DOMPurify from 'dompurify';
import { projectService } from '../services/project.service';
import { employeeService } from '../services/employee.service';
import { FileService } from '../services/file.service';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { Project, ProjectMember, ProjectAttachment, ProjectSnapshot, Employee } from '../types';

interface ProjectViewProps {
  projectId?: string; // If undefined, we are in create mode
  onBack: () => void;
}

export default function ProjectView({ projectId, onBack }: ProjectViewProps) {
  const [isEditing, setIsEditing] = useState(!projectId);
  const [showHistory, setShowHistory] = useState(false);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [isSaveVersionModalOpen, setIsSaveVersionModalOpen] = useState(false);
  const [changeNote, setChangeNote] = useState('');
  const [isLoading, setIsLoading] = useState(!!projectId);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<ProjectAttachment | null>(null);
  
  const { showToast } = useToast();

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [year, setYear] = useState('');
  const [scale, setScale] = useState('');
  const [tech, setTech] = useState('');
  const [content, setContent] = useState('');
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);
  const [history, setHistory] = useState<ProjectSnapshot[]>([]);
  
  const [projectData, setProjectData] = useState<Project | null>(null);

  // Autocomplete states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchEmp, setSearchEmp] = useState('');
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  
  // URL attachment states
  const [urlAttachName, setUrlAttachName] = useState('');
  const [urlAttachLink, setUrlAttachLink] = useState('');
  const [urlAttachType, setUrlAttachType] = useState('application/pdf');

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  useEffect(() => {
    // Basic debounce for employee search
    const timer = setTimeout(() => {
      employeeService.list({ search: searchEmp, limit: 10 }).then((res) => {
        setEmployees(res.data);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchEmp]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowEmpDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadProject = async () => {
    setIsLoading(true);
    try {
      const data = await projectService.getById(projectId!);
      setProjectData(data);
      setTitle(data.name);
      setCategory(data.category || '');
      setYear(data.year ? data.year.toString() : '');
      setScale(data.scale || '');
      setTech(data.technologies.join(', '));
      setContent(data.content);
      setMembers(data.members || []);
      setAttachments(data.attachments || []);
      setHistory(data.history || []);
    } catch (err) {
      setError('Failed to load project details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        name: title,
        category,
        year: year ? parseInt(year) : undefined,
        scale,
        technologies: tech.split(',').map(t => t.trim()).filter(Boolean),
        tags: [], // Tags were not in the UI, adding empty array to satisfy payload
        content,
        members,
        attachments,
      };

      if (projectId) {
        await projectService.update(projectId, payload);
        await loadProject();
        setIsEditing(false);
      } else {
        const newProj = await projectService.create(payload);
        // Automatically save initial history snapshot
        await projectService.saveHistorySnapshot(newProj.id, {
          content_snapshot: content,
          change_note: 'Initial version',
        });
        onBack();
      }
    } catch (err) {
      setError('Failed to save project.');
    } finally {
      setIsSaving(false);
    }
  };

  const addMember = (emp: Employee) => {
    if (!members.find(m => m.employee_id === emp.id)) {
      setMembers([...members, {
        employee_id: emp.id,
        full_name: emp.role ? `${emp.name} (${emp.role})` : emp.name,
        avatar_url: emp.avatar
      }]);
    }
    setSearchEmp('');
    setShowEmpDropdown(false);
  };

  const removeMember = (id: string) => {
    setMembers(members.filter(m => m.employee_id !== id));
  };

  const removeAttachment = (idx: number) => {
    setAttachments(attachments.filter((_, i) => i !== idx));
  };

  const editorConfig = {
    readonly: false,
    placeholder: 'Enter project content...',
    toolbarSticky: false,
    buttons: [
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'ul', 'ol', '|',
      'outdent', 'indent', '|',
      'font', 'fontsize', 'brush', '|',
      'image', 'table', 'link', '|',
      'align', 'undo', 'redo', 'hr', 'eraser', 'fullsize'
    ]
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-xl shadow-sm border border-slate-200">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden font-sans">
      <div className="px-8 py-10 max-w-5xl mx-auto relative">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách dự án
          </button>

          <div className="flex items-center gap-3">
            {!isEditing ? (
              <>
                <button 
                  onClick={() => setShowHistory(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg font-medium transition-all text-sm"
                >
                  <History className="w-4 h-4" />
                  Lịch sử phiên bản
                </button>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-all text-sm shadow-sm"
                >
                  <Edit className="w-4 h-4" />
                  Chỉnh sửa
                </button>
              </>
            ) : (
              <>
                {projectId && (
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      loadProject(); // reset
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-all text-sm"
                  >
                    <X className="w-4 h-4" />
                    Hủy
                  </button>
                )}
                {projectId && (
                  <button 
                    onClick={() => setIsSaveVersionModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg font-medium transition-all text-sm shadow-sm"
                  >
                    <History className="w-4 h-4" />
                    Lưu phiên bản
                  </button>
                )}
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-3 py-1.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-all text-sm shadow-sm disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Lưu thay đổi
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {isEditing ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <input
                type="text"
                placeholder="Tên dự án"
                className="w-full text-4xl font-extrabold text-slate-900 placeholder:text-slate-300 border-b border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-0 px-0 bg-transparent mb-6 pb-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Year</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Scale</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    value={scale}
                    onChange={(e) => setScale(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Technologies (comma sep)</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    value={tech}
                    onChange={(e) => setTech(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Team Participants</label>
              <div className="relative flex items-start gap-2 max-w-md" ref={dropdownRef}>
                 <input 
                    type="text" 
                    placeholder="Add team member..." 
                    className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                    value={searchEmp}
                    onChange={(e) => {
                      setSearchEmp(e.target.value);
                      setShowEmpDropdown(true);
                    }}
                    onFocus={() => setShowEmpDropdown(true)}
                  />
                  <button 
                    type="button"
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-transparent"
                    onClick={() => {
                      if (employees.length > 0) {
                        addMember(employees[0]);
                      }
                    }}
                  >
                    Add
                  </button>
                  {showEmpDropdown && employees.length > 0 && (
                    <div className="absolute top-11 left-0 w-[calc(100%-70px)] bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {employees.map(emp => (
                        <div 
                          key={emp.id} 
                          className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700"
                          onClick={() => addMember(emp)}
                        >
                          {emp.name} ({emp.code})
                        </div>
                      ))}
                    </div>
                  )}
              </div>
              <div className="flex gap-2 mt-4 flex-wrap">
                {members.map(m => (
                  <span key={m.employee_id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-md text-sm font-medium">
                    {m.full_name} <X className="w-3.5 h-3.5 cursor-pointer hover:text-blue-900" onClick={() => removeMember(m.employee_id)} />
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <label className="block text-sm font-semibold text-slate-700 mb-4">Document Content</label>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <JoditEditor
                  value={content}
                  config={editorConfig}
                  onBlur={(newContent) => setContent(newContent)}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-8 pb-4">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-base font-semibold text-slate-800">Quản lý File Đính Kèm</label>
                <button 
                  type="button"
                  onClick={() => setIsAttachmentModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md text-sm font-medium transition-colors"
                >
                  <Paperclip className="w-4 h-4" /> Thêm File
                </button>
              </div>
              
              {attachments.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 text-slate-500">
                  <FileText className="w-10 h-10 mb-3 text-slate-300" />
                  <p className="font-medium text-sm text-slate-600">Chưa có file đính kèm nào</p>
                  <p className="text-xs mt-1">Bấm "Thêm File" để upload tài liệu dự án</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-400 transition-colors shadow-sm relative group">
                      <div className="flex items-start">
                        <div className="p-3 bg-blue-50 text-blue-500 rounded-lg mr-3 shrink-0 cursor-pointer" onClick={() => setPreviewAttachment(att)}>
                          {att.file_type?.includes('image') ? <FileImage className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                        </div>
                        <div className="flex-1 min-w-0 pr-8">
                          <h3 className="text-sm font-semibold text-slate-800 truncate" title={att.file_name}>{att.file_name}</h3>
                          <div className="mt-1 text-xs text-slate-500 truncate">
                            {att.file_type || 'Unknown Type'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="absolute top-3 right-3 flex opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-100 shadow-sm rounded-md overflow-hidden">
                        <button 
                          type="button"
                          onClick={() => setPreviewAttachment(att)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-50"
                          title="Xem / Tải xuống"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-50 border-l border-slate-100"
                          title="Xóa khỏi dự án"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            {projectData && (
              <>
                <div className="absolute top-24 right-8 flex flex-col items-end text-sm">
                  {projectData.updated_by && (
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      Last edited by {projectData.updated_by.full_name}
                    </div>
                  )}
                </div>

                <div className="mb-8 pr-64">
                  <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
                    {projectData.name}
                  </h1>
                  <div className="flex flex-wrap gap-2">
                    {projectData.category && (
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md">
                        Category: {projectData.category}
                      </span>
                    )}
                    {projectData.year && (
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md">
                        Year: {projectData.year}
                      </span>
                    )}
                    {projectData.scale && (
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold rounded-md">
                        Scale: {projectData.scale}
                      </span>
                    )}
                    {projectData.technologies.length > 0 && (
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md">
                        Tech: {projectData.technologies.join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                {projectData.members.length > 0 && (
                  <div className="flex items-center gap-4 pb-8 mb-8 border-b border-slate-100">
                    <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Team Participants:</span>
                    <div className="flex items-center gap-4 flex-wrap">
                      {projectData.members.map(m => (
                        <div key={m.employee_id} className="flex items-center gap-2">
                          <img
                            src={m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.full_name)}`}
                            alt={m.full_name}
                            className="w-8 h-8 rounded-full border border-slate-200 shadow-sm"
                          />
                          <span className="text-sm font-medium text-slate-700">{m.full_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="max-w-none text-slate-800 prose prose-slate" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(projectData.content) }}></div>

                {projectData.attachments.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-slate-100">
                    <h4 className="text-lg font-bold text-slate-900 mb-4 tracking-tight">Tài liệu dự án đính kèm</h4>
                    {projectData.attachments.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">Không có tài liệu nào được đính kèm.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projectData.attachments.map((att, idx) => (
                          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-400 transition-colors shadow-sm relative group">
                            <div className="flex items-start">
                              <div className="p-3 bg-blue-50 text-blue-500 rounded-lg mr-3 shrink-0 cursor-pointer" onClick={() => setPreviewAttachment(att)}>
                                {att.file_type?.includes('image') ? <FileImage className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                              </div>
                              <div className="flex-1 min-w-0 pr-8">
                                <h3 className="text-sm font-semibold text-slate-800 truncate" title={att.file_name}>{att.file_name}</h3>
                                <div className="mt-1 text-xs text-slate-500 truncate">
                                  {att.file_type || 'Unknown Type'}
                                </div>
                              </div>
                            </div>
                            
                            <div className="absolute top-3 right-3 flex opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-100 shadow-sm rounded-md overflow-hidden">
                              <button 
                                type="button"
                                onClick={() => setPreviewAttachment(att)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-50"
                                title="Xem / Tải xuống"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Version History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Lịch sử phiên bản (Tối đa 5)</h3>
              </div>
              <button 
                onClick={() => setShowHistory(false)}
                className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-md hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {history.length === 0 ? (
                <p className="text-center text-slate-500">Chưa có lịch sử thay đổi.</p>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {history.map((snap, idx) => (
                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-900 text-sm">Bản ghi</span>
                          <button
                            onClick={async () => {
                              if (!projectId) return;
                              if (!window.confirm('Bạn có chắc chắn muốn khôi phục lại nội dung phiên bản này? Nội dung hiện tại sẽ bị ghi đè!')) return;
                              
                              try {
                                showToast({ type: 'success', message: 'Đang khôi phục...' });
                                await projectService.update(projectId, { content: snap.content_snapshot });
                                // Save audit trail for the restore action
                                await projectService.saveHistorySnapshot(projectId, {
                                  content_snapshot: snap.content_snapshot,
                                  change_note: `Khôi phục từ phiên bản: ${snap.change_note || 'N/A'}`,
                                });
                                showToast({ type: 'success', message: 'Đã khôi phục thành công!' });
                                setShowHistory(false);
                                loadProject(); // Reload project to show new content
                              } catch (e: any) {
                                showToast({ type: 'error', message: e?.response?.data?.message || 'Lỗi khi khôi phục' });
                              }
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                          >
                            Khôi phục
                          </button>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">{snap.change_note || 'Updated project'}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-medium">{snap.modified_by.full_name}</span>
                          <span>•</span>
                          <span>{new Date(snap.modified_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Attachment Modal */}
      <Modal
        isOpen={isAttachmentModalOpen}
        onClose={() => setIsAttachmentModalOpen(false)}
        title="Add Attachment"
      >
        <div className="space-y-6">
          {/* Upload Option */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Option 1: Upload File</h3>
            <input 
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                
                try {
                  setIsUploading(true);
                  const res = await FileService.upload(file, { fileType: 'Other', isPrivate: false });
                  setAttachments([...attachments, { 
                    file_name: res.file.filename || file.name, 
                    file_url: res.file.url, 
                    file_type: file.type || 'application/octet-stream' 
                  }]);
                  setIsAttachmentModalOpen(false);
                } catch (err: any) {
                  showToast({ type: 'error', message: err?.response?.data?.message || 'Upload failed' });
                } finally {
                  setIsUploading(false);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full border-2 border-dashed border-slate-200 rounded-lg p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-colors text-slate-500 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 mb-1 text-blue-500 animate-spin" />
                  <span className="text-sm">Uploading...</span>
                </>
              ) : (
                <>
                  <Paperclip className="w-5 h-5 mb-1 text-slate-400" />
                  <span className="text-sm">Click to browse file</span>
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">Or</span>
            </div>
          </div>

          {/* URL Option */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Option 2: Add from URL</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="File Name"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                value={urlAttachName}
                onChange={e => setUrlAttachName(e.target.value)}
              />
              <input
                type="url"
                placeholder="https://..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                value={urlAttachLink}
                onChange={e => setUrlAttachLink(e.target.value)}
              />
              <input
                type="text"
                placeholder="Type (e.g. application/pdf, image/png)"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                value={urlAttachType}
                onChange={e => setUrlAttachType(e.target.value)}
              />
              <button
                type="button"
                className="w-full bg-slate-800 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-700"
                onClick={() => {
                  if (urlAttachName && urlAttachLink && urlAttachType) {
                    // Validate URL scheme to prevent javascript: XSS
                    try {
                      const parsed = new URL(urlAttachLink);
                      if (!['http:', 'https:'].includes(parsed.protocol)) {
                        showToast({ type: 'error', message: 'Chỉ hỗ trợ URL http:// hoặc https://' });
                        return;
                      }
                    } catch {
                      showToast({ type: 'error', message: 'URL không hợp lệ' });
                      return;
                    }
                    setAttachments([...attachments, {
                      file_name: urlAttachName,
                      file_url: urlAttachLink,
                      file_type: urlAttachType
                    }]);
                    setUrlAttachName('');
                    setUrlAttachLink('');
                    setIsAttachmentModalOpen(false);
                  }
                }}
              >
                Add Link
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        title="Xem trước tài liệu"
        maxWidth="max-w-5xl"
      >
        {previewAttachment && (
          <div className="flex flex-col h-[70vh]">
            <div className="flex-1 w-full bg-slate-100 rounded-lg overflow-hidden flex flex-col border border-slate-200">
              {(() => {
              const url = previewAttachment.file_url;
              const type = previewAttachment.file_type || '';
              const name = previewAttachment.file_name || '';
              
              const isImage = type.startsWith('image/') || /\.(jpeg|jpg|gif|png)$/i.test(name);
              const isPdf = type === 'application/pdf' || /\.pdf$/i.test(name);
              const isDoc = type.includes('word') || type.includes('officedocument') || /\.(doc|docx)$/i.test(name);

              if (isImage) {
                return (
                  <div className="flex flex-1 items-center justify-center p-4">
                    <img src={url} alt={name} className="max-w-full max-h-full object-contain shadow-sm" />
                  </div>
                );
              }
              
              if (isPdf) {
                return <iframe src={url} className="flex-1 w-full border-0" title={name} />;
              }

              if (isDoc) {
                const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
                return (
                  <iframe src={viewerUrl} className="flex-1 w-full border-0" title={name}>
                    This is an embedded <a target="_blank" href="http://office.com" rel="noreferrer">Microsoft Office</a> document, powered by <a target="_blank" href="http://office.com/webapps" rel="noreferrer">Office Online</a>.
                  </iframe>
                );
              }

              return (
                <div className="flex flex-1 flex-col items-center justify-center text-slate-500 p-8 text-center">
                  <FileText className="w-16 h-16 mb-4 text-slate-300" />
                  <p className="text-lg font-medium text-slate-700 mb-2">No preview available</p>
                  <p className="text-sm mb-6">This file type cannot be previewed directly in the browser.</p>
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Download File
                  </a>
                </div>
              );
            })()}
            </div>
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
              <button 
                onClick={() => setPreviewAttachment(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors text-sm"
              >
                Đóng
              </button>
              <a 
                href={previewAttachment.file_url} 
                download={previewAttachment.file_name} 
                target="_blank" 
                rel="noreferrer"
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Tải xuống
              </a>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isSaveVersionModalOpen}
        onClose={() => setIsSaveVersionModalOpen(false)}
        title="Lưu phiên bản mới"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Ghi chú thay đổi (tùy chọn)</label>
            <textarea
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              rows={3}
              placeholder="Vd: Cập nhật danh sách thành viên và tài liệu..."
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setIsSaveVersionModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={async () => {
                if (!projectId) return;
                try {
                  setIsSaving(true);
                  await projectService.saveHistorySnapshot(projectId, { content_snapshot: content, change_note: changeNote });
                  showToast({ type: 'success', message: 'Lưu phiên bản thành công!' });
                  setIsSaveVersionModalOpen(false);
                  setChangeNote('');
                  loadProject();
                } catch (e: any) {
                  showToast({ type: 'error', message: e?.response?.data?.message || 'Lỗi khi lưu phiên bản' });
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              Lưu phiên bản
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
