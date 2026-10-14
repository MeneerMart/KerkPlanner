import { create } from 'zustand';
import { api } from '../lib/api';
import { jwtDecode } from 'jwt-decode';
import type {
  ActivityPayload,
  Announcement,
  AdminEnrollmentPayload,
  AdminGuestEnrollmentPayload,
  EnrollmentPayload,
  ResponsiblesPayload,
  UserOption,
  WorkDay,
} from './types';

export type * from './types';

interface AuthState {
  token: string | null;
  firstName: string | null;
  role: string | null;
  userId: string | null;
}

interface AppStore extends AuthState {
  workDays: WorkDay[];
  users: UserOption[];
  announcement: Announcement;
  isLoading: boolean;
  login: (token: string, firstName: string, role: string) => void;
  logout: () => void;
  fetchPlanning: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchAnnouncement: () => Promise<void>;
  updateAnnouncement: (data: Announcement) => Promise<void>;
  enroll: (data: EnrollmentPayload) => Promise<void>;
  updateEnrollment: (id: string, data: EnrollmentPayload) => Promise<void>;
  deleteEnrollment: (id: string) => Promise<void>;
  adminEnroll: (data: AdminEnrollmentPayload) => Promise<void>;
  adminEnrollGuest: (data: AdminGuestEnrollmentPayload) => Promise<void>;
  createWorkDay: (date: string) => Promise<void>;
  updateResponsibles: (workDayId: string, data: ResponsiblesPayload) => Promise<void>;
  deleteWorkDay: (id: string) => Promise<void>;
  createActivity: (activityData: ActivityPayload) => Promise<void>;
  updateActivity: (id: string, activityData: ActivityPayload) => Promise<void>;
  setActivityCompleted: (id: string, isCompleted: boolean) => Promise<void>;
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

  /** Voert een wijziging uit, ververst daarna de planning en logt fouten met een herkenbare melding. */
  const mutate = async (logMessage: string, request: () => Promise<unknown>) => {
    try {
      await request();
      await get().fetchPlanning();
    } catch (error) {
      console.error(logMessage, error);
      throw error;
    }
  };

  return {
    token,
    firstName: localStorage.getItem('firstName'),
    role: localStorage.getItem('role'),
    userId: getInitialUserId(token),
    workDays: [],
    users: [],
    announcement: { title: '', message: '' },
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

    fetchAnnouncement: async () => {
      try {
        const response = await api.get<Announcement>('/announcement');
        set({ announcement: response.data });
      } catch (error) {
        // Zonder mededeling werkt de planning gewoon; alleen loggen.
        console.error('Fout bij ophalen mededeling', error);
      }
    },

    updateAnnouncement: async (data) => {
      try {
        await api.put('/announcement', data);
        set({ announcement: data });
      } catch (error) {
        console.error('Fout bij opslaan mededeling', error);
        throw error;
      }
    },

    enroll: (data) => mutate('Inschrijven mislukt', () => api.post('/planning/enroll', data)),
    updateEnrollment: (id, data) => mutate('Wijzigen inschrijving mislukt', () => api.put(`/planning/enroll/${id}`, data)),
    deleteEnrollment: (id) => mutate('Verwijderen inschrijving mislukt', () => api.delete(`/planning/enroll/${id}`)),
    adminEnroll: (data) => mutate('Inschrijving door beheerder mislukt', () => api.post('/planning/enroll/admin', data)),
    adminEnrollGuest: (data) => mutate('Gastinschrijving door beheerder mislukt', () => api.post('/planning/enroll/admin/guest', data)),

    createWorkDay: (date) => mutate('Fout bij aanmaken werkdag', () => api.post('/planning/workday', { date })),
    updateResponsibles: (workDayId, data) => mutate('Fout bij opslaan verantwoordelijken', () => api.put(`/planning/workday/${workDayId}/responsibles`, data)),
    deleteWorkDay: (id) => mutate('Fout bij verwijderen werkdag', () => api.delete(`/planning/workday/${id}`)),

    createActivity: (activityData) => mutate('Fout bij aanmaken activiteit', () => api.post('/planning/activity', activityData)),
    updateActivity: (id, activityData) => mutate('Fout bij bijwerken activiteit', () => api.put(`/planning/activity/${id}`, activityData)),
    setActivityCompleted: (id, isCompleted) => mutate('Fout bij afvinken activiteit', () => api.put(`/planning/activity/${id}/completed`, { isCompleted })),
    deleteActivity: (id) => mutate('Fout bij verwijderen activiteit', () => api.delete(`/planning/activity/${id}`)),
  };
});
