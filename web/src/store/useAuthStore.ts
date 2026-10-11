import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';

interface AuthState {
  token: string | null;
  role: 'Admin' | 'Volunteer' | null;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  role: localStorage.getItem('token') ? (jwtDecode(localStorage.getItem('token')!) as any).role : null,
  
  setToken: (token) => {
    localStorage.setItem('token', token);
    const decoded: any = jwtDecode(token);
    set({ token, role: decoded.role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, role: null });
  },
}));