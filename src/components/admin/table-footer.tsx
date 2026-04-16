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
    <div className="-mt-px flex flex-col gap-4 rounded-b-md border border-border bg-card px-4 py-4 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-muted-foreground whitespace-nowrap">
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
