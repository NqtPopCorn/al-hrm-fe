import { api } from '../lib/api';

export interface WorkingScheduleRequest {
  id: string;
  employeeId: string;
  effectiveDate: string;
  workingDays: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectMessage?: string;
  reviewerId?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface CreateWorkingScheduleRequestDto {
  effectiveDate: string;
  workingDays: string[];
}

export interface ReviewWorkingScheduleRequestDto {
  status: 'APPROVED' | 'REJECTED';
  rejectMessage?: string;
}

class WorkingScheduleRequestService {
  async createRequest(data: CreateWorkingScheduleRequestDto): Promise<WorkingScheduleRequest> {
    return api.post<WorkingScheduleRequest>('/working-schedule-requests', data);
  }

  async getMyRequests(): Promise<WorkingScheduleRequest[]> {
    return api.get<WorkingScheduleRequest[]>('/working-schedule-requests/my-requests');
  }

  async getCurrentSchedule(): Promise<WorkingScheduleRequest | null> {
    return api.get<WorkingScheduleRequest | null>('/working-schedule-requests/current');
  }

  async getAllRequests(): Promise<WorkingScheduleRequest[]> {
    return api.get<WorkingScheduleRequest[]>('/working-schedule-requests');
  }

  async reviewRequest(id: string, data: ReviewWorkingScheduleRequestDto): Promise<WorkingScheduleRequest> {
    return api.patch<WorkingScheduleRequest>(`/working-schedule-requests/${id}/review`, data);
  }
}

export const workingScheduleRequestService = new WorkingScheduleRequestService();
