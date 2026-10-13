import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { errorMessage } from '../../lib/errors';
import { Button } from '../ui/button';
import { ConfirmDialog } from '../ui/confirm-dialog';

/** Prullenbakknop met bevestiging; toont het resultaat als toast. */
export default function ConfirmDeleteButton({
  title,
  buttonTitle,
  description,
  confirmLabel,
  successMessage,
  onConfirm,
}: {
  title: string;
  buttonTitle: string;
  description: string;
  confirmLabel: string;
  successMessage?: string;
  onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="icon" title={buttonTitle} onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4 text-red-600" />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        destructive
        onConfirm={async () => {
          try {
            await onConfirm();
            if (successMessage) toast.success(successMessage);
          } catch (error) {
            toast.error(errorMessage(error, 'De handeling is niet gelukt.'));
          }
        }}
      />
    </>
  );
}
