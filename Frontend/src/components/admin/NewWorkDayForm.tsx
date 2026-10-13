import { useState } from 'react';
import { toast } from 'sonner';
import { useAppStore } from '../../store/useAppStore';
import { errorMessage } from '../../lib/errors';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export default function NewWorkDayForm() {
  const createWorkDay = useAppStore(state => state.createWorkDay);
  const [newDate, setNewDate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newDate) return;
    setError('');
    try {
      await createWorkDay(newDate);
      setNewDate('');
      toast.success('Werkdag ingepland.');
    } catch (requestError) {
      const message = errorMessage(requestError, 'Er ging iets mis bij het toevoegen.');
      setError(message);
      toast.error(message);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">Nieuwe werkdag inplannen</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col items-end gap-3 sm:flex-row">
          <div className="w-full space-y-1 sm:flex-1">
            <Label htmlFor="workday-date">Datum</Label>
            <Input id="workday-date" type="date" min={new Date().toISOString().slice(0, 10)} value={newDate} onChange={event => setNewDate(event.target.value)} required />
          </div>
          <Button type="submit" className="w-full bg-blue-600 px-8 hover:bg-blue-700 sm:w-auto">Aanmaken</Button>
        </form>
        {error && <p role="alert" className="mt-2 text-sm text-red-500">{error}</p>}
      </CardContent>
    </Card>
  );
}
