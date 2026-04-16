import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
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
  const hasMultiplePages = totalPages > 1

  const pageItems = React.useMemo(() => {
    if (totalPages <= 1) return [1]
    const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1])
    const filtered = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((left, right) => left - right)
    const items: Array<number | "ellipsis"> = []

    filtered.forEach((page, index) => {
      const previous = filtered[index - 1]
      if (previous && page - previous > 1) {
        items.push("ellipsis")
      }
      items.push(page)
    })

    return items
  }, [currentPage, totalPages])

  return (
    <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
      <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-transparent px-3 shadow-xs">
        <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">Rows per page</p>
        <select
          className="h-7 w-[52px] appearance-none border-0 bg-transparent p-0 text-right text-sm font-medium text-foreground outline-none disabled:cursor-not-allowed disabled:opacity-50"
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

      {hasMultiplePages ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <p className="min-w-[110px] text-right text-sm font-medium text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex h-9 items-center gap-1 rounded-md border border-input bg-transparent px-1 shadow-xs">
            <Button
              variant="ghost"
              className="h-7 w-7 rounded-sm border-0 bg-transparent p-0 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {pageItems.map((item, index) =>
              item === "ellipsis" ? (
                <div key={`ellipsis-${index}`} className="flex h-8 w-8 items-center justify-center text-muted-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </div>
              ) : (
                <Button
                  key={item}
                  variant="ghost"
                  className={`h-7 min-w-7 rounded-sm border-0 px-2 ${
                    item === currentPage
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                  onClick={() => onPageChange(item)}
                >
                  {item}
                </Button>
              )
            )}
            <Button
              variant="ghost"
              className="h-7 w-7 rounded-sm border-0 bg-transparent p-0 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export { Pagination }
