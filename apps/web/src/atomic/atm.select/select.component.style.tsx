import { field } from '@atomic/obj.form/field.component.styled';
import { tv } from 'tailwind-variants';

const { border, content } = field();

export const style = tv({
  slots: {
    wrapper: 'relative',
    field: [border(), content(), 'cursor-pointer pr-[42px]'],
    icon: 'pointer-events-none absolute top-1/2 right-xs -translate-y-1/2 text-neutral [&>svg]:h-lg [&>svg]:w-lg',
  },
  variants: {
    invalid: {
      true: {
        field: [content({ invalid: true }), border({ invalid: true })],
      },
    },
  },
});
