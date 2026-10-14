import { useState } from 'react';
import { UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../../store/useAppStore';
import type { ResponsiblesPayload, WorkDay } from '../../store/types';
import { errorMessage } from '../../lib/errors';
import { formatDay } from '../../lib/format';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Field, FieldGroup } from '../ui/field';

type NameKey = 'coordinatorName' | 'openerName' | 'closerName';
type TimeKey = 'openTime' | 'closeTime';

const FIELDS: { key: NameKey; label: string; timeKey?: TimeKey; timeLabel?: string }[] = [
  { key: 'coordinatorName', label: 'Dagcoördinator' },
  { key: 'openerName', label: 'Opent de kerk', timeKey: 'openTime', timeLabel: 'Hoe laat open?' },
  { key: 'closerName', label: 'Sluit de kerk af', timeKey: 'closeTime', timeLabel: 'Hoe laat dicht?' },
];

const EMPTY: ResponsiblesPayload = { coordinatorName: '', openerName: '', openTime: '', closerName: '', closeTime: '' };

/** Dagcoördinator en opener/afsluiter (met tijden) instellen. Namen zijn vrije tekst. */
export default function ResponsiblesModal({ day }: { day: WorkDay }) {
  const updateResponsibles = useAppStore(state => state.updateResponsibles);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<ResponsiblesPayload>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const idPrefix = `responsibles-${day.id}`;

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setValues({ coordinatorName: day.coordinatorName, openerName: day.openerName, openTime: day.openTime, closerName: day.closerName, closeTime: day.closeTime });
      setError('');
    }
    setOpen(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateResponsibles(day.id, {
        coordinatorName: values.coordinatorName.trim(),
        openerName: values.openerName.trim(),
        openTime: values.openTime,
        closerName: values.closerName.trim(),
        closeTime: values.closeTime,
      });
      toast.success('Verantwoordelijken opgeslagen.');
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
      <DialogTrigger render={
        <Button size="sm" variant="outline"><UserCog className="mr-1 h-4 w-4" /> Verantwoordelijken</Button>
      } />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verantwoordelijken</DialogTitle>
          <DialogDescription>Voor {formatDay(day.date, 'EEEE d MMMM')}. Vul de namen en tijden in die bekend zijn.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup className="space-y-4 py-4">
            {FIELDS.map(({ key, label, timeKey, timeLabel }) => (
              <div key={key} className={timeKey ? 'grid grid-cols-[minmax(0,1fr)_7.5rem] gap-3' : undefined}>
                <Field>
                  <Label htmlFor={`${idPrefix}-${key}`}>{label}</Label>
                  <Input id={`${idPrefix}-${key}`} maxLength={100} placeholder="Naam" value={values[key]} onChange={event => setValues(current => ({ ...current, [key]: event.target.value }))} />
                </Field>
                {timeKey && (
                  <Field>
                    <Label htmlFor={`${idPrefix}-${timeKey}`}>{timeLabel}</Label>
                    <Input id={`${idPrefix}-${timeKey}`} type="time" value={values[timeKey]} onChange={event => setValues(current => ({ ...current, [timeKey]: event.target.value }))} />
                  </Field>
                )}
              </div>
            ))}
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline">Annuleren</Button>} />
            <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">{saving ? 'Bezig...' : 'Opslaan'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
