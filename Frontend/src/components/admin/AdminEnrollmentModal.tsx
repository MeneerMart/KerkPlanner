import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../../store/useAppStore';
import type { Activity, Enrollment, WorkDay } from '../../store/types';
import { capToolQuantities } from '../../lib/tools';
import { errorMessage } from '../../lib/errors';
import { formatDay } from '../../lib/format';
import ToolsPicker from '../ToolsPicker';
import EnrollmentDetailsFields from '../EnrollmentDetailsFields';
import { emptyEnrollmentDetails, type EnrollmentDetails } from '../../lib/enrollmentDetails';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Field, FieldGroup } from '../ui/field';

/** Laat een beheerder iemand zonder account inschrijven. */
export default function AdminEnrollmentModal({
  day,
  activity,
  existingEnrollments,
}: {
  day: WorkDay;
  activity: Activity | null;
  existingEnrollments: Enrollment[];
}) {
  const { adminEnrollGuest } = useAppStore();
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [details, setDetails] = useState<EnrollmentDetails>(emptyEnrollmentDetails);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const idPrefix = `guest-${day.id}-${activity?.id ?? 'general'}`;

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
      setQuantities({});
      setDetails(emptyEnrollmentDetails);
      setError('');
    }
    setOpen(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim()) {
      setError('Vul de voor- en achternaam in.');
      return;
    }

    setSaving(true);
    try {
      await adminEnrollGuest({
        workDayId: day.id,
        activityId: activity?.id ?? null,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        ...details,
        selectedTools: JSON.stringify(capToolQuantities(activity?.materialsNeeded, quantities, activity?.toolsProvided)),
      });
      toast.success(`${firstName.trim()} ${lastName.trim()} is ingeschreven.`);
      setOpen(false);
    } catch (requestError) {
      const message = errorMessage(requestError, 'Inschrijven is niet gelukt.');
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={
        <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50">
          <UserPlus className="mr-1 h-4 w-4" /> Inschrijven
        </Button>
      } />
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Vrijwilliger inschrijven</DialogTitle>
          <DialogDescription>
            Voor {activity?.title ?? 'algemene beschikbaarheid'} op {formatDay(day.date, 'd MMMM yyyy')}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup className="space-y-4 py-4">
            <Field>
              <Label htmlFor={`${idPrefix}-first`}>Voornaam</Label>
              <Input id={`${idPrefix}-first`} autoComplete="given-name" maxLength={50} required value={firstName} onChange={event => setFirstName(event.target.value)} placeholder="Voornaam" />
            </Field>
            <Field>
              <Label htmlFor={`${idPrefix}-last`}>Achternaam</Label>
              <Input id={`${idPrefix}-last`} autoComplete="family-name" maxLength={50} required value={lastName} onChange={event => setLastName(event.target.value)} placeholder="Achternaam" />
            </Field>
            <Field>
              <Label htmlFor={`${idPrefix}-phone`}>Telefoonnummer (optioneel)</Label>
              <Input id={`${idPrefix}-phone`} type="tel" autoComplete="tel" maxLength={20} value={phoneNumber} onChange={event => setPhoneNumber(event.target.value)} placeholder="06..." />
            </Field>
            <ToolsPicker
              materialsNeeded={activity?.materialsNeeded}
              toolsProvided={activity?.toolsProvided}
              enrollments={existingEnrollments}
              quantities={quantities}
              onChange={setQuantities}
            />
            <EnrollmentDetailsFields idPrefix={idPrefix} value={details} onChange={setDetails} />
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline">Annuleren</Button>} />
            <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">{saving ? 'Bezig...' : 'Inschrijving opslaan'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
