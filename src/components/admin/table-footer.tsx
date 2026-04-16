"use client";

import * as React from "react";

import { Pagination } from "@/components/ui/pagination";

type AdminTableFooterProps = {
  currentPage: number;
  totalPages: number;
  totalRows: number;
  rowsPerPage: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
};

export function AdminTableFooter({
  currentPage,
  totalPages,
  totalRows,
  rowsPerPage,
  startIndex,
  endIndex,
  onPageChange,
  onRowsPerPageChange,
}: AdminTableFooterProps) {
  const showingFrom = totalRows === 0 ? 0 : startIndex + 1;
  const showingTo = totalRows === 0 ? 0 : Math.min(endIndex, totalRows);

  return (
    <div className="flex flex-col gap-3 border-t bg-card px-4 py-4">
      <p className="text-sm text-muted-foreground">
        Showing {showingFrom} to {showingTo} of {totalRows}
      </p>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        rowsPerPage={rowsPerPage}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
      />
    </div>
  );
}
