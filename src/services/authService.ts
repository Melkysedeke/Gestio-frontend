import { API_BASE_URL } from '../config/apiConfig';
import User from '../database/models/User';
import api from './api'; // Importe o Axios aqui

interface RegisterResponse {
  user: User;
  token: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

export const authService = {
  /**
   * REGISTRO (Com Upload de Foto) - Usa FETCH nativo
   */
  async register(formData: FormData): Promise<RegisterResponse> {
     try {
      const response = await fetch(`${API_BASE_URL}/users/signup`, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' },
      });
      const textResponse = await response.text();
      let json;
      try { 
        json = JSON.parse(textResponse); 
      } catch { 
        console.error('❌ Falha ao transformar em JSON. O servidor mandou isso:', textResponse);
        throw new Error('Erro na resposta do servidor. Verifique o console do Backend.'); 
      }
      if (!response.ok) throw new Error(json.error || 'Falha ao realizar cadastro.');
      return json;
    } catch (error: any) {
      console.error('❌ Erro completo:', error);
      throw error; 
    }
  },

  /**
   * LOGIN (JSON Simples) - Usa AXIOS (Mais limpo)
   */
  async login(credentials: LoginCredentials): Promise<RegisterResponse> {
    try {
      const response = await api.post('/users/signin', credentials);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.error || 'Credenciais inválidas.');
      } else {
        throw new Error('Erro de conexão. Verifique sua internet.');
      }
    }
  }
};