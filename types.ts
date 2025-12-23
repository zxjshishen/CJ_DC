export interface Ingredient {
  id: number;
  name: string;
  category?: string; // 新增
  unit: string;
  notes?: string;    // 新增
  source?: string;   // 新增
  quantity: number;  // 对应数据库 current_stock
  cost: number;      // 对应数据库 cost_per_unit
  threshold: number; // 预警阈值(保留)
  demand?: number;
  suggestedAmount?: number;
  estimatedCost?: number;
}

export interface Dish {
  id: number;
  name: string;
  price: number;
  image: string; // 对应数据库 image_url
  category?: string;       // 新增
  attributes?: string;     // 新增
  flavor?: string;         // 新增
  targetAudience?: string; // 新增
  difficulty?: string;     // 新增
  prepItems?: string;      // 新增
}

export interface RecipeItem {
  ingredientId: number;
  amount: number;
}

export interface CartItem extends Dish {
  count: number;
}

export interface OrderItem extends Dish {
  count: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'completed';
  timestamp: string;
  isReservation: boolean;
  tableNo: string;
  guestCount: number;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  time: string;
  invoiceStatus: 'none' | 'pending' | 'completed';
  invoiceNo: string;
}

export interface Reservation {
  id: string;
  customerName: string;
  date: string;
  time: string;
  guests: number;
  items: CartItem[];
  status: 'booked' | 'checked_in' | 'cancelled';
  realTableNo?: string;
}

export interface TableInfo {
    tableNo: string;
    guestCount: number;
}