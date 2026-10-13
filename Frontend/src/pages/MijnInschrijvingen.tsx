import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ClipboardList } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatToolQuantities } from '../lib/tools';
import { formatDay, timeSlotLabel } from '../lib/format';
import { EnrollmentModal } from '../components/EnrollmentModal';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

export default function MijnInschrijvingen() {
  const navigate = useNavigate();
  const { workDays, fetchPlanning, isLoading, token, userId, firstName } = useAppStore();

  useEffect(() => { void fetchPlanning(); }, [fetchPlanning]);

  const ownEnrollments = useMemo(() => workDays.flatMap(day => day.enrollments
    .filter(enrollment => token && userId && enrollment.userId === userId)
    .map(enrollment => ({
      day,
      enrollment,
      activity: day.activities.find(activity => activity.id === enrollment.activityId) ?? null,
    }))), [workDays, token, userId]);

  if (isLoading) return <div className="mt-10 text-center text-slate-500">Inschrijvingen ophalen...</div>;

  if (!token) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-blue-600" /> Mijn inschrijvingen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">Log in om je eigen inschrijvingen te bekijken, te wijzigen of te annuleren.</p>
          <Button onClick={() => navigate('/login')} className="bg-blue-600 hover:bg-blue-700">Inloggen of registreren</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Mijn inschrijvingen</h2>
        <p className="mt-1 text-sm text-slate-500">{firstName ? `Hoi ${firstName}, hier vind je je aanmeldingen.` : 'Hier vind je je aanmeldingen.'} Je kunt ze ook wijzigen of annuleren.</p>
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-600"><Badge variant="secondary">{ownEnrollments.length}</Badge> {ownEnrollments.length === 1 ? 'inschrijving' : 'inschrijvingen'}</div>

      {ownEnrollments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <CalendarDays className="h-9 w-9 text-slate-400" />
            <h3 className="font-semibold text-slate-800">Je hebt nog geen inschrijvingen</h3>
            <p className="max-w-sm text-sm text-slate-500">Bekijk de geplande werkdagen en meld je aan voor een activiteit waarbij je wilt helpen.</p>
            <Button variant="outline" onClick={() => navigate('/')}>Bekijk de planning</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {ownEnrollments.map(({ day, enrollment, activity }) => (
            <Card key={enrollment.id} className="border-l-4 border-l-blue-500">
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <h3 className="font-semibold text-slate-800">{activity?.title ?? 'Algemeen beschikbaar'}</h3>
                  <p className="text-sm text-slate-500">{formatDay(day.date)} · {timeSlotLabel(enrollment.timeSlot).toLowerCase()}</p>
                  {enrollment.selectedTools && <p className="text-sm text-slate-600">Gereedschap: {formatToolQuantities(enrollment.selectedTools) || 'geen'}</p>}
                  {enrollment.specificSkills && <p className="text-sm text-slate-600">Vaardigheden: {enrollment.specificSkills}</p>}
                  {enrollment.remarks && <p className="text-sm text-slate-600">Opmerking: {enrollment.remarks}</p>}
                  {enrollment.bringsVehicle && <p className="text-xs text-slate-500">Neemt busje/aanhanger mee</p>}
                </div>
                <div className="w-full sm:w-56">
                  <EnrollmentModal
                    day={day}
                    activity={activity}
                    existingEnrollment={enrollment}
                    enrollmentsForTask={day.enrollments.filter(item => item.activityId === enrollment.activityId)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
