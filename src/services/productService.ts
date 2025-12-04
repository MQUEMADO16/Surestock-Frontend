import api from './api';
import { 
  CreateProductRequest, 
  UpdateStockRequest, 
  UpdateProductDetailsRequest 
} from '../types/payloads';
import { Product } from '../types/models';

const productService = {
  getAll: async () => {
    return api.get<Product[]>('/products');
  },

  create: async (data: CreateProductRequest) => {
    return api.post<Product>('/products', data);
  },

  // Endpoint 1: Quick Stock Adjustment
  updateStock: async (id: number, data: UpdateStockRequest) => {
    return api.patch<Product>(`/products/${id}/stock`, data);
  },

  // Endpoint 2: Edit Details (Metadata)
  updateDetails: async (id: number, data: UpdateProductDetailsRequest) => {
    return api.patch<Product>(`/products/${id}`, data);
  },

  delete: async (id: number) => {
    return api.delete<void>(`/products/${id}`);
  }
};

export default productService;