'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
import { Separator } from '@/components/ui/separator'
import { BookOpen, Library as LibraryIcon, Upload, Trash2, Settings, Pencil, Download, RefreshCw, Eye, Heart, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { AppHeader } from '@/components/ui/app-header'
import { UploadPdfDialog } from '@/components/upload/upload-pdf-dialog'
import { BookUploadItem } from '@/components/upload/book-upload-item'
import { EmptyLibraryUpload } from '@/components/upload/file-upload-zone'
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
import { OnboardingTutorial } from '@/components/onboarding/onboarding-tutorial'

const statusConfig = {
  PROCESSING: { label: 'Processing', color: 'bg-amber-500', uiStatus: 'reading' },
  READY: { label: 'New', color: 'bg-emerald-500', uiStatus: 'completed' },
  ERROR: { label: 'Error', color: 'bg-red-500', uiStatus: 'reading' },
}

// Apple Books-style subtle background - consistent neutral style
const coverStyle = {
  bg: 'bg-zinc-100 dark:bg-zinc-800',
  text: 'text-zinc-500 dark:text-zinc-400',
  initialsBg: 'bg-zinc-200 dark:bg-zinc-700'
}

// Generate initials from book title (max 2 characters)
function getBookInitials(title: string): string {
  const words = title.split(/[\s:]+/).filter(w => w.length > 0);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Mock data for Community Favorites
interface CommunityBook {
  id: string
  title: string
  author: string
  readersCount: number
  rating: number
}

const communityFavorites: CommunityBook[] = [
  {
    id: 'comm-1',
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    readersCount: 12543,
    rating: 4.8,
  },
  {
    id: 'comm-2',
    title: 'The Pragmatic Programmer',
    author: 'Andrew Hunt, David Thomas',
    readersCount: 9821,
    rating: 4.9,
  },
  {
    id: 'comm-3',
    title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
    author: 'Gang of Four',
    readersCount: 8765,
    rating: 4.7,
  },
]

export function Library() {
  const uploadingBooks = useUploadStore((state) => state.uploadingBooks)
  const cancelUpload = useUploadStore((state) => state.cancelUpload)
  const retryUpload = useUploadStore((state) => state.retryUpload)

  const { books, isLoading, refetch, deleteBook } = useBooks()

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

  // Show empty state when no books and no active uploads (allows re-appearing after deletion)
  const showEmptyState = !isLoading && books.length === 0 && activeUploads.length === 0

  return (
    <div className="min-h-screen bg-background">
      <OnboardingTutorial />
      <AppHeader />
      <main className="mx-auto max-w-7xl py-8 pb-16 px-[5%]">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Your Library
            </h2>
            <p className="mt-2 text-muted-foreground">
              {totalBooks} {totalBooks === 1 ? 'book' : 'books'}
              {processingBooks > 0 && (
                <span className="text-muted-foreground/80"> ({processingBooks} processing)</span>
              )}
              {activeUploads.length > 0 && (
                <span className="text-muted-foreground/80"> &bull; {activeUploads.length} uploading</span>
              )}
            </p>
          </div>
          <UploadPdfDialog />
        </div>

        {/* Loading State - Skeleton Cards */}
        {isLoading && books.length === 0 && activeUploads.length === 0 && (
          <motion.div 
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.35, 
                  delay: i * 0.04,
                  ease: "easeOut"
                }}
              >
                <BookCardSkeleton />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Content Area with AnimatePresence for switching between Empty State and Books Grid */}
        <AnimatePresence mode="wait">
          {/* Empty State */}
          {showEmptyState && (
            <EmptyLibraryUpload maxFiles={3} />
          )}

          {/* Books Grid */}
          {(books.length > 0 || activeUploads.length > 0) && (
            <motion.div 
              key="books-grid"
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <AnimatePresence mode="popLayout">
                {/* Uploading books */}
                {activeUploads.map((book) => (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <BookUploadItem
                      id={book.id}
                      fileName={book.fileName}
                      progress={book.progress}
                      currentStep={book.currentStep}
                      status={book.status}
                      error={book.error}
                      onCancel={cancelUpload}
                      onRetry={retryUpload}
                    />
                  </motion.div>
                ))}

                {/* Books from database */}
                {books.map((book) => (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <BookCard book={book} onDelete={deleteBook} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <Separator className='mt-14'></Separator>

        {/* Community Favorites Section */}
        <section className="mt-4 pt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Community Favorites
              </h2>
              <p className="mt-1 text-muted-foreground">
                Most read books by the DeepRead community
              </p>
            </div>
            <Button  className="gap-1">
              Explore
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {communityFavorites.map((book, index) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <CommunityBookCard book={book} />
              </motion.div>
            ))}
          </div>
        </section>
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
  const progress = book.status === 'READY' ? 0 : book.status === 'PROCESSING' ? 0 : 0
  const initials = getBookInitials(book.title)

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
          <Card className="cursor-pointer transition-all hover:shadow-lg hover:shadow-muted/50 h-full flex flex-col">
            <CardContent className="flex-1 flex flex-col">
              {/* Book Cover Placeholder */}
              <div
                className={`mb-4 h-48 rounded-lg ${coverStyle.bg} shrink-0 relative overflow-hidden border border-border/50`}
              >
                {/* Subtle texture */}
                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_50%_50%,currentColor_1px,transparent_1px)] bg-[length:8px_8px]" />
                
                {/* Book spine effect */}
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-black/5 dark:bg-white/5" />
                
                {/* Status Badge - Top Right */}
                <div className="absolute top-3 right-3 z-20">
                  <Badge
                    variant="secondary"
                    className={`${config.color} border-0 text-white text-[10px] px-2 py-0.5`}
                  >
                    {config.label}
                  </Badge>
                </div>
                
                {/* Content - centered initials */}
                <div className="h-full flex items-center justify-center relative z-10">
                  <div className={`w-20 h-20 rounded-full ${coverStyle.initialsBg} flex items-center justify-center`}>
                    <span className={`text-2xl font-semibold tracking-tight ${coverStyle.text}`}>{initials}</span>
                  </div>
                </div>
              </div>

              {/* Book Info */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* Title & Author - grows to push progress down */}
                <div className="flex-1">
                  <h3 className="font-semibold leading-tight text-foreground line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {book.author || 'Unknown Author'}
                  </p>
                </div>

                {/* Progress - always at bottom */}
                <div className="space-y-2 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Reading progress</span>
                    <span className="font-medium text-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>

                {/* Status and Action Buttons - always at bottom */}
                <div className="pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground/80">
                      Added {new Date(book.createdAt).toLocaleDateString()}
                    </span>

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
                                    className="h-7 w-7 hover:bg-accent transition-colors"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setSettingsOpen(!settingsOpen)
                                    }}
                                  >
                                    <Settings className="h-4 w-4 text-muted-foreground" />
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
                                    <Button
                                      variant="ghost"
                                      className="w-full justify-start text-sm h-9"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        window.location.href = `/preview/${book.id}`
                                      }}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      Debug / Preview
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
        <AlertDialogContent className="sm:max-w-sm gap-0">
          <div className="flex flex-col items-center">
            {/* Icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-3">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>

            {/* Title */}
            <AlertDialogTitle className="text-center text-lg font-semibold">
              Delete &quot;{book.title}&quot;?
            </AlertDialogTitle>

            {/* Description */}
            <AlertDialogDescription className="mt-1.5 text-center text-sm text-muted-foreground">
              This action cannot be undone. The PDF and all data will be permanently removed.
            </AlertDialogDescription>

            {/* Book Preview */}
            <div className="mt-8 mb-3 w-full rounded-lg border border-border/50 bg-muted/30 p-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-9 items-center justify-center rounded ${coverStyle.initialsBg}`}>
                  <span className={`text-xs font-semibold ${coverStyle.text}`}>{initials}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{book.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{book.author || 'Unknown Author'}</p>
                </div>
              </div>
            </div>
          </div>

          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel 
              disabled={isDeleting}
              className="h-10 flex-1"
            >
              Keep Book
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-10 flex-1 gap-2 bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function CommunityBookCard({ book }: { book: CommunityBook }) {
  const initials = getBookInitials(book.title)

  return (
    <Card className="cursor-pointer transition-all hover:shadow-lg hover:shadow-muted/50 h-full flex flex-col group">
      <CardContent className="flex-1 flex flex-col">
        {/* Book Cover Placeholder */}
        <div
          className={`mb-4 h-48 rounded-lg ${coverStyle.bg} shrink-0 relative overflow-hidden border border-border/50`}
        >
          {/* Subtle texture */}
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_50%_50%,currentColor_1px,transparent_1px)] bg-[length:8px_8px]" />
          
          {/* Book spine effect */}
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-black/5 dark:bg-white/5" />
          
          {/* Rating badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-background/90 border border-border/50 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium z-20">
            <span className="text-amber-500">★</span>
            <span className="text-foreground">{book.rating}</span>
          </div>
          
          {/* Content - centered initials */}
          <div className="h-full flex items-center justify-center relative z-10">
            <div className={`w-20 h-20 rounded-full ${coverStyle.initialsBg} flex items-center justify-center`}>
              <span className={`text-2xl font-semibold tracking-tight ${coverStyle.text}`}>{initials}</span>
            </div>
          </div>
        </div>

        {/* Book Info */}
        <div className="space-y-3 flex-1 flex flex-col">
          <div className="shrink-0">
            <h3 className="font-semibold leading-tight text-foreground line-clamp-2">
              {book.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {book.author}
            </p>
          </div>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Readers count */}
          <div className="shrink-0 flex items-center gap-2 text-sm text-muted-foreground">
            <Heart className="h-4 w-4 text-rose-500" />
            <span>{book.readersCount.toLocaleString()} readers</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function BookCardSkeleton() {
  return (
    <div className="h-full">
      <Card className="h-full flex flex-col">
        <CardContent className="flex-1 flex flex-col">
          {/* Book Cover Skeleton */}
          <div className="mb-4 h-48 rounded-lg bg-muted shrink-0 animate-pulse flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-muted-foreground/10" />
          </div>

          {/* Book Info Skeleton */}
          <div className="space-y-3 flex-1 flex flex-col">
            <div className="shrink-0">
              {/* Title skeleton */}
              <div className="h-5 bg-muted rounded animate-pulse w-3/4 mb-2" />
              <div className="h-5 bg-muted rounded animate-pulse w-1/2" />
              {/* Author skeleton */}
              <div className="mt-1 h-4 bg-muted rounded animate-pulse w-1/3" />
            </div>

            {/* Progress Skeleton */}
            <div className="space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-muted rounded animate-pulse w-32" />
                <div className="h-4 bg-muted rounded animate-pulse w-8" />
              </div>
              <div className="h-1.5 bg-muted rounded-full animate-pulse" />
            </div>

            {/* Spacer */}
            <div className="flex-1"></div>

            {/* Status Skeleton */}
            <div className="shrink-0">
              <div className="flex items-center justify-between pb-2">
                <div className="h-6 bg-muted rounded-full animate-pulse w-20" />
              </div>
              <div className="h-3 bg-muted rounded animate-pulse w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
