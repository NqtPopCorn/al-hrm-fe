import { AttendanceRecord } from '../types';

type AttendanceStatusMeta = {
  label: string;
  detail: string;
};

const statusReasonMetaByCode: Record<string, AttendanceStatusMeta> = {
  ATTENDANCE_VALID: {
    label: 'Hop le',
    detail: 'Check-in va check-out nam trong ca lam viec da cau hinh.',
  },
  CHECK_OUT_PENDING: {
    label: 'Chua check-out',
    detail: 'Ban ghi nay da check-in nhung chua co check-out cho ngay lam viec.',
  },
  CHECK_IN_LATE: {
    label: 'Di tre',
    detail: 'Gio check-in muon hon gio bat dau ca lam viec.',
  },
  CHECK_OUT_EARLY: {
    label: 'Ve som',
    detail: 'Gio check-out som hon gio ket thuc ca lam viec.',
  },
  SHIFT_NOT_CONFIGURED: {
    label: 'Khong hop le',
    detail: 'Khong tim thay ca lam viec ap dung cho nhan vien hoac phong ban nay.',
  },
  ATTENDANCE_INVALID: {
    label: 'Khong hop le',
    detail: 'Ban ghi attendance khong the duoc xac thuc theo cau hinh ca lam viec hien tai.',
  },
  MANUAL_ADJUSTMENT: {
    label: 'Da dieu chinh',
    detail: 'Ban ghi nay da duoc dieu chinh thu cong boi nguoi duyet.',
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
