import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export interface ToolRequirementDraft {
  name: string;
  amount: string;
}

/** Lijst met benodigd gereedschap en aantallen in het taakformulier. */
export default function ToolRequirementsEditor({
  value,
  onChange,
}: {
  value: ToolRequirementDraft[];
  onChange: (next: ToolRequirementDraft[]) => void;
}) {
  const update = (index: number, field: keyof ToolRequirementDraft, fieldValue: string) =>
    onChange(value.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: fieldValue } : item)));

  return (
    <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <Label className="font-bold text-slate-800">Benodigd gereedschap</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, { name: '', amount: '1' }])}><Plus className="mr-1 h-4 w-4" /> Toevoegen</Button>
      </div>
      {value.length === 0 && <p className="text-xs text-slate-500">Nog geen gereedschap toegevoegd.</p>}
      {value.map((material, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input aria-label="Naam gereedschap" placeholder="Naam (bijv. Hamer)" value={material.name} onChange={event => update(index, 'name', event.target.value)} className="bg-white" />
          <Input aria-label="Benodigd aantal" type="number" min="1" step="1" required className="w-24 bg-white" value={material.amount} onChange={event => update(index, 'amount', event.target.value)} />
          <Button type="button" variant="ghost" size="icon" title="Gereedschap verwijderen" onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4 text-red-500" /></Button>
        </div>
      ))}
    </div>
  );
}
