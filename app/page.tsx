"use client"

import { CSVUploader } from "@/components/csv-uploader"

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-foreground">Accountant AI</h1>
        </div>
        <CSVUploader />
      </div>
    </main>
  )
}
