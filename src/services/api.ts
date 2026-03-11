import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../config/apiConfig';
import { useAuthStore } from '../stores/authStore'; // 🚀 Importação estática normal

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  }
});

api.interceptors.request.use((config) => {
  try {
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