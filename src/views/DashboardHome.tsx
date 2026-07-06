import { Briefcase, Calendar, Clock, FileText, Server, ShieldCheck, Users } from 'lucide-react';

import { useAttendance } from '../hooks/useAttendance';
import { useDailyReports } from '../hooks/useDailyReports';
import { useEmployees } from '../hooks/useEmployees';
import { AttendanceRecord, User } from '../types';

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function isWorkingStatus(record: AttendanceRecord) {
  return (
    record.status === 'VALID' ||
    record.status === 'LATE' ||
    record.status === 'EARLY_LEAVE' ||
    record.status === 'MANUAL_ADJUSTED'
  );
}

export default function DashboardHome({ user }: { user: User }) {
  const month = getCurrentMonth();
  const today = getToday();
  const isSuperAdmin = user.role === 'Super Admin';

  const {
    employees,
    isLoading: isEmployeesLoading,
    error: employeesError,
  } = useEmployees({ enabled: isSuperAdmin });
  const employeeIds = isSuperAdmin ? employees.map(employee => employee.id) : [];

  const {
    records,
    isLoading: isAttendanceLoading,
    error: attendanceError,
  } = useAttendance({
    month,
    employeeIds,
    enabled: isSuperAdmin,
  });
  const {
    records: personalRecords,
    isLoading: isPersonalAttendanceLoading,
    error: personalAttendanceError,
  } = useAttendance({
    month,
    enabled: !isSuperAdmin,
  });
  const {
    reports: myReports,
    isLoading: isReportsLoading,
    error: reportsError,
  } = useDailyReports({
    scope: 'me',
    enabled: !isSuperAdmin,
  });

  const pageError = isSuperAdmin
    ? employeesError || attendanceError
    : personalAttendanceError || reportsError;
  const isLoading = isSuperAdmin
    ? isEmployeesLoading || isAttendanceLoading
    : isPersonalAttendanceLoading || isReportsLoading;

  const todaysCompanyRecords = records.filter(record => record.date === today);
  const personalTodayRecord =
    personalRecords.find(record => record.date === today) ?? null;

  const stats = isSuperAdmin
    ? [
        {
          label: 'Tong nhan vien',
          value: employees.length.toString(),
          icon: Users,
          trend: `${employees.filter(employee => employee.workStatus === 'ACTIVE').length} dang active`,
          color: 'text-slate-900',
          trendColor: 'text-emerald-600',
        },
        {
          label: 'Di lam hom nay',
          value: todaysCompanyRecords.filter(isWorkingStatus).length.toString(),
          icon: Clock,
          trend: `${todaysCompanyRecords.length} ban ghi trong ngay`,
          color: 'text-blue-600',
          trendColor: 'text-slate-500',
        },
        {
          label: 'Lam tai nha',
          value: todaysCompanyRecords.filter(record => record.type === 'WFH').length.toString(),
          icon: Briefcase,
          trend: `${todaysCompanyRecords.filter(record => record.type === 'OFFICE').length} dang office`,
          color: 'text-teal-600',
          trendColor: 'text-slate-500',
        },
        {
          label: 'Can xu ly',
          value: todaysCompanyRecords
            .filter(
              record =>
                record.status === 'LATE' ||
                record.status === 'EARLY_LEAVE' ||
                record.status === 'MISSING_CHECKOUT' ||
                record.status === 'INVALID',
            )
            .length.toString(),
          icon: Calendar,
          trend: 'Late, invalid, missing checkout',
          color: 'text-amber-500',
          trendColor: 'text-slate-500',
        },
      ]
    : [
        {
          label: 'Check-in hom nay',
          value: personalTodayRecord?.checkIn ?? '--:--',
          icon: Clock,
          trend: personalTodayRecord
            ? `Trang thai ${personalTodayRecord.status}`
            : 'Chua co ban ghi hom nay',
          color: 'text-blue-600',
          trendColor: 'text-slate-500',
        },
        {
          label: 'Ngay da cham cong',
          value: personalRecords.filter(isWorkingStatus).length.toString(),
          icon: Calendar,
          trend: `Trong thang ${month}`,
          color: 'text-slate-900',
          trendColor: 'text-slate-500',
        },
        {
          label: 'Bao cao da nop',
          value: myReports.length.toString(),
          icon: FileText,
          trend: `${myReports.filter(report => report.date.startsWith(month)).length} trong thang`,
          color: 'text-teal-600',
          trendColor: 'text-slate-500',
        },
        {
          label: 'Can luu y',
          value: personalRecords
            .filter(
              record =>
                record.status === 'LATE' ||
                record.status === 'EARLY_LEAVE' ||
                record.status === 'MISSING_CHECKOUT' ||
                record.status === 'INVALID',
            )
            .length.toString(),
          icon: Briefcase,
          trend: 'Late, invalid, missing checkout',
          color: 'text-amber-500',
          trendColor: 'text-slate-500',
        },
      ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className={`mb-3 inline-flex rounded-lg bg-slate-50 p-2 ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">
                  {stat.label}
                </p>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <div className={`mt-2 text-xs ${stat.trendColor}`}>{stat.trend}</div>
            </div>
          );
        })}
      </div>

      {pageError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {pageError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
          <h3 className="font-semibold mb-4 text-sm">
            {isSuperAdmin ? 'Tinh hinh attendance hom nay' : 'Trang thai cham cong cua ban'}
          </h3>
          <div className="space-y-4 flex-1">
            {isLoading ? (
              <p className="text-sm text-slate-500">Dang tai du lieu...</p>
            ) : isSuperAdmin ? (
              todaysCompanyRecords.slice(0, 4).map(record => (
                <div
                  key={`${record.employeeId}-${record.date}`}
                  className="flex items-start pb-4 border-b border-slate-100 last:border-0 last:pb-0"
                >
                  <div
                    className={`w-2 h-2 mt-2 rounded-full mr-4 ${
                      record.status === 'VALID'
                        ? 'bg-emerald-500'
                        : record.status === 'LATE'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {record.employeeId} {record.checkIn ? `check-in ${record.checkIn}` : 'chua check-in'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {record.type} - {record.status}
                    </p>
                  </div>
                </div>
              ))
            ) : personalRecords.slice(0, 4).map(record => (
              <div
                key={record.id}
                className="flex items-start pb-4 border-b border-slate-100 last:border-0 last:pb-0"
              >
                <div
                  className={`w-2 h-2 mt-2 rounded-full mr-4 ${
                    record.status === 'VALID'
                      ? 'bg-emerald-500'
                      : record.status === 'LATE'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                  }`}
                />
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {record.date}: {record.checkIn ?? '--:--'} - {record.checkOut ?? '--:--'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {record.type} - {record.status}
                  </p>
                </div>
              </div>
            ))}

            {!isLoading &&
            ((isSuperAdmin && todaysCompanyRecords.length === 0) ||
              (!isSuperAdmin && personalRecords.length === 0)) ? (
              <p className="text-sm text-slate-500">Chua co du lieu attendance phu hop.</p>
            ) : null}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
          <h3 className="font-semibold mb-4 text-sm">
            {isSuperAdmin ? 'Ghi chu van hanh sprint' : 'Bao cao gan day cua ban'}
          </h3>
          <div className="space-y-3 flex-1">
            {isSuperAdmin ? (
              <>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  Daily report da duoc dua vao attendance domain va check-out hien yeu cau report cung ngay.
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  Company attendance view hien dang tong hop tu employee list + monthly summary theo tung employee.
                </div>
              </>
            ) : myReports.slice(0, 3).map(report => (
              <div
                key={report.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-sm font-medium text-slate-800">{report.date}</p>
                <p className="mt-2 text-sm text-slate-600 line-clamp-3">
                  {report.content.replace(/<[^>]+>/g, ' ')}
                </p>
              </div>
            ))}

            {!isSuperAdmin && !isLoading && myReports.length === 0 ? (
              <p className="text-sm text-slate-500">Chua co bao cao nao trong tai khoan nay.</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <span className="flex items-center gap-1">
            <Server className="w-3.5 h-3.5" />
            He thong: <span className="text-green-600 font-bold ml-1">On</span>
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Bao mat: <span className="text-blue-600 ml-1">Cookie auth + role scopes</span>
          </span>
          <span>Dashboard mode: {isSuperAdmin ? 'Company scope' : 'Personal scope'}</span>
        </div>
        <div className="font-medium text-slate-600">Month: {month}</div>
      </div>
    </div>
  );
}
