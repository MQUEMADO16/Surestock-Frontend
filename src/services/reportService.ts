import api from './api';
import { ReportResult } from '../types/models';

const reportService = {
  // (Not all are implemented) Types: 'INVENTORY', 'SALES', 'DEAD_STOCK', 'PROFIT', 'TOP_SELLERS' 
  getReport: async (type: string) => {
    return api.get<ReportResult>(`/reports/${type}`);
  }
};

export default reportService;