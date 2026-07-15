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
  AlertCircle
} from 'lucide-react';
import JoditEditor from 'jodit-react';
import { projectService } from '../services/project.service';
import { employeeService } from '../services/employee.service';
import { Project, ProjectMember, ProjectAttachment, ProjectSnapshot, Employee } from '../types';

interface ProjectViewProps {
  projectId?: string; // If undefined, we are in create mode
  onBack: () => void;
}

export default function ProjectView({ projectId, onBack }: ProjectViewProps) {
  const [isEditing, setIsEditing] = useState(!projectId);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(!!projectId);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  useEffect(() => {
    // Basic debounce for employee search
    const timer = setTimeout(() => {
      if (searchEmp.length >= 2) {
        employeeService.list({ search: searchEmp, limit: 10 }).then((res) => {
          setEmployees(res.data);
        });
      } else {
        setEmployees([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchEmp]);

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
    try {
      const payload = {
        name: title,
        category,
        year: year ? parseInt(year) : undefined,
        scale,
        technologies: tech.split(',').map(t => t.trim()).filter(Boolean),
        content,
        members,
        attachments,
      };

      if (projectId) {
        await projectService.update(projectId, payload);
        // Also save history snapshot explicitly on edit
        await projectService.saveHistorySnapshot(projectId, {
          content_snapshot: content,
          change_note: 'Updated project details',
        });
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
        full_name: emp.name,
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
              <div className="relative flex items-center gap-2">
                 <input 
                    type="text" 
                    placeholder="Search employee name..." 
                    className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-md"
                    value={searchEmp}
                    onChange={(e) => {
                      setSearchEmp(e.target.value);
                      setShowEmpDropdown(true);
                    }}
                    onFocus={() => setShowEmpDropdown(true)}
                  />
                  {showEmpDropdown && employees.length > 0 && (
                    <div className="absolute top-10 left-0 w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
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

            <div className="border-t border-slate-100 pt-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Attachments (Links)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                        {att.file_type.includes('image') ? <FileImage className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-semibold text-slate-700 truncate">{att.file_name}</p>
                        <a href={att.file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline truncate block">View link</a>
                      </div>
                    </div>
                    <button onClick={() => removeAttachment(idx)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded shrink-0"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
              <div 
                className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer text-slate-500"
                onClick={() => {
                  const name = prompt('File name:');
                  const url = prompt('File URL:');
                  const type = prompt('File type (e.g. image/png, application/pdf):', 'application/pdf');
                  if (name && url && type) {
                    setAttachments([...attachments, { file_name: name, file_url: url, file_type: type }]);
                  }
                }}
              >
                <Paperclip className="w-6 h-6 mb-2 text-slate-400" />
                <p className="font-medium text-sm">Click to add attachment link</p>
              </div>
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

                <div className="max-w-none text-slate-800 prose prose-slate" dangerouslySetInnerHTML={{ __html: projectData.content }}></div>

                {projectData.attachments.length > 0 && (
                  <div className="border-t border-slate-200 pt-8 mt-8">
                    <h4 className="text-lg font-bold text-slate-900 mb-4 tracking-tight">Attached Files & Resources:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {projectData.attachments.map((att, idx) => (
                        <a 
                          key={idx}
                          href={att.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group bg-white cursor-pointer"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-md shrink-0">
                              {att.file_type.includes('image') ? <FileImage className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                            </div>
                            <div className="truncate">
                              <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors truncate">{att.file_name}</p>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
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
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900 text-sm">Bản ghi</span>
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
    </div>
  );
}
