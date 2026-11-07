import { FaIcon } from '@atomic/atm.fa-icon';
import { TextFieldMasks, TextInput } from '@atomic/atm.text-input';
import { forwardRef, useRef } from 'react';
import { formatDueDateInput, parseDueDateInput } from './quest-presentation';

interface QuestDueDateInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
}

export const QuestDueDateInput = forwardRef<HTMLInputElement, QuestDueDateInputProps>(
  ({ id, value, onChange, invalid, describedBy }, ref) => {
    const datePickerRef = useRef<HTMLInputElement>(null);
    const isoValue = parseDueDateInput(value) ?? '';

    const openCalendar = () => {
      const datePicker = datePickerRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
      if (!datePicker) {
        return;
      }

      if (typeof datePicker.showPicker === 'function') {
        datePicker.showPicker();
      } else {
        datePicker.click();
      }
    };

    return (
      <div className="flex items-start gap-xs">
        <div className="flex-1">
          <TextInput
            ref={ref}
            id={id}
            value={value}
            onChange={eventOrValue =>
              onChange(typeof eventOrValue === 'string' ? eventOrValue : eventOrValue.target.value)
            }
            mask={TextFieldMasks.custom('99/99/9999')}
            placeholder="dd/mm/aaaa"
            inputMode="numeric"
            invalid={invalid}
            aria-invalid={invalid}
            aria-describedby={describedBy}
          />
        </div>
        <button
          type="button"
          aria-label="Abrir calendário"
          title="Abrir calendário"
          onClick={openCalendar}
          className="border-neutral-strong bg-neutral-xsoft text-neutral-strong flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[4px] border hover:brightness-110">
          <FaIcon.Calendar />
        </button>
        <input
          ref={datePickerRef}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          value={isoValue}
          onChange={event => onChange(formatDueDateInput(event.target.value || null))}
        />
      </div>
    );
  },
);

QuestDueDateInput.displayName = 'QuestDueDateInput';
