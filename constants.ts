import { Ingredient, Dish, RecipeItem } from './types';

export const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 101, name: '鸡胸肉', quantity: 5.0, unit: 'kg', threshold: 2.0, cost: 20 },
  { id: 102, name: '花生米', quantity: 2.0, unit: 'kg', threshold: 1.0, cost: 10 },
  { id: 103, name: '酱油', quantity: 10.0, unit: '瓶', threshold: 3.0, cost: 5 },
  { id: 104, name: '青椒', quantity: 3.0, unit: 'kg', threshold: 1.5, cost: 6 },
];

export const INITIAL_DISHES: Dish[] = [
  { id: 1, name: '宫保鸡丁', price: 38, image: '🥘' },
  { id: 2, name: '红烧鸡块', price: 45, image: '🍲' },
  { id: 3, name: '青椒炒肉', price: 32, image: '🥗' },
];

export const INITIAL_RECIPES: Record<number, RecipeItem[]> = {
  1: [ { ingredientId: 101, amount: 0.2 }, { ingredientId: 102, amount: 0.1 }, { ingredientId: 103, amount: 0.05 } ],
  2: [ { ingredientId: 101, amount: 0.5 }, { ingredientId: 103, amount: 0.1 } ],
  3: [ { ingredientId: 101, amount: 0.15 }, { ingredientId: 104, amount: 0.2 }, { ingredientId: 103, amount: 0.02 } ]
};

export const EXPENSE_CATEGORIES = ['原材料采购', '水电煤费', '店面租金', '员工工资', '员工备用金/预支', '设备维修', '其他杂费'];