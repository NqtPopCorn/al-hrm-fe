import { api } from '../lib/api';
import { AttendanceRecord, DailyReport } from '../types';

export const attendanceService = {
  listMonthlySummary(month?: string) {
    return api.get<AttendanceRecord[]>('/attendance/monthly-summary', {
      query: { month },
    });
  },

  checkIn(payload: Record<string, unknown>) {
    return api.post<AttendanceRecord>('/attendance/check-in', payload);
  },

  checkOut(payload: Record<string, unknown>) {
    return api.post<AttendanceRecord>('/attendance/check-out', payload);
  },

  getMyReports() {
    return api.get<DailyReport[]>('/daily-reports/me');
  },

  createDailyReport(payload: Partial<DailyReport>) {
    return api.post<DailyReport>('/daily-reports', payload);
  },

  updateDailyReport(reportId: string, payload: Partial<DailyReport>) {
    return api.patch<DailyReport>(`/daily-reports/${reportId}`, payload);
  },
};
