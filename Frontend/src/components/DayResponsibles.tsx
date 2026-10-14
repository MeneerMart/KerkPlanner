import { DoorClosed, DoorOpen, UserCog } from 'lucide-react';
import type { WorkDay } from '../store/types';

/** Toont dagcoördinator en wie de kerk opent en afsluit; niets als er nog niemand is ingevuld. */
export default function DayResponsibles({ day }: { day: WorkDay }) {
  const items = [
    { icon: UserCog, label: 'Dagcoördinator', name: day.coordinatorName, time: '' },
    { icon: DoorOpen, label: 'Opent de kerk', name: day.openerName, time: day.openTime },
    { icon: DoorClosed, label: 'Sluit de kerk af', name: day.closerName, time: day.closeTime },
  ].filter(item => item.name || item.time);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
      {items.map(({ icon: Icon, label, name, time }) => (
        <span key={label} className="flex items-center gap-1.5">
          <Icon className="h-4 w-4 text-slate-400" /> {label}
          {time && <> om <strong className="font-medium text-slate-800">{time}</strong></>}
          {name && <>: <strong className="font-medium text-slate-800">{name}</strong></>}
        </span>
      ))}
    </div>
  );
}
