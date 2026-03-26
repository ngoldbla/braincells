'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useDatasetStore } from '@/lib/store/dataset-store';

export function useRealtimeCells(datasetId: string | null) {
  const mergeCells = useDatasetStore((s) => s.mergeCells);

  useEffect(() => {
    if (!datasetId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`cell_values:${datasetId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cell_values',
          filter: `dataset_id=eq.${datasetId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const row = payload.new as any;
            mergeCells(row.column_id, [
              {
                row_idx: row.row_idx,
                value: row.value,
                generating: false,
                validated: false,
              },
            ]);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [datasetId, mergeCells]);
}
