import type { WorkDay } from '../../store/types';
import { nameWithTimeSlot } from '../../lib/format';
import { EnrollmentModal } from '../EnrollmentModal';
import { Card, CardContent } from '../ui/card';

export default function GeneralAvailabilityCard({ day, userId }: { day: WorkDay; userId: string | null }) {
  const generalEnrollments = day.enrollments.filter(enrollment => enrollment.activityId === null);
  const ownGeneralEnrollment = userId ? generalEnrollments.find(enrollment => enrollment.userId === userId) : undefined;

  return (
    <Card className="border-2 border-dashed bg-slate-50">
      <CardContent className="flex flex-col items-start gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full">
          <h4 className="font-semibold text-slate-700">Algemeen beschikbaar</h4>
          <p className="text-xs text-slate-500">Deel mij in waar nodig op deze dag (hele dag of een dagdeel).</p>
          {generalEnrollments.length > 0 && <p className="mt-1 text-xs text-slate-600"><strong>Ingeschreven:</strong> {generalEnrollments.map(nameWithTimeSlot).join(', ')}</p>}
        </div>
        <div className="w-full sm:w-52">
          <EnrollmentModal
            day={day}
            activity={null}
            existingEnrollment={ownGeneralEnrollment}
            enrollmentsForTask={generalEnrollments}
          />
        </div>
      </CardContent>
    </Card>
  );
}
