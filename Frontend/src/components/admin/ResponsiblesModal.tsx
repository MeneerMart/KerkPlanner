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

const FIELDS: { key: keyof ResponsiblesPayload; label: string }[] = [
  { key: 'coordinatorName', label: 'Dagcoördinator' },
  { key: 'openerName', label: 'Opent de kerk' },
  { key: 'closerName', label: 'Sluit de kerk af' },
];

/** Dagcoördinator en opener/afsluiter instellen. Vrije tekst met suggesties uit de geregistreerde gebruikers. */
export default function ResponsiblesModal({ day, userNames }: { day: WorkDay; userNames: string[] }) {
  const updateResponsibles = useAppStore(state => state.updateResponsibles);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<ResponsiblesPayload>({ coordinatorName: '', openerName: '', closerName: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const listId = `responsible-names-${day.id}`;

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setValues({ coordinatorName: day.coordinatorName, openerName: day.openerName, closerName: day.closerName });
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
        closerName: values.closerName.trim(),
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
          <DialogDescription>Voor {formatDay(day.date, 'EEEE d MMMM')}. Kies een naam uit de lijst of typ zelf een naam.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup className="space-y-4 py-4">
            {FIELDS.map(({ key, label }) => (
              <Field key={key}>
                <Label htmlFor={`${listId}-${key}`}>{label}</Label>
                <Input id={`${listId}-${key}`} list={listId} maxLength={100} placeholder="Naam" value={values[key]} onChange={event => setValues(current => ({ ...current, [key]: event.target.value }))} />
              </Field>
            ))}
            <datalist id={listId}>
              {userNames.map(name => <option key={name} value={name} />)}
            </datalist>
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
