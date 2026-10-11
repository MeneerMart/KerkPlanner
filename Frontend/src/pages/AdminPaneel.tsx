import { useState, useEffect } from 'react';
import { useAppStore } from '../../src/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../@/components/ui/card';
import { Button } from '../../@/components/ui/button';
import { Input } from '../../@/components/ui/input';
import { Label } from '../../@/components/ui/label';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '../../@/components/ui/dialog';
import { Field, FieldGroup } from '../../@/components/ui/field';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Trash2, Edit, Plus } from 'lucide-react';

// --- DE ACTIVITEIT MODAL (Voor Toevoegen EN Bewerken) ---
function ActivityModal({ dayId, activity }: { dayId: string, activity?: any }) {
  const { createActivity, updateActivity } = useAppStore();
  const [open, setOpen] = useState(false);
  const isEdit = !!activity;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [volunteers, setVolunteers] = useState(1);
  const [materials, setMaterials] = useState<{name: string, amount: number}[]>([]);

  // Vul formulier als we bewerken
  useEffect(() => {
    if (activity && open) {
      setTitle(activity.title);
      setDescription(activity.description);
      setVolunteers(activity.requiredVolunteers);
      try { setMaterials(JSON.parse(activity.materialsNeeded || '[]')); } catch { setMaterials([]); }
    } else if (!open && !activity) {
      setTitle(''); setDescription(''); setVolunteers(1); setMaterials([]);
    }
  }, [activity, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      workDayId: dayId, title, description, requiredVolunteers: volunteers,
      materialsNeeded: JSON.stringify(materials.filter(m => m.name.trim() !== '')) 
    };

    if (isEdit) await updateActivity(activity.id, data);
    else await createActivity(data);
    
    setOpen(false);
  };

  const updateMaterial = (index: number, field: string, value: any) => {
    const newM = [...materials];
    newM[index] = { ...newM[index], [field]: value };
    setMaterials(newM);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          isEdit 
            ? <Button variant="ghost" size="icon" title="Taak bewerken"><Edit className="w-4 h-4 text-slate-600"/></Button>
            : <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50"><Plus className="w-4 h-4 mr-1"/> Taak toevoegen</Button>
        } 
      />
      <DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle>{isEdit ? 'Taak Bewerken' : 'Nieuwe Taak Aanmaken'}</DialogTitle></DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <FieldGroup className="py-4 space-y-4">
            <Field>
              <Label>Titel</Label>
              <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bijv. Vloer slopen" />
            </Field>
            <Field>
              <Label>Omschrijving</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
            <Field>
              <Label>Aantal vrijwilligers nodig</Label>
              <Input type="number" min="1" required value={volunteers} onChange={(e) => setVolunteers(parseInt(e.target.value))} />
            </Field>
            
            <div className="space-y-3 border p-4 rounded-md bg-slate-50 border-slate-200">
              <Label className="font-bold flex items-center justify-between text-slate-800">
                Benodigd Gereedschap
                <Button type="button" variant="outline" size="sm" onClick={() => setMaterials([...materials, {name: '', amount: 1}])}>+ Toevoegen</Button>
              </Label>
              {materials.map((m, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input placeholder="Naam (bijv. Hamer)" value={m.name} onChange={(e) => updateMaterial(i, 'name', e.target.value)} className="bg-white" />
                  <Input type="number" min="1" className="w-24 bg-white" value={m.amount} onChange={(e) => updateMaterial(i, 'amount', parseInt(e.target.value))} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setMaterials(materials.filter((_, idx) => idx !== i))}><Trash2 className="w-4 h-4 text-red-500"/></Button>
                </div>
              ))}
            </div>
          </FieldGroup>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button">Annuleren</Button>} />
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Opslaan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
// --- EINDE ACTIVITEIT MODAL ---

export default function AdminPaneel() {
  const { workDays, fetchPlanning, createWorkDay, deleteActivity, deleteWorkDay } = useAppStore();
  const [newDate, setNewDate] = useState('');
  const [dateError, setDateError] = useState('');

  useEffect(() => { fetchPlanning(); }, [fetchPlanning]);

  const handleCreateWorkDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;
    setDateError('');
    try {
      await createWorkDay(newDate);
      setNewDate('');
    } catch (err: any) {
      setDateError(err.response?.data || "Er ging iets mis bij het toevoegen.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 text-white p-4 rounded-lg">
        <h2 className="font-semibold text-lg">Beheerderspaneel</h2>
        <p className="text-sm opacity-90">Maak werkdagen en taken aan, en bekijk alle details.</p>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-md">Nieuwe werkdag inplannen</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleCreateWorkDay} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="w-full sm:flex-1 space-y-1">
              <Label>Datum</Label>
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full sm:w-auto px-8 bg-blue-600 hover:bg-blue-700">Aanmaken</Button>
          </form>
          {dateError && <p className="text-red-500 text-sm mt-2">{dateError}</p>}
        </CardContent>
      </Card>

      <div className="space-y-8">
        {workDays.map((day) => (
          <div key={day.id} className="border-t-2 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-4">
                {format(new Date(day.date), 'EEEE d MMMM yyyy', { locale: nl })}
                <Button variant="ghost" size="icon" onClick={() => { if(confirm('Wil je deze hele dag en alle bijbehorende taken en inschrijvingen verwijderen?')) deleteWorkDay(day.id) }}>
                   <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </h3>
              <ActivityModal dayId={day.id} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {day.activities.map((activity) => (
                <Card key={activity.id} className="border-l-4 border-l-blue-600">
                  <CardHeader className="pb-2 flex flex-row justify-between items-start">
                    <div>
                      <CardTitle className="text-md text-slate-800">{activity.title}</CardTitle>
                      <p className="text-xs text-slate-500 mt-1">Capaciteit: {activity.requiredVolunteers} personen</p>
                    </div>
                    <div className="flex gap-1">
                      <ActivityModal dayId={day.id} activity={activity} />
                      <Button variant="ghost" size="icon" onClick={() => { if(confirm('Taak verwijderen?')) deleteActivity(activity.id) }}><Trash2 className="w-4 h-4 text-red-600"/></Button>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="font-semibold mt-2 border-b pb-1 text-slate-700">Inschrijvingen:</div>
                    <ul className="space-y-2">
                      {day.enrollments.filter(e => e.activityId === activity.id).map(e => (
                        <li key={e.id} className="bg-slate-50 p-2 rounded border border-slate-200">
                          <strong className="text-slate-800">{e.firstName} {e.lastName}</strong>
                          <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                            {e.bringsVehicle && <div>🚚 Busje/Aanhanger</div>}
                            {e.selectedTools && <div>🔨 Neemt mee: {e.selectedTools}</div>}
                            {e.remarks && <div className="text-orange-600 font-medium">💬 {e.remarks}</div>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}