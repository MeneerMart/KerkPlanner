import type { TimeSlot } from '../store/types';
import { TIME_SLOTS } from '../lib/format';
import type { EnrollmentDetails } from '../lib/enrollmentDetails';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { NativeSelect } from './ui/native-select';
import { Field } from './ui/field';

/** Tijdsblok, vervoer, vaardigheden en opmerking: gedeeld door de vrijwilligers- en beheerdersinschrijving. */
export default function EnrollmentDetailsFields({
  idPrefix,
  value,
  onChange,
}: {
  idPrefix: string;
  value: EnrollmentDetails;
  onChange: (next: EnrollmentDetails) => void;
}) {
  const update = <K extends keyof EnrollmentDetails>(key: K, fieldValue: EnrollmentDetails[K]) =>
    onChange({ ...value, [key]: fieldValue });

  return (
    <>
      <Field>
        <Label htmlFor={`${idPrefix}-timeslot`}>Wanneer kun je?</Label>
        <NativeSelect id={`${idPrefix}-timeslot`} value={value.timeSlot} onChange={event => update('timeSlot', event.target.value as TimeSlot)}>
          {TIME_SLOTS.map(slot => <option key={slot.value} value={slot.value}>{slot.label}</option>)}
        </NativeSelect>
      </Field>
      <Field>
        <Label htmlFor={`${idPrefix}-skills`}>Vaardigheden (optioneel)</Label>
        <Input id={`${idPrefix}-skills`} maxLength={250} placeholder="Bijv. timmerman, elektricien, BHV" value={value.specificSkills} onChange={event => update('specificSkills', event.target.value)} />
      </Field>
      <Field>
        <Label htmlFor={`${idPrefix}-remarks`}>Opmerking (optioneel)</Label>
        <Input id={`${idPrefix}-remarks`} maxLength={500} placeholder="Bijv. ik kan pas vanaf 10:00 uur" value={value.remarks} onChange={event => update('remarks', event.target.value)} />
      </Field>
      <label htmlFor={`${idPrefix}-vehicle`} className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
        <input id={`${idPrefix}-vehicle`} type="checkbox" checked={value.bringsVehicle} onChange={event => update('bringsVehicle', event.target.checked)} className="h-4 w-4 accent-blue-600" />
        Ik kan een busje of aanhanger meenemen
      </label>
    </>
  );
}
