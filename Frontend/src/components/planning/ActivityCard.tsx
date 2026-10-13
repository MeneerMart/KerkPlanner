import { CheckCircle2, Users } from 'lucide-react';
import type { Activity, Enrollment, WorkDay } from '../../store/types';
import { nameWithTimeSlot } from '../../lib/format';
import { EnrollmentModal } from '../EnrollmentModal';
import ActivityInfo from '../ActivityInfo';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

export default function ActivityCard({ day, activity, userId }: { day: WorkDay; activity: Activity; userId: string | null }) {
  const enrolledHere: Enrollment[] = day.enrollments.filter(enrollment => enrollment.activityId === activity.id);
  const ownEnrollment = userId ? enrolledHere.find(enrollment => enrollment.userId === userId) : undefined;
  const isFull = enrolledHere.length >= activity.requiredVolunteers;

  return (
    <Card className={`border-l-4 ${activity.isCompleted ? 'border-l-slate-400 opacity-75' : 'border-l-blue-500'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            {activity.isCompleted && <CheckCircle2 className="h-5 w-5 text-slate-500" />}
            <span className={activity.isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}>{activity.title}</span>
          </CardTitle>
          {activity.isCompleted ? (
            <Badge variant="secondary" className="whitespace-nowrap bg-slate-100 text-slate-700">Afgerond</Badge>
          ) : (
            <Badge variant={isFull ? 'secondary' : 'default'} className={`whitespace-nowrap ${isFull ? 'bg-slate-100 text-slate-800' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}>
              {enrolledHere.length} / {activity.requiredVolunteers}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <ActivityInfo activity={activity} />
        {enrolledHere.length > 0 && (
          <div className="flex items-start gap-2 rounded-md border border-slate-100 bg-slate-50 p-3">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <div className="font-medium text-slate-700">{enrolledHere.map(nameWithTimeSlot).join(', ')}</div>
          </div>
        )}
        {!activity.isCompleted && (
          <EnrollmentModal
            day={day}
            activity={activity}
            isFull={isFull}
            existingEnrollment={ownEnrollment}
            enrollmentsForTask={enrolledHere}
          />
        )}
      </CardContent>
    </Card>
  );
}
