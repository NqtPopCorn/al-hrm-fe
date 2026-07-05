import {
  AttendanceRecord,
  Candidate,
  DailyReport,
  Department,
  Employee,
  PayrollRecord,
  Position,
  SalaryAdvance,
  ShiftConfig,
} from './types';

export const mockDepartments: Department[] = [
  { id: 'd1', name: 'Engineering', code: 'ENG' },
  { id: 'd2', name: 'Human Resources', code: 'HR' },
  { id: 'd3', name: 'Sales', code: 'SAL' },
];

export const mockPositions: Position[] = [
  { id: 'p1', title: 'Frontend Developer', departmentId: 'd1', baseSalary: 15000000 },
  { id: 'p2', title: 'Backend Developer', departmentId: 'd1', baseSalary: 16000000 },
  { id: 'p3', title: 'HR Manager', departmentId: 'd2', baseSalary: 18000000 },
  { id: 'p4', title: 'Sales Executive', departmentId: 'd3', baseSalary: 12000000 },
];

export const mockEmployees: Employee[] = [
  {
    id: 'e1',
    code: 'EMP001',
    name: 'John Doe',
    personalEmail: 'john.doe@gmail.com',
    companyEmail: 'john.doe@nova.com',
    phone: '0123456789',
    role: 'Super Admin',
    departmentId: 'd1',
    positionId: 'p1',
    workStatus: 'ACTIVE',
    emailStatus: 'ACTIVE',
    joinDate: '2023-01-15',
    sensitiveInfo: {
      employeeId: 'e1',
      baseSalary: 20000000,
      bankId: 'MB',
      bankAccountNumber: '0123456789',
      bankAccountName: 'JOHN DOE',
    },
  },
  {
    id: 'e2',
    code: 'EMP002',
    name: 'Jane Smith',
    personalEmail: 'jane.smith@gmail.com',
    companyEmail: 'jane.smith@nova.com',
    phone: '0987654321',
    role: 'HR Admin',
    departmentId: 'd2',
    positionId: 'p3',
    workStatus: 'ACTIVE',
    emailStatus: 'ACTIVE',
    joinDate: '2023-03-01',
    sensitiveInfo: {
      employeeId: 'e2',
      baseSalary: 18000000,
      bankId: 'VCB',
      bankAccountNumber: '9876543210',
      bankAccountName: 'JANE SMITH',
    },
  },
  {
    id: 'e3',
    code: 'EMP003',
    name: 'Mike Johnson',
    personalEmail: 'mike.j@gmail.com',
    companyEmail: 'mike.johnson@nova.com',
    phone: '0555666777',
    role: 'Employee',
    departmentId: 'd3',
    positionId: 'p4',
    workStatus: 'ACTIVE',
    emailStatus: 'ACTIVE',
    joinDate: '2024-01-10',
    sensitiveInfo: {
      employeeId: 'e3',
      baseSalary: 12000000,
      bankId: 'TCB',
      bankAccountNumber: '190333333333',
      bankAccountName: 'MIKE JOHNSON',
    },
  },
];

export const mockAttendance: AttendanceRecord[] = [
  {
    id: 'a1',
    employeeId: 'e1',
    date: new Date().toISOString().split('T')[0],
    checkIn: '08:25',
    checkOut: '17:35',
    type: 'OFFICE',
    ip: '192.168.1.100',
    status: 'VALID',
    workdayCoefficient: 1,
  },
  {
    id: 'a2',
    employeeId: 'e2',
    date: new Date().toISOString().split('T')[0],
    checkIn: '08:45',
    checkOut: '17:30',
    type: 'WFH',
    ip: '10.0.0.5',
    status: 'LATE',
    workdayCoefficient: 0.95,
  },
];

export const mockCandidates: Candidate[] = [
  {
    id: 'c1',
    name: 'Alice Williams',
    email: 'alice.w@email.com',
    phone: '0112233445',
    positionId: 'p1',
    status: 'Interviewing',
    skills: ['React', 'TypeScript', 'Tailwind'],
  },
];

export const mockShiftConfig: ShiftConfig = {
  startTime: '08:30',
  endTime: '17:30',
  breakStartTime: '12:00',
  breakEndTime: '13:00',
  standardHours: 8,
  minWorkingDaysPerMonth: 22,
};

export const mockReports: DailyReport[] = [
  {
    id: 'r1',
    employeeId: 'e1',
    date: new Date().toISOString().split('T')[0],
    content: '<p>Hôm nay đã hoàn thành xong tính năng <strong>chấm công</strong>. Ngày mai sẽ tiếp tục làm tính năng <strong>Báo cáo</strong>.</p>',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockPayrollHistory: PayrollRecord[] = [
  {
    id: 'pr_hist_1',
    employeeId: 'e1',
    month: 5,
    year: 2026,
    baseSalary: 20000000,
    standardWorkDays: 22,
    actualWorkDays: 22,
    allowances: 1000000,
    bonus: 2000000,
    totalDeduction: 2000000,
    grossSalary: 23000000,
    netSalary: 21000000,
    status: 'PAID',
    approvedAt: '2026-06-05T10:00:00Z',
  },
  {
    id: 'pr_hist_2',
    employeeId: 'e2',
    month: 5,
    year: 2026,
    baseSalary: 18000000,
    standardWorkDays: 22,
    actualWorkDays: 21,
    allowances: 1000000,
    bonus: 0,
    totalDeduction: 1500000,
    grossSalary: 18181818,
    netSalary: 16681818,
    status: 'PAID',
    approvedAt: '2026-06-05T10:00:00Z',
  },
  {
    id: 'pr_hist_3',
    employeeId: 'e1',
    month: 4,
    year: 2026,
    baseSalary: 20000000,
    standardWorkDays: 22,
    actualWorkDays: 20,
    allowances: 1000000,
    bonus: 500000,
    totalDeduction: 1800000,
    grossSalary: 19681818,
    netSalary: 17881818,
    status: 'PAID',
    approvedAt: '2026-05-05T10:00:00Z',
  },
];

export const mockAdvances: SalaryAdvance[] = [
  {
    id: 'adv1',
    employeeId: 'e3',
    date: '2026-06-15',
    amount: 3000000,
    reason: 'Việc gia đình',
    status: 'Approved',
  },
  {
    id: 'adv2',
    employeeId: 'e1',
    date: '2026-06-20',
    amount: 5000000,
    reason: 'Sửa xe',
    status: 'Pending',
  },
];
