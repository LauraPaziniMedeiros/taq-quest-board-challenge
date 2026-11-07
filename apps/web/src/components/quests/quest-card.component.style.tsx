import { tv } from 'tailwind-variants';

export const style = tv({
  slots: {
    card: 'border-neutral-soft bg-neutral-xxsoft flex flex-col gap-[10px] rounded-md border p-[14px] shadow-[0_1px_0_var(--color-background-strong),0_3px_8px_rgba(60,40,20,0.12)]',
    title: 'font-primary text-neutral-strong m-0 text-lg leading-[1.2] font-semibold',
    description: 'font-primary text-tinta-2 m-0 text-[15px] italic',
    tags: 'flex flex-wrap gap-[6px]',
    questTags: 'm-0 flex list-none flex-wrap gap-[6px] p-0',
    questTag:
      'border-primary-medium bg-neutral-xsoft text-neutral-strong rounded-full border px-[10px] py-[2px] text-sm',
    difficulty: 'border-background-strong bg-neutral-xsoft text-tinta-2 rounded-full border px-[10px] py-[2px] text-sm',
    dueDate: 'border-neutral-soft bg-neutral-xxsoft text-tinta-2 rounded-full border px-[10px] py-[2px] text-sm',
    overdueBadge:
      'border-feedback-danger bg-feedback-danger text-fixed-white rounded-full border px-[10px] py-[2px] text-sm font-semibold',
    footer: 'border-neutral-soft flex items-center justify-between gap-sm border-t border-dashed pt-sm',
    meta: 'text-tinta-2 flex items-center gap-xs text-[15px]',
    xpIcon: 'text-ouro-escuro text-sm',
    advanceButton:
      'font-secondary border-neutral-strong h-[40px] rounded-md border text-[13px] font-semibold tracking-[0.06em] hover:brightness-110',
    editButton:
      'font-secondary border-neutral-strong h-[40px] rounded-md border bg-neutral-xsoft text-neutral-strong text-[13px] font-semibold tracking-[0.06em] hover:brightness-110',
    removeButton:
      'font-secondary border-feedback-danger bg-feedback-danger text-fixed-white h-[40px] rounded-md border text-[13px] font-semibold tracking-[0.06em] hover:brightness-110',
    completed: 'text-feedback-success-medium flex items-center gap-[6px] text-[15px] italic',
    completedIcon: 'text-sm',
  },
  variants: {
    overdue: {
      true: {
        card: 'border-feedback-danger bg-feedback-warning-soft',
      },
    },
    columnStatus: {
      open: {
        advanceButton:
          'bg-neutral-strong text-ficha-nome dark:border-neutral-medium dark:bg-secondary-strong dark:text-neutral-strong',
      },
      in_progress: {
        advanceButton:
          'bg-primary-medium text-neutral-strong dark:border-neutral-medium dark:bg-secondary-strong dark:text-primary-soft',
      },
      resolved: {},
    },
  },
});
