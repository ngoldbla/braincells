import React from 'react';
import { useSpreadsheetStore } from '../../stores/spreadsheet-store';
import { Button, Select } from '../common';

export function Pagination() {
  const {
    currentPage,
    rowsPerPage,
    totalRows,
    nextPage,
    previousPage,
    setRowsPerPage,
  } = useSpreadsheetStore();

  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startRow = currentPage * rowsPerPage + 1;
  const endRow = Math.min((currentPage + 1) * rowsPerPage, totalRows);

  const rowsPerPageOptions = [
    { value: '25', label: '25 rows' },
    { value: '50', label: '50 rows' },
    { value: '100', label: '100 rows' },
    { value: '200', label: '200 rows' },
  ];

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRowsPerPage = parseInt(e.target.value, 10);
    setRowsPerPage(newRowsPerPage);
  };

  if (totalRows === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
      {/* Left side - Rows per page */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">Show</span>
        <Select
          value={rowsPerPage.toString()}
          onChange={handleRowsPerPageChange}
          options={rowsPerPageOptions}
          className="text-sm"
        />
      </div>

      {/* Middle - Page info */}
      <div className="text-sm text-gray-700">
        Showing {startRow} to {endRow} of {totalRows} rows
      </div>

      {/* Right side - Navigation */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700 mr-2">
          Page {currentPage + 1} of {totalPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={previousPage}
          disabled={currentPage === 0}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Previous
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={nextPage}
          disabled={currentPage >= totalPages - 1}
        >
          Next
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Button>
      </div>
    </div>
  );
}
