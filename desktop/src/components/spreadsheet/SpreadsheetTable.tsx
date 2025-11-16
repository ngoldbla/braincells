import { useSpreadsheetStore } from '../../stores/spreadsheet-store';
import { ColumnType } from '../../types/database';
import { Badge } from '../common';
import { TableCell } from './TableCell';

export function SpreadsheetTable() {
  const { currentTableView, loading, error, updateCell } = useSpreadsheetStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Loading spreadsheet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!currentTableView) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No dataset selected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Select a dataset to view and edit spreadsheet data
          </p>
        </div>
      </div>
    );
  }

  const { columns, rows } = currentTableView;

  const getColumnTypeBadge = (type: ColumnType) => {
    switch (type) {
      case ColumnType.Input:
        return <Badge variant="info">Input</Badge>;
      case ColumnType.Output:
        return <Badge variant="success">AI</Badge>;
      case ColumnType.Formula:
        return <Badge variant="warning">Formula</Badge>;
      default:
        return <Badge variant="default">{type}</Badge>;
    }
  };

  const handleCellUpdate = (columnId: string, rowIndex: number, value: string) => {
    updateCell(columnId, rowIndex, value);
  };

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="w-full border-collapse">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-16">
              #
            </th>
            {columns.map((column) => (
              <th
                key={column.id}
                className="px-4 py-3 text-left border-b border-gray-200 min-w-[200px]"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{column.name}</span>
                  {getColumnTypeBadge(column.column_type)}
                </div>
                {column.prompt && (
                  <p className="mt-1 text-xs text-gray-500 truncate" title={column.prompt}>
                    {column.prompt}
                  </p>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="px-4 py-8 text-center text-gray-500"
              >
                No data available. Add rows by importing CSV or manually entering data.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.index} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm text-gray-500 border-r border-gray-200 font-medium">
                  {row.index + 1}
                </td>
                {columns.map((column) => {
                  const cell = row.cells[column.id];
                  const isEditable = column.column_type === ColumnType.Input;

                  return (
                    <TableCell
                      key={column.id}
                      cell={cell}
                      onUpdate={(value) => handleCellUpdate(column.id, row.index, value)}
                      isEditable={isEditable}
                    />
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
