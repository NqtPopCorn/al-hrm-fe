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
import { projectService, ProjectListParams } from '../services/project.service';
import { Project } from '../types';

interface ProjectsProps {
  onViewDetail: (projectId: string) => void;
  onCreateNew: () => void;
}

export default function Projects({ onViewDetail, onCreateNew }: ProjectsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTech, setSearchTech] = useState('');
  const [searchYear, setSearchYear] = useState('');
  const [searchScale, setSearchScale] = useState('');
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: ProjectListParams = {};
      if (searchTerm) params.name = searchTerm;
      if (searchTech) params.tech = searchTech;
      if (searchYear) params.year = parseInt(searchYear);
      if (searchScale) params.scale = searchScale;

      const data = await projectService.list(params);
      setProjects(data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
      setError('Failed to load projects. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                <button className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                {project.name}
              </h3>
              
              <div className="text-slate-500 text-sm mb-4 flex-grow line-clamp-3" dangerouslySetInnerHTML={{ __html: project.content }} />
              
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
    </div>
  );
}
