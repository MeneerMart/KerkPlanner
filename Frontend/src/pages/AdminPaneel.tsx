import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import NewWorkDayForm from '../components/admin/NewWorkDayForm';
import AnnouncementEditor from '../components/admin/AnnouncementEditor';
import AdminWorkDaySection from '../components/admin/AdminWorkDaySection';

export default function AdminPaneel() {
  const { workDays, fetchPlanning } = useAppStore();

  useEffect(() => {
    void fetchPlanning();
  }, [fetchPlanning]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-slate-800 p-4 text-white">
        <h2 className="text-lg font-semibold">Beheerderspaneel</h2>
        <p className="text-sm opacity-90">Maak werkdagen en taken aan, wijs verantwoordelijken toe, beheer vrijwilligers en houd bij welk gereedschap nog nodig is.</p>
      </div>

      <AnnouncementEditor />
      <NewWorkDayForm />

      {workDays.length === 0 && <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">Er zijn geen toekomstige werkdagen ingepland.</p>}
      <div className="space-y-8">
        {workDays.map(day => <AdminWorkDaySection key={day.id} day={day} />)}
      </div>
    </div>
  );
}
