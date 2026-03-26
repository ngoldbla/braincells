import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createColumn, getMaxPosition } from '@/lib/supabase/queries/columns';
import { bulkUpsertCellValues } from '@/lib/supabase/queries/cells';
import Papa from 'papaparse';
import { MAX_ROWS_IMPORT } from '@/lib/types/domain';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const datasetId = formData.get('dataset_id') as string;
  const fileType = formData.get('file_type') as string;

  if (!file || !datasetId) {
    return NextResponse.json(
      { error: 'Missing file or dataset_id' },
      { status: 400 },
    );
  }

  const text = await file.text();

  let rows: Record<string, any>[];

  if (fileType === 'json') {
    try {
      const parsed = JSON.parse(text);
      rows = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON file' },
        { status: 400 },
      );
    }
  } else {
    try {
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      rows = parsed.data as Record<string, any>[];
    } catch {
      return NextResponse.json(
        { error: 'Invalid CSV file' },
        { status: 400 },
      );
    }
  }

  // Limit rows
  rows = rows.slice(0, MAX_ROWS_IMPORT);

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No data found in file' }, { status: 400 });
  }

  // Get column names from first row
  const columnNames = Object.keys(rows[0]);

  // Create columns
  let maxPos = await getMaxPosition(supabase, datasetId);
  const columnMap: Record<string, string> = {};

  for (const name of columnNames) {
    maxPos++;
    const col = await createColumn(supabase, {
      dataset_id: datasetId,
      name,
      type: 'text',
      kind: 'static',
      position: maxPos,
    });
    columnMap[name] = col.id;
  }

  // Build cell values
  const cellValues = rows.flatMap((row, rowIdx) =>
    columnNames.map((colName) => ({
      dataset_id: datasetId,
      column_id: columnMap[colName],
      row_idx: rowIdx,
      value: row[colName] ?? null,
    })),
  );

  await bulkUpsertCellValues(supabase, cellValues);

  return NextResponse.json({
    columns: columnNames.length,
    rows: rows.length,
  });
}
