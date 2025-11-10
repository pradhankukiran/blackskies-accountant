"use client"

import type React from "react"

import { useMemo, useState, useRef, useCallback } from "react"
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CSVTableProps {
  headers: string[]
  rows: Record<string, string>[]
}

const ROW_HEIGHT = 40

export function CSVTable({ headers, rows }: CSVTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "asc" | "desc"
  } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(headers))
  const [showColumnSelector, setShowColumnSelector] = useState(false)

  const toggleColumn = (header: string) => {
    setVisibleColumns((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(header)) {
        newSet.delete(header)
      } else {
        newSet.add(header)
      }
      return newSet
    })
  }

  const toggleAllColumns = () => {
    setVisibleColumns((prev) => {
      if (prev.size === headers.length) {
        return new Set()
      } else {
        return new Set(headers)
      }
    })
  }

  const sortedRows = useMemo(() => {
    const sorted = [...rows]
    if (sortConfig) {
      sorted.sort((a, b) => {
        const aVal = (a[sortConfig.key] || "").toLowerCase()
        const bVal = (b[sortConfig.key] || "").toLowerCase()

        if (sortConfig.direction === "asc") {
          return aVal.localeCompare(bVal)
        } else {
          return bVal.localeCompare(aVal)
        }
      })
    }
    return sorted
  }, [rows, sortConfig])

  const filteredHeaders = useMemo(() => {
    return headers.filter((h) => visibleColumns.has(h))
  }, [headers, visibleColumns])

  const totalPages = Math.ceil(sortedRows.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const visibleRows = sortedRows.slice(startIndex, endIndex)

  const handleSort = useCallback((key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === "asc" ? { key, direction: "desc" } : null
      }
      return { key, direction: "asc" }
    })
    setCurrentPage(1)
  }, [])

  const handlePreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1))
  }, [])

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
  }, [totalPages])

  const handleRowsPerPageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number.parseInt(e.target.value, 10))
    setCurrentPage(1)
  }, [])

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
      {/* Column Selector */}
      <div className="border-b border-border bg-muted/20 px-4 py-3">
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowColumnSelector(!showColumnSelector)}
            className="gap-2 bg-transparent"
          >
            {showColumnSelector ? (
              <>
                <EyeOff className="h-4 w-4" />
                Hide Columns
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Show Columns ({visibleColumns.size}/{headers.length})
              </>
            )}
          </Button>

          {showColumnSelector && (
            <div className="absolute top-10 left-0 mt-1 z-10 bg-background border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto min-w-max">
              <div className="sticky top-0 bg-muted/50 border-b border-border px-4 py-2">
                <button
                  onClick={toggleAllColumns}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  {visibleColumns.size === headers.length ? "Deselect All" : "Select All"}
                </button>
              </div>
              <div className="p-3 space-y-1 max-h-80">
                {headers.map((header) => (
                  <label
                    key={header}
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted transition-colors whitespace-nowrap min-w-max px-2 py-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns.has(header)}
                      onChange={() => toggleColumn(header)}
                      className="cursor-pointer"
                    />
                    <span className="text-sm text-foreground truncate max-w-xs" title={header}>
                      {header}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Header and Body Table */}
      <div className="overflow-x-auto flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-muted/50 border-b border-border">
                {filteredHeaders.map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left font-semibold text-foreground cursor-pointer hover:bg-muted transition-colors whitespace-nowrap min-w-max"
                    onClick={() => handleSort(header)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{header}</span>
                      {sortConfig?.key === header &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUp className="h-3 w-3 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-3 w-3 flex-shrink-0" />
                        ))}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, idx) => (
                <tr
                  key={startIndex + idx}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                  style={{ height: `${ROW_HEIGHT}px` }}
                >
                  {filteredHeaders.map((header) => (
                    <td
                      key={`${startIndex + idx}-${header}`}
                      className="px-4 py-3 text-foreground text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-xs"
                      title={row[header]}
                    >
                      {row[header]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border-t border-border bg-muted/30 px-4 py-4 space-y-4">
        {/* Pagination Info and Rows Per Page */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Show</span>
            <select
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
              className="rounded border border-border bg-background px-2 py-1 text-sm text-foreground"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>rows per page</span>
          </div>

          <div className="text-xs text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, sortedRows.length)} of {sortedRows.length.toLocaleString()}{" "}
            rows • {filteredHeaders.length} columns
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="gap-1 bg-transparent"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground">
              Page <span className="font-semibold">{currentPage}</span> of{" "}
              <span className="font-semibold">{totalPages}</span>
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="gap-1 bg-transparent"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
