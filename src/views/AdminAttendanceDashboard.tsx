import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Calendar,
  Clock,
  MapPin,
  Search,
  Users,
} from 'lucide-react';

import { useAttendance } from '../hooks/useAttendance';
import { useEmployees } from '../hooks/useEmployees';
import { getAttendanceStatusMeta } from '../lib/attendance-status';
import { AttendanceRecord, User } from '../types';

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getStatusBadgeClasses(status: AttendanceRecord['status']) {
  if (status === 'VALID') return 'bg-green-100 text-green-700';
  if (status === 'LATE' || status === 'EARLY_LEAVE') return 'bg-amber-100 text-amber-700';
  return 'bg-rose-100 text-rose-700';
}

function formatMinutes(mins?: number): string {
  if (mins == null) return '--';
  return `${mins} phút`;
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'blue' | 'amber' | 'rose' | 'violet';
}) {
  const borderMap = {
    blue: 'border-l-blue-500',
    amber: 'border-l-amber-500',
    rose: 'border-l-rose-500',
    violet: 'border-l-violet-500',
  };
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-sm border-l-4 ${borderMap[accent ?? 'blue']} p-5 transition-shadow hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold text-slate-800">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
        </div>
        <div className="rounded-lg bg-slate-50 p-2.5 text-slate-400">{icon}</div>
      </div>
    </div>
  );
}

function getEmployeeMap(employees: { id: string; name: string; code: string }[]) {
  const map = new Map<string, { name: string; code: string }>();
  for (const e of employees) {
    map.set(e.id, { name: e.name, code: e.code });
  }
  return map;
}

export default function AdminAttendanceDashboard({ user }: { user: User }) {
  const currentMonth = getCurrentMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<'date' | 'employee'>('date');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  const {
    employees,
    isLoading: isEmployeesLoading,
  } = useEmployees({ enabled: true, page: 1, limit: 1000 });

  const employeeIds = useMemo(
    () => employees.map(e => e.id),
    [employees],
  );

  const {
    records,
    isLoading: isAttendanceLoading,
    error: attendanceError,
  } = useAttendance({
    month: selectedMonth,
    employeeIds,
    enabled: employeeIds.length > 0,
  });

  const employeeMap = useMemo(() => getEmployeeMap(employees), [employees]);

  const filtered = useMemo(() => {
    let items = records;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      items = items.filter(r => {
        const emp = employeeMap.get(r.employeeId);
        if (!emp) return false;
        return (
          emp.name.toLowerCase().includes(q) ||
          emp.code.toLowerCase().includes(q) ||
          r.employeeId.toLowerCase().includes(q)
        );
      });
    }

    const sorted = [...items].sort((a, b) => {
      const dir = sortDir === 'desc' ? -1 : 1;
      if (sortKey === 'employee') {
        const aName = employeeMap.get(a.employeeId)?.name ?? '';
        const bName = employeeMap.get(b.employeeId)?.name ?? '';
        return aName.localeCompare(bName) * dir;
      }
      return a.date.localeCompare(b.date) * dir;
    });

    return sorted;
  }, [records, searchQuery, sortKey, sortDir, employeeMap]);

  const stats = useMemo(() => {
    const uniqueEmployees = new Set(filtered.map(r => r.employeeId));
    const totalDayUnits = filtered.reduce(
      (sum, r) => sum + (r.dayUnit ?? (r.status === 'INVALID' || r.status === 'MISSING_CHECKOUT' ? 0 : 1)),
      0,
    );
    const lateCount = filtered.filter(r => (r.lateMinutes ?? 0) > 0).length;
    const earlyCount = filtered.filter(r => (r.earlyLeaveMinutes ?? 0) > 0).length;
    const outOfRange = filtered.filter(r => r.isOutRange || r.warningMessage).length;
    return {
      employeeCount: uniqueEmployees.size,
      totalDayUnits: Math.round(totalDayUnits * 100) / 100,
      lateEarlyCount: lateCount + earlyCount,
      outOfRangeCount: outOfRange,
    };
  }, [filtered]);

  const toggleSort = (key: 'date' | 'employee') => {
    if (sortKey === key) {
      setSortDir(d => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'date' ? 'desc' : 'asc');
    }
  };

  const SortIcon = ({ colKey }: { colKey: 'date' | 'employee' }) => {
    if (sortKey !== colKey) return null;
    return sortDir === 'desc' ? (
      <ArrowDown className="ml-1 inline h-3 w-3" />
    ) : (
      <ArrowUp className="ml-1 inline h-3 w-3" />
    );
  };

  const isLoading = isEmployeesLoading || isAttendanceLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-slate-400">
        <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
        Đang tải dữ liệu chấm công...
      </div>
    );
  }

  if (attendanceError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-rose-400" />
        <p className="font-medium text-rose-700">Không thể tải dữ liệu chấm công</p>
        <p className="mt-1 text-sm text-rose-500">{attendanceError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Dashboard chấm công
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Dữ liệu tháng {selectedMonth}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên / mã NV..."
              className="w-56 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Nhân sự đã chấm công"
          value={stats.employeeCount}
          sub={`/ ${employees.length} tổng nhân sự`}
          accent="blue"
        />
        <StatCard
          icon={<Calendar className="h-5 w-5" />}
          label="Tổng ngày công tích lũy"
          value={stats.totalDayUnits}
          sub="Tổng hệ số công từ Backend"
          accent="violet"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Lượt trễ / về sớm"
          value={stats.lateEarlyCount}
          sub={`${filtered.filter(r => (r.lateMinutes ?? 0) > 0).length} trễ · ${filtered.filter(r => (r.earlyLeaveMinutes ?? 0) > 0).length} sớm`}
          accent="amber"
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="🚨 Chấm công ngoài phạm vi"
          value={stats.outOfRangeCount}
          sub="Có warningMessage hoặc isOutRange"
          accent="rose"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16">
          <MapPin className="mb-3 h-10 w-10 text-slate-300" />
          <p className="font-medium text-slate-600">
            {searchQuery
              ? 'Không tìm thấy nhân viên phù hợp'
              : 'Chưa có dữ liệu chấm công trong tháng này'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {searchQuery ? 'Thử điều chỉnh từ khóa tìm kiếm' : 'Chọn tháng khác để xem dữ liệu'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th
                    className="cursor-pointer px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700"
                    onClick={() => toggleSort('employee')}
                  >
                    Nhân viên <SortIcon colKey="employee" />
                  </th>
                  <th
                    className="cursor-pointer px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700"
                    onClick={() => toggleSort('date')}
                  >
                    Ngày <SortIcon colKey="date" />
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Giờ vào / Giờ ra
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Muộn / Sớm
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Công thực tế
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Trạng thái
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Vị trí & Cảnh báo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(record => {
                  const emp = employeeMap.get(record.employeeId);
                  const statusMeta = getAttendanceStatusMeta(record);
                  const late = record.lateMinutes ?? 0;
                  const early = record.earlyLeaveMinutes ?? 0;
                  const hasTimeIssue = late > 0 || early > 0;

                  return (
                    <tr
                      key={`${record.employeeId}-${record.date}`}
                      className="transition-colors hover:bg-slate-50/60"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                            {emp
                              ? emp.name
                                  .split(' ')
                                  .map(s => s[0])
                                  .slice(0, 2)
                                  .join('')
                                  .toUpperCase()
                              : '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {emp?.name ?? record.employeeId}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {emp?.code ?? ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                        {record.date
                          ? new Date(record.date + 'T00:00:00').toLocaleDateString(
                              'vi-VN',
                              { day: '2-digit', month: '2-digit', year: 'numeric' },
                            )
                          : '--'}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-2 font-mono text-sm">
                          <span className="text-slate-700">
                            {record.checkIn || '--:--'}
                          </span>
                          <span className="text-slate-300">|</span>
                          <span className="text-slate-700">
                            {record.checkOut || '--:--'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {hasTimeIssue ? (
                          <div className="flex flex-wrap gap-1">
                            {late > 0 && (
                              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                Muộn {late}'
                              </span>
                            )}
                            {early > 0 && (
                              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                Sớm {early}'
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">--</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`font-mono text-sm font-semibold ${
                          record.dayUnit != null && record.dayUnit < 1
                            ? 'text-amber-700'
                            : 'text-slate-800'
                        }`}>
                          {record.dayUnit != null
                            ? record.dayUnit.toFixed(2)
                            : record.workdayCoefficient.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase ${getStatusBadgeClasses(record.status)}`}
                          >
                            {statusMeta.label}
                          </span>
                          <p className="max-w-[10rem] text-[10px] leading-tight text-slate-400">
                            {statusMeta.detail}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {record.warningMessage || record.isOutRange ? (
                          <div className="group relative">
                            <span className="inline-flex animate-pulse items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              ⚠️ Ngoài phạm vi
                            </span>
                            <div className="absolute left-0 top-full z-10 mt-1.5 w-64 rounded-lg border border-rose-200 bg-white p-3 shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
                              <p className="text-xs font-medium text-rose-700">
                                Cảnh báo vị trí
                              </p>
                              <p className="mt-1 text-xs text-slate-600">
                                {record.warningMessage ||
                                  `GPS location is outside the valid radius`}
                              </p>
                            </div>
                          </div>
                        ) : record.type ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-[11px] font-semibold text-green-700">
                            <MapPin className="h-3 w-3" />
                            Văn phòng
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">--</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-3 text-xs text-slate-400">
            Hiển thị {filtered.length} bản ghi
          </div>
        </div>
      )}
    </div>
  );
}
