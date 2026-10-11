import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Truck,
  Wrench,
  Plus,
  LogOut,
  Users,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

interface Enrollment {
  id: number;
  userId: number;
  userFirstName: string;
  userLastName: string;
  activityId?: number | null;
  bringsVehicle: boolean;
  bringsTools: boolean;
  specificSkills?: string;
  remarks?: string;
}

interface Activity {
  id: number;
  workDayId: number;
  title: string;
  description: string;
  requiredVolunteers: number;
  materialsNeeded?: string;
  safetyInstructions?: string;
  isCompleted?: boolean;
  enrollments: Enrollment[];
}

interface WorkDay {
  id: number;
  date: string;
  coordinatorName?: string;
  openerName?: string;
  closerName?: string;
  activities: Activity[];
  generalEnrollments: Enrollment[];
}

export function AdminDashboard() {
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDayModal, setShowAddDayModal] = useState(false);
  const [showAddActivityModal, setShowAddActivityModal] = useState<number | null>(null);

  // New WorkDay form state
  const [newDayDate, setNewDayDate] = useState('');

  // New Activity form state
  const [actTitle, setActTitle] = useState('');
  const [actDesc, setActDesc] = useState('');
  const [actRequired, setActRequired] = useState(3);
  const [actMaterials, setActMaterials] = useState('');
  const [actSafety, setActSafety] = useState('');

  const logout = useAuthStore((state) => state.logout);

  const fetchWorkDays = async () => {
    try {
      setLoading(true);
      const res = await api.get('/workdays/admin');
      setWorkDays(res.data);
    } catch (err) {
      console.error('Fout bij ophalen van werkdagen', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkDays();
  }, []);

  const handleCreateWorkDay = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/workdays', { date: newDayDate });
      setShowAddDayModal(false);
      setNewDayDate('');
      fetchWorkDays();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateActivity = async (workDayId: number, e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/activities', {
        workDayId,
        title: actTitle,
        description: actDesc,
        requiredVolunteers: actRequired,
        materialsNeeded: actMaterials,
        safetyInstructions: actSafety,
      });
      setShowAddActivityModal(null);
      setActTitle('');
      setActDesc('');
      setActMaterials('');
      setActSafety('');
      fetchWorkDays();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActivityStatus = async (activityId: number, currentStatus: boolean) => {
    try {
      await api.patch(`/activities/${activityId}`, { isCompleted: !currentStatus });
      fetchWorkDays();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Beheerderspaneel</h1>
            <p className="text-xs text-slate-500">Overzicht sloop kerk (Weken 43-44)</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddDayModal(true)}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium py-2 px-3 rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" /> Dag toevoegen
            </button>
            <button
              onClick={logout}
              className="p-2 text-slate-600 hover:text-red-600 rounded-lg transition"
              title="Uitloggen"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : workDays.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-sm text-slate-500">Er zijn nog geen werkdagen aangemaakt.</p>
          </div>
        ) : (
          workDays.map((day) => (
            <div key={day.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              {/* Day Header */}
              <div className="bg-slate-100/60 p-4 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-slate-700" />
                  <span className="font-semibold text-slate-900 text-base">
                    {new Date(day.date).toLocaleDateString('nl-NL', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </span>
                </div>
                <button
                  onClick={() => setShowAddActivityModal(day.id)}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-2.5 py-1.5 rounded-md hover:bg-slate-50 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Taak toevoegen
                </button>
              </div>

              {/* Responsibilities */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
                <div>
                  <span className="font-medium text-slate-800">Coördinator: </span>
                  {day.coordinatorName || 'Niet toegewezen'}
                </div>
                <div>
                  <span className="font-medium text-slate-800">Opener: </span>
                  {day.openerName || 'Niet toegewezen'}
                </div>
                <div>
                  <span className="font-medium text-slate-800">Sluiter: </span>
                  {day.closerName || 'Niet toegewezen'}
                </div>
              </div>

              {/* General Availability Enrollments */}
              {day.generalEnrollments && day.generalEnrollments.length > 0 && (
                <div className="p-4 bg-amber-50/50 border-b border-amber-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Algemeen Beschikbaar ({day.generalEnrollments.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {day.generalEnrollments.map((gen) => (
                      <div key={gen.id} className="text-xs bg-white p-2.5 rounded border border-amber-200/60 shadow-xs">
                        <div className="font-medium text-slate-900">
                          {gen.userFirstName} {gen.userLastName}
                        </div>
                        <div className="flex gap-2 mt-1 text-slate-600">
                          {gen.bringsVehicle && (
                            <span className="flex items-center gap-1 text-emerald-700">
                              <Truck className="w-3 h-3" /> Aanhanger/Bus
                            </span>
                          )}
                          {gen.bringsTools && (
                            <span className="flex items-center gap-1 text-blue-700">
                              <Wrench className="w-3 h-3" /> Gereedschap
                            </span>
                          )}
                        </div>
                        {gen.remarks && <p className="italic text-slate-500 mt-1">"{gen.remarks}"</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activities */}
              <div className="p-4 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Taken & Activiteiten
                </h3>
                {day.activities.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Geen taken aangemaakt voor deze dag.</p>
                ) : (
                  day.activities.map((act) => {
                    const isFull = (act.enrollments?.length || 0) >= act.requiredVolunteers;
                    return (
                      <div
                        key={act.id}
                        className={`p-3.5 rounded-lg border transition ${
                          act.isCompleted ? 'bg-slate-50 border-slate-200 opacity-60' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-semibold ${
                                  act.isCompleted ? 'line-through text-slate-500' : 'text-slate-900'
                                }`}
                              >
                                {act.title}
                              </span>
                              <span
                                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                  isFull
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {act.enrollments?.length || 0}/{act.requiredVolunteers} vrijwilligers
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{act.description}</p>
                          </div>

                          <button
                            onClick={() => toggleActivityStatus(act.id, !!act.isCompleted)}
                            className="text-xs flex items-center gap-1 px-2.5 py-1 border rounded bg-white hover:bg-slate-50 transition"
                          >
                            {act.isCompleted ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Afgerond
                              </>
                            ) : (
                              <>
                                <Clock className="w-3.5 h-3.5 text-slate-400" /> Afronden
                              </>
                            )}
                          </button>
                        </div>

                        {/* Safety & Materials */}
                        {(act.materialsNeeded || act.safetyInstructions) && (
                          <div className="mt-2.5 flex flex-wrap gap-3 text-xs bg-slate-50 p-2 rounded">
                            {act.materialsNeeded && (
                              <div>
                                <span className="font-semibold text-slate-700">Materiaal: </span>
                                <span className="text-slate-600">{act.materialsNeeded}</span>
                              </div>
                            )}
                            {act.safetyInstructions && (
                              <div className="flex items-center gap-1 text-amber-800">
                                <ShieldAlert className="w-3 h-3 text-amber-600" />
                                <span>{act.safetyInstructions}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Enrolled Volunteers with Admin-only details */}
                        <div className="mt-3 border-t border-slate-100 pt-2">
                          <p className="text-xs font-semibold text-slate-700 mb-1.5">Aanmeldingen:</p>
                          {act.enrollments.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">Nog geen aanmeldingen.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {act.enrollments.map((enr) => (
                                <div
                                  key={enr.id}
                                  className="text-xs flex flex-wrap items-center justify-between bg-slate-50 p-2 rounded border border-slate-100"
                                >
                                  <div>
                                    <span className="font-medium text-slate-900">
                                      {enr.userFirstName} {enr.userLastName}
                                    </span>
                                    {enr.remarks && (
                                      <span className="text-slate-500 italic ml-2">"{enr.remarks}"</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {enr.bringsVehicle && (
                                      <span className="flex items-center gap-1 text-emerald-700">
                                        <Truck className="w-3 h-3" /> Aanhanger/bus
                                      </span>
                                    )}
                                    {enr.bringsTools && (
                                      <span className="flex items-center gap-1 text-blue-700">
                                        <Wrench className="w-3 h-3" /> Gereedschap
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))
        )}
      </main>

      {/* Modal: Create WorkDay */}
      {showAddDayModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 shadow-lg">
            <h2 className="text-base font-bold text-slate-900">Nieuwe Werkdag Toevoegen</h2>
            <form onSubmit={handleCreateWorkDay} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Datum</label>
                <input
                  type="date"
                  required
                  value={newDayDate}
                  onChange={(e) => setNewDayDate(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDayModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition"
                >
                  Opslaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Activity */}
      {showAddActivityModal !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-lg">
            <h2 className="text-base font-bold text-slate-900">Nieuwe Activiteit Toevoegen</h2>
            <form onSubmit={(e) => handleCreateActivity(showAddActivityModal, e)} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Titel</label>
                <input
                  type="text"
                  required
                  value={actTitle}
                  onChange={(e) => setActTitle(e.target.value)}
                  placeholder="bijv. Banken demonteren"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Beschrijving</label>
                <textarea
                  value={actDesc}
                  onChange={(e) => setActDesc(e.target.value)}
                  placeholder="Omschrijf wat er moet gebeuren..."
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-slate-900 outline-none"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Aantal personen nodig</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={actRequired}
                  onChange={(e) => setActRequired(Number(e.target.value))}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Benodigdheden / Materiaal</label>
                <input
                  type="text"
                  value={actMaterials}
                  onChange={(e) => setActMaterials(e.target.value)}
                  placeholder="bijv. Accuboormachines, steekwagens"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Veiligheidsinstructies</label>
                <input
                  type="text"
                  value={actSafety}
                  onChange={(e) => setActSafety(e.target.value)}
                  placeholder="bijv. Veiligheidsschoenen en werkhandschoenen verplicht"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddActivityModal(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition"
                >
                  Toevoegen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}