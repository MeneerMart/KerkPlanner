import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

/** Centrale mededeling van de beheerders (lunch, toilet, parkeren, ...). Toont niets zolang er geen tekst is. */
export default function AnnouncementBanner() {
  const { announcement, fetchAnnouncement } = useAppStore();

  useEffect(() => { void fetchAnnouncement(); }, [fetchAnnouncement]);

  if (!announcement.message.trim()) return null;

  return (
    <section aria-label="Mededeling" className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4">
      <h2 className="flex items-center gap-2 font-bold text-amber-900">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" /> {announcement.title.trim() || 'Let op!'}
      </h2>
      <p className="mt-2 whitespace-pre-line text-sm text-amber-950">{announcement.message}</p>
    </section>
  );
}
