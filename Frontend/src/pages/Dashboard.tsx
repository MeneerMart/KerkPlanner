import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { CheckCircle2, Users } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { EnrollmentModal } from '../components/EnrollmentModal';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

export default function Dashboard() {
  const navigate = useNavigate();
  const { workDays, fetchPlanning, isLoading, firstName, token, userId } = useAppStore();

  useEffect(() => { void fetchPlanning(); }, [fetchPlanning]);

  if (isLoading) return <div className="mt-10 text-center text-slate-500">Planning ophalen...</div>;

  return (
    <div className="space-y-6">
      {firstName ? (
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <h2 className="font-semibold text-blue-900">Welkom, {firstName}!</h2>
          <p className="mt-1 text-sm text-blue-700">Bekijk de geplande dagen en activiteiten en meld je aan als je mee wilt helpen.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-800">Welkom bij de planning!</h2>
            <p className="mt-1 text-sm text-slate-600">Bekijk de geplande dagen en activiteiten. Inschrijven kan met een account of via WhatsApp.</p>
          </div>
          <Button onClick={() => navigate('/login')} variant="outline" className="w-full bg-white sm:w-auto">Inloggen of registreren</Button>
        </div>
      )}

      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Geplande werkdagen</h2>
          <p className="mt-1 text-sm text-slate-500">Bekijk de activiteiten en hoeveel vrijwilligers er nodig zijn.</p>
        </div>
        <Badge variant="secondary">{workDays.length} {workDays.length === 1 ? 'dag' : 'dagen'}</Badge>
      </div>

      {workDays.length === 0 && <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">Er zijn momenteel geen werkdagen ingepland.</div>}

      {workDays.map(day => {
        const generalEnrollments = day.enrollments.filter(enrollment => enrollment.activityId === null);
        const ownGeneralEnrollment = token && userId ? generalEnrollments.find(enrollment => enrollment.userId === userId) : undefined;
        return (
          <div key={day.id} className="space-y-4">
            <h3 className="mt-8 border-b pb-2 text-xl font-bold text-slate-800">
              {format(new Date(day.date), 'EEEE d MMMM yyyy', { locale: nl })}
            </h3>
            {day.activities.map(activity => {
              const enrolledHere = day.enrollments.filter(enrollment => enrollment.activityId === activity.id);
              const ownEnrollment = token && userId ? enrolledHere.find(enrollment => enrollment.userId === userId) : undefined;
              const isFull = enrolledHere.length >= activity.requiredVolunteers;
              return (
                <Card key={activity.id} className={`border-l-4 ${activity.isCompleted ? 'border-l-slate-400 opacity-75' : 'border-l-blue-500'}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {activity.isCompleted && <CheckCircle2 className="h-5 w-5 text-slate-500" />}
                        <span className={activity.isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}>{activity.title}</span>
                      </CardTitle>
                      <Badge variant={isFull ? 'secondary' : 'default'} className={`whitespace-nowrap ${isFull ? 'bg-slate-100 text-slate-800' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}>
                        {enrolledHere.length} / {activity.requiredVolunteers}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    {activity.description && <p className="text-slate-600">{activity.description}</p>}
                    {enrolledHere.length > 0 && (
                      <div className="flex items-start gap-2 rounded-md border border-slate-100 bg-slate-50 p-3">
                        <Users className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <div className="font-medium text-slate-700">{enrolledHere.map(enrollment => enrollment.firstName).join(', ')}</div>
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
            })}

            <Card className="border-2 border-dashed bg-slate-50">
              <CardContent className="flex flex-col items-start gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="w-full">
                  <h4 className="font-semibold text-slate-700">Algemeen beschikbaar</h4>
                  <p className="text-xs text-slate-500">Deel mij in waar nodig op deze dag.</p>
                  {generalEnrollments.length > 0 && <p className="mt-1 text-xs text-slate-600"><strong>Ingeschreven:</strong> {generalEnrollments.map(enrollment => enrollment.firstName).join(', ')}</p>}
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
          </div>
        );
      })}
    </div>
  );
}
