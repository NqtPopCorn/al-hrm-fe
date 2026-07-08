import assert from 'node:assert/strict';
import test from 'node:test';

import {
  filterAndPaginateAttendanceRecords,
  filterAndPaginateAdjustmentRequests,
  filterAndPaginateReports,
  getEmployeeOptions,
} from './attendance-view-model.ts';
import {
  AttendanceAdjustmentRequest,
  AttendanceRecord,
  DailyReport,
  Department,
  Employee,
} from '../types.ts';

const departments: Department[] = [
  {
    id: 'dept-eng',
    name: 'Engineering',
    managerId: null,
  },
  {
    id: 'dept-hr',
    name: 'HR',
    managerId: null,
  },
];

const employees: Employee[] = [
  {
    id: 'emp-1',
    code: 'E001',
    name: 'Alice',
    personalEmail: 'alice@example.com',
    companyEmail: 'alice@nova.test',
    phone: '0123',
    role: 'Employee',
    departmentId: 'dept-eng',
    positionId: null,
    workStatus: 'ACTIVE',
    emailStatus: 'ACTIVE',
    joinDate: '2026-01-10',
  },
  {
    id: 'emp-2',
    code: 'E002',
    name: 'Bob',
    personalEmail: 'bob@example.com',
    companyEmail: 'bob@nova.test',
    phone: '0456',
    role: 'Employee',
    departmentId: 'dept-eng',
    positionId: null,
    workStatus: 'ACTIVE',
    emailStatus: 'ACTIVE',
    joinDate: '2026-01-10',
  },
  {
    id: 'emp-3',
    code: 'H001',
    name: 'Cara',
    personalEmail: 'cara@example.com',
    companyEmail: 'cara@nova.test',
    phone: '0789',
    role: 'Employee',
    departmentId: 'dept-hr',
    positionId: null,
    workStatus: 'ACTIVE',
    emailStatus: 'ACTIVE',
    joinDate: '2026-01-10',
  },
];

const records: AttendanceRecord[] = [
  {
    id: 'att-1',
    employeeId: 'emp-1',
    departmentId: 'dept-eng',
    date: '2026-07-04',
    checkIn: '08:00',
    checkOut: '17:00',
    checkInAt: '2026-07-04T08:00:00.000Z',
    checkOutAt: '2026-07-04T17:00:00.000Z',
    type: 'OFFICE',
    status: 'VALID',
    workdayCoefficient: 1,
  },
  {
    id: 'att-2',
    employeeId: 'emp-2',
    departmentId: 'dept-eng',
    date: '2026-07-06',
    checkIn: '08:10',
    checkOut: '17:02',
    checkInAt: '2026-07-06T08:10:00.000Z',
    checkOutAt: '2026-07-06T17:02:00.000Z',
    type: 'OFFICE',
    status: 'LATE',
    workdayCoefficient: 1,
  },
  {
    id: 'att-3',
    employeeId: 'emp-3',
    departmentId: 'dept-hr',
    date: '2026-06-30',
    checkIn: '08:05',
    checkOut: '17:10',
    checkInAt: '2026-06-30T08:05:00.000Z',
    checkOutAt: '2026-06-30T17:10:00.000Z',
    type: 'WFH',
    status: 'VALID',
    workdayCoefficient: 1,
  },
];

const requests: AttendanceAdjustmentRequest[] = [
  {
    id: 'req-1',
    employeeId: 'emp-1',
    workDate: '2026-07-01',
    requestedCheckIn: '08:30',
    requestedCheckOut: '17:30',
    requestedCheckInAt: '2026-07-01T08:30:00.000Z',
    requestedCheckOutAt: '2026-07-01T17:30:00.000Z',
    reason: 'Forgot check-in',
    status: 'PENDING',
    createdAt: '2026-07-01T10:00:00.000Z',
  },
  {
    id: 'req-2',
    employeeId: 'emp-2',
    workDate: '2026-07-05',
    requestedCheckIn: '08:15',
    requestedCheckOut: '17:15',
    requestedCheckInAt: '2026-07-05T08:15:00.000Z',
    requestedCheckOutAt: '2026-07-05T17:15:00.000Z',
    reason: 'Forgot checkout',
    status: 'APPROVED',
    createdAt: '2026-07-05T18:00:00.000Z',
  },
  {
    id: 'req-3',
    employeeId: 'emp-3',
    workDate: '2026-06-29',
    requestedCheckIn: '08:20',
    requestedCheckOut: '17:20',
    requestedCheckInAt: '2026-06-29T08:20:00.000Z',
    requestedCheckOutAt: '2026-06-29T17:20:00.000Z',
    reason: 'WFH note',
    status: 'REJECTED',
    createdAt: '2026-06-29T18:00:00.000Z',
  },
];

const reports: DailyReport[] = [
  {
    id: 'rep-1',
    employeeId: 'emp-1',
    date: '2026-07-02',
    content: '<p>Alice report</p>',
    createdAt: '2026-07-02T17:00:00.000Z',
    updatedAt: '2026-07-02T18:00:00.000Z',
  },
  {
    id: 'rep-2',
    employeeId: 'emp-2',
    date: '2026-07-06',
    content: '<p>Bob report</p>',
    createdAt: '2026-07-06T17:00:00.000Z',
    updatedAt: '2026-07-06T19:00:00.000Z',
  },
  {
    id: 'rep-3',
    employeeId: 'emp-3',
    date: '2026-06-29',
    content: '<p>Cara report</p>',
    createdAt: '2026-06-29T17:00:00.000Z',
    updatedAt: '2026-06-29T18:00:00.000Z',
  },
];

test('filters attendance records by shared filters and sorts newest first', () => {
  const result = filterAndPaginateAttendanceRecords({
    records,
    employees,
    departments,
    filters: {
      month: '2026-07',
      departmentId: 'dept-eng',
      employeeId: '',
    },
    page: 1,
    pageSize: 10,
  });

  assert.equal(result.totalItems, 2);
  assert.deepEqual(
    result.items.map(record => record.id),
    ['att-2', 'att-1'],
  );
});

test('filters adjustment requests and paginates the result range', () => {
  const result = filterAndPaginateAdjustmentRequests({
    requests,
    employees,
    departments,
    filters: {
      month: '2026-07',
      departmentId: 'dept-eng',
      employeeId: '',
    },
    page: 2,
    pageSize: 1,
  });

  assert.equal(result.totalItems, 2);
  assert.equal(result.page, 2);
  assert.equal(result.totalPages, 2);
  assert.equal(result.rangeStart, 2);
  assert.equal(result.rangeEnd, 2);
  assert.deepEqual(
    result.items.map(request => request.id),
    ['req-1'],
  );
});

test('filters reports by selected employee and sorts by date then updatedAt descending', () => {
  const result = filterAndPaginateReports({
    reports,
    employees,
    departments,
    filters: {
      month: '2026-07',
      departmentId: 'dept-eng',
      employeeId: 'emp-2',
    },
    page: 1,
    pageSize: 10,
  });

  assert.equal(result.totalItems, 1);
  assert.deepEqual(
    result.items.map(report => report.id),
    ['rep-2'],
  );
});

test('limits employee options by selected department', () => {
  const options = getEmployeeOptions(employees, {
    departmentId: 'dept-eng',
  });

  assert.deepEqual(
    options.map(employee => employee.id),
    ['emp-1', 'emp-2'],
  );
});
