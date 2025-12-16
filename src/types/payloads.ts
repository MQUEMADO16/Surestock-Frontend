// The shape of data sent TO the API

// Auth & User
export interface LoginRequest {
  email: string;
  password?: string;
}

export interface RegisterRequest {
  email: string;
  password?: string;
  role: 'OWNER';
  businessName: string;
}

export interface CreateEmployeeRequest {
  email: string;
  password?: string;
}

// Business
export interface BusinessSettingsUpdate {
  name: string;
  currency: string;
  taxRate: number;
  lowStockThreshold: number;
  contactAddress?: string;
}

// Product
export interface CreateProductRequest {
  name: string;
  sku: string;
  price: number;
  cost: number;
  quantity: number;
  reorderThreshold: number;
}

export interface UpdateStockRequest {
  quantityChange: number;
}

export interface UpdateProductDetailsRequest {
  name?: string;
  sku?: string;
  price?: number;
  cost?: number;
  reorderThreshold?: number;
}

// Transactions
export interface SaleItem {
  productId: number;
  quantity: number;
}

export interface SaleRequest {
  items: SaleItem[];
}