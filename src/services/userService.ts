import api from './api';
import { CreateEmployeeRequest } from '../types/payloads';
import { User } from '../types/models';

const userService = {

  getMe: async () => {
    return api.get<User>('/users/me');
  },

  getEmployees: async () => {
    const response = await api.get<User[]>('/users/employees');
    return response.data;
  },

  createEmployee: async (data: CreateEmployeeRequest) => {
    return api.post<User>('/users/employee', data);
  },

  deleteEmployee: async (employeeId: number) => {
    return api.delete<void>(`/users/employee/${employeeId}`);
  },

  closeAccount: async () => {
    return api.delete<void>('/users/owner/self');
  }
};

export default userService;