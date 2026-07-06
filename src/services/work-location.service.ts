import { api } from '../lib/api';

export interface WorkLocationConfig {
  id?: string;
  name?: string | null;
  officeIp?: string | null;
  wifiSsid?: string | null;
  gpsLat?: number | null;
  gpsLng?: number | null;
  gpsRadiusMeters?: number;
  isActive?: boolean;
}

export const workLocationService = {
  async getActive(): Promise<WorkLocationConfig | null> {
    try {
      const result = await api.get<WorkLocationConfig>('/work-locations/active');
      return result;
    } catch {
      return null;
    }
  },

  async saveConfig(dto: Omit<WorkLocationConfig, 'id' | 'isActive'>): Promise<WorkLocationConfig> {
    return api.put<WorkLocationConfig>('/work-locations', dto);
  },
};
