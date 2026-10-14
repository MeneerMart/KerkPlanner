export type TimeSlot = 'FullDay' | 'Morning' | 'Afternoon' | 'Evening';

export interface Enrollment {
  id: string;
  userId: string | null;
  activityId: string | null;
  workDayId: string;
  firstName: string;
  timeSlot: TimeSlot;
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
  /** 0 = geen limiet */
  requiredVolunteers: number;
  /** "HH:mm"; null = hele dag */
  startTime: string | null;
  endTime: string | null;
  materialsNeeded: string;
  safetyInstructions: string;
  estimatedDurationMinutes: number | null;
  isCompleted: boolean;
  toolsProvided: string;
}

export interface WorkDay {
  id: string;
  date: string;
  coordinatorName: string;
  openerName: string;
  openTime: string;
  closerName: string;
  closeTime: string;
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
  timeSlot: TimeSlot;
  bringsVehicle: boolean;
  selectedTools: string;
  specificSkills: string;
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

export interface ActivityPayload {
  workDayId: string;
  title: string;
  description: string;
  requiredVolunteers: number;
  startTime: string | null;
  endTime: string | null;
  materialsNeeded: string;
  safetyInstructions: string;
  estimatedDurationMinutes: number | null;
}

export interface ResponsiblesPayload {
  coordinatorName: string;
  openerName: string;
  openTime: string;
  closerName: string;
  closeTime: string;
}
