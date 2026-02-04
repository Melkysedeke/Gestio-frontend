import axios from 'axios';

const BASE_URL = 'http://192.168.0.114:3000'; 

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
});

// Interceptor de Requisição
api.interceptors.request.use(async (config) => {
  try {
    // IMPORTANTE: Importação dinâmica aqui dentro evita o Require Cycle
    const { useAuthStore } = await import('../stores/authStore');
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.log("Erro ao recuperar token no interceptor");
  }

  // Lógica de Content-Type para FormData
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  } else if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;