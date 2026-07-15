import { api } from '../lib/api';
import { Project } from '../types';

export interface ProjectListParams {
  name?: string;
  tech?: string;
  year?: number;
  scale?: string;
  category?: string;
  tags?: string;
}

export type CreateProjectPayload = Omit<
  Project,
  'id' | 'created_by' | 'updated_by' | 'history' | 'createdAt' | 'updatedAt'
>;

export type UpdateProjectPayload = Partial<CreateProjectPayload>;

export const projectService = {
  async list(params: ProjectListParams = {}) {
    const response = await api.get<Project[]>('/projects', {
      query: params as Record<string, string | number | boolean | null | undefined>,
    });
    return response;
  },

  async getById(id: string) {
    const response = await api.get<Project>(`/projects/${id}`);
    return response;
  },

  async create(payload: CreateProjectPayload) {
    const response = await api.post<Project>('/projects', payload);
    return response;
  },

  async update(id: string, payload: UpdateProjectPayload) {
    const response = await api.put<Project>(`/projects/${id}`, payload);
    return response;
  },

  async delete(id: string) {
    const response = await api.delete<Project>(`/projects/${id}`);
    return response;
  },

  async saveHistorySnapshot(
    id: string,
    payload: { content_snapshot: string; change_note?: string },
  ) {
    const response = await api.post<Project>(`/projects/${id}/history`, payload);
    return response;
  },
};
