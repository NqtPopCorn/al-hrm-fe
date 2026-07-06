import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getSensitiveInfoCacheSource,
  mergeSensitiveInfoIntoPaginatedEmployees,
} from './employee-sensitive-cache';

test('prefers dedicated sensitive query cache over employee row data', () => {
  const result = getSensitiveInfoCacheSource({
    querySensitiveInfo: {
      employeeId: 'emp-1',
      bankAccountNumber: '111',
    },
    employeeSensitiveInfo: {
      employeeId: 'emp-1',
      bankAccountNumber: '222',
    },
  });

  assert.equal(result.shouldFetch, false);
  assert.deepEqual(result.sensitiveInfo, {
    employeeId: 'emp-1',
    bankAccountNumber: '111',
  });
});

test('uses employee row sensitive info as a no-fetch fallback', () => {
  const result = getSensitiveInfoCacheSource({
    querySensitiveInfo: undefined,
    employeeSensitiveInfo: {
      employeeId: 'emp-1',
      baseSalary: 20_000_000,
    },
  });

  assert.equal(result.shouldFetch, false);
  assert.deepEqual(result.sensitiveInfo, {
    employeeId: 'emp-1',
    baseSalary: 20_000_000,
  });
});

test('requests fetch only when both cache sources are missing', () => {
  const result = getSensitiveInfoCacheSource({
    querySensitiveInfo: undefined,
    employeeSensitiveInfo: undefined,
  });

  assert.equal(result.shouldFetch, true);
  assert.equal(result.sensitiveInfo, undefined);
});

test('updates only the matching employee in paginated cache data', () => {
  const merged = mergeSensitiveInfoIntoPaginatedEmployees(
    {
      data: [
        {
          id: 'emp-1',
          code: 'EMP001',
          name: 'A',
          personalEmail: 'a@gmail.com',
          companyEmail: 'a@nova.com',
          phone: '0123',
          role: 'Employee',
          departmentId: null,
          positionId: null,
          workStatus: 'ACTIVE',
          emailStatus: 'ACTIVE',
          joinDate: '2026-07-01',
        },
        {
          id: 'emp-2',
          code: 'EMP002',
          name: 'B',
          personalEmail: 'b@gmail.com',
          companyEmail: 'b@nova.com',
          phone: '0456',
          role: 'Employee',
          departmentId: null,
          positionId: null,
          workStatus: 'ACTIVE',
          emailStatus: 'ACTIVE',
          joinDate: '2026-07-01',
        },
      ],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    },
    'emp-2',
    {
      employeeId: 'emp-2',
      bankId: 'MB',
    },
  );

  assert.deepEqual(merged?.data[1].sensitiveInfo, {
    employeeId: 'emp-2',
    bankId: 'MB',
  });
  assert.equal(merged?.data[0].sensitiveInfo, undefined);
});
