import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { MessageCircle, Pencil } from 'lucide-react';
import { useAppStore, type Activity, type Enrollment, type WorkDay } from '../store/useAppStore';
import { capToolQuantities, parseToolQuantities, type ToolQuantities } from '../lib/tools';
import ToolsPicker from './ToolsPicker';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Field, FieldGroup } from './ui/field';
import { ConfirmDialog } from './ui/confirm-dialog';
import { toast } from 'sonner';

function getWhatsAppUrl(day: WorkDay, title: string): string {
  // Dit is het afgesproken WhatsApp-nummer van Henk.
  const configuredPhone = '0634239485';
  let phone = configuredPhone.replace(/\D/g, '');
  if (phone.startsWith('00')) phone = phone.slice(2);
  if (phone.startsWith('0')) phone = `31${phone.slice(1)}`;
  const date = format(new Date(day.date), 'EEEE d MMMM', { locale: nl });
  const message = `Hoi Henk, ik wil graag meer informatie of me laten inschrijven voor "${title}" op ${date}.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function EnrollmentModal({
  day,
  activity,
  enrollmentsForTask,
  existingEnrollment,
  isFull,
}: {
  day: WorkDay;
  activity: Activity | null;
  enrollmentsForTask: Enrollment[];
  existingEnrollment?: Enrollment;
  isFull?: boolean;
}) {
  const { enroll, updateEnrollment, deleteEnrollment, token } = useAppStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [selectedTools, setSelectedTools] = useState<ToolQuantities>({});
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<'delete' | null>(null);
  const title = activity?.title ?? 'Algemeen beschikbaar';
  const whatsappUrl = getWhatsAppUrl(day, title);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setError('');
      setSelectedTools(parseToolQuantities(existingEnrollment?.selectedTools));
      setRemarks(existingEnrollment?.remarks ?? '');
    }
    setOpen(nextOpen);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError('');
    await confirmSave();
  };

  const confirmSave = async () => {
    setIsSubmitting(true);
    setError('');
    const payload = {
      workDayId: day.id,
      activityId: activity?.id ?? null,
      bringsVehicle: false,
      selectedTools: JSON.stringify(capToolQuantities(activity?.materialsNeeded, selectedTools, activity?.toolsProvided, existingEnrollment?.selectedTools)),
      remarks,
    };
    try {
      if (existingEnrollment) {
        await updateEnrollment(existingEnrollment.id, payload);
        toast.success('Je inschrijving is bijgewerkt.');
      } else {
        await enroll(payload);
        toast.success('Je bent ingeschreven!');
      }
      setOpen(false);
    } catch (requestError: unknown) {
      toast.error('Opslaan is niet gelukt. Probeer het opnieuw.');
      setError(typeof requestError === 'object' && requestError !== null && 'response' in requestError && typeof (requestError as { response?: { data?: unknown } }).response?.data === 'string' ? (requestError as { response: { data: string } }).response.data : 'Opslaan is niet gelukt. Probeer het opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!existingEnrollment) return;
    setIsSubmitting(true);
    setError('');
    try {
      await deleteEnrollment(existingEnrollment.id);
      setOpen(false);
      toast.success('Je inschrijving is verwijderd.');
    } catch {
      setError('Verwijderen is niet gelukt. Probeer het opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="mt-2 flex flex-col gap-2">
        <Button onClick={() => navigate('/login')} variant="outline" className="w-full text-slate-600">
          Inloggen om aan te melden
        </Button>
        <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm font-medium text-emerald-800 hover:bg-emerald-100">
          <MessageCircle className="h-4 w-4 shrink-0" /> Voor meer informatie of inschrijven, app Henk (0634239485)
        </a>
      </div>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger render={
          <Button variant={existingEnrollment ? 'outline' : isFull ? 'outline' : 'default'} className={`mt-2 w-full ${existingEnrollment ? 'border-blue-200 text-blue-700' : isFull ? 'text-slate-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {existingEnrollment ? <><Pencil className="mr-2 h-4 w-4" /> Aanmelding wijzigen</> : isFull ? 'Aanmelden als reserve' : 'Aanmelden'}
          </Button>
        } />
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{existingEnrollment ? 'Aanmelding wijzigen' : 'Aanmelden'}</DialogTitle>
            <DialogDescription>
              {existingEnrollment ? 'Pas je gegevens en het gereedschap dat je meeneemt aan.' : <>Je meldt je aan voor: <strong className="text-slate-800">{title}</strong>.</>}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <FieldGroup className="space-y-4 py-4">
              <ToolsPicker
                materialsNeeded={activity?.materialsNeeded}
                toolsProvided={activity?.toolsProvided}
                enrollments={enrollmentsForTask}
                quantities={selectedTools}
                onChange={setSelectedTools}
                excludeEnrollmentId={existingEnrollment?.id}
              />
              <Field>
                <Label htmlFor={`remarks-${day.id}-${activity?.id ?? 'general'}`}>Opmerking (optioneel)</Label>
                <Input id={`remarks-${day.id}-${activity?.id ?? 'general'}`} placeholder="Bijv. ik kan pas vanaf 10:00 uur" value={remarks} onChange={event => setRemarks(event.target.value)} />
              </Field>
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            </FieldGroup>
            <DialogFooter className="gap-2 sm:gap-0">
              {existingEnrollment && <Button type="button" variant="ghost" disabled={isSubmitting} onClick={() => setConfirmation('delete')} className="mr-auto text-red-600 hover:text-red-700">Inschrijving verwijderen</Button>}
              <DialogClose render={<Button variant="outline" type="button">Annuleren</Button>} />
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">{isSubmitting ? 'Bezig...' : 'Opslaan'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={confirmation === 'delete'}
        onOpenChange={nextOpen => {
          if (!nextOpen) setConfirmation(null);
        }}
        title="Inschrijving verwijderen?"
        description="Je inschrijving wordt verwijderd en je opgegeven gereedschap telt niet meer mee."
        confirmLabel="Uitschrijven"
        destructive
        onConfirm={async () => {
          await confirmDelete();
          setConfirmation(null);
        }}
      />
    </>
  );
}
