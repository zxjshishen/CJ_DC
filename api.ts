import { Dish, Ingredient, Order, RecipeItem, Transaction } from './types';

// 使用相对路径 '/api'，这样 vite.config.ts 中的代理设置 (proxy) 就会生效
const API_BASE = '/api'; 

// 辅助函数：处理 Fetch 请求，统一处理错误
async function fetchJson(url: string, options?: RequestInit) {
  try {
    const res = await fetch(url, options);
    // 如果状态码不是 2xx，抛出错误
    if (!res.ok) {
      const text = await res.text();
      // 如果返回 404 且包含 "File not found"，说明是 Vite 没有代理成功，而是试图访问静态文件
      if (res.status === 404 && text.includes('File not found')) {
        throw new Error(`连接失败: 前端代理未生效。请重启前端服务 (npm run dev) 以应用配置。`);
      }
      // 如果返回 504，通常是后端没开启
      if (res.status === 504) {
        throw new Error(`连接超时: 请检查后端服务是否已启动 (node server/index.js)。`);
      }
      throw new Error(`请求失败 (${res.status}): ${text.substring(0, 50)}`);
    }
    return res.json();
  } catch (error: any) {
    console.warn(`API Error [${url}]:`, error);
    throw error;
  }
}

export const api = {
  // --- 菜品相关 ---
  getDishes: async (): Promise<Dish[]> => {
    return fetchJson(`${API_BASE}/dishes`);
  },

  // --- 食材库存相关 ---
  getIngredients: async (): Promise<Ingredient[]> => {
    return fetchJson(`${API_BASE}/ingredients`);
  },

  // --- 订单相关 ---
  createOrder: async (orderData: any): Promise<{ message: string, orderId: string }> => {
    return fetchJson(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
  },

  // --- 初始化数据库 (仅首次使用) ---
  initDB: async () => {
    try {
      const res = await fetch(`${API_BASE}/init-db`);
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      return text;
    } catch (e: any) {
      console.error("Init DB failed", e);
      return `初始化失败: ${e.message}`;
    }
  },

  // --- 图片上传 ---
  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const data = await fetchJson(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData
    });
    return data.url;
  }
};