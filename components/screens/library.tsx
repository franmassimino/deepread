'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { BookOpen, Library as LibraryIcon, Upload, Trash2, Settings, Pencil, Download, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { AppHeader } from '@/components/ui/app-header'
import { UploadPdfDialog } from '@/components/upload/upload-pdf-dialog'
import { BookUploadItem } from '@/components/upload/book-upload-item'
import { useUploadStore } from '@/lib/stores/upload-store'
import { useBooks, BookFromAPI } from '@/lib/hooks/use-books'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { toast } from 'sonner'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const statusConfig = {
  PROCESSING: { label: 'Processing', color: 'bg-amber-500', uiStatus: 'reading' },
  READY: { label: 'Ready', color: 'bg-green-500', uiStatus: 'completed' },
  ERROR: { label: 'Error', color: 'bg-red-500', uiStatus: 'reading' },
}

const coverColors = [
  'bg-blue-100', 'bg-purple-100', 'bg-green-100',
  'bg-amber-100', 'bg-rose-100', 'bg-cyan-100'
]

function getBookColor(bookId: string): string {
  // Consistent color based on book ID
  let hash = 0;
  for (let i = 0; i < bookId.length; i++) {
    hash = ((hash << 5) - hash) + bookId.charCodeAt(i);
    hash = hash & hash;
  }
  return coverColors[Math.abs(hash) % coverColors.length];
}

export function Library() {
  const uploadingBooks = useUploadStore((state) => state.uploadingBooks)
  const cancelUpload = useUploadStore((state) => state.cancelUpload)
  const retryUpload = useUploadStore((state) => state.retryUpload)

  const { books, isLoading, refetch, deleteBook } = useBooks()
  const [hasHadContent, setHasHadContent] = useState(false)

  // Track if we've ever had books or uploads
  useEffect(() => {
    if (books.length > 0 || uploadingBooks.length > 0) {
      setHasHadContent(true)
    }
  }, [books.length, uploadingBooks.length])

  // Auto-refresh when uploads complete
  useEffect(() => {
    const completedCount = uploadingBooks.filter(b => b.status === 'ready').length
    if (completedCount > 0) {
      // Refetch after a short delay to ensure DB is updated
      const timer = setTimeout(() => refetch(), 500)
      return () => clearTimeout(timer)
    }
  }, [uploadingBooks, refetch])

  // Keep completed uploads visible until they appear in the books list
  const activeUploads = uploadingBooks.filter(book => {
    // If status is ready, only show if the book is not yet in the books list
    if (book.status === 'ready') {
      return !books.some(b => b.title === book.fileName.replace('.pdf', ''))
    }
    return true
  })
  const totalBooks = books.length
  const processingBooks = books.filter(b => b.status === 'PROCESSING').length

  // Show empty state only if never had content and not loading
  const showEmptyState = !isLoading && books.length === 0 && activeUploads.length === 0 && !hasHadContent

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader />
      <main className="mx-auto max-w-7xl py-8 px-[5%]">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-neutral-900">
              Your Library
            </h2>
            <p className="mt-2 text-neutral-600">
              {totalBooks} {totalBooks === 1 ? 'book' : 'books'}
              {processingBooks > 0 && (
                <span className="text-neutral-500"> ({processingBooks} processing)</span>
              )}
              {activeUploads.length > 0 && (
                <span className="text-neutral-500"> &bull; {activeUploads.length} uploading</span>
              )}
            </p>
          </div>
          <UploadPdfDialog />
        </div>

        {/* Loading State - Skeleton Cards */}
        {isLoading && books.length === 0 && activeUploads.length === 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {showEmptyState && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="rounded-full bg-neutral-100 p-6">
              <LibraryIcon className="h-12 w-12 text-neutral-400" />
            </div>
            <h3 className="mt-6 text-lg font-medium text-neutral-900">No books yet</h3>
            <p className="mt-2 max-w-sm text-center text-neutral-600">
              Upload your first PDF to start building your library.
            </p>
            <div className="mt-6">
              <UploadPdfDialog
                trigger={
                  <button className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800">
                    <Upload className="h-4 w-4" />
                    Upload PDF
                  </button>
                }
              />
            </div>
          </div>
        )}

        {/* Books Grid */}
        {(books.length > 0 || activeUploads.length > 0) && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Uploading books */}
            {activeUploads.map((book) => (
              <BookUploadItem
                key={book.id}
                id={book.id}
                fileName={book.fileName}
                progress={book.progress}
                currentStep={book.currentStep}
                status={book.status}
                error={book.error}
                onCancel={cancelUpload}
                onRetry={retryUpload}
              />
            ))}

            {/* Books from database */}
            {books.map((book) => (
              <BookCard key={book.id} book={book} onDelete={deleteBook} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function BookCard({
  book,
  onDelete
}: {
  book: BookFromAPI
  onDelete: (bookId: string) => Promise<void>
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const config = statusConfig[book.status]
  const coverColor = getBookColor(book.id)
  const progress = book.status === 'READY' ? 0 : book.status === 'PROCESSING' ? 0 : 0

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(book.id)
      setShowDeleteDialog(false)
      toast.success('Book deleted', {
        description: `"${book.title}" has been removed from your library.`
      })
    } catch (error) {
      toast.error('Failed to delete book', {
        description: 'Please try again later.'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="h-full relative group/card">
        <Link href={`/book/${book.id}`} className="h-full block">
          <Card className="cursor-pointer transition-all hover:shadow-lg hover:shadow-neutral-200/50 h-full flex flex-col">
            <CardContent className="flex-1 flex flex-col">
              {/* Book Cover Placeholder */}
              <div
                className={`mb-4 flex h-48 items-end rounded-lg ${coverColor} p-4 transition-transform group-hover/card:scale-[1.02] shrink-0`}
              >
                <BookOpen className="h-8 w-8 text-neutral-600/40" />
              </div>

              {/* Book Info */}
              <div className="space-y-3 flex-1 flex flex-col">
                <div className="shrink-0">
                  <h3 className="font-semibold leading-tight text-neutral-900 line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-600">
                    {book.author || 'Unknown Author'}
                  </p>
                </div>

                {/* Progress */}
                <div className="space-y-2 shrink-0">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">Reading progress</span>
                    <span className="font-medium text-neutral-900">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>

                {/* Spacer */}
                <div className="flex-1"></div>

                {/* Status and Action Buttons */}
                <div className="shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={`${config.color} border-0 text-white`}
                      >
                        {config.label}
                      </Badge>
                      <span className="text-xs text-neutral-500">
                        Added {new Date(book.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Action Buttons - Always visible */}
                    <TooltipProvider>
                      <div className="flex gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 hover:bg-neutral-100 transition-colors"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setSettingsOpen(!settingsOpen)
                                    }}
                                  >
                                    <Settings className="h-4 w-4 text-neutral-600" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-48 p-2"
                                  align="end"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                  }}
                                >
                                  <div className="space-y-1">
                                    <Button
                                      variant="ghost"
                                      className="w-full justify-start text-sm h-9"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        // TODO: Implement edit functionality
                                        console.log('Edit book:', book.title)
                                        setSettingsOpen(false)
                                      }}
                                    >
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit Details
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      className="w-full justify-start text-sm h-9"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        // TODO: Implement export functionality
                                        console.log('Export book:', book.title)
                                        setSettingsOpen(false)
                                      }}
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      Export
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      className="w-full justify-start text-sm h-9"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        // TODO: Implement refresh functionality
                                        console.log('Refresh book:', book.title)
                                        setSettingsOpen(false)
                                      }}
                                    >
                                      <RefreshCw className="h-4 w-4 mr-2" />
                                      Refresh Data
                                    </Button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Book settings</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-red-50 hover:text-red-600 transition-colors"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setShowDeleteDialog(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete book</TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this book?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{book.title}&quot;? This action cannot be undone.
              The PDF file and all associated data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function BookCardSkeleton() {
  return (
    <div className="h-full">
      <Card className="h-full flex flex-col">
        <CardContent className="flex-1 flex flex-col">
          {/* Book Cover Skeleton */}
          <div className="mb-4 flex h-48 items-end rounded-lg bg-neutral-200 p-4 shrink-0 animate-pulse">
            <div className="h-8 w-8 rounded bg-neutral-300" />
          </div>

          {/* Book Info Skeleton */}
          <div className="space-y-3 flex-1 flex flex-col">
            <div className="shrink-0">
              {/* Title skeleton */}
              <div className="h-5 bg-neutral-200 rounded animate-pulse w-3/4 mb-2" />
              <div className="h-5 bg-neutral-200 rounded animate-pulse w-1/2" />
              {/* Author skeleton */}
              <div className="mt-1 h-4 bg-neutral-200 rounded animate-pulse w-1/3" />
            </div>

            {/* Progress Skeleton */}
            <div className="space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-neutral-200 rounded animate-pulse w-32" />
                <div className="h-4 bg-neutral-200 rounded animate-pulse w-8" />
              </div>
              <div className="h-1.5 bg-neutral-200 rounded-full animate-pulse" />
            </div>

            {/* Spacer */}
            <div className="flex-1"></div>

            {/* Status Skeleton */}
            <div className="shrink-0">
              <div className="flex items-center justify-between pb-2">
                <div className="h-6 bg-neutral-200 rounded-full animate-pulse w-20" />
              </div>
              <div className="h-3 bg-neutral-200 rounded animate-pulse w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
