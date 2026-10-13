import type { TimeSlot } from '../store/types';

export interface EnrollmentDetails {
  timeSlot: TimeSlot;
  bringsVehicle: boolean;
  specificSkills: string;
  remarks: string;
}

export const emptyEnrollmentDetails: EnrollmentDetails = {
  timeSlot: 'FullDay',
  bringsVehicle: false,
  specificSkills: '',
  remarks: '',
};

