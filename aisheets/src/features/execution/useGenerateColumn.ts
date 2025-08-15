import { $ } from '@builder.io/qwik';
import { server$ } from '@builder.io/qwik-city';
import { useExecution } from '~/features/add-column';
import { getColumnById, getColumnCellById } from '~/services';
import {
  type Column,
  type CreateColumn,
  TEMPORAL_ID,
  useColumnsStore,
} from '~/state';
import { useAddColumnUseCase } from '~/usecases/add-column.usecase';
import { useEditColumnUseCase } from '~/usecases/edit-column.usecase';
import { useRegenerateCellsUseCase } from '~/usecases/regenerate-cells.usecase';

const getColumnById$ = server$(getColumnById);
const getColumnCellById$ = server$(getColumnCellById);

export const useGenerateColumn = () => {
  const { open, columnId } = useExecution();
  const { addColumn, updateColumn, replaceCell, columns } = useColumnsStore();
  const addNewColumn = useAddColumnUseCase();
  const editColumn = useEditColumnUseCase();
  const regenerateCells = useRegenerateCellsUseCase();

  const syncAbortedColumn = $(async () => {
    const column = columns.value.find((c) => c.id === columnId.value);

    if (column) {
      const updated = await getColumnById$(column.id);
      updateColumn(updated!);

      for (const c of column.cells.filter((c) => c.generating)) {
        const cell = await getColumnCellById$(c.id!);
        replaceCell(cell!);
      }
    }
  });

  const onCreateColumn = $(async (newColumn: CreateColumn) => {
    const response = await addNewColumn(
      newColumn.process!.cancellable!.signal,
      newColumn,
    );

    let newColumnId: string | undefined;

    for await (const { column, cell } of response) {
      if (column) {
        column.process!.cancellable = newColumn.process!.cancellable;
        column.process!.isExecuting = newColumn.process!.isExecuting;

        addColumn(column);
        open(column.id, 'edit');
        newColumnId = column.id;
      }
      if (cell) {
        replaceCell(cell);
      }
    }

    const newbie = await getColumnById$(newColumnId!);
    if (newbie) {
      updateColumn(newbie);
    }
  });

  const onRegenerateCells = $(async (column: Column) => {
    if (column.process?.isExecuting) return;

    const response = await regenerateCells(column);

    for await (const cell of response) {
      replaceCell(cell);
    }

    const updated = await getColumnById$(column.id);
    updateColumn(updated!);
  });

  const onEditColumn = $(async (persistedColumn: Column) => {
    const response = await editColumn(
      persistedColumn.process!.cancellable!.signal,
      persistedColumn,
    );

    for await (const { column, cell } of response) {
      if (column) {
        updateColumn(column);
      }
      if (cell) {
        replaceCell(cell);
      }
    }

    const updated = await getColumnById$(persistedColumn.id);
    if (updated) {
      updateColumn(updated);
    }
  });

  const onGenerateColumn = $(async (column: Column | CreateColumn) => {
    column.process!.cancellable!.signal.onabort = () => {
      syncAbortedColumn();
    };

    if ('id' in column && column.id === TEMPORAL_ID) {
      return onCreateColumn(column as CreateColumn);
    }
    return onEditColumn(column as Column);
  });

  return { onGenerateColumn, onRegenerateCells };
};
