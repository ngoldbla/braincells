import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Papa from 'papaparse';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const datasetId = searchParams.get('dataset_id');
  const format = searchParams.get('format') || 'csv';

  if (!datasetId) {
    return NextResponse.json(
      { error: 'Missing dataset_id' },
      { status: 400 },
    );
  }

  // Get columns
  const { data: columns, error: colError } = await supabase
    .from('columns')
    .select('id, name')
    .eq('dataset_id', datasetId)
    .order('position', { ascending: true });

  if (colError) {
    return NextResponse.json({ error: colError.message }, { status: 500 });
  }
  if (!columns || columns.length === 0) {
    return NextResponse.json({ error: 'No columns found' }, { status: 404 });
  }

  // Get all cell values
  const { data: cells, error: cellError } = await supabase
    .from('cell_values')
    .select('column_id, row_idx, value')
    .eq('dataset_id', datasetId)
    .order('row_idx', { ascending: true });

  if (cellError) {
    return NextResponse.json({ error: cellError.message }, { status: 500 });
  }

  // Build row map
  const columnMap = new Map<string, string>(columns.map((c: any) => [c.id, c.name]));
  const rowMap = new Map<number, Record<string, any>>();

  for (const cell of cells || []) {
    if (!rowMap.has(cell.row_idx)) {
      rowMap.set(cell.row_idx, {});
    }
    const colName = columnMap.get(cell.column_id);
    if (colName) {
      rowMap.get(cell.row_idx)![colName] = cell.value;
    }
  }

  const rows = Array.from(rowMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([, row]) => row);

  if (format === 'json') {
    return new Response(JSON.stringify(rows, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="export.json"',
      },
    });
  }

  const csv = Papa.unparse(rows, {
    columns: columns.map((c: any) => c.name),
  });

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="export.csv"',
    },
  });
}
