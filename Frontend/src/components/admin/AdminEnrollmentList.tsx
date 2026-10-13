import type { Enrollment } from '../../store/types';
import { useAppStore } from '../../store/useAppStore';
import { formatToolQuantities } from '../../lib/tools';
import { timeSlotLabel } from '../../lib/format';
import ConfirmDeleteButton from './ConfirmDeleteButton';

export default function AdminEnrollmentList({ enrollments }: { enrollments: Enrollment[] }) {
  const deleteEnrollment = useAppStore(state => state.deleteEnrollment);
  if (enrollments.length === 0) return <p className="text-xs text-slate-500">Nog geen inschrijvingen.</p>;

  return (
    <ul className="space-y-2">
      {enrollments.map(enrollment => {
        const tools = formatToolQuantities(enrollment.selectedTools);
        return (
          <li key={enrollment.id} className="flex items-start justify-between gap-2 rounded border border-slate-200 bg-slate-50 p-2">
            <div className="min-w-0">
              <strong className="text-slate-800">{enrollment.firstName} {enrollment.lastName}</strong>
              {enrollment.timeSlot !== 'FullDay' && <span className="ml-2 text-xs text-slate-500">{timeSlotLabel(enrollment.timeSlot)}</span>}
              <div className="mt-1 space-y-0.5 text-xs text-slate-500">
                {enrollment.phoneNumber && <div>☎ {enrollment.phoneNumber}</div>}
                {tools && <div>🔨 Neemt mee: {tools}</div>}
                {enrollment.bringsVehicle && <div>🚚 Busje/aanhanger</div>}
                {enrollment.specificSkills && <div>🛠 {enrollment.specificSkills}</div>}
                {enrollment.remarks && <div className="font-medium text-orange-600">💬 {enrollment.remarks}</div>}
                {!enrollment.userId && <div className="text-slate-400">Ingeschreven door beheerder (geen account)</div>}
              </div>
            </div>
            <ConfirmDeleteButton
              buttonTitle="Inschrijving verwijderen"
              title="Inschrijving verwijderen?"
              description={`De inschrijving van ${enrollment.firstName} wordt verwijderd. Het opgegeven gereedschap telt daarna niet meer mee.`}
              confirmLabel="Inschrijving verwijderen"
              successMessage="Inschrijving verwijderd."
              onConfirm={() => deleteEnrollment(enrollment.id)}
            />
          </li>
        );
      })}
    </ul>
  );
}
