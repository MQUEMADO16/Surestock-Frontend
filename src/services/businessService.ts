import api from './api';
import { BusinessSettingsUpdate } from '../types/payloads';
import { Business } from '../types/models';

const businessService = {
  getSettings: async () => {
    return api.get<Business>('/business/settings');
  },

  updateSettings: async (data: BusinessSettingsUpdate) => {
    return api.put<Business>('/business/settings', data);
  }
};

export default businessService;