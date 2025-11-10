"use client"

import { CSVUploader } from "@/components/csv-uploader"

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Accountant AI</h1>
        </div>
        <CSVUploader />
      </div>
    </main>
  )
}
