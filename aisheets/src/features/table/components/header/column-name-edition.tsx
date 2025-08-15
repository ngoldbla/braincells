import { $, component$, useSignal } from '@builder.io/qwik';
import { server$ } from '@builder.io/qwik-city';
import { Input } from '~/components';
import { useClickOutside } from '~/components/hooks/click/outside';
import { updateColumnPartially } from '~/services';
import { type Column, TEMPORAL_ID, useColumnsStore } from '~/state';

export const ColumnNameEdition = component$<{ column: Column }>(
  ({ column }) => {
    const isClicking = useSignal(false);
    const newName = useSignal(column.name);
    const { updateColumn } = useColumnsStore();

    const saveChanges = $(() => {
      if (!isClicking.value) return;
      if (!newName.value.trim()) {
        newName.value = column.name;
        isClicking.value = false;
        return;
      }

      isClicking.value = false;
      if (newName.value === column.name) return;
      column.name = newName.value;

      updateColumn({ ...column });

      if (column.id === TEMPORAL_ID) {
        return;
      }

      server$(async (id: string, name: string) => {
        await updateColumnPartially({ id, name });
      })(column.id, newName.value);
    });

    const ref = useClickOutside(saveChanges);

    const handleKeyDown = $((event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        saveChanges();
      }
    });

    return (
      <div
        class="font-normal w-full"
        ref={ref}
        onClick$={() => (isClicking.value = true)}
      >
        <Input
          type="text"
          class="h-8"
          bind:value={newName}
          onKeyDown$={handleKeyDown}
        />
      </div>
    );
  },
);
