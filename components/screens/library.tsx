'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BookOpen } from 'lucide-react'
import Link from 'next/link'
import { AppHeader } from '@/components/ui/app-header'
import { UploadPdfDialog } from '@/components/upload-pdf-dialog'
import { BookUploadItem } from '@/components/book-upload-item'
import { useUploadStore } from '@/lib/stores/upload-store'
import { useBooksStore } from '@/lib/stores/books-store'

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
  const uploadingBooks = useUploadStore((state) => state.uploadingBooks);
  const dynamicBooks = useBooksStore((state) => state.books);

  const allBooks = [...mockBooks, ...dynamicBooks];
  const totalBooksInProgress = allBooks.filter(b => b.status === 'reading').length + uploadingBooks.length;

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
              {totalBooksInProgress} {totalBooksInProgress === 1 ? 'book' : 'books'} in progress
              {uploadingBooks.length > 0 && (
                <span className="text-neutral-500"> • {uploadingBooks.length} uploading</span>
              )}
            </p>
          </div>
          <UploadPdfDialog />
        </div>

        {/* Books Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Uploading books */}
          {uploadingBooks.map((book) => (
            <BookUploadItem
              key={book.id}
              fileName={book.fileName}
              progress={book.progress}
              currentStep={book.currentStep}
            />
          ))}

          {/* Regular books (mock + dynamic) */}
          {allBooks.map((book) => (
            <Link key={book.id} href={`/book/${book.id}`} className="h-full">
              <Card className="group cursor-pointer transition-all hover:shadow-lg hover:shadow-neutral-200/50 h-full flex flex-col">
                <CardContent className="flex-1 flex flex-col">
                  {/* Book Cover Placeholder */}
                  <div
                    className={`mb-4 flex h-48 items-end rounded-lg ${book.coverColor} p-4 transition-transform group-hover:scale-[1.02] shrink-0`}
                  >
                    <BookOpen className="h-8 w-8 text-neutral-600/40" />
                  </div>

                  {/* Book Info */}
                  <div className="space-y-3 flex-1 flex flex-col">
                    <div className="shrink-0">
                      <h3 className="font-semibold leading-tight text-neutral-900 line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="mt-1 text-sm text-neutral-600">{book.author}</p>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2 shrink-0">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-600">Overall progress</span>
                        <span className="font-medium text-neutral-900">{book.progress}%</span>
                      </div>
                      <Progress value={book.progress} className="h-1.5" />
                    </div>

                    {/* Spacer */}
                    <div className="flex-1"></div>

                    {/* Status & Last Activity */}
                    <div className="shrink-0">
                      <div className="flex items-center justify-between pb-2">
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
