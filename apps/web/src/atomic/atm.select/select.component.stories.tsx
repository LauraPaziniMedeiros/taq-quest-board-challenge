import { H3, InputLabel } from '@atomic/atm.typography';
import type { Meta, StoryObj } from '@storybook/react';
import { Select } from './select.component';

const meta: Meta<typeof Select> = {
  title: 'Atomic/Atoms/Select',
};

export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: {
    options: [
      { value: 'easy', label: 'Fácil' },
      { value: 'normal', label: 'Normal' },
      { value: 'high', label: 'Difícil' },
    ],
    defaultValue: 'normal',
  },
  render: args => (
    <div>
      <H3>Select</H3>
      <InputLabel htmlFor="select-story">Dificuldade</InputLabel>
      <Select id="select-story" {...args} />
    </div>
  ),
};
