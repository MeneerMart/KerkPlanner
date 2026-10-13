import { useEffect, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import NewWorkDayForm from '../components/admin/NewWorkDayForm';
import AdminWorkDaySection from '../components/admin/AdminWorkDaySection';

export default function AdminPaneel() {
  const { workDays, users, fetchPlanning, fetchUsers } = useAppStore();

  useEffect(() => {
    void fetchPlanning();
    // De gebruikerslijst is alleen voor naamsuggesties; zonder lijst werkt het formulier gewoon.
    fetchUsers().catch(() => undefined);
  }, [fetchPlanning, fetchUsers]);

  const userNames = useMemo(() => users.map(user => `${user.firstName} ${user.lastName}`.trim()), [users]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-slate-800 p-4 text-white">
        <h2 className="text-lg font-semibold">Beheerderspaneel</h2>
        <p className="text-sm opacity-90">Maak werkdagen en taken aan, wijs verantwoordelijken toe, beheer vrijwilligers en houd bij welk gereedschap nog nodig is.</p>
      </div>

      <NewWorkDayForm />

      {workDays.length === 0 && <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">Er zijn geen toekomstige werkdagen ingepland.</p>}
      <div className="space-y-8">
        {workDays.map(day => <AdminWorkDaySection key={day.id} day={day} userNames={userNames} />)}
      </div>
    </div>
  );
}
