import React, { useState, useEffect } from 'react';
import { Cell, CellStatus } from '../../types/database';
import { Badge } from '../common';

interface TableCellProps {
  cell: Cell | undefined;
  onUpdate: (value: string) => void;
  isEditable: boolean;
}

export function TableCell({ cell, onUpdate, isEditable }: TableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(cell?.value || '');

  useEffect(() => {
    setValue(cell?.value || '');
  }, [cell?.value]);

  const handleDoubleClick = () => {
    if (isEditable) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (value !== (cell?.value || '')) {
      onUpdate(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      onUpdate(value);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setValue(cell?.value || '');
    }
  };

  const getCellStatusColor = (status: CellStatus) => {
    switch (status) {
      case CellStatus.Pending:
        return 'bg-gray-50';
      case CellStatus.Processing:
        return 'bg-blue-50';
      case CellStatus.Complete:
        return 'bg-white';
      case CellStatus.Error:
        return 'bg-red-50';
      default:
        return 'bg-white';
    }
  };

  const statusColor = cell?.status ? getCellStatusColor(cell.status) : 'bg-white';
  const borderColor = cell?.error ? 'border-red-300' : 'border-gray-200';

  return (
    <td
      className={`px-4 py-2 border ${borderColor} ${statusColor} ${isEditable ? 'cursor-text' : 'cursor-default'}`}
      onDoubleClick={handleDoubleClick}
      title={cell?.error || undefined}
    >
      <div className="flex items-center justify-between gap-2">
        {isEditing ? (
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 border border-indigo-500 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
        ) : (
          <span className="flex-1 min-w-0 truncate">
            {cell?.value || ''}
          </span>
        )}

        {cell?.status && cell.status !== CellStatus.Complete && (
          <div className="flex-shrink-0">
            {cell.status === CellStatus.Pending && (
              <Badge variant="default">Pending</Badge>
            )}
            {cell.status === CellStatus.Processing && (
              <Badge variant="info">Processing</Badge>
            )}
            {cell.status === CellStatus.Error && (
              <Badge variant="danger">Error</Badge>
            )}
          </div>
        )}
      </div>
    </td>
  );
}
