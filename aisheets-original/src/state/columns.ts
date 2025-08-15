import { $, type NoSerialize, useComputed$ } from '@builder.io/qwik';

import { useDatasetsStore } from '~/state/datasets';

export type ColumnKind = 'static' | 'dynamic';

export interface Process {
  // Persisted data
  id?: string;
  prompt: string;
  modelName: string;
  modelProvider: string;
  useEndpointURL?: boolean;
  columnsReferences: string[];
  updatedAt: Date;
  searchEnabled: boolean;
  // Non persisted data
  isExecuting?: boolean;
  cancellable?: NoSerialize<AbortController>;
  offset?: number;
  limit?: number;
}

export interface CreateColumn {
  name: string;
  type: string;
  kind: ColumnKind;
  dataset: {
    id: string;
    name: string;
    createdBy: string;
  };
  process?: {
    modelName: string;
    modelProvider: string;
    useEndpointURL?: boolean;
    prompt: string;
    searchEnabled: boolean;
    columnsReferences: string[];
    isExecuting?: boolean;
    cancellable?: NoSerialize<AbortController>;
  };
}

export interface CellSource {
  url: string;
  snippet: string;
}

export type Cell = {
  id?: string;
  idx: number;
  updatedAt: Date;
  generating: boolean;
  validated: boolean;
  value?: any;
  error?: string;
  sources?: CellSource[];
  column?: {
    id: Column['id'];
    type: Column['type'];
  };
};

export interface Column {
  id: string;
  name: string;
  type: string;
  kind: ColumnKind;
  visible: boolean;
  process?: Process | undefined;
  cells: Cell[];
  dataset: {
    id: string;
    name: string;
    createdBy: string;
  };
  numberOfCells?: number;
}

export const TEMPORAL_ID = '-1';
export const useColumnsStore = () => {
  const { activeDataset } = useDatasetsStore();

  const createPlaceholderColumn = $(
    ({ type, name }: { type?: string; name?: string }): Column => {
      const getNextColumnName = (counter = 1): string => {
        const manyColumnsWithName = activeDataset.value.columns.filter(
          (c) => c.id !== TEMPORAL_ID,
        );
        const newPosibleColumnName = `Column ${manyColumnsWithName.length + 1}`;

        if (!manyColumnsWithName.find((c) => c.name === newPosibleColumnName)) {
          return newPosibleColumnName;
        }

        return getNextColumnName(counter + 1);
      };

      return {
        id: TEMPORAL_ID,
        name: name ?? getNextColumnName(),
        kind: 'dynamic',
        type: type ?? 'text',
        visible: true,
        cells: [
          {
            id: TEMPORAL_ID,
            idx: 0,
            validated: false,
            updatedAt: new Date(),
            generating: false,
            value: '',
            column: {
              id: TEMPORAL_ID,
              type: type ?? 'text',
            },
          },
          {
            id: TEMPORAL_ID,
            idx: 1,
            validated: false,
            updatedAt: new Date(),
            generating: false,
            value: '',
            column: {
              id: TEMPORAL_ID,
              type: type ?? 'text',
            },
          },
          {
            id: TEMPORAL_ID,
            idx: 2,
            validated: false,
            updatedAt: new Date(),
            generating: false,
            value: '',
            column: {
              id: TEMPORAL_ID,
              type: type ?? 'text',
            },
          },
          {
            id: TEMPORAL_ID,
            idx: 3,
            validated: false,
            updatedAt: new Date(),
            generating: false,
            value: '',
            column: {
              id: TEMPORAL_ID,
              type: type ?? 'text',
            },
          },
          {
            id: TEMPORAL_ID,
            idx: 4,
            validated: false,
            updatedAt: new Date(),
            generating: false,
            value: '',
            column: {
              id: TEMPORAL_ID,
              type: type ?? 'text',
            },
          },
          {
            id: TEMPORAL_ID,
            idx: 5,
            validated: false,
            updatedAt: new Date(),
            generating: false,
            value: '',
            column: {
              id: TEMPORAL_ID,
              type: type ?? 'text',
            },
          },
          {
            id: TEMPORAL_ID,
            idx: 6,
            validated: false,
            updatedAt: new Date(),
            generating: false,
            value: '',
            column: {
              id: TEMPORAL_ID,
              type: type ?? 'text',
            },
          },
          {
            id: TEMPORAL_ID,
            idx: 7,
            validated: false,
            updatedAt: new Date(),
            generating: false,
            value: '',
            column: {
              id: TEMPORAL_ID,
              type: type ?? 'text',
            },
          },
        ],
        process: {
          modelName: '',
          modelProvider: '',
          prompt: '',
          searchEnabled: false,
          columnsReferences: [],
          updatedAt: new Date(),
        },
        dataset: {
          ...activeDataset.value,
        },
      };
    },
  );

  const columns = useComputed$(async () => {
    if (activeDataset.value.columns.length === 0) {
      activeDataset.value.columns = [await createPlaceholderColumn({})];
    }
    return activeDataset.value.columns;
  });

  const replaceColumns = $((replaced: Column[]) => {
    activeDataset.value = {
      ...activeDataset.value,
      columns: [...replaced],
    };
  });

  const firstColumn = useComputed$(() => columns.value[0]);

  return {
    columns,
    firstColumn,
    replaceColumns,
    addTemporalColumn: $(async (type?: string, name?: string) => {
      if (activeDataset.value.columns.some((c) => c.id === TEMPORAL_ID)) return;

      const newTemporalColumn = await createPlaceholderColumn({ type, name });

      replaceColumns([...columns.value, newTemporalColumn]);
    }),
    removeTemporalColumn: $(() => {
      replaceColumns(columns.value.filter((c) => c.id !== TEMPORAL_ID));
    }),
    getColumn: $((id: string) => {
      return columns.value.find((c) => c.id === id);
    }),
    addColumn: $((newbie: Column) => {
      replaceColumns([
        ...columns.value.filter((c) => c.id !== TEMPORAL_ID),
        newbie,
      ]);
    }),
    removeColumn: $((removed: Column) => {
      replaceColumns(columns.value.filter((c) => c.id !== removed.id));
    }),
    updateColumn: $((updated: Column) => {
      replaceColumns(
        columns.value.map((c) =>
          c.id === updated.id
            ? {
                ...updated,
                cells: c.cells,
              }
            : c,
        ),
      );
    }),
    deleteColumn: $((deleted: Column) => {
      replaceColumns(columns.value.filter((c) => c.id !== deleted.id));
    }),
    replaceCell: $((cell: Cell) => {
      const column = columns.value.find((c) => c.id === cell.column?.id);
      if (!column) return;

      if (column.cells.some((c) => c.idx === cell.idx)) {
        column.cells = [
          ...column.cells.map((c) => (c.idx === cell.idx ? cell : c)),
        ];
      } else {
        column.cells.push(cell);
        column.cells.sort((a, b) => a.idx - b.idx);
      }

      replaceColumns(columns.value);
    }),
    deleteCellByIdx: $((...idxs: number[]) => {
      for (const column of columns.value) {
        for (const idx of idxs) {
          column.cells = column.cells.filter((c) => c.idx !== idx);
        }

        for (const idx of idxs.sort((a, b) => b - a)) {
          column.cells = column.cells.map((c) =>
            c.idx > idx ? { ...c, idx: c.idx - 1 } : c,
          );
        }
      }

      replaceColumns(columns.value);
    }),
  };
};
