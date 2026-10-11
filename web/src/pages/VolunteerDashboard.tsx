import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export function VolunteerDashboard() {
  const [workDays, setWorkDays] = useState<any[]>([]);

  useEffect(() => {
    api.get('/workdays').then(res => setWorkDays(res.data));
  }, []);

  const getOccupancyColor = (enrolled: number, required: number) => {
    if (enrolled >= required) return 'bg-red-100 text-red-800 border-red-300';
    if (enrolled >= required * 0.7) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-green-100 text-green-800 border-green-300';
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold mb-4">Planning Overzicht</h1>
      {workDays.map(day => (
        <div key={day.id} className="border rounded-lg p-4 shadow-sm bg-white">
          <h2 className="font-semibold text-lg">{new Date(day.date).toLocaleDateString('nl-NL')}</h2>
          <div className="mt-3 space-y-3">
            {day.activities.map((act: any) => (
              <div key={act.id} className={`p-3 border rounded-md ${getOccupancyColor(act.enrolledCount, act.requiredVolunteers)}`}>
                <h3 className="font-medium">{act.title}</h3>
                <p className="text-sm mt-1">Bezetting: {act.enrolledCount} / {act.requiredVolunteers}</p>
                {/* DTO ensures only first names are returned for volunteers */}
                <p className="text-xs mt-1 text-gray-600">
                  Aangemeld: {act.enrollments.map((e: any) => e.userFirstName).join(', ') || 'Nog niemand'}
                </p>
                <button className="mt-2 w-full bg-white text-black py-2 rounded-md shadow-sm border border-gray-200 font-medium">
                  Inschrijven
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}