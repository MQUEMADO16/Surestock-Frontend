import api from './api';
import { ReportType, ReportResult } from '../types/models';

export const getReport = async (type: ReportType): Promise<ReportResult> => {
  const response = await api.get<ReportResult>(`/reports/${type}`);
  return response.data;
};