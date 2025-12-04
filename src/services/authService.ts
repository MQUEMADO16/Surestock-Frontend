import api from './api';
import { LoginRequest, RegisterRequest } from '../types/payloads';
import { User } from '../types/models';

const authService = {
  login: async (data: LoginRequest) => {
    return api.post<User>('/auth/login', data);
  },

  register: async (data: RegisterRequest) => {
    return api.post<User>('/auth/register', data);
  },

  logout: async () => {
    return api.post<void>('/auth/logout');
  }
};

export default authService;