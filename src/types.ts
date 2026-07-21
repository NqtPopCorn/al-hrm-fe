export type Role = 'Super Admin' | 'HR Admin' | 'Manager' | 'Employee';
export type AccountStatus =
  | 'pending_verification'
  | 'active'
  | 'inactive'
  | 'banned';

export type EmployeeWorkStatus =
  | 'PROBATION'
  | 'ACTIVE'
  | 'ON_LEAVE'
  | 'RESIGNED'
  | 'TERMINATED'
  | 'INACTIVE';

export type CompanyEmailStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export type WorkMode = 'OFFICE' | 'WFH' | 'UNKNOWN';

export type AttendanceStatus =
  | 'VALID'
  | 'LATE'
  | 'EARLY_LEAVE'
  | 'MISSING_CHECKOUT'
  | 'INVALID'
  | 'MANUAL_ADJUSTED';

export type AdjustmentRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type PayrollStatus =
  | 'DRAFT'
  | 'CALCULATED'
  | 'HR_REVIEWED'
  | 'APPROVED'
  | 'PAID'
  | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  role: Role;
  name: string;
  avatar?: string;
  permissions?: string[];
}

export interface UserAccount {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: Role;
  status: AccountStatus;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  id: string;
  name: string;
  code?: string;
  managerId?: string | null;
  isActive?: boolean;
  disabledAt?: string | null;
}

export interface Position {
  id: string;
  title: string;
  departmentId: string;
  baseSalary: number;
}

export interface EmployeeExportReadiness {
  canExportDefaultSdlcAccount: boolean;
  reasons: string[];
}

export interface EmployeeSensitiveInfo {
  employeeId: string;
  baseSalary?: number;
  bankId?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  birthday?: string;
}

export interface Employee {
  id: string;
  code: string;
  name: string;
  personalEmail: string;
  companyEmail: string;
  phone: string;
  avatar?: string;
  role: Role;
  departmentId: string | null;
  positionId: string | null;
  workStatus: EmployeeWorkStatus;
  emailStatus: CompanyEmailStatus;
  joinDate: string;
  isActive?: boolean;
  disabledAt?: string | null;
  sensitiveInfo?: EmployeeSensitiveInfo;
  exportReadiness?: EmployeeExportReadiness;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  departmentId?: string | null;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  type: WorkMode | null;
  ip?: string;
  location?: string;
  status: AttendanceStatus;
  statusReasonCode?: string | null;
  workdayCoefficient: number;
  dayUnit?: number;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  workingMinutes?: number;
  standardWorkMinutes?: number;
  warningMessage?: string;
  isOutRange?: boolean;
  dailyReportId?: string | null;
  manualAdjustmentReason?: string | null;
}

export interface AttendanceAdjustmentRequest {
  id: string;
  employeeId: string;
  workDate: string;
  requestedCheckIn: string | null;
  requestedCheckOut: string | null;
  requestedCheckInAt?: string | null;
  requestedCheckOutAt?: string | null;
  reason: string;
  status: AdjustmentRequestStatus;
  reviewerId?: string | null;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  positionId: string;
  status: 'New' | 'Interviewing' | 'Offered' | 'Rejected' | 'Hired';
  cvUrl?: string;
  skills: string[];
}

export interface Interview {
  id: string;
  candidateId: string;
  interviewerId: string;
  date: string;
  time: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  result?: string;
}

export interface DocumentRecord {
  id: string;
  employeeId: string;
  title: string;
  type: 'Contract' | 'ID Card' | 'Bank Info' | 'Education' | 'Handover';
  url: string;
  uploadDate: string;
  isSensitive: boolean;
}

export interface ShiftConfig {
  startTime: string;
  endTime: string;
  breakStartTime: string;
  breakEndTime: string;
  standardHours: number;
  minWorkingDaysPerMonth: number;
}

export interface PayrollBankSnapshot {
  bankId?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
}

export interface PayrollAttendanceSummary {
  totalAttendances: number;
  payableAttendances: number;
  workedMinutes: number;
  workedDayEquivalent: number;
}

export interface PayrollSystemEarnings {
  baseSalaryProrated: number;
}

export interface PayrollMandatoryInsuranceBreakdown {
  insuranceBase: number;
  socialInsurance: number;
  healthInsurance: number;
  unemploymentInsurance: number;
  total: number;
}

export interface PayrollSystemDeductions {
  mandatoryInsurance: PayrollMandatoryInsuranceBreakdown;
  personalIncomeTax: number;
  salaryAdvances?: number;
}

export interface PayrollManualAdjustments {
  allowance: number;
  bonus: number;
  otherDeduction: number;
  otherDeductionReason?: string | null;
  note?: string | null;
  updatedBy?: string | null;
  updatedAt?: string | null;
}

export interface PayrollItem {
  id: string;
  periodId: string;
  periodCode: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentId?: string | null;
  positionId?: string | null;
  baseSalarySnapshot: number;
  systemEarnings: PayrollSystemEarnings;
  systemDeductions: PayrollSystemDeductions;
  manualAdjustments: PayrollManualAdjustments;
  bankSnapshot: PayrollBankSnapshot;
  attendanceSummary: PayrollAttendanceSummary;
  standardWorkingDays: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  paidAmount: number;
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID';
  paymentHistory: {
    amount: number;
    date: string;
    method: string;
    note?: string;
  }[];
  calculatedAt?: string | null;
  warnings: string[];
}

export interface PayrollPeriod {
  id: string;
  code: string;
  name: string;
  periodStart: string;
  periodEnd: string;
  status: PayrollStatus;
  standardWorkingDays: number;
  calculatedBy?: string | null;
  calculatedAt?: string | null;
  hrReviewedBy?: string | null;
  hrReviewedAt?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  paidBy?: string | null;
  paidAt?: string | null;
}

export interface PayrollPeriodDetail extends PayrollPeriod {
  items: PayrollItem[];
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  baseSalary: number;
  standardWorkDays: number;
  actualWorkDays: number;
  allowances: number;
  bonus: number;
  totalDeduction: number;
  grossSalary: number;
  netSalary: number;
  status: PayrollStatus;
  approvedAt?: string;
}

export interface SalaryAdvance {
  id: string;
  employeeId: string;
  date: string;
  amount: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface DailyReport {
  id: string;
  employeeId: string;
  employeeSnapshot?: {
    employeeId: string;
    employeeCode: string;
    employeeName: string;
  };
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

export interface ProjectMember {
  employee_id: string;
  full_name: string;
  avatar_url?: string;
}

export interface ProjectAttachment {
  file_name: string;
  file_url: string;
  file_type: string;
}

export interface AuditUser {
  user_id: string;
  full_name: string;
}

export interface ProjectSnapshot {
  content_snapshot: string;
  modified_by: AuditUser;
  modified_at: string;
  change_note?: string;
}

export interface Project {
  id: string;
  name: string;
  content: string;
  category?: string;
  technologies: string[];
  tags: string[];
  scale?: string;
  year?: number;
  members: ProjectMember[];
  attachments: ProjectAttachment[];
  created_by: AuditUser;
  updated_by?: AuditUser;
  history: ProjectSnapshot[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SystemAuditLog {
  _id: string;
  type: string;
  severity: string;
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AuditLogStats {
  total: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  recentCount: number;
}
