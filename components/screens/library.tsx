'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BookOpen } from 'lucide-react'
import Link from 'next/link'
import { AppHeader } from '@/components/ui/app-header'
import { UploadPdfDialog } from '@/components/upload-pdf-dialog'

const mockBooks = [
  {
    id: 'designing-data-intensive-apps',
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    progress: 25,
    status: 'reading',
    lastActivity: 'Chapter 3: Storage and Retrieval',
    coverColor: 'bg-blue-100',
  },
]

const statusConfig = {
  reading: { label: 'Reading', color: 'bg-blue-500' },
  consolidating: { label: 'Consolidating', color: 'bg-amber-500' },
  completed: { label: 'Completed', color: 'bg-green-500' },
}

export function Library() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader />
      {/* Main Content */}
      <main className="mx-auto max-w-7xl py-8 px-[5%]">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-neutral-900">
              Your Library
            </h2>
            <p className="mt-2 text-neutral-600">
              {mockBooks.filter(b => b.status === 'reading').length} books in progress
            </p>
          </div>
          <UploadPdfDialog />
        </div>

        {/* Books Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mockBooks.map((book) => (
            <Link key={book.id} href={`/book/${book.id}`}>
              <Card className="group cursor-pointer transition-all hover:shadow-lg hover:shadow-neutral-200/50">
                <CardContent className="">
                  {/* Book Cover Placeholder */}
                  <div
                    className={`mb-4 flex h-48 items-end rounded-lg ${book.coverColor} p-4 transition-transform group-hover:scale-[1.02]`}
                  >
                    <BookOpen className="h-8 w-8 text-neutral-600/40" />
                  </div>

                  {/* Book Info */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold leading-tight text-neutral-900 line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="mt-1 text-sm text-neutral-600">{book.author}</p>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-600">Overall progress</span>
                        <span className="font-medium text-neutral-900">{book.progress}%</span>
                      </div>
                      <Progress value={book.progress} className="h-1.5" />
                    </div>

                    {/* Status & Last Activity */}
                    <div className="flex items-center justify-between pt-2">
                      <Badge
                        variant="secondary"
                        className={`${
                          statusConfig[book.status as keyof typeof statusConfig].color
                        } border-0 text-white`}
                      >
                        {statusConfig[book.status as keyof typeof statusConfig].label}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-500 line-clamp-1">
                      {book.lastActivity}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
