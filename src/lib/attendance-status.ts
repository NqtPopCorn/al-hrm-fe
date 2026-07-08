import { AttendanceRecord } from '../types';

type AttendanceStatusMeta = {
  label: string;
  detail: string;
};

const statusReasonMetaByCode: Record<string, AttendanceStatusMeta> = {
  ATTENDANCE_VALID: {
    label: 'Hợp lệ',
    detail: 'Check-in va check-out nằm trong ca làm việc đã cấu hình.',
  },
  CHECK_OUT_PENDING: {
    label: 'Chưa check-out',
    detail: 'Ban ghi này đã check-in nhưng chưa có check-out cho ngày làm việc.',
  },
  CHECK_IN_LATE: {
    label: 'Đi muộn',
    detail: 'Giờ check-in muộn hơn giờ bắt đầu ca làm việc.',
  },
  CHECK_OUT_EARLY: {
    label: 'Về sớm',
    detail: 'Giờ check-out sớm hơn giờ kết thúc ca làm việc.',
  },
  SHIFT_NOT_CONFIGURED: {
    label: 'Không hợp lệ',
    detail: 'Không tìm thấy ca làm việc áp dụng cho nhân viên hoặc phòng ban này.',
  },
  ATTENDANCE_INVALID: {
    label: 'Không hợp lệ',
    detail: 'Ban ghi attendance không thể được xác thực theo cấu hình ca làm việc hiện tại.',
  },
  MANUAL_ADJUSTMENT: {
    label: 'Đã điều chỉnh',
    detail: 'Ban ghi này đã được điều chỉnh thủ công bởi người duyệt.',
  },
};

const fallbackMetaByStatus: Record<AttendanceRecord['status'], AttendanceStatusMeta> = {
  VALID: statusReasonMetaByCode.ATTENDANCE_VALID,
  LATE: statusReasonMetaByCode.CHECK_IN_LATE,
  EARLY_LEAVE: statusReasonMetaByCode.CHECK_OUT_EARLY,
  MISSING_CHECKOUT: statusReasonMetaByCode.CHECK_OUT_PENDING,
  INVALID: statusReasonMetaByCode.ATTENDANCE_INVALID,
  MANUAL_ADJUSTED: statusReasonMetaByCode.MANUAL_ADJUSTMENT,
};

export function getAttendanceStatusMeta(
  record: Pick<
    AttendanceRecord,
    'status' | 'statusReasonCode' | 'manualAdjustmentReason'
  >,
): AttendanceStatusMeta {
  const meta =
    (record.statusReasonCode
      ? statusReasonMetaByCode[record.statusReasonCode]
      : undefined) ?? fallbackMetaByStatus[record.status];

  if (
    record.status === 'MANUAL_ADJUSTED' &&
    record.manualAdjustmentReason?.trim()
  ) {
    return {
      ...meta,
      detail: `Dieu chinh thu cong: ${record.manualAdjustmentReason.trim()}`,
    };
  }

  return meta;
}
