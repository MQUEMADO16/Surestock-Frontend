// The shape of data returned from the API

export interface User {
  id: number;
  email: string;
  role: 'OWNER' | 'EMPLOYEE';
  businessId: number;
}

export interface Business {
  id: number;
  name: string;
  currency: string;
  taxRate: number;
  lowStockThreshold: number;
  contactAddress?: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  price: number; // Retail Price
  cost: number;  // Wholesale Cost
  quantity: number;
  reorderThreshold: number;
  businessId: number;
}

export interface SalesTransaction {
  id: number;
  businessId: number;
  product: Product; // Full product object is returned in the transaction entity
  quantitySold: number;
  totalPrice: number;
  timestamp: string; // ISO Date String
}

export interface ReportResult {
  reportType: string;
  businessId: number;
  generatedAt: string;
  data: Record<string, any>; // Flexible map for different report data
  summary: string;
}