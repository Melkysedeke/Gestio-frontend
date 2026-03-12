import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../config/apiConfig';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 🚀 Adicionamos o 'async' aqui
api.interceptors.request.use(async (config) => {
  try {
    // 🚀 Importação dinâmica com ES Modules (O TypeScript e o ESLint adoram isso)
    const { useAuthStore } = await import('../stores/authStore'); 
    
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error("Erro ao injetar token no interceptor:", error);
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;