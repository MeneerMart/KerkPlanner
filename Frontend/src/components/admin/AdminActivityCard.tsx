import { useState } from 'react';
import { CheckCircle2, Circle, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../../store/useAppStore';
import type { Activity, WorkDay } from '../../store/types';
import { errorMessage } from '../../lib/errors';
import { hasNoLimit } from '../../lib/format';
import ActivityInfo from '../ActivityInfo';
import ActivityModal from './ActivityModal';
import AdminEnrollmentModal from './AdminEnrollmentModal';
import AdminEnrollmentList from './AdminEnrollmentList';
import ConfirmDeleteButton from './ConfirmDeleteButton';
import ToolStatus from './ToolStatus';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

export default function AdminActivityCard({ day, activity }: { day: WorkDay; activity: Activity }) {
  const { deleteActivity, setActivityCompleted } = useAppStore();
  const [toggling, setToggling] = useState(false);
  const enrollments = day.enrollments.filter(enrollment => enrollment.activityId === activity.id);

  const toggleCompleted = async () => {
    setToggling(true);
    try {
      await setActivityCompleted(activity.id, !activity.isCompleted);
      toast.success(activity.isCompleted ? 'Taak staat weer open.' : 'Taak afgevinkt.');
    } catch (error) {
      toast.error(errorMessage(error, 'Afvinken is niet gelukt.'));
    } finally {
      setToggling(false);
    }
  };

  return (
    <Card className={`border-l-4 ${activity.isCompleted ? 'border-l-emerald-500 bg-slate-50' : 'border-l-blue-600'}`}>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className={`text-base ${activity.isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{activity.title}</CardTitle>
          <p className="mt-1 text-xs text-slate-500">{hasNoLimit(activity) ? `${enrollments.length} aangemeld · geen limiet` : `Capaciteit: ${enrollments.length}/${activity.requiredVolunteers} personen`}</p>
        </div>
        <div className="flex gap-1">
          <ActivityModal dayId={day.id} activity={activity} />
          <ConfirmDeleteButton
            buttonTitle="Taak verwijderen"
            title="Taak verwijderen?"
            description={`De taak "${activity.title}" en alle bijbehorende inschrijvingen worden verwijderd.`}
            confirmLabel="Taak verwijderen"
            successMessage="Taak verwijderd."
            onConfirm={() => deleteActivity(activity.id)}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <Button
          variant="outline"
          size="sm"
          disabled={toggling}
          onClick={toggleCompleted}
          className={activity.isCompleted ? 'border-emerald-200 text-emerald-700' : 'text-slate-600'}
        >
          {activity.isCompleted
            ? <><CheckCircle2 className="mr-1 h-4 w-4" /> Afgerond — heropenen</>
            : <><Circle className="mr-1 h-4 w-4" /> Markeer als afgerond</>}
        </Button>
        <ActivityInfo activity={activity} showTools={false} />
        <ToolStatus activity={activity} />
        <div className="flex items-center justify-between gap-2 border-b pb-1 pt-2">
          <div className="flex items-center gap-2 font-semibold text-slate-700"><Users className="h-4 w-4" /> Inschrijvingen</div>
          <AdminEnrollmentModal day={day} activity={activity} existingEnrollments={enrollments} />
        </div>
        <AdminEnrollmentList enrollments={enrollments} />
      </CardContent>
    </Card>
  );
}
