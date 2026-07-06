import {
  AttendanceAdjustmentRequest,
  AttendanceRecord,
  AttendanceStatus,
  DailyReport,
  WorkMode,
} from '../types';
import { api } from '../lib/api';

interface ApiAttendanceRecord {
  id: string;
  employeeId: string;
  departmentId?: string | null;
  workDate: string;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  workLocationMode: WorkMode;
  workLocationMetadata?: {
    publicIp?: string;
    wifiSsid?: string;
    gps?: { lat: number; lng: number };
  };
  status: AttendanceStatus;
  dailyReportId?: string | null;
  manualAdjustmentReason?: string | null;
}

interface ApiDailyReport {
  id: string;
  employeeId: string;
  workDate: string;
  contentHtml: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiAdjustmentRequest {
  id: string;
  employeeId: string;
  workDate: string;
  requestedCheckInAt?: string | null;
  requestedCheckOutAt?: string | null;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewerId?: string | null;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceCheckInPayload {
  employeeId?: string;
  departmentId?: string | null;
  workDate: string;
  checkInAt: string;
  requestedMode: WorkMode;
  publicIp?: string;
  wifiSsid?: string;
}

export interface AttendanceCheckOutPayload {
  employeeId?: string;
  departmentId?: string | null;
  workDate: string;
  checkOutAt: string;
  reportContentHtml: string;
  requestedMode: WorkMode;
  publicIp?: string;
  wifiSsid?: string;
}

export interface AttendanceSummaryParams {
  month?: string;
  employeeId?: string;
}

export interface ManualAdjustAttendancePayload {
  attendanceId?: string;
  employeeId: string;
  departmentId?: string | null;
  workDate: string;
  checkInAt?: string;
  checkOutAt?: string;
  reason: string;
  requestedMode: WorkMode;
  publicIp?: string;
  wifiSsid?: string;
}

export interface AdjustmentRequestPayload {
  employeeId?: string;
  workDate: string;
  requestedCheckInAt?: string;
  requestedCheckOutAt?: string;
  reason: string;
}

export interface AdjustmentRequestReviewPayload {
  decision: 'APPROVED' | 'REJECTED';
  reviewNote?: string;
}

export interface AdjustmentRequestListParams {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  employeeId?: string;
}

function formatTime(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizeAttendance(record: ApiAttendanceRecord): AttendanceRecord {
  return {
    id: record.id,
    employeeId: record.employeeId,
    departmentId: record.departmentId ?? null,
    date: record.workDate,
    checkIn: formatTime(record.checkInAt),
    checkOut: formatTime(record.checkOutAt),
    checkInAt: record.checkInAt ?? null,
    checkOutAt: record.checkOutAt ?? null,
    type: record.workLocationMode,
    ip: record.workLocationMetadata?.publicIp,
    location:
      record.workLocationMetadata?.wifiSsid ??
      (record.workLocationMetadata?.gps
        ? `${record.workLocationMetadata.gps.lat}, ${record.workLocationMetadata.gps.lng}`
        : undefined),
    status: record.status,
    workdayCoefficient:
      record.status === 'INVALID' || record.status === 'MISSING_CHECKOUT'
        ? 0
        : 1,
    dailyReportId: record.dailyReportId ?? null,
    manualAdjustmentReason: record.manualAdjustmentReason ?? null,
  };
}

function normalizeDailyReport(report: ApiDailyReport): DailyReport {
  return {
    id: report.id,
    employeeId: report.employeeId,
    date: report.workDate,
    content: report.contentHtml,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    submittedAt: report.submittedAt,
  };
}

function normalizeAdjustmentRequest(
  request: ApiAdjustmentRequest,
): AttendanceAdjustmentRequest {
  return {
    id: request.id,
    employeeId: request.employeeId,
    workDate: request.workDate,
    requestedCheckIn: formatTime(request.requestedCheckInAt),
    requestedCheckOut: formatTime(request.requestedCheckOutAt),
    requestedCheckInAt: request.requestedCheckInAt ?? null,
    requestedCheckOutAt: request.requestedCheckOutAt ?? null,
    reason: request.reason,
    status: request.status,
    reviewerId: request.reviewerId ?? null,
    reviewNote: request.reviewNote ?? null,
    reviewedAt: request.reviewedAt ?? null,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

export const attendanceService = {
  async listMonthlySummary(params: AttendanceSummaryParams = {}) {
    const response = await api.get<ApiAttendanceRecord[]>(
      '/attendance/monthly-summary',
      {
        query: params as Record<
          string,
          string | number | boolean | null | undefined
        >,
      },
    );
    return response.map(normalizeAttendance);
  },

  async checkIn(payload: AttendanceCheckInPayload) {
    const response = await api.post<ApiAttendanceRecord>(
      '/attendance/check-in',
      payload,
    );
    return normalizeAttendance(response);
  },

  async checkOut(payload: AttendanceCheckOutPayload) {
    const response = await api.post<
      ApiAttendanceRecord & { dailyReport?: ApiDailyReport }
    >('/attendance/check-out', payload);

    return {
      attendance: normalizeAttendance(response),
      dailyReport: response.dailyReport
        ? normalizeDailyReport(response.dailyReport)
        : null,
    };
  },

  async manualAdjust(payload: ManualAdjustAttendancePayload) {
    const response = await api.post<ApiAttendanceRecord>(
      '/attendance/manual-adjust',
      payload,
    );
    return normalizeAttendance(response);
  },

  async createAdjustmentRequest(payload: AdjustmentRequestPayload) {
    const response = await api.post<ApiAdjustmentRequest>(
      '/attendance/adjustment-requests',
      payload,
    );
    return normalizeAdjustmentRequest(response);
  },

  async listAdjustmentRequests(params: AdjustmentRequestListParams = {}) {
    const response = await api.get<ApiAdjustmentRequest[]>(
      '/attendance/adjustment-requests',
      {
        query: params as Record<
          string,
          string | number | boolean | null | undefined
        >,
      },
    );
    return response.map(normalizeAdjustmentRequest);
  },

  async approveAdjustmentRequest(
    requestId: string,
    payload: AdjustmentRequestReviewPayload,
  ) {
    const response = await api.post<ApiAdjustmentRequest>(
      `/attendance/adjustment-requests/${requestId}/approve`,
      payload,
    );
    return normalizeAdjustmentRequest(response);
  },

  async getMyReports() {
    const response = await api.get<ApiDailyReport[]>('/daily-reports/me');
    return response.map(normalizeDailyReport);
  },

  async getAllReports() {
    const response = await api.get<ApiDailyReport[]>('/daily-reports');
    return response.map(normalizeDailyReport);
  },

  async createDailyReport(payload: {
    employeeId?: string;
    workDate: string;
    contentHtml: string;
  }) {
    const response = await api.post<ApiDailyReport>('/daily-reports', payload);
    return normalizeDailyReport(response);
  },

  async updateDailyReport(
    reportId: string,
    payload: {
      contentHtml: string;
    },
  ) {
    const response = await api.patch<ApiDailyReport>(
      `/daily-reports/${reportId}`,
      payload,
    );
    return normalizeDailyReport(response);
  },
};
