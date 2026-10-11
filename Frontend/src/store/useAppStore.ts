import { create } from 'zustand';
import { api } from '../../@/lib/api';
import { jwtDecode } from 'jwt-decode';

export interface Enrollment {
  id: string;
  activityId: string | null;
  workDayId: string;
  firstName: string;
  lastName?: string | null;
  bringsVehicle?: boolean | null;
  bringsTools?: boolean | null;
  selectedTools?: string | null;
  specificSkills?: string | null;
  remarks?: string | null;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  requiredVolunteers: number;
  materialsNeeded: string;
  safetyInstructions: string;
  isCompleted: boolean;
}

export interface WorkDay {
  id: string;
  date: string;
  activities: Activity[];
  enrollments: Enrollment[];
}

interface AuthState {
  token: string | null;
  firstName: string | null;
  role: string | null;
  userId: string | null;
}

interface AppStore extends AuthState {
  workDays: WorkDay[];
  isLoading: boolean;
  
  login: (token: string, firstName: string, role: string) => void;
  logout: () => void;
  fetchPlanning: () => Promise<void>;
  enroll: (data: any) => Promise<void>;
  createWorkDay: (date: string) => Promise<void>;
  deleteWorkDay: (id: string) => Promise<void>;
  createActivity: (activityData: any) => Promise<void>;
  updateActivity: (id: string, activityData: any) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
}

export const useAppStore = create<AppStore>((set, get) => {
  const token = localStorage.getItem('token');
  let initialUserId = null;
  if (token) {
    try { initialUserId = (jwtDecode(token) as any).nameid; } catch { }
  }

  return {
    token: token,
    firstName: localStorage.getItem('firstName'),
    role: localStorage.getItem('role'),
    userId: initialUserId,
    
    workDays: [],
    isLoading: false,

    login: (token, firstName, role) => {
      localStorage.setItem('token', token);
      localStorage.setItem('firstName', firstName);
      localStorage.setItem('role', role);
      
      const decoded: any = jwtDecode(token);
      set({ token, firstName, role, userId: decoded.nameid });
    },

    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('firstName');
      localStorage.removeItem('role');
      set({ token: null, firstName: null, role: null, userId: null, workDays: [] });
    },

    fetchPlanning: async () => {
      set({ isLoading: true });
      try {
        const response = await api.get<WorkDay[]>('/planning');
        set({ workDays: response.data, isLoading: false });
      } catch (error) {
        console.error("Fout bij ophalen planning", error);
        set({ isLoading: false });
      }
    },

    enroll: async (enrollmentData) => {
      try {
        await api.post('/planning/enroll', enrollmentData);
        await get().fetchPlanning();
      } catch (error) {
        console.error("Inschrijven mislukt", error);
        throw error;
      }
    },

    createWorkDay: async (date) => {
      try {
        await api.post('/planning/workday', { date });
        await get().fetchPlanning(); // Herlaad direct de dagen!
      } catch (error) {
        console.error("Fout bij aanmaken werkdag", error);
        throw error;
      }
    },

    deleteWorkDay: async (id) => {
      await api.delete(`/planning/workday/${id}`);
      await get().fetchPlanning();
    },

    createActivity: async (activityData) => {
      try {
        await api.post('/planning/activity', activityData);
        await get().fetchPlanning(); // Herlaad direct de activiteiten!
      } catch (error) {
        console.error("Fout bij aanmaken activiteit", error);
        throw error;
      }
    },

    updateActivity: async (id, activityData) => {
      await api.put(`/planning/activity/${id}`, activityData);
      await get().fetchPlanning();
    },

    deleteActivity: async (id) => {
      await api.delete(`/planning/activity/${id}`);
      await get().fetchPlanning();
    }
  };
});