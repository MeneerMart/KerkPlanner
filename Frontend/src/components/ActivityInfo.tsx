import { Clock, Hammer, ShieldAlert, Timer } from 'lucide-react';
import type { Activity } from '../store/types';
import { formatActivityTime, formatDuration } from '../lib/format';
import { parseToolRequirements } from '../lib/tools';

/** Omschrijving, tijdsduur, benodigd gereedschap en veiligheidsinstructies van een taak. */
export default function ActivityInfo({ activity, showTools = true }: { activity: Activity; showTools?: boolean }) {
  const duration = formatDuration(activity.estimatedDurationMinutes);
  const tools = showTools ? parseToolRequirements(activity.materialsNeeded) : [];

  return (
    <div className="space-y-2">
      {activity.description && <p className="whitespace-pre-line text-slate-600">{activity.description}</p>}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="flex items-center gap-1 font-medium text-slate-700"><Clock className="h-3.5 w-3.5" /> {formatActivityTime(activity)}</span>
        {duration && <span className="flex items-center gap-1"><Timer className="h-3.5 w-3.5" /> ca. {duration}</span>}
        {tools.length > 0 && <span className="flex items-center gap-1"><Hammer className="h-3.5 w-3.5" /> {tools.map(tool => `${tool.amount}× ${tool.name}`).join(', ')}</span>}
      </div>
      {activity.safetyInstructions && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div><strong className="font-semibold">Veiligheid:</strong> <span className="whitespace-pre-line">{activity.safetyInstructions}</span></div>
        </div>
      )}
    </div>
  );
}
