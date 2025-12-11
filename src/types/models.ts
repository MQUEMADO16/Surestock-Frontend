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

export interface TransactionResponse {
  id: number;
  timestamp: string;
  quantity: number;
  totalPrice: number;
  productName: string;
  productSku: string;
}

export enum ReportType {
  SALES = "SALES",
  TOP_SELLERS = "TOP_SELLERS",
  LOW_STOCK = "LOW_STOCK",
  PROFIT = "PROFIT",
  DEAD_STOCK = "DEAD_STOCK",
  RESTOCK = "RESTOCK",
  INVENTORY = "INVENTORY"
}

export interface ReportResult {
  title: string;
  summary: string;
  chartType: "BAR" | "LINE" | "PIE" | "TABLE" | "NONE";
  data: any[]; // Array of objects (e.g., { name: "Product A", value: 100 })
}