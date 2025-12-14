"use client"

import { CSVUploader } from "@/components/csv-uploader"

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex items-center justify-between relative">
          <div className="flex-shrink-0">
            <img src="/Blackskies-Logo.png" alt="Blackskies Logo" className="h-14 w-auto" />
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <h1 className="text-4xl font-bold text-foreground">Accountant AI</h1>
          </div>
        </header>
        <CSVUploader />
      </div>
    </main>
  )
}
