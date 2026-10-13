import { Hammer } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import type { Enrollment } from '../store/useAppStore';
import { parseToolQuantities, parseToolRequirements, toolCountForEnrollments, type ToolQuantities } from '../lib/tools';

interface ToolsPickerProps {
  materialsNeeded?: string | null;
  toolsProvided?: string | null;
  enrollments: Enrollment[];
  quantities: ToolQuantities;
  onChange: (next: ToolQuantities) => void;
  excludeEnrollmentId?: string;
}

export default function ToolsPicker({ materialsNeeded, toolsProvided, enrollments, quantities, onChange, excludeEnrollmentId }: ToolsPickerProps) {
  const tools = parseToolRequirements(materialsNeeded);
  if (tools.length === 0) return null;

  return (
    <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4">
      <Label className="flex items-center gap-2 font-semibold text-slate-800">
        <Hammer className="h-4 w-4 text-slate-500" /> Gereedschap meenemen
      </Label>
      <p className="text-xs text-slate-500">Vul per soort in hoeveel stuks je kunt meenemen.</p>
      {tools.map(tool => {
        const aggregateCount = parseToolQuantities(toolsProvided)[tool.name] ?? 0;
        const excludedCount = excludeEnrollmentId
          ? (parseToolQuantities(enrollments.find(enrollment => enrollment.id === excludeEnrollmentId)?.selectedTools)[tool.name] ?? 0)
          : 0;
        const alreadyProvided = toolsProvided != null
          ? Math.max(0, aggregateCount - excludedCount)
          : toolCountForEnrollments(enrollments, tool.name, excludeEnrollmentId);
        const remaining = Math.max(0, tool.amount - alreadyProvided);
        const quantity = quantities[tool.name] ?? 0;
        return (
          <div key={tool.name} className="grid grid-cols-[minmax(0,1fr)_92px] items-center gap-3">
            <div>
              <p className="font-medium text-slate-700">{tool.name}</p>
              <p className={`text-xs ${remaining === 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                {remaining === 0 ? 'Genoeg geregeld' : `Nog ${remaining} nodig`} · {alreadyProvided}/{tool.amount} geregeld
              </p>
            </div>
            <Input
              type="number"
              min={0}
              max={remaining}
              step={1}
              aria-label={`Aantal ${tool.name}`}
              value={quantity > 0 ? quantity : ''}
              disabled={remaining === 0 && quantity === 0}
              onChange={(event) => {
                const rawValue = event.target.value;
                if (rawValue === '') {
                  onChange({
                    ...quantities,
                    [tool.name]: 0,
                  });
                  return;
                }

                const value = Math.max(
                  0,
                  Math.min(
                    remaining,
                    Math.floor(Number(rawValue) || 0)
                  )
                );

                onChange({
                  ...quantities,
                  [tool.name]: value,
                });
              }}
              className="bg-white"
            />
          </div>
        );
      })}
    </div>
  );
}
