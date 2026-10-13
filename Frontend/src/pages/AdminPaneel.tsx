import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Edit, Plus, Trash2, UserPlus, Hammer, Users } from 'lucide-react';
import { useAppStore, type Activity, type Enrollment, type WorkDay } from '../store/useAppStore';
import { capToolQuantities, parseToolQuantities, parseToolRequirements, formatToolQuantities } from '../lib/tools';
import ToolsPicker from '../components/ToolsPicker';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Field, FieldGroup } from '../components/ui/field';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { toast } from 'sonner';

function errorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: unknown } }).response;
    if (typeof response?.data === 'string') return response.data;
  }
  return fallback;
}

function ActivityModal({ dayId, activity }: { dayId: string; activity?: Activity }) {
  const { createActivity, updateActivity } = useAppStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [volunteers, setVolunteers] = useState('1');
  const [materials, setMaterials] = useState<{ name: string; amount: string }[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const isEdit = !!activity;

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      if (activity) {
        setTitle(activity.title);
        setDescription(activity.description);
        setVolunteers(String(activity.requiredVolunteers));
        setMaterials(
          parseToolRequirements(activity.materialsNeeded).map((material) => ({
            name: material.name,
            amount: String(material.amount),
          }))
        );
      } else {
        setTitle('');
        setDescription('');
        setVolunteers('1');
        setMaterials([]);
      }
      setError('');
    }
    setOpen(nextOpen);
  };

  const updateMaterial = (
    index: number,
    field: 'name' | 'amount',
    value: string
  ) => {
    setMaterials((current) =>
      current.map((material, itemIndex) =>
        itemIndex === index
          ? { ...material, [field]: value }
          : material
      )
    );
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError('');
    await saveActivity();
  };

  const saveActivity = async () => {
    setSaving(true);
    setError('');

    const payload = {
      workDayId: dayId,
      title: title.trim(),
      description,
      requiredVolunteers: Math.max(
        1,
        Number.parseInt(volunteers, 10) || 1
      ),
      materialsNeeded: JSON.stringify(
        materials
          .filter((material) => material.name.trim())
          .map((material) => ({
            name: material.name.trim(),
            amount: Math.max(
              1,
              Number.parseInt(material.amount, 10) || 1
            ),
          }))
      ),
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
      const message = errorMessage(
        requestError,
        'Opslaan is niet gelukt.'
      );

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
      <DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle>{isEdit ? 'Taak bewerken' : 'Nieuwe taak aanmaken'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup className="space-y-4 py-4">
            <Field><Label htmlFor={`activity-title-${dayId}-${activity?.id ?? 'new'}`}>Titel</Label><Input id={`activity-title-${dayId}-${activity?.id ?? 'new'}`} required value={title} onChange={event => setTitle(event.target.value)} placeholder="Bijv. Vloer slopen" /></Field>
            <Field><Label htmlFor={`activity-description-${dayId}-${activity?.id ?? 'new'}`}>Omschrijving</Label><Input id={`activity-description-${dayId}-${activity?.id ?? 'new'}`} value={description} onChange={event => setDescription(event.target.value)} /></Field>
            <Field><Label htmlFor={`activity-volunteers-${dayId}-${activity?.id ?? 'new'}`}>Aantal vrijwilligers nodig</Label><Input id={`activity-volunteers-${dayId}-${activity?.id ?? 'new'}`} type="number" min="1" step="1" required value={volunteers} onChange={(event) => setVolunteers(event.target.value)} /></Field>
            <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3"><Label className="font-bold text-slate-800">Benodigd gereedschap</Label><Button type="button" variant="outline" size="sm" onClick={() => setMaterials(current => [...current, { name: '', amount: '1' }])}><Plus className="mr-1 h-4 w-4" /> Toevoegen</Button></div>
              {materials.length === 0 && <p className="text-xs text-slate-500">Nog geen gereedschap toegevoegd.</p>}
              {materials.map((material, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input aria-label="Naam gereedschap" placeholder="Naam (bijv. Hamer)" value={material.name} onChange={event => updateMaterial(index, 'name', event.target.value)} className="bg-white" />
                  <Input aria-label="Benodigd aantal" type="number" min="1" step="1" required className="w-24 bg-white" value={material.amount} onChange={(event) => updateMaterial(index, 'amount', event.target.value)}/>
                  <Button type="button" variant="ghost" size="icon" title="Gereedschap verwijderen" onClick={() => setMaterials(current => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              ))}
            </div>
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


function AdminEnrollmentModal({
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
  const [quantities, setQuantities] =
    useState<Record<string, number>>({});
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
      setQuantities({});
      setRemarks('');
      setError('');
    }
    setOpen(nextOpen);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
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
        bringsVehicle: false,
        selectedTools: JSON.stringify(
          capToolQuantities(
            activity?.materialsNeeded,
            quantities,
            activity?.toolsProvided
          )
        ),
        remarks,
      });

      toast.success(
        `${firstName.trim()} ${lastName.trim()} is ingeschreven.`
      );
      setOpen(false);
    } catch (requestError) {
      const message = errorMessage(
        requestError,
        'Inschrijven is niet gelukt.'
      );
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <UserPlus className="mr-1 h-4 w-4" />
            Inschrijven
          </Button>
        }
      />

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Vrijwilliger inschrijven</DialogTitle>
          <DialogDescription>
            Voor {activity?.title ?? 'algemene beschikbaarheid'} op{' '}
            {format(new Date(day.date), 'd MMMM yyyy', {
              locale: nl,
            })}
            .
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup className="space-y-4 py-4">
            <Field>
              <Label htmlFor={`guest-first-${day.id}-${activity?.id ?? 'general'}`}>
                Voornaam
              </Label>
              <Input
                id={`guest-first-${day.id}-${activity?.id ?? 'general'}`}
                autoComplete="given-name"
                maxLength={50}
                required
                value={firstName}
                onChange={event => setFirstName(event.target.value)}
                placeholder="Voornaam"
              />
            </Field>

            <Field>
              <Label htmlFor={`guest-last-${day.id}-${activity?.id ?? 'general'}`}>
                Achternaam
              </Label>
              <Input
                id={`guest-last-${day.id}-${activity?.id ?? 'general'}`}
                autoComplete="family-name"
                maxLength={50}
                required
                value={lastName}
                onChange={event => setLastName(event.target.value)}
                placeholder="Achternaam"
              />
            </Field>

            <Field>
              <Label htmlFor={`guest-phone-${day.id}-${activity?.id ?? 'general'}`}>
                Telefoonnummer (optioneel)
              </Label>
              <Input
                id={`guest-phone-${day.id}-${activity?.id ?? 'general'}`}
                autoComplete="tel"
                maxLength={20}
                value={phoneNumber}
                onChange={event => setPhoneNumber(event.target.value)}
                placeholder="06..."
              />
            </Field>

            <ToolsPicker
              materialsNeeded={activity?.materialsNeeded}
              toolsProvided={activity?.toolsProvided}
              enrollments={existingEnrollments}
              quantities={quantities}
              onChange={setQuantities}
            />

            <Field>
              <Label htmlFor={`admin-remarks-${day.id}-${activity?.id ?? 'general'}`}>
                Opmerking (optioneel)
              </Label>
              <Input
                id={`admin-remarks-${day.id}-${activity?.id ?? 'general'}`}
                value={remarks}
                onChange={event => setRemarks(event.target.value)}
                placeholder="Extra informatie"
              />
            </Field>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
          </FieldGroup>

          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline">
                  Annuleren
                </Button>
              }
            />
            <Button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? 'Bezig...' : 'Inschrijving opslaan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ToolStatus({ activity }: { activity: Activity }) {
  const tools = parseToolRequirements(activity.materialsNeeded);
  if (tools.length === 0) return null;
  const quantities = parseToolQuantities(activity.toolsProvided);
  return (
    <div className="mt-3 space-y-1 rounded-md border border-amber-100 bg-amber-50 p-3">
      <div className="mb-1 flex items-center gap-2 font-semibold text-slate-700"><Hammer className="h-4 w-4" /> Gereedschap</div>
      {tools.map(tool => {
        const have = quantities[tool.name] ?? 0;
        const remaining = Math.max(0, tool.amount - have);
        return <div key={tool.name} className="flex justify-between gap-2 text-xs"><span className="text-slate-700">{tool.name}</span><span className={remaining === 0 ? 'font-medium text-emerald-700' : 'font-medium text-amber-800'}>{remaining === 0 ? `Geregeld (${Math.min(have, tool.amount)}/${tool.amount})` : `Nog ${remaining} nodig (${Math.min(have, tool.amount)}/${tool.amount})`}</span></div>;
      })}
    </div>
  );
}

function EnrollmentList({ enrollments }: { enrollments: Enrollment[] }) {
  const { deleteEnrollment } = useAppStore();
  const [pendingEnrollment, setPendingEnrollment] = useState<Enrollment | null>(null);
  const [error, setError] = useState('');
  if (enrollments.length === 0) return <p className="text-xs text-slate-500">Nog geen inschrijvingen.</p>;

  return (
    <>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      <ul className="space-y-2">
        {enrollments.map(enrollment => (
          <li key={enrollment.id} className="flex items-start justify-between gap-2 rounded border border-slate-200 bg-slate-50 p-2">
            <div className="min-w-0">
              <strong className="text-slate-800">{enrollment.firstName} {enrollment.lastName}</strong>
              <div className="mt-1 space-y-0.5 text-xs text-slate-500">
                {enrollment.phoneNumber && <div>☎ {enrollment.phoneNumber}</div>}
                {enrollment.selectedTools && formatToolQuantities(enrollment.selectedTools) && <div>🔨 Neemt mee: {formatToolQuantities(enrollment.selectedTools)}</div>}
                {enrollment.remarks && <div className="font-medium text-orange-600">💬 {enrollment.remarks}</div>}
                {!enrollment.userId && <div className="text-slate-400">Ingeschreven door beheerder (geen account)</div>}
              </div>
            </div>
            <Button variant="ghost" size="icon" title="Inschrijving verwijderen" onClick={() => { setError(''); setPendingEnrollment(enrollment); }}><Trash2 className="h-4 w-4 text-red-600" /></Button>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={pendingEnrollment !== null}
        onOpenChange={nextOpen => { if (!nextOpen) setPendingEnrollment(null); }}
        title="Inschrijving verwijderen?"
        description={`De inschrijving van ${pendingEnrollment?.firstName ?? 'deze persoon'} wordt verwijderd. Het opgegeven gereedschap telt daarna niet meer mee.`}
        confirmLabel="Inschrijving verwijderen"
        destructive
        onConfirm={async () => {
          if (!pendingEnrollment) return;
          try {
            await deleteEnrollment(pendingEnrollment.id);
            setPendingEnrollment(null);
          } catch (requestError) {
            setError(errorMessage(requestError, 'De inschrijving kon niet worden verwijderd.'));
          }
        }}
      />
    </>
  );
}

type PendingAction = {
  title: string;
  description: string;
  confirmLabel: string;
  successMessage: string;
  destructive?: boolean;
  action: () => Promise<void>;
};

export default function AdminPaneel() {
  const { workDays, fetchPlanning, createWorkDay, deleteActivity, deleteWorkDay } = useAppStore();
  const [newDate, setNewDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [actionError, setActionError] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  useEffect(() => {
    void fetchPlanning();
  }, [fetchPlanning]);

  const handleCreateWorkDay = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!newDate) return;

    setDateError('');

    try {
      await createWorkDay(newDate);
      setNewDate('');
      toast.success('Werkdag ingepland.');
    } catch (error) {
      const message = errorMessage(
        error,
        'Er ging iets mis bij het toevoegen.'
      );
      setDateError(message);
      toast.error(message);
    }
  };

  const confirmPendingAction = async () => {
    if (!pendingAction) return;

    const action = pendingAction;
    setActionError('');

    try {
      await action.action();
      toast.success(action.successMessage);
    } catch (error) {
      const message = errorMessage(
        error,
        'De handeling is niet gelukt.'
      );
      setActionError(message);
      toast.error(message);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-slate-800 p-4 text-white">
        <h2 className="text-lg font-semibold">Beheerderspaneel</h2>
        <p className="text-sm opacity-90">Maak werkdagen en taken aan, beheer vrijwilligers en houd bij welk gereedschap nog nodig is.</p>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Nieuwe werkdag inplannen</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleCreateWorkDay} className="flex flex-col items-end gap-3 sm:flex-row">
            <div className="w-full space-y-1 sm:flex-1"><Label htmlFor="workday-date">Datum</Label><Input id="workday-date" type="date" min={new Date().toISOString().slice(0, 10)} value={newDate} onChange={event => setNewDate(event.target.value)} required /></div>
            <Button type="submit" className="w-full bg-blue-600 px-8 hover:bg-blue-700 sm:w-auto">Aanmaken</Button>
          </form>
          {dateError && <p role="alert" className="mt-2 text-sm text-red-500">{dateError}</p>}
        </CardContent>
      </Card>

      {actionError && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
      {workDays.length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">Er zijn geen toekomstige werkdagen ingepland.</p> : null}
      <div className="space-y-8">
        {workDays.map(day => {
          const generalEnrollments = day.enrollments.filter(enrollment => enrollment.activityId === null);
          return (
            <div key={day.id} className="border-t-2 pt-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-3 text-lg font-bold text-slate-800">
                  {format(new Date(day.date), 'EEEE d MMMM yyyy', { locale: nl })}
                  <Button variant="ghost" size="icon" title="Werkdag verwijderen" onClick={() => {
                    setActionError('');
                    setPendingAction({
                      title: 'Werkdag verwijderen?',
                      description: `Weet je zeker dat je ${format(new Date(day.date), 'd MMMM yyyy', { locale: nl })} en alle taken en inschrijvingen wilt verwijderen?`,
                      confirmLabel: 'Werkdag verwijderen',
                      successMessage: 'Werkdag verwijderd.',
                      destructive: true,
                      action: async () => { await deleteWorkDay(day.id); },
                    });
                  }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </h3>
                <ActivityModal dayId={day.id} />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {day.activities.map(activity => {
                  const activityEnrollments = day.enrollments.filter(enrollment => enrollment.activityId === activity.id);
                  return (
                    <Card key={activity.id} className="border-l-4 border-l-blue-600">
                      <CardHeader className="flex flex-row items-start justify-between pb-2">
                        <div><CardTitle className="text-base text-slate-800">{activity.title}</CardTitle><p className="mt-1 text-xs text-slate-500">Capaciteit: {activityEnrollments.length}/{activity.requiredVolunteers} personen</p></div>
                        <div className="flex gap-1">
                          <ActivityModal dayId={day.id} activity={activity} />
                          <Button variant="ghost" size="icon" title="Taak verwijderen" onClick={() => {
                            setActionError('');
                            setPendingAction({
                              title: 'Taak verwijderen?',
                              description: `De taak "${activity.title}" en alle bijbehorende inschrijvingen worden verwijderd.`,
                              confirmLabel: 'Taak verwijderen',
                              successMessage: 'Taak verwijderd.',
                              destructive: true,
                              action: async () => { await deleteActivity(activity.id); },
                            });
                          }}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        {activity.description && <p className="text-slate-600">{activity.description}</p>}
                        <ToolStatus activity={activity} />
                        <div className="flex items-center justify-between gap-2 border-b pb-1 pt-2"><div className="flex items-center gap-2 font-semibold text-slate-700"><Users className="h-4 w-4" /> Inschrijvingen</div><AdminEnrollmentModal day={day} activity={activity} existingEnrollments={activityEnrollments} /></div>
                        <EnrollmentList enrollments={activityEnrollments} />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card className="mt-4 border-dashed border-2 bg-slate-50">
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div><h4 className="font-semibold text-slate-700">Algemeen beschikbaar</h4><p className="text-xs text-slate-500">Vrijwilligers die nog niet aan een specifieke taak zijn gekoppeld.</p></div>
                    <AdminEnrollmentModal day={day} activity={null} existingEnrollments={generalEnrollments} />
                  </div>
                  <EnrollmentList enrollments={generalEnrollments} />
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={nextOpen => { if (!nextOpen) setPendingAction(null); }}
        title={pendingAction?.title ?? 'Bevestig handeling'}
        description={pendingAction?.description ?? ''}
        confirmLabel={pendingAction?.confirmLabel ?? 'Bevestigen'}
        destructive={pendingAction?.destructive}
        onConfirm={confirmPendingAction}
      />
    </div>
  );
}
