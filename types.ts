export interface Ingredient {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  threshold: number;
  cost: number;
  demand?: number;
  suggestedAmount?: number;
  estimatedCost?: number;
}

export interface Dish {
  id: number;
  name: string;
  price: number;
  image: string;
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