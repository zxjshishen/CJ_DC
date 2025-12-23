import { Dish, Ingredient, Order, RecipeItem, Transaction } from './types';

// 假设后端运行在 3000 端口，如果前后端同域部署（如通过 Nginx），可以设为 ''
// 在本地开发时，通常前端是 5173/3000，需要配置代理或写全路径
const API_BASE = 'http://localhost:3000/api'; 

export const api = {
  // --- 菜品相关 ---
  getDishes: async (): Promise<Dish[]> => {
    const res = await fetch(`${API_BASE}/dishes`);
    return res.json();
  },

  // --- 食材库存相关 ---
  getIngredients: async (): Promise<Ingredient[]> => {
    const res = await fetch(`${API_BASE}/ingredients`);
    return res.json();
  },

  // --- 订单相关 ---
  createOrder: async (orderData: any): Promise<{ message: string, orderId: string }> => {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    return res.json();
  },

  // --- 初始化数据库 (仅首次使用) ---
  initDB: async () => {
    try {
      const res = await fetch(`${API_BASE}/init-db`);
      const text = await res.text();
      return text;
    } catch (e) {
      console.error("Init DB failed", e);
      return "初始化失败，请检查后端是否启动";
    }
  },

  // --- 图片上传 ---
  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    return `http://localhost:3000${data.url}`; // 拼接完整路径
  }
};
