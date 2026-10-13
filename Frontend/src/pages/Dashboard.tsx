import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { formatDay } from '../lib/format';
import ActivityCard from '../components/planning/ActivityCard';
import GeneralAvailabilityCard from '../components/planning/GeneralAvailabilityCard';
import DayResponsibles from '../components/DayResponsibles';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

export default function Dashboard() {
  const navigate = useNavigate();
  const { workDays, fetchPlanning, isLoading, firstName, token, userId } = useAppStore();
  const currentUserId = token ? userId : null;

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

      {workDays.map(day => (
        <div key={day.id} className="space-y-4">
          <div className="mt-8 space-y-2 border-b pb-2">
            <h3 className="text-xl font-bold text-slate-800">{formatDay(day.date)}</h3>
            <DayResponsibles day={day} />
          </div>
          {day.activities.map(activity => (
            <ActivityCard key={activity.id} day={day} activity={activity} userId={currentUserId} />
          ))}
          <GeneralAvailabilityCard day={day} userId={currentUserId} />
        </div>
      ))}
    </div>
  );
}
