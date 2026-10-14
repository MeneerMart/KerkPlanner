import { useAppStore } from '../../store/useAppStore';
import type { WorkDay } from '../../store/types';
import { formatDay } from '../../lib/format';
import DayResponsibles from '../DayResponsibles';
import ActivityModal from './ActivityModal';
import AdminActivityCard from './AdminActivityCard';
import AdminEnrollmentList from './AdminEnrollmentList';
import AdminEnrollmentModal from './AdminEnrollmentModal';
import ConfirmDeleteButton from './ConfirmDeleteButton';
import ResponsiblesModal from './ResponsiblesModal';
import { Card, CardContent } from '../ui/card';

export default function AdminWorkDaySection({ day }: { day: WorkDay }) {
  const deleteWorkDay = useAppStore(state => state.deleteWorkDay);
  const generalEnrollments = day.enrollments.filter(enrollment => enrollment.activityId === null);
  const hasResponsibles = day.coordinatorName || day.openerName || day.openTime || day.closerName || day.closeTime;

  return (
    <div className="border-t-2 pt-6">
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-3 text-lg font-bold text-slate-800">
            {formatDay(day.date)}
            <ConfirmDeleteButton
              buttonTitle="Werkdag verwijderen"
              title="Werkdag verwijderen?"
              description={`Weet je zeker dat je ${formatDay(day.date, 'd MMMM yyyy')} en alle taken en inschrijvingen wilt verwijderen?`}
              confirmLabel="Werkdag verwijderen"
              successMessage="Werkdag verwijderd."
              onConfirm={() => deleteWorkDay(day.id)}
            />
          </h3>
          <div className="flex flex-wrap gap-2">
            <ResponsiblesModal day={day} />
            <ActivityModal dayId={day.id} />
          </div>
        </div>
        {hasResponsibles
          ? <DayResponsibles day={day} />
          : <p className="text-sm text-amber-700">Nog geen dagcoördinator of opener/afsluiter ingesteld.</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {day.activities.map(activity => <AdminActivityCard key={activity.id} day={day} activity={activity} />)}
      </div>

      <Card className="mt-4 border-2 border-dashed bg-slate-50">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="font-semibold text-slate-700">Algemeen beschikbaar</h4>
              <p className="text-xs text-slate-500">Vrijwilligers die nog niet aan een specifieke taak zijn gekoppeld.</p>
            </div>
            <AdminEnrollmentModal day={day} activity={null} existingEnrollments={generalEnrollments} />
          </div>
          <AdminEnrollmentList enrollments={generalEnrollments} />
        </CardContent>
      </Card>
    </div>
  );
}
