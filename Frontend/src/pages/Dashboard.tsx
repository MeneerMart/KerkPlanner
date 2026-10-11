import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../src/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../@/components/ui/card';
import { Badge } from '../../@/components/ui/badge';
import { Button } from '../../@/components/ui/button';
import { Input } from '../../@/components/ui/input';
import { Label } from '../../@/components/ui/label';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../@/components/ui/dialog';
import { Field, FieldGroup } from '../../@/components/ui/field';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Users, Hammer, CheckCircle2 } from 'lucide-react';

// --- DE MODAL COMPONENT (Volledig in Base-UI Shadcn stijl) ---
function EnrollmentModal({ day, activity, isFull }: { day: any, activity: any, isFull?: boolean }) {
  const { enroll, workDays, token } = useAppStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [bringsVehicle, setBringsVehicle] = useState(false);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Als de gebruiker niet is ingelogd, stuur hem naar login in plaats van de modal te openen
  if (!token) {
    return (
      <Button onClick={() => navigate('/login')} variant="outline" className="w-full mt-2 text-slate-600">
        Inloggen om aan te melden
      </Button>
    );
  }

  let parsedTools: {name: string, amount: number}[] = [];
  let enrollmentsForTask: any[] = [];
  if (activity?.materialsNeeded) {
    try { parsedTools = JSON.parse(activity.materialsNeeded); } catch {}
    enrollmentsForTask = workDays.find(w => w.id === day.id)?.enrollments.filter(e => e.activityId === activity.id) || [];
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await enroll({
        workDayId: day.id,
        activityId: activity?.id || null,
        bringsVehicle,
        selectedTools: selectedTools.join(','),
        remarks
      });
      setOpen(false);
    } catch {
      alert("Inschrijven mislukt.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = activity ? activity.title : 'Algemeen Beschikbaar';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <Button variant={isFull ? "outline" : "default"} className={`w-full mt-2 ${isFull ? 'text-slate-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {isFull ? 'Aanmelden als reserve' : 'Aanmelden'}
          </Button>
        } 
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Aanmelden</DialogTitle>
          <DialogDescription>
            Je meldt je aan voor: <strong className="text-slate-800">{title}</strong>.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <FieldGroup className="py-4 space-y-4">
            <Field className="flex flex-row items-center space-x-3 bg-slate-50 p-3 rounded-md border border-slate-200">
              <input type="checkbox" id={`vehicle-${day.id}`} checked={bringsVehicle} onChange={(e) => setBringsVehicle(e.target.checked)} className="w-4 h-4 text-blue-600" />
              <Label htmlFor={`vehicle-${day.id}`} className="cursor-pointer font-normal m-0 text-slate-700">Ik neem een busje of aanhanger mee</Label>
            </Field>

            {parsedTools.length > 0 && (
              <div className="space-y-3 border p-4 rounded-md bg-slate-50 border-slate-200">
                <Label className="flex items-center gap-2 font-semibold text-slate-800">
                  <Hammer className="w-4 h-4 text-slate-500" /> Benodigd Gereedschap
                </Label>
                {parsedTools.map((tool) => {
                  const alreadyBrought = enrollmentsForTask.filter(e => e.selectedTools?.includes(tool.name)).length;
                  const available = tool.amount - alreadyBrought;
                  const isFullTool = available <= 0;

                  return (
                    <Field key={tool.name} className={`flex flex-row items-center space-x-3 ${isFullTool ? 'opacity-50' : ''}`}>
                      <input 
                        type="checkbox" 
                        id={`tool-${tool.name}`}
                        disabled={isFullTool}
                        checked={selectedTools.includes(tool.name)} 
                        onChange={() => setSelectedTools(prev => prev.includes(tool.name) ? prev.filter(t => t !== tool.name) : [...prev, tool.name])} 
                        className="w-4 h-4 text-blue-600" 
                      />
                      <Label htmlFor={`tool-${tool.name}`} className={`font-normal m-0 ${isFullTool ? 'line-through text-slate-500' : 'cursor-pointer text-slate-700'}`}>
                        {tool.name} {isFullTool ? '(Voldoende aanwezig)' : `(Nog ${available} nodig)`}
                      </Label>
                    </Field>
                  )
                })}
              </div>
            )}

            <Field>
              <Label htmlFor={`remarks-${day.id}`}>Opmerking (optioneel)</Label>
              <Input id={`remarks-${day.id}`} placeholder="Bijv. ik kan pas vanaf 10:00 uur" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button">Annuleren</Button>} />
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? 'Bezig...' : 'Bevestigen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
// --- EINDE MODAL COMPONENT ---


export default function Dashboard() {
  const navigate = useNavigate();
  const { workDays, fetchPlanning, isLoading, firstName } = useAppStore();

  useEffect(() => { fetchPlanning(); }, [fetchPlanning]);

  if (isLoading) return <div className="text-center mt-10 text-slate-500">Planning ophalen...</div>;

  return (
    <div className="space-y-6">
      {firstName ? (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h2 className="font-semibold text-blue-900">Welkom, {firstName}!</h2>
          <p className="text-sm text-blue-700 mt-1">Kies hieronder een dag of taak en meld je aan.</p>
        </div>
      ) : (
        <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="font-semibold text-slate-800">Welkom bij de planning!</h2>
            <p className="text-sm text-slate-600 mt-1">Bekijk hieronder de voortgang. Log in om je in te schrijven.</p>
          </div>
          <Button onClick={() => navigate('/login')} variant="outline" className="w-full sm:w-auto bg-white">Inloggen of Registreren</Button>
        </div>
      )}

      {workDays.map((day) => {
        const generalEnrollments = day.enrollments.filter(e => e.activityId === null);
        
        return (
          <div key={day.id} className="space-y-4">
            <h3 className="font-bold text-xl border-b pb-2 mt-8 text-slate-800">
              {format(new Date(day.date), 'EEEE d MMMM', { locale: nl })}
            </h3>

            {day.activities.map((activity) => {
              const enrolledHere = day.enrollments.filter(e => e.activityId === activity.id);
              const isFull = enrolledHere.length >= activity.requiredVolunteers;
              
              return (
                <Card key={activity.id} className={`border-l-4 ${activity.isCompleted ? 'border-l-slate-400 opacity-75' : 'border-l-blue-500'}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {activity.isCompleted && <CheckCircle2 className="w-5 h-5 text-slate-500" />}
                        <span className={activity.isCompleted ? 'line-through text-slate-500' : 'text-slate-800'}>{activity.title}</span>
                      </CardTitle>
                      <Badge variant={isFull ? "secondary" : "default"} className={`whitespace-nowrap ${isFull ? 'bg-slate-100 text-slate-800' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}>
                        {enrolledHere.length} / {activity.requiredVolunteers}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm space-y-4">
                    <p className="text-slate-600">{activity.description}</p>
                    
                    {enrolledHere.length > 0 && (
                      <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-md border border-slate-100">
                        <Users className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div className="font-medium text-slate-700">{enrolledHere.map(e => e.firstName).join(', ')}</div>
                      </div>
                    )}

                    {!activity.isCompleted && (
                      <EnrollmentModal day={day} activity={activity} isFull={isFull} />
                    )}
                  </CardContent>
                </Card>
              );
            })}

            <Card className="border-dashed border-2 bg-slate-50">
              <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="w-full">
                  <h4 className="font-semibold text-slate-700">Algemeen Beschikbaar</h4>
                  <p className="text-xs text-slate-500">Deel mij in waar nodig op deze dag</p>
                  {generalEnrollments.length > 0 && <p className="text-xs mt-1 text-slate-600"><strong>Ingeschreven:</strong> {generalEnrollments.map(e => e.firstName).join(', ')}</p>}
                </div>
                <div className="w-full sm:w-auto">
                   <EnrollmentModal day={day} activity={null} />
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}