import { Hammer } from 'lucide-react';
import type { Activity } from '../../store/types';
import { parseToolQuantities, parseToolRequirements } from '../../lib/tools';

/** Per gereedschap: hoeveel er nodig is en hoeveel vrijwilligers al meenemen. */
export default function ToolStatus({ activity }: { activity: Activity }) {
  const tools = parseToolRequirements(activity.materialsNeeded);
  if (tools.length === 0) return null;
  const quantities = parseToolQuantities(activity.toolsProvided);

  return (
    <div className="mt-3 space-y-1 rounded-md border border-amber-100 bg-amber-50 p-3">
      <div className="mb-1 flex items-center gap-2 font-semibold text-slate-700"><Hammer className="h-4 w-4" /> Gereedschap</div>
      {tools.map(tool => {
        const have = quantities[tool.name] ?? 0;
        const remaining = Math.max(0, tool.amount - have);
        return (
          <div key={tool.name} className="flex justify-between gap-2 text-xs">
            <span className="text-slate-700">{tool.name}</span>
            <span className={remaining === 0 ? 'font-medium text-emerald-700' : 'font-medium text-amber-800'}>
              {remaining === 0 ? `Geregeld (${Math.min(have, tool.amount)}/${tool.amount})` : `Nog ${remaining} nodig (${Math.min(have, tool.amount)}/${tool.amount})`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
