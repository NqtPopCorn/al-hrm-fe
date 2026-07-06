import { useEffect, useState } from 'react';
import { Clock, Loader2, Mail, MapPin, Save, Shield, ShieldAlert } from 'lucide-react';

import { mockShiftConfig } from '../mockData';
import {
  WorkLocationConfig,
  workLocationService,
} from '../services/work-location.service';

function showDeferredFeatureAlert(featureName: string) {
  window.alert(
    `${featureName} is not supported in this sprint yet. Please discuss the target workflow before we wire this settings area to live APIs.`,
  );
}

const roleScopeRows = [
  {
    area: 'Danh mục nhân viên',
    currentScope: 'Live',
    note: 'Đã kết nối trực tiếp cho Super Admin.',
  },
  {
    area: 'Xem xét chấm công',
    currentScope: 'Live',
    note: 'Xem tổng quan công ty hiện chỉ dành cho Super Admin.',
  },
  {
    area: 'Thao tác quản lý lương',
    currentScope: 'Partial',
    note: 'Chỉ Super Admin có quyền quản lý lương.',
  },
  {
    area: 'Ma trận quyền có thể chỉnh sửa',
    currentScope: 'Deferred',
    note: 'Chỉnh sửa quyền trực tiếp nằm ngoài phạm vi sprint hiện tại.',
  },
];

export default function Settings() {
  const [locationConfig, setLocationConfig] = useState<WorkLocationConfig>({
    officeIp: '',
    wifiSsid: '',
    gpsLat: undefined,
    gpsLng: undefined,
    gpsRadiusMeters: 100,
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [locationSaveError, setLocationSaveError] = useState<string | null>(null);
  const [locationSaveSuccess, setLocationSaveSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingLocation(true);
    workLocationService.getActive().then(config => {
      if (cancelled) return;
      if (config) {
        setLocationConfig({
          officeIp: config.officeIp ?? '',
          wifiSsid: config.wifiSsid ?? '',
          gpsLat: config.gpsLat ?? undefined,
          gpsLng: config.gpsLng ?? undefined,
          gpsRadiusMeters: config.gpsRadiusMeters ?? 100,
        });
      }
      setIsLoadingLocation(false);
    });
    return () => { cancelled = true; };
  }, []);

  const handleSaveLocation = async () => {
    setIsSavingLocation(true);
    setLocationSaveError(null);
    setLocationSaveSuccess(false);
    try {
      await workLocationService.saveConfig({
        officeIp: locationConfig.officeIp || null,
        wifiSsid: locationConfig.wifiSsid || null,
        gpsLat: locationConfig.gpsLat ?? null,
        gpsLng: locationConfig.gpsLng ?? null,
        gpsRadiusMeters: locationConfig.gpsRadiusMeters ?? 100,
      });
      setLocationSaveSuccess(true);
      setTimeout(() => setLocationSaveSuccess(false), 3000);
    } catch (err) {
      setLocationSaveError(
        err instanceof Error ? err.message : 'Không thể lưu cấu hình.',
      );
    } finally {
      setIsSavingLocation(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-amber-950">
              Cài đặt — một phần vẫn đang được phát triển
            </h1>
            <p className="mt-2 text-sm text-amber-800">
              Cấu hình vị trí làm việc đã được kết nối API. Các phần còn lại như
              ca làm việc, email công ty và quyền truy cập vẫn ở chế độ chỉ xem.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Work Shift Config — read-only */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center">
            <div className="mr-3 rounded-lg bg-blue-50 p-2 text-blue-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Cấu hình ca làm việc
              </h2>
              <p className="text-xs text-slate-500">
                Giá trị nguyên mẫu. Giao diện quản trị trực tiếp vẫn đang phát triển.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Giờ bắt đầu
                </label>
                <input
                  type="time"
                  readOnly
                  value={mockShiftConfig.startTime}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Giờ kết thúc
                </label>
                <input
                  type="time"
                  readOnly
                  value={mockShiftConfig.endTime}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Bắt đầu nghỉ trưa
                </label>
                <input
                  type="time"
                  readOnly
                  value={mockShiftConfig.breakStartTime}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Kết thúc nghỉ trưa
                </label>
                <input
                  type="time"
                  readOnly
                  value={mockShiftConfig.breakEndTime}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Số ngày làm việc tối thiểu mỗi tháng
              </label>
              <input
                type="number"
                readOnly
                value={mockShiftConfig.minWorkingDaysPerMonth}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => showDeferredFeatureAlert('Cài đặt ca làm việc')}
              className="w-full rounded-md border border-slate-200 bg-slate-100 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Thảo luận cài đặt ca làm việc trực tiếp
            </button>
          </div>
        </div>

        {/* Company Email — read-only */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center">
            <div className="mr-3 rounded-lg bg-purple-50 p-2 text-purple-600">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Cấu hình email công ty
              </h2>
              <p className="text-xs text-slate-500">
                Vẫn chỉ là nguyên mẫu trong sprint này.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Tên miền chính
              </label>
              <input
                type="text"
                readOnly
                value="nova.com"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none"
              />
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Tự động cấp phát email công ty vẫn đang được phát triển. Sprint hiện tại
              chỉ triển khai CRUD nhân viên và ranh giới thông tin nhạy cảm.
            </div>
            <button
              type="button"
              onClick={() => showDeferredFeatureAlert('Cài đặt tên miền email')}
              className="w-full rounded-md border border-slate-200 bg-slate-100 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Thảo luận cài đặt email
            </button>
          </div>
        </div>

        {/* Work Locations — LIVE */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-3 rounded-lg bg-orange-50 p-2 text-orange-600">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Vị trí làm việc
                </h2>
                <p className="text-xs text-slate-500">
                  Cấu hình trực tiếp — thay đổi sẽ ảnh hưởng đến dữ liệu metadata chấm công.
                </p>
              </div>
            </div>
            {isLoadingLocation && (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                IP công khai của văn phòng
              </label>
              <input
                type="text"
                placeholder="VD: 203.0.113.10"
                value={locationConfig.officeIp ?? ''}
                onChange={e =>
                  setLocationConfig(c => ({ ...c, officeIp: e.target.value }))
                }
                disabled={isLoadingLocation}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/10 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Wi-Fi SSID của văn phòng
              </label>
              <input
                type="text"
                placeholder="VD: CompanyWiFi_5G"
                value={locationConfig.wifiSsid ?? ''}
                onChange={e =>
                  setLocationConfig(c => ({ ...c, wifiSsid: e.target.value }))
                }
                disabled={isLoadingLocation}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/10 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  GPS Vĩ độ (Lat)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="VD: 10.7769"
                  value={locationConfig.gpsLat ?? ''}
                  onChange={e =>
                    setLocationConfig(c => ({
                      ...c,
                      gpsLat: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  disabled={isLoadingLocation}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/10 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  GPS Kinh độ (Lng)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="VD: 106.7009"
                  value={locationConfig.gpsLng ?? ''}
                  onChange={e =>
                    setLocationConfig(c => ({
                      ...c,
                      gpsLng: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  disabled={isLoadingLocation}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/10 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Bán kính GPS (mét)
              </label>
              <input
                type="number"
                min={10}
                placeholder="100"
                value={locationConfig.gpsRadiusMeters ?? 100}
                onChange={e =>
                  setLocationConfig(c => ({
                    ...c,
                    gpsRadiusMeters: Number(e.target.value),
                  }))
                }
                disabled={isLoadingLocation}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/10 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            {locationSaveError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
                {locationSaveError}
              </div>
            ) : null}

            {locationSaveSuccess ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                ✓ Đã lưu cấu hình vị trí thành công.
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void handleSaveLocation()}
              disabled={isSavingLocation || isLoadingLocation}
              className="inline-flex w-full items-center justify-center rounded-md bg-orange-600 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingLocation ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isSavingLocation ? 'Đang lưu...' : 'Lưu cấu hình'}
            </button>
          </div>
        </div>

        {/* Role Access Overview */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center">
            <div className="mr-3 rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Tổng quan quyền truy cập
              </h2>
              <p className="text-xs text-slate-500">
                Snapshot chỉ đọc cho bàn giao sprint.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {roleScopeRows.map(row => (
              <div
                key={row.area}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {row.area}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">{row.note}</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      row.currentScope === 'Live'
                        ? 'bg-emerald-100 text-emerald-700'
                        : row.currentScope === 'Partial'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {row.currentScope}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => showDeferredFeatureAlert('Ma trận quyền có thể chỉnh sửa')}
            className="mt-5 w-full rounded-md border border-slate-200 bg-slate-100 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            Thảo luận ma trận quyền trước khi bật
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Tạm hoãn từ giao diện cài đặt cũ
        </h2>
        <ul className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
          <li className="rounded-lg bg-slate-50 px-4 py-3">
            Màn hình cấu hình ca làm việc có thể chỉnh sửa
          </li>
          <li className="rounded-lg bg-slate-50 px-4 py-3">
            Luồng quản lý tên miền email công ty
          </li>
          <li className="rounded-lg bg-slate-50 px-4 py-3">
            ✓ Trình chỉnh sửa vị trí IP / Wi-Fi / GPS đã được kết nối live
          </li>
          <li className="rounded-lg bg-slate-50 px-4 py-3">
            Ma trận quyền có thể chỉnh sửa
          </li>
        </ul>
      </div>
    </div>
  );
}
