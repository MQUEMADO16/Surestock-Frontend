export interface User {
  id: number;
  email: string;
  role: 'OWNER' | 'EMPLOYEE';
  businessId: number;
}