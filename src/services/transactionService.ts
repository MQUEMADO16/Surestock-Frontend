import api from './api';
import { SaleRequest } from '../types/payloads';
import { SalesTransaction } from '../types/models';

const transactionService = {
  // Process a sale (Checkout)
  createTransaction: async (data: SaleRequest) => {
    return api.post<SalesTransaction[]>('/transactions', data);
  },

  getHistory: async () => {
    var history = api.get<SalesTransaction[]>('/transactions');
    console.log(history);
    return history;
  }
};

export default transactionService;