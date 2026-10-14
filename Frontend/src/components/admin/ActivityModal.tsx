import { useState } from 'react';
import { Edit, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../../store/useAppStore';
import type { Activity, ActivityPayload } from '../../store/types';
import { parseToolRequirements } from '../../lib/tools';
import { errorMessage } from '../../lib/errors';
import ToolRequirementsEditor, { type ToolRequirementDraft } from './ToolRequirementsEditor';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Field, FieldGroup } from '../ui/field';

/** "1,5" of "1.5" uur → 90 minuten; leeg of ongeldig → null. */
function hoursToMinutes(hours: string): number | null {
  const value = Number.parseFloat(hours.replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? Math.round(value * 60) : null;
}

function CheckboxLabel({ id, checked, onChange, children }: { id: string; checked: boolean; onChange: (checked: boolean) => void; children: React.ReactNode }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
      <input id={id} type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="h-4 w-4 accent-blue-600" />
      {children}
    </label>
  );
}

function minutesToHours(minutes: number | null): string {
  return minutes ? String(Math.round((minutes / 60) * 100) / 100) : '';
}

export default function ActivityModal({ dayId, activity }: { dayId: string; activity?: Activity }) {
  const { createActivity, updateActivity } = useAppStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [volunteers, setVolunteers] = useState('1');
  const [unlimited, setUnlimited] = useState(false);
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [safetyInstructions, setSafetyInstructions] = useState('');
  const [materials, setMaterials] = useState<ToolRequirementDraft[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const idPrefix = `activity-${dayId}-${activity?.id ?? 'new'}`;

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setTitle(activity?.title ?? '');
      setDescription(activity?.description ?? '');
      const requiredVolunteers = activity?.requiredVolunteers ?? 1;
      setUnlimited(requiredVolunteers <= 0);
      setVolunteers(String(requiredVolunteers > 0 ? requiredVolunteers : 1));
      setAllDay(!activity?.startTime);
      setStartTime(activity?.startTime ?? '');
      setEndTime(activity?.endTime ?? '');
      setDurationHours(minutesToHours(activity?.estimatedDurationMinutes ?? null));
      setSafetyInstructions(activity?.safetyInstructions ?? '');
      setMaterials(parseToolRequirements(activity?.materialsNeeded).map(material => ({ name: material.name, amount: String(material.amount) })));
      setError('');
    }
    setOpen(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!allDay && (!startTime || !endTime || startTime >= endTime)) {
      setError('Vul een begin- en eindtijd in, waarbij de eindtijd na de begintijd ligt.');
      return;
    }
    setSaving(true);

    const payload: ActivityPayload = {
      workDayId: dayId,
      title: title.trim(),
      description,
      requiredVolunteers: unlimited ? 0 : Math.max(1, Number.parseInt(volunteers, 10) || 1),
      startTime: allDay ? null : startTime,
      endTime: allDay ? null : endTime,
      materialsNeeded: JSON.stringify(
        materials
          .filter(material => material.name.trim())
          .map(material => ({ name: material.name.trim(), amount: Math.max(1, Number.parseInt(material.amount, 10) || 1) }))
      ),
      safetyInstructions: safetyInstructions.trim(),
      estimatedDurationMinutes: hoursToMinutes(durationHours),
    };

    try {
      if (activity) {
        await updateActivity(activity.id, payload);
        toast.success('Taak bijgewerkt.');
      } else {
        await createActivity(payload);
        toast.success('Taak aangemaakt.');
      }
      setOpen(false);
    } catch (requestError) {
      const message = errorMessage(requestError, 'Opslaan is niet gelukt.');
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={activity
        ? <Button variant="ghost" size="icon" title="Taak bewerken"><Edit className="h-4 w-4 text-slate-600" /></Button>
        : <Button size="sm" variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50"><Plus className="mr-1 h-4 w-4" /> Taak toevoegen</Button>
      } />
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>{activity ? 'Taak bewerken' : 'Nieuwe taak aanmaken'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup className="space-y-4 py-4">
            <Field>
              <Label htmlFor={`${idPrefix}-title`}>Titel</Label>
              <Input id={`${idPrefix}-title`} required maxLength={100} value={title} onChange={event => setTitle(event.target.value)} placeholder="Bijv. Vloer slopen" />
            </Field>
            <Field>
              <Label htmlFor={`${idPrefix}-description`}>Omschrijving</Label>
              <Textarea id={`${idPrefix}-description`} maxLength={500} rows={3} value={description} onChange={event => setDescription(event.target.value)} />
            </Field>
            <div className="space-y-2 rounded-md border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-3">
                <Label>Tijdstip</Label>
                <CheckboxLabel id={`${idPrefix}-allday`} checked={allDay} onChange={setAllDay}>Hele dag</CheckboxLabel>
              </div>
              {!allDay && (
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <Label htmlFor={`${idPrefix}-start`} className="text-xs text-slate-500">Van</Label>
                    <Input id={`${idPrefix}-start`} type="time" required value={startTime} onChange={event => setStartTime(event.target.value)} />
                  </Field>
                  <Field>
                    <Label htmlFor={`${idPrefix}-end`} className="text-xs text-slate-500">Tot</Label>
                    <Input id={`${idPrefix}-end`} type="time" required value={endTime} onChange={event => setEndTime(event.target.value)} />
                  </Field>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <Label htmlFor={`${idPrefix}-volunteers`}>Vrijwilligers nodig</Label>
                <Input id={`${idPrefix}-volunteers`} type="number" min="1" step="1" required={!unlimited} disabled={unlimited} value={unlimited ? '' : volunteers} placeholder={unlimited ? 'Geen limiet' : undefined} onChange={event => setVolunteers(event.target.value)} />
                <CheckboxLabel id={`${idPrefix}-unlimited`} checked={unlimited} onChange={setUnlimited}>Geen limiet</CheckboxLabel>
              </Field>
              <Field>
                <Label htmlFor={`${idPrefix}-duration`}>Geschatte duur (uren)</Label>
                <Input id={`${idPrefix}-duration`} type="number" min="0.25" max="24" step="0.25" inputMode="decimal" placeholder="Bijv. 1,5" value={durationHours} onChange={event => setDurationHours(event.target.value)} />
              </Field>
            </div>
            <Field>
              <Label htmlFor={`${idPrefix}-safety`}>Veiligheidsinstructies (optioneel)</Label>
              <Textarea id={`${idPrefix}-safety`} maxLength={500} rows={2} placeholder="Bijv. werkhandschoenen en veiligheidsschoenen verplicht" value={safetyInstructions} onChange={event => setSafetyInstructions(event.target.value)} />
            </Field>
            <ToolRequirementsEditor value={materials} onChange={setMaterials} />
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button">Annuleren</Button>} />
            <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">{saving ? 'Bezig...' : 'Opslaan'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
