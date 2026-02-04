export interface User {
  id: number;
  name: string;
  email: string;
  last_opened_wallet?: number | null;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}
