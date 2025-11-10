"use client"

import type React from "react"

import { useCallback, useRef, useState } from "react"
import { Upload, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CSVTable } from "./csv-table"

export interface CSVData {
  headers: string[]
  rows: Record<string, string>[]
}

export function CSVUploader() {
  const [csvData, setCSVData] = useState<CSVData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseCSV = useCallback((text: string): CSVData => {
    const lines = text.split("\n")
    if (lines.length === 0) throw new Error("CSV file is empty")

    const headers = parseCSVLine(lines[0], ";")
    const rows: Record<string, string>[] = []

    let i = 1
    while (i < lines.length) {
      const { line: fullLine, nextIndex } = readCSVRow(lines, i, ";")
      i = nextIndex

      if (!fullLine.trim()) continue

      const values = parseCSVLine(fullLine, ";")
      const row: Record<string, string> = {}

      headers.forEach((header, index) => {
        row[header] = values[index] || ""
      })

      if (Object.values(row).some((v) => v.trim())) {
        rows.push(row)
      }
    }

    return { headers, rows }
  }, [])

  const readCSVRow = (lines: string[], startIndex: number, delimiter: string): { line: string; nextIndex: number } => {
    let line = lines[startIndex]
    let index = startIndex + 1

    // Count quotes to determine if we're inside a quoted field
    let quoteCount = 0
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') quoteCount++
    }

    // If odd number of quotes, we're still inside a quoted field, keep reading
    while (quoteCount % 2 === 1 && index < lines.length) {
      line += "\n" + lines[index]
      quoteCount = 0
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') quoteCount++
      }
      index++
    }

    return { line, nextIndex: index }
  }

  const parseCSVLine = (line: string, delimiter: string): string[] => {
    const result: string[] = []
    let current = ""
    let insideQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          current += '"'
          i++
        } else {
          insideQuotes = !insideQuotes
        }
      } else if (char === delimiter && !insideQuotes) {
        result.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }

    result.push(current.trim())
    return result
  }

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      if (!file.name.toLowerCase().endsWith(".csv")) {
        setError("Please upload a CSV file")
        return
      }

      setLoading(true)
      setError(null)

      try {
        const text = await file.text()
        const data = parseCSV(text)

        if (data.rows.length === 0) {
          setError("CSV file contains no data rows")
          return
        }

        setCSVData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse CSV file")
      } finally {
        setLoading(false)
      }
    },
    [parseCSV],
  )

  const handleClear = useCallback(() => {
    setCSVData(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className="relative rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 transition-colors hover:border-primary hover:bg-muted/50"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          e.currentTarget.classList.add("border-primary", "bg-muted/50")
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove("border-primary", "bg-muted/50")
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.currentTarget.classList.remove("border-primary", "bg-muted/50")
          const file = e.dataTransfer.files?.[0]
          if (file) {
            const input = fileInputRef.current
            if (input) {
              const dataTransfer = new DataTransfer()
              dataTransfer.items.add(file)
              input.files = dataTransfer.files
              handleFileChange({
                target: input,
              } as React.ChangeEvent<HTMLInputElement>)
            }
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          disabled={loading}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="rounded-lg bg-primary/10 p-3">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-foreground">
              {loading ? "Processing..." : "Drag and drop your CSV file"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">or click to browse</p>
          </div>
          <Button disabled={loading}>{loading ? "Processing..." : "Select File"}</Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
          <div>
            <h4 className="font-semibold text-destructive">Error</h4>
            <p className="mt-1 text-sm text-destructive/80">{error}</p>
          </div>
        </div>
      )}

      {/* Data Display */}
      {csvData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Data Preview</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {csvData.rows.length.toLocaleString()} rows, {csvData.headers.length} columns
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleClear} className="gap-2 bg-transparent">
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>

          <CSVTable headers={csvData.headers} rows={csvData.rows} />
        </div>
      )}
    </div>
  )
}
