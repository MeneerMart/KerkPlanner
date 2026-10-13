import { create } from 'zustand';
import { api } from '../lib/api';
import { jwtDecode } from 'jwt-decode';

export interface Enrollment {
  id: string;
  userId: string | null;
  activityId: string | null;
  workDayId: string;
  firstName: string;
  lastName?: string | null;
  phoneNumber?: string | null;
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
  isCompleted: boolean;
  toolsProvided: string;
}

export interface WorkDay {
  id: string;
  date: string;
  activities: Activity[];
  enrollments: Enrollment[];
}

export interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
}

export interface EnrollmentPayload {
  workDayId: string;
  activityId: string | null;
  bringsVehicle: boolean;
  selectedTools: string;
  specificSkills?: string;
  remarks: string;
}

export interface AdminEnrollmentPayload extends EnrollmentPayload {
  userId: string;
}

export interface AdminGuestEnrollmentPayload extends EnrollmentPayload {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

interface AuthState {
  token: string | null;
  firstName: string | null;
  role: string | null;
  userId: string | null;
}

interface AppStore extends AuthState {
  workDays: WorkDay[];
  users: UserOption[];
  isLoading: boolean;
  login: (token: string, firstName: string, role: string) => void;
  logout: () => void;
  fetchPlanning: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  enroll: (data: EnrollmentPayload) => Promise<void>;
  updateEnrollment: (id: string, data: EnrollmentPayload) => Promise<void>;
  deleteEnrollment: (id: string) => Promise<void>;
  adminEnroll: (data: AdminEnrollmentPayload) => Promise<void>;
  adminEnrollGuest: (data: AdminGuestEnrollmentPayload) => Promise<void>;
  createWorkDay: (date: string) => Promise<void>;
  deleteWorkDay: (id: string) => Promise<void>;
  createActivity: (activityData: Record<string, unknown>) => Promise<void>;
  updateActivity: (id: string, activityData: Record<string, unknown>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
}

function getInitialUserId(token: string | null): string | null {
  if (!token) return null;
  try {
    const decoded = jwtDecode<Record<string, unknown>>(token);
    const id = decoded.nameid ?? decoded.sub ?? decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
    return typeof id === 'string' ? id : null;
  } catch {
    return null;
  }
}

export const useAppStore = create<AppStore>((set, get) => {
  const token = localStorage.getItem('token');
  return {
    token,
    firstName: localStorage.getItem('firstName'),
    role: localStorage.getItem('role'),
    userId: getInitialUserId(token),
    workDays: [],
    users: [],
    isLoading: false,

    login: (newToken, firstName, role) => {
      localStorage.setItem('token', newToken);
      localStorage.setItem('firstName', firstName);
      localStorage.setItem('role', role);
      set({ token: newToken, firstName, role, userId: getInitialUserId(newToken) });
    },

    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('firstName');
      localStorage.removeItem('role');
      set({ token: null, firstName: null, role: null, userId: null, workDays: [], users: [] });
    },

    fetchPlanning: async () => {
      set({ isLoading: true });
      try {
        const response = await api.get<WorkDay[]>('/planning');
        set({ workDays: response.data, isLoading: false });
      } catch (error) {
        console.error('Fout bij ophalen planning', error);
        set({ isLoading: false });
      }
    },

    fetchUsers: async () => {
      try {
        const response = await api.get<UserOption[]>('/planning/users');
        set({ users: response.data });
      } catch (error) {
        console.error('Fout bij ophalen gebruikers', error);
        throw error;
      }
    },

    enroll: async (data) => {
      try {
        await api.post('/planning/enroll', data);
        await get().fetchPlanning();
      } catch (error) {
        console.error('Inschrijven mislukt', error);
        throw error;
      }
    },

    updateEnrollment: async (id, data) => {
      try {
        await api.put(`/planning/enroll/${id}`, data);
        await get().fetchPlanning();
      } catch (error) {
        console.error('Wijzigen inschrijving mislukt', error);
        throw error;
      }
    },

    deleteEnrollment: async (id) => {
      try {
        await api.delete(`/planning/enroll/${id}`);
        await get().fetchPlanning();
      } catch (error) {
        console.error('Verwijderen inschrijving mislukt', error);
        throw error;
      }
    },

    adminEnroll: async (data) => {
      try {
        await api.post('/planning/enroll/admin', data);
        await get().fetchPlanning();
      } catch (error) {
        console.error('Inschrijving door beheerder mislukt', error);
        throw error;
      }
    },

    adminEnrollGuest: async (data) => {
      try {
        await api.post('/planning/enroll/admin/guest', data);
        await get().fetchPlanning();
      } catch (error) {
        console.error('Gastinschrijving door beheerder mislukt', error);
        throw error;
      }
    },

    createWorkDay: async (date) => {
      try {
        await api.post('/planning/workday', { date });
        await get().fetchPlanning();
      } catch (error) {
        console.error('Fout bij aanmaken werkdag', error);
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
        await get().fetchPlanning();
      } catch (error) {
        console.error('Fout bij aanmaken activiteit', error);
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
