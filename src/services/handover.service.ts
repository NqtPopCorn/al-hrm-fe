import { api } from '../lib/api';
import { Employee } from '../types';

export interface HandoverSection {
  documents: string;
  assets: string;
  accounts: string;
  tasks: string;
}

export interface ManagerReview {
  rating: number;
  comment: string;
}

export interface HandoverRecord {
  _id: string;
  id?: string;
  employeeId: Employee;
  departmentId?: { name: string; _id: string };
  targetManagerId?: { fullName: string; _id: string };
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
  sections: HandoverSection;
  managerReview: ManagerReview;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  editHistory?: Array<{
    actorId: string;
    actorRole: string;
    changedAt: string;
    previousSections: HandoverSection;
  }>;
}

export const getHandovers = async (): Promise<HandoverRecord[]> => {
  return await api.get('/handovers');
};

export const createHandoverDraft = async (): Promise<HandoverRecord> => {
  return await api.post('/handovers');
};

export const getHandoverById = async (id: string): Promise<HandoverRecord> => {
  return await api.get(`/handovers/${id}`);
};

export const updateDraft = async (id: string, sections: HandoverSection): Promise<HandoverRecord> => {
  return await api.patch(`/handovers/${id}/draft`, { sections });
};

export const submitHandover = async (id: string): Promise<HandoverRecord> => {
  return await api.post(`/handovers/${id}/submit`);
};

export const approveHandover = async (id: string, review: ManagerReview): Promise<HandoverRecord> => {
  return await api.post(`/handovers/${id}/approve`, review);
};

export const resetHandover = async (id: string): Promise<HandoverRecord> => {
  return await api.post(`/handovers/${id}/reset`);
};

export const adminUpdateSections = async (id: string, sections: HandoverSection): Promise<HandoverRecord> => {
  return await api.patch(`/handovers/${id}/admin-sections`, { sections });
};
