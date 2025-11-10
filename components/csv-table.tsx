"use client"

import type React from "react"

import { useState, useCallback, useMemo, useEffect } from "react"
import { ChevronLeft, ChevronRight, Search, X, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

interface CSVTableProps {
  headers: string[]
  rows: Record<string, string>[]
}

const ROW_HEIGHT = 40

// Only display these specific columns
const DISPLAY_COLUMNS = [
  "Dokument: Datum",
  "Dokument: ID",
  "Dokument: Typ",
  "Dokument: Bestellnummer",
  "Dokument: Externe ID"
]

// Parse DD.MM.YYYY format to Date
const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null
  const trimmed = dateStr.trim()
  const parts = trimmed.split('.')
  if (parts.length !== 3) return null
  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1 // Month is 0-indexed
  const year = parseInt(parts[2], 10)
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null
  return new Date(year, month, day)
}

// Format Date to DD.MM.YYYY
const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}

export function CSVTable({ headers, rows }: CSVTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [searchValues, setSearchValues] = useState<Record<string, string>>({})
  const [debouncedSearchValues, setDebouncedSearchValues] = useState<Record<string, string>>({})
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({})
  const [defaultMonth, setDefaultMonth] = useState<Date | undefined>(undefined)

  // Debounce search values
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchValues(searchValues)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchValues])

  // Set default month based on first valid date in the data
  useEffect(() => {
    if (defaultMonth) return // Already set

    for (const row of rows) {
      const dateStr = row["Dokument: Datum"]
      if (dateStr) {
        const parsedDate = parseDate(dateStr)
        if (parsedDate) {
          setDefaultMonth(parsedDate)
          break
        }
      }
    }
  }, [rows, defaultMonth])

  // Filter rows based on search values
  const filteredRows = useMemo(() => {
    let filtered = rows

    // Apply date filter
    if (selectedDate) {
      const selectedDateStr = formatDate(selectedDate)
      filtered = filtered.filter((row) => {
        const rowDateStr = (row["Dokument: Datum"] || '').trim()
        return rowDateStr === selectedDateStr
      })
    }

    // Apply text filters
    const activeFilters = Object.entries(debouncedSearchValues).filter(([_, value]) => value.trim() !== '')

    if (activeFilters.length > 0) {
      filtered = filtered.filter((row) => {
        return activeFilters.every(([column, searchValue]) => {
          const cellValue = (row[column] || '').toLowerCase()
          const search = searchValue.toLowerCase()
          return cellValue.includes(search)
        })
      })
    }

    return filtered
  }, [rows, debouncedSearchValues, selectedDate])

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const visibleRows = filteredRows.slice(startIndex, endIndex)

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

  const handleSearchChange = useCallback((column: string, value: string) => {
    setSearchValues((prev) => ({
      ...prev,
      [column]: value,
    }))
  }, [])

  const clearSearch = useCallback((column: string) => {
    setSearchValues((prev) => {
      const newValues = { ...prev }
      delete newValues[column]
      return newValues
    })
  }, [])

  const clearDateFilter = useCallback(() => {
    setSelectedDate(undefined)
  }, [])

  const togglePopover = useCallback((column: string) => {
    setOpenPopovers((prev) => ({
      ...prev,
      [column]: !prev[column],
    }))
  }, [])

  const hasActiveFilters = Object.keys(searchValues).length > 0 || selectedDate !== undefined

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
      {/* Header and Body Table */}
      <div className="overflow-x-auto flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-base border-collapse">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="bg-muted/50 border-b border-border">
                {DISPLAY_COLUMNS.map((header) => (
                  <th
                    key={header}
                    className="px-6 py-4 text-left font-semibold text-foreground whitespace-nowrap min-w-max"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{header}</span>
                      {header === "Dokument: Datum" ? (
                        <Popover
                          open={openPopovers[header]}
                          onOpenChange={() => togglePopover(header)}
                        >
                          <PopoverTrigger asChild>
                            <button
                              className={`p-1.5 rounded hover:bg-muted transition-colors ${
                                selectedDate ? "text-primary" : "text-muted-foreground"
                              }`}
                            >
                              <CalendarIcon className="h-4 w-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            {selectedDate && (
                              <div className="p-4 border-b border-border">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm text-muted-foreground">
                                    Selected: {formatDate(selectedDate)}
                                  </span>
                                  <button
                                    onClick={clearDateFilter}
                                    className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-muted"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            )}
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={(date) => {
                                setSelectedDate(date)
                                togglePopover(header)
                              }}
                              defaultMonth={defaultMonth}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <Popover
                          open={openPopovers[header]}
                          onOpenChange={() => togglePopover(header)}
                        >
                          <PopoverTrigger asChild>
                            <button
                              className={`p-1.5 rounded hover:bg-muted transition-colors ${
                                searchValues[header] ? "text-primary" : "text-muted-foreground"
                              }`}
                            >
                              <Search className="h-4 w-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-4" align="start">
                            <div className="space-y-3">
                              <label className="text-sm font-medium text-foreground">
                                Search {header}
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="Type to search..."
                                  value={searchValues[header] || ''}
                                  onChange={(e) => handleSearchChange(header, e.target.value)}
                                  className="w-full px-4 py-2.5 text-base border border-border rounded bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                  autoFocus
                                />
                                {searchValues[header] && (
                                  <button
                                    onClick={() => clearSearch(header)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
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
                  style={{ height: `${ROW_HEIGHT + 12}px` }}
                >
                  {DISPLAY_COLUMNS.map((header) => (
                    <td
                      key={header}
                      className="px-6 py-4 text-foreground text-base whitespace-nowrap overflow-hidden text-ellipsis max-w-xs"
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

      <div className="border-t border-border bg-muted/30 px-6 py-5 space-y-5">
        {/* Pagination Info and Rows Per Page */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 text-base text-muted-foreground">
            <span>Show</span>
            <select
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
              className="rounded border border-border bg-background px-3 py-2 text-base text-foreground"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>rows per page</span>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredRows.length)} of {filteredRows.length.toLocaleString()}{" "}
            {hasActiveFilters && `(filtered from ${rows.length.toLocaleString()}) `}
            rows • {DISPLAY_COLUMNS.length} columns
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="default"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="gap-2 bg-transparent"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-base text-foreground">
              Page <span className="font-semibold">{currentPage}</span> of{" "}
              <span className="font-semibold">{totalPages}</span>
            </span>
          </div>

          <Button
            variant="outline"
            size="default"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="gap-2 bg-transparent"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
