import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, Edit3, Eye, FileText, MapPin } from 'lucide-react';
import JoditEditor from 'jodit-react';

import Modal from '../components/Modal';
import { getAttendanceStatusMeta } from '../lib/attendance-status';
import { useAttendance } from '../hooks/useAttendance';
import { useDailyReports } from '../hooks/useDailyReports';
import {
  AttendanceAdjustmentRequest,
  AttendanceRecord,
  DailyReport,
  User,
  WorkMode,
} from '../types';

const shiftCopy = {
  startTime: '08:00',
  endTime: '17:00',
  breakStartTime: '12:00',
  breakEndTime: '13:00',
};

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function buildIsoDateTime(workDate: string, timeValue: string) {
  return new Date(`${workDate}T${timeValue}:00`).toISOString();
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function getStatusBadgeClasses(status: AttendanceRecord['status']) {
  if (status === 'VALID') {
    return 'bg-green-100 text-green-700';
  }

  if (status === 'LATE' || status === 'EARLY_LEAVE') {
    return 'bg-amber-100 text-amber-700';
  }

  return 'bg-rose-100 text-rose-700';
}

function getAdjustmentStatusClasses(status: AttendanceAdjustmentRequest['status']) {
  if (status === 'APPROVED') {
    return 'bg-green-100 text-green-700';
  }

  if (status === 'PENDING') {
    return 'bg-amber-100 text-amber-700';
  }

  return 'bg-rose-100 text-rose-700';
}

export default function CheckInOut({ user }: { user: User }) {
  const month = getCurrentMonth();
  const today = getToday();
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  );
  const [viewMode, setViewMode] = useState<'personal' | 'requests' | 'reports'>('personal');
  const [workMode, setWorkMode] = useState<WorkMode>('OFFICE');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [reportError, setReportError] = useState<string | null>(null);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustCheckIn, setAdjustCheckIn] = useState('');
  const [adjustCheckOut, setAdjustCheckOut] = useState('');
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [viewingReport, setViewingReport] = useState<DailyReport | null>(null);
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'fetching' | 'ok' | 'denied'>('idle');

  /** Lấy GPS hiện tại — MVP: server tin client, không validate phức tạp */
  const getGps = (): Promise<{ lat: number; lng: number } | null> => {
    if (!navigator.geolocation) return Promise.resolve(null);
    setGpsStatus('fetching');
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentGps(coords);
          setGpsStatus('ok');
          resolve(coords);
        },
        () => {
          setGpsStatus('denied');
          resolve(null);
        },
        { timeout: 5000 },
      );
    });
  };

  const {
    records,
    adjustmentRequests,
    isLoading: isAttendanceLoading,
    isAdjustmentRequestsLoading,
    error: attendanceError,
    adjustmentRequestsError,
    checkIn,
    checkOut,
    createAdjustmentRequest,
    isCheckingIn,
    isCheckingOut,
    isCreatingAdjustmentRequest,
  } = useAttendance({
    month,
    enabled: true,
    includeAdjustmentRequests: true,
  });
  const {
    reports,
    isLoading: isReportsLoading,
    error: reportsError,
    updateReport,
    isUpdating: isUpdatingReport,
  } = useDailyReports({
    scope: 'me',
    enabled: true,
  });

  const todayRecord = records.find(record => record.date === today) ?? null;
  const todayReport = reports.find(report => report.date === today) ?? null;
  const isCheckedIn = Boolean(todayRecord?.checkIn && !todayRecord?.checkOut);
  const todayStatusMeta = todayRecord ? getAttendanceStatusMeta(todayRecord) : null;
  const pageError = attendanceError || adjustmentRequestsError || reportsError;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClock(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      );
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  const openAdjustModal = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setAdjustCheckIn(record.checkIn ?? '');
    setAdjustCheckOut(record.checkOut ?? '');
    setAdjustReason('');
    setAdjustError(null);
    setIsAdjustModalOpen(true);
  };

  const openCheckOutModal = () => {
    setReportError(null);
    setEditingReport(null);
    setReportContent(todayReport?.content ?? '');
    setIsReportModalOpen(true);
  };

  const handleCheckIn = async () => {
    try {
      const gps = workMode === 'OFFICE' ? await getGps() : null;
      await checkIn({
        workDate: today,
        checkInAt: new Date().toISOString(),
        requestedMode: workMode,
        ...(gps ? { gps } : {}),
      });
    } catch (error) {
      setReportError(getErrorMessage(error, 'Không thể check in.'));
    }
  };

  const handleReportSubmit = async () => {
    if (!reportContent.trim()) {
      setReportError('Báo cáo cuối ngày là bắt buộc khi check-out.');
      return;
    }

    try {
      setReportError(null);

      if (editingReport) {
        await updateReport(editingReport.id, reportContent);
      } else {
        const gps = workMode === 'OFFICE' ? (currentGps ?? await getGps()) : null;
        await checkOut({
          workDate: today,
          checkOutAt: new Date().toISOString(),
          reportContentHtml: reportContent,
          requestedMode: workMode,
          ...(gps ? { gps } : {}),
        });
      }

      setIsReportModalOpen(false);
      setEditingReport(null);
      setReportContent('');
    } catch (error) {
      setReportError(
        getErrorMessage(error, 'Unable to submit report or complete check-out.'),
      );
    }
  };

  const handleAdjustmentSubmit = async () => {
    if (!selectedRecord) {
      return;
    }

    if (!adjustReason.trim()) {
      setAdjustError('Vui lòng nhập lý do điều chỉnh.');
      return;
    }

    try {
      setAdjustError(null);
      await createAdjustmentRequest({
        workDate: selectedRecord.date,
        requestedCheckInAt: adjustCheckIn
          ? buildIsoDateTime(selectedRecord.date, adjustCheckIn)
          : undefined,
        requestedCheckOutAt: adjustCheckOut
          ? buildIsoDateTime(selectedRecord.date, adjustCheckOut)
          : undefined,
        reason: adjustReason.trim(),
      });
      setIsAdjustModalOpen(false);
      setViewMode('requests');
    } catch (error) {
      setAdjustError(
        getErrorMessage(error, 'Unable to create attendance adjustment request.'),
      );
    }
  };

  const openEditReport = (report: DailyReport) => {
    setEditingReport(report);
    setReportContent(report.content);
    setReportError(null);
    setViewingReport(null);
    setIsReportModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Giờ hiện tại</h2>
          <div className="text-4xl font-mono text-blue-600 mb-6 tracking-tight">
            {clock}
          </div>

          <div className="w-full space-y-3">
            <select
              value={workMode}
              onChange={event => setWorkMode(event.target.value as WorkMode)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="OFFICE">Office</option>
              <option value="WFH">WFH</option>
            </select>

            {workMode === 'OFFICE' && (
              <div className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                {gpsStatus === 'idle' && 'GPS sẽ được lấy khi check in/out.'}
                {gpsStatus === 'fetching' && '📡 Đang lấy GPS...'}
                {gpsStatus === 'ok' && currentGps
                  ? `📍 GPS: ${currentGps.lat.toFixed(5)}, ${currentGps.lng.toFixed(5)}`
                  : null}
                {gpsStatus === 'denied' && '⚠️ Không thể lấy GPS — sẽ bỏ qua.'}
              </div>
            )}

            <button
              onClick={() => {
                if (isCheckedIn) {
                  openCheckOutModal();
                  return;
                }
                void handleCheckIn();
              }}
              disabled={isCheckingIn || isCheckingOut}
              className={`w-full py-3 px-4 rounded-md font-medium transition-all flex justify-center items-center text-sm ${!isCheckedIn
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                } disabled:opacity-60`}
            >
              <Clock className="w-5 h-5 mr-2" />
              {isCheckedIn ? 'Check Out và Báo Cáo' : 'Check In'}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 w-full text-left">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Chi tiết ca làm việc</h4>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Bắt đầu:</span>
                <span className="font-mono">{shiftCopy.startTime}</span>
              </div>
              <div className="flex justify-between">
                <span>Kết thúc:</span>
                <span className="font-mono">{shiftCopy.endTime}</span>
              </div>
              <div className="flex justify-between">
                <span>Nghỉ trưa:</span>
                <span className="font-mono">
                  {shiftCopy.breakStartTime} - {shiftCopy.breakEndTime}
                </span>
              </div>
            </div>
            {todayRecord ? (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-600">
                <p>Hôm nay: {todayRecord.status}</p>
                <p className="mt-1">
                  {todayRecord.checkIn ?? '--:--'} - {todayRecord.checkOut ?? '--:--'}
                </p>
                <p className="mt-1 text-slate-500">{todayStatusMeta?.detail}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col col-span-1 md:col-span-2">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
            <div>
              <h3 className="font-semibold text-sm">Lịch sử cá nhân</h3>
              {pageError ? (
                <p className="mt-1 text-xs text-rose-600">
                  {pageError}
                </p>
              ) : null}
            </div>

            <div className="flex bg-slate-100 p-1 rounded-md">
              <button
                onClick={() => setViewMode('personal')}
                className={`px-3 py-1.5 text-xs font-medium rounded ${viewMode === 'personal'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Lịch sử chấm công
              </button>
              <button
                onClick={() => setViewMode('requests')}
                className={`px-3 py-1.5 text-xs font-medium rounded ${viewMode === 'requests'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Yêu cầu điều chỉnh
              </button>
              <button
                onClick={() => setViewMode('reports')}
                className={`px-3 py-1.5 text-xs font-medium rounded flex items-center ${viewMode === 'reports'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <FileText className="w-3.5 h-3.5 mr-1" />
                Báo cáo của tôi
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-0 h-[500px]">
            {viewMode === 'reports' ? (
              <div className="p-6">
                {(isReportsLoading || isAttendanceLoading) && reports.length === 0 ? (
                  <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
                ) : null}
                <div className="space-y-4">
                  {reports.map(report => (
                    <div
                      key={report.id}
                      className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-xs text-slate-500">
                            Báo cáo ngày {report.date} - Lần sửa cuối:{' '}
                            {new Date(report.updatedAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => setViewingReport(report)}
                          className="text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center text-xs font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Xem chi tiết
                        </button>
                      </div>
                      <div
                        className="prose prose-sm prose-slate max-w-none text-slate-600 line-clamp-3 bg-slate-50 p-3 rounded border border-slate-100"
                        dangerouslySetInnerHTML={{ __html: report.content }}
                      />
                    </div>
                  ))}
                  {!isReportsLoading && reports.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                      <p>Bạn chưa có báo cáo nào</p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : viewMode === 'requests' ? (
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Ngày</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Check In Đề xuất</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Check Out Đề xuất</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Lý do</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adjustmentRequests.map(request => (
                    <tr key={request.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium">{request.workDate}</td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-600">
                        {request.requestedCheckIn || '--:--'}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-600">
                        {request.requestedCheckOut || '--:--'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="max-w-[18rem] space-y-1">
                          <p>{request.reason}</p>
                          {request.reviewNote ? (
                            <p className="text-xs text-slate-500">
                              Review: {request.reviewNote}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase ${getAdjustmentStatusClasses(request.status)}`}
                        >
                          {request.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!isAdjustmentRequestsLoading && adjustmentRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                        Chưa có yêu cầu điều chỉnh nào.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Ngày</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Check In</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Check Out</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Vị trí</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Trạng thái</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map(record => {
                    const statusMeta = getAttendanceStatusMeta(record);
                    return (
                      <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium">{record.date}</td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-600">{record.checkIn || '--:--'}</td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-600">{record.checkOut || '--:--'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-slate-600">
                            <MapPin className="w-4 h-4 mr-1 text-slate-400" />
                            {record.type}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusBadgeClasses(record.status)}`}
                            >
                              {record.status === 'VALID' ? (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              ) : (
                                <AlertCircle className="w-3 h-3 mr-1" />
                              )}
                              {statusMeta.label}
                            </span>
                            <p className="max-w-[14rem] text-xs text-slate-500">
                              {statusMeta.detail}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => openAdjustModal(record)}
                            className="text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center text-xs font-medium"
                          >
                            Yêu cầu sửa
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {!isAttendanceLoading && records.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                        Chưa có dữ liệu attendance trong tháng này.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Yêu cầu sửa đổi chấm công"
      >
        {selectedRecord ? (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm text-slate-700">
              <div className="flex justify-between mb-1">
                <span className="font-medium">Ngày:</span>
                <span>{selectedRecord.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Trạng thái hiện tại:</span>
                <span>{selectedRecord.status}</span>
              </div>
            </div>

            {adjustError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {adjustError}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Giờ Check In</label>
                <input
                  type="time"
                  value={adjustCheckIn}
                  onChange={event => setAdjustCheckIn(event.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Giờ Check Out</label>
                <input
                  type="time"
                  value={adjustCheckOut}
                  onChange={event => setAdjustCheckOut(event.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Lý do</label>
              <textarea
                rows={3}
                value={adjustReason}
                onChange={event => setAdjustReason(event.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                placeholder="Vui lòng giải thích lý do yêu cầu sửa đổi..."
              />
            </div>

            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleAdjustmentSubmit()}
                disabled={isCreatingAdjustmentRequest}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-60"
              >
                {isCreatingAdjustmentRequest ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setEditingReport(null);
          setReportContent('');
          setReportError(null);
        }}
        title={editingReport ? 'Chỉnh sửa báo cáo' : 'Báo cáo cuối ngày'}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          {reportError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {reportError}
            </div>
          ) : null}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nội dung báo cáo công việc hôm nay:
            </label>
            <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
              <JoditEditor
                value={reportContent}
                config={{
                  readonly: false,
                  height: 300,
                  toolbarAdaptive: false,
                }}
                onBlur={newContent => setReportContent(newContent)}
                onChange={() => { }}
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setIsReportModalOpen(false);
                setEditingReport(null);
                setReportContent('');
                setReportError(null);
              }}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              Bỏ qua
            </button>
            <button
              type="button"
              onClick={() => void handleReportSubmit()}
              disabled={isCheckingOut || isUpdatingReport}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-60"
            >
              {editingReport
                ? isUpdatingReport
                  ? 'Đang lưu...'
                  : 'Lưu thay đổi'
                : isCheckingOut
                  ? 'Đang check-out...'
                  : 'Gửi báo cáo và Check Out'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!viewingReport}
        onClose={() => setViewingReport(null)}
        title="Chi tiết báo cáo"
        maxWidth="max-w-4xl"
      >
        {viewingReport ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm text-slate-500 mb-2">
              <span>Ngày: {viewingReport.date}</span>
            </div>

            <div
              className="prose prose-sm prose-slate max-w-none text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100"
              dangerouslySetInnerHTML={{ __html: viewingReport.content }}
            />

            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setViewingReport(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => openEditReport(viewingReport)}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                <Edit3 className="w-4 h-4 mr-1 inline" />
                Chỉnh sửa
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
