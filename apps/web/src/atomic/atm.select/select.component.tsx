import { FaIcon } from '@atomic/atm.fa-icon';
import type { FieldStateType } from '@atomic/obj.form/form.model';
import * as React from 'react';
import { style } from './select.component.style';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends FieldStateType, React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
}

export const Select = React.forwardRef(
  ({ invalid, className, options, ...props }: SelectProps, ref: React.ForwardedRef<HTMLSelectElement>) => {
    return (
      <div className={style().wrapper()}>
        <select ref={ref} className={style().field({ invalid, className })} {...props}>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <FaIcon.ArrowDropDown className={style().icon()} />
      </div>
    );
  },
);

Select.displayName = 'Select';
