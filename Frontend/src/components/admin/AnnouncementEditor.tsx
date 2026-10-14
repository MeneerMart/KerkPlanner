import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAppStore } from '../../store/useAppStore';
import type { Announcement } from '../../store/types';
import { errorMessage } from '../../lib/errors';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Field } from '../ui/field';

/** Bewerkt de mededeling die bovenaan de homepage staat. Leeg laten = geen mededeling tonen. */
export default function AnnouncementEditor() {
  const { announcement, fetchAnnouncement } = useAppStore();

  useEffect(() => { void fetchAnnouncement(); }, [fetchAnnouncement]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Mededeling bovenaan de planning</CardTitle>
        <p className="text-xs text-slate-500">Bijvoorbeeld over lunch, drinken, toiletgebruik of parkeren. Laat de tekst leeg om niets te tonen.</p>
      </CardHeader>
      <CardContent>
        {/* Nieuwe key zodra de opgeslagen tekst binnenkomt, zodat het formulier daarmee opnieuw begint. */}
        <AnnouncementForm key={`${announcement.title}\n${announcement.message}`} saved={announcement} />
      </CardContent>
    </Card>
  );
}

function AnnouncementForm({ saved }: { saved: Announcement }) {
  const updateAnnouncement = useAppStore(state => state.updateAnnouncement);
  const [title, setTitle] = useState(saved.title);
  const [message, setMessage] = useState(saved.message);
  const [saving, setSaving] = useState(false);
  const isChanged = title !== saved.title || message !== saved.message;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateAnnouncement({ title: title.trim(), message: message.trim() });
      toast.success(message.trim() ? 'Mededeling opgeslagen.' : 'Mededeling verwijderd.');
    } catch (error) {
      toast.error(errorMessage(error, 'Opslaan is niet gelukt.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field>
        <Label htmlFor="announcement-title">Titel</Label>
        <Input id="announcement-title" maxLength={100} placeholder="Let op!" value={title} onChange={event => setTitle(event.target.value)} />
      </Field>
      <Field>
        <Label htmlFor="announcement-message">Tekst</Label>
        <Textarea id="announcement-message" maxLength={2000} rows={5} placeholder={'Bijv.\n- Lunch wordt niet verzorgd, drinken is aanwezig.\n- De wc kan tot en met woensdag gebruikt worden.\n- Vergeet je parkeerschijf niet.'} value={message} onChange={event => setMessage(event.target.value)} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" disabled={saving || !isChanged} className="bg-blue-600 hover:bg-blue-700">{saving ? 'Bezig...' : 'Opslaan'}</Button>
      </div>
    </form>
  );
}
