import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface PaginationProps {
  currentPage: number
  totalPages: number
  rowsPerPage: number
  onPageChange: (page: number) => void
  onRowsPerPageChange: (rows: number) => void
}

const Pagination = ({
  currentPage,
  totalPages,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: PaginationProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-2 py-4 sm:flex-nowrap">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">Rows per page</p>
        <select
          className="h-8 w-[70px] rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
        >
          {[10, 25, 50, 100, 500, 1000].map((pageSize) => (
            <option key={pageSize} value={pageSize} className="bg-background text-foreground">
              {pageSize}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <p className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {totalPages === 0 ? 0 : currentPage} of {totalPages}
        </p>
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || totalPages === 0}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages || totalPages === 0}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export { Pagination }
