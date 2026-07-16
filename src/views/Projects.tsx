import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Calendar, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { Project } from '../types';
import DOMPurify from 'dompurify';

interface ProjectsProps {
  onViewDetail: (projectId: string) => void;
  onCreateNew: () => void;
}

export default function Projects({ onViewDetail, onCreateNew }: ProjectsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTech, setSearchTech] = useState('');
  const [searchYear, setSearchYear] = useState('');
  const [searchScale, setSearchScale] = useState('');
  
  const [page, setPage] = useState(1);
  const limit = 9; // Show 9 per page in grid
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const {
    projects,
    total,
    isLoading,
    error,
    deleteProject
  } = useProjects({
    page,
    limit,
    name: searchTerm || undefined,
    tech: searchTech || undefined,
    year: searchYear ? parseInt(searchYear) : undefined,
    scale: searchScale || undefined,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, searchTech, searchYear, searchScale]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Dự án</h1>
          <p className="text-slate-500 mt-1">Hồ sơ và thông tin các dự án công ty đã tham gia</p>
        </div>
        <button 
          onClick={onCreateNew}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm dự án mới
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tên dự án..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Công nghệ..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTech}
            onChange={(e) => setSearchTech(e.target.value)}
          />
        </div>

        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="number" 
            placeholder="Năm thực hiện..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchYear}
            onChange={(e) => setSearchYear(e.target.value)}
          />
        </div>

        <select 
          className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={searchScale}
          onChange={(e) => setSearchScale(e.target.value)}
        >
          <option value="">Tất cả quy mô</option>
          <option value="Small">Nhỏ</option>
          <option value="Medium">Vừa</option>
          <option value="Large">Lớn</option>
          <option value="Enterprise">Doanh nghiệp</option>
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Project Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500">Không tìm thấy dự án nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div 
              key={project.id} 
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-6 flex flex-col group cursor-pointer"
              onClick={() => onViewDetail(project.id)}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {project.category || 'N/A'}
                </span>
                <div className="relative">
                  <button 
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdown(activeDropdown === project.id ? null : project.id);
                    }}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  {activeDropdown === project.id && (
                    <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1" onClick={e => e.stopPropagation()}>
                      <button 
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        onClick={() => {
                          setActiveDropdown(null);
                          onViewDetail(project.id);
                        }}
                      >
                        Xem chi tiết
                      </button>
                      <button 
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        onClick={async () => {
                          setActiveDropdown(null);
                          if (window.confirm('Bạn có chắc chắn muốn xóa dự án này?')) {
                            try {
                              await deleteProject(project.id);
                            } catch (e) {
                              alert('Lỗi khi xóa dự án');
                            }
                          }
                        }}
                      >
                        Xóa dự án
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                {project.name}
              </h3>
              
              <div className="text-slate-500 text-sm mb-4 flex-grow line-clamp-3" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(project.content) }} />
              
              <div className="space-y-4 mt-auto border-t border-slate-100 pt-4">
                {project.technologies?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {project.technologies.slice(0, 3).map(tech => (
                      <span key={tech} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 3 && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                        +{project.technologies.length - 3}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <div className="flex -space-x-2">
                    {project.members?.slice(0, 3).map((member, idx) => (
                      <img 
                        key={idx} 
                        src={member.avatar_url || 'https://via.placeholder.com/150'} 
                        alt={member.full_name}
                        title={member.full_name}
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover"
                      />
                    ))}
                    {project.members?.length > 3 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-xs font-medium text-slate-500 shadow-sm">
                        +{project.members.length - 3}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {project.year || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && total > limit && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 rounded-xl shadow-sm">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Trang trước
            </button>
            <button
              onClick={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))}
              disabled={page >= Math.ceil(total / limit)}
              className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Trang sau
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-700">
                Hiển thị <span className="font-medium">{(page - 1) * limit + 1}</span> đến <span className="font-medium">{Math.min(page * limit, total)}</span> trong tổng số <span className="font-medium">{total}</span> dự án
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Trang trước</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>
                {[...Array(Math.ceil(total / limit))].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 ${
                      page === i + 1
                        ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                        : 'text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))}
                  disabled={page >= Math.ceil(total / limit)}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Trang sau</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
