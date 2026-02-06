'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  ArrowLeft, 
  BookOpen, 
  FileText, 
  Image as ImageIcon, 
  AlertCircle,
  Clock,
  Calendar,
  Hash,
  Type,
  ChevronDown,
  ChevronRight,
  Copy,
  Check
} from 'lucide-react'
import Link from 'next/link'
import { AppHeader } from '@/components/ui/app-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface Chapter {
  id: string
  chapterNumber: number
  title: string
  content: string
  wordCount: number
  startPage: number | null
  endPage: number | null
  createdAt: string
}

interface Image {
  id: string
  filename: string
  pageNumber: number
  width: number
  height: number
  createdAt: string
}

interface Book {
  id: string
  title: string
  author: string | null
  summary: string
  coverUrl: string | null
  pdfPath: string
  totalPages: number
  wordCount: number
  readingTimeMinutes: number
  status: 'PROCESSING' | 'READY' | 'ERROR'
  errorMessage: string | null
  createdAt: string
  updatedAt: string
  chapters: Chapter[]
  images: Image[]
}

export function PreviewView({ bookId }: { bookId: string }) {
  const [book, setBook] = useState<Book | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBookDetails() {
      try {
        const response = await fetch(`/api/books/${bookId}/details`)
        if (!response.ok) {
          throw new Error('Failed to fetch book details')
        }
        const data = await response.json()
        setBook(data.book)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookDetails()
  }, [bookId])

  const toggleChapter = (chapterNumber: number) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev)
      if (newSet.has(chapterNumber)) {
        newSet.delete(chapterNumber)
      } else {
        newSet.add(chapterNumber)
      }
      return newSet
    })
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-7xl py-6 px-[5%]">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading book details...</div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-7xl py-6 px-[5%]">
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {error || 'Book not found'}
            </div>
          </div>
        </main>
      </div>
    )
  }

  const statusConfig = {
    PROCESSING: { label: 'Processing', color: 'bg-amber-500', textColor: 'text-amber-600' },
    READY: { label: 'Ready', color: 'bg-green-500', textColor: 'text-green-600' },
    ERROR: { label: 'Error', color: 'bg-red-500', textColor: 'text-red-600' },
  }

  const config = statusConfig[book.status]

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto max-w-7xl py-6 px-[5%]">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4 pl-0">
            <Link href="/" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Library
            </Link>
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                  {book.title}
                </h1>
                <Badge className={`${config.color} text-white border-0`}>
                  {config.label}
                </Badge>
              </div>
              <p className="text-lg text-muted-foreground">
                {book.author || 'Unknown Author'}
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              ID: {book.id}
            </Badge>
          </div>
        </div>

        {/* Book Metadata */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Book Metadata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetadataItem 
                icon={<Hash className="h-4 w-4" />} 
                label="Total Pages" 
                value={book.totalPages.toString()} 
              />
              <MetadataItem 
                icon={<Type className="h-4 w-4" />} 
                label="Word Count" 
                value={book.wordCount.toLocaleString()} 
              />
              <MetadataItem 
                icon={<Clock className="h-4 w-4" />} 
                label="Reading Time" 
                value={`${book.readingTimeMinutes} min`} 
              />
              <MetadataItem 
                icon={<FileText className="h-4 w-4" />} 
                label="Chapters" 
                value={book.chapters.length.toString()} 
              />
              <MetadataItem 
                icon={<ImageIcon className="h-4 w-4" />} 
                label="Images" 
                value={book.images.length.toString()} 
              />
              <MetadataItem 
                icon={<Calendar className="h-4 w-4" />} 
                label="Created" 
                value={new Date(book.createdAt).toLocaleString()} 
              />
              <MetadataItem 
                icon={<Calendar className="h-4 w-4" />} 
                label="Updated" 
                value={new Date(book.updatedAt).toLocaleString()} 
              />
              <MetadataItem 
                icon={<AlertCircle className="h-4 w-4" />} 
                label="Status" 
                value={book.status}
                valueClassName={config.textColor}
              />
            </div>

            {book.errorMessage && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">
                  <strong>Error:</strong> {book.errorMessage}
                </p>
              </div>
            )}

            {book.summary && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Summary</h4>
                <p className="text-sm text-foreground bg-muted p-3 rounded-md">
                  {book.summary}
                </p>
              </div>
            )}

            <div className="mt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">PDF Path</h4>
              <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
                {book.pdfPath}
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="chapters" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="chapters" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Chapters ({book.chapters.length})
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Images ({book.images.length})
            </TabsTrigger>
            <TabsTrigger value="raw" className="flex items-center gap-2">
              <CodeIcon className="h-4 w-4" />
              Raw Data
            </TabsTrigger>
          </TabsList>

          {/* Chapters Tab */}
          <TabsContent value="chapters">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Extracted Chapters</CardTitle>
              </CardHeader>
              <CardContent>
                {book.chapters.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No chapters extracted yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {book.chapters.map((chapter) => (
                      <Collapsible 
                        key={chapter.id} 
                        open={expandedChapters.has(chapter.chapterNumber)}
                        onOpenChange={() => toggleChapter(chapter.chapterNumber)}
                      >
                        <div className="border rounded-lg overflow-hidden">
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors">
                              <div className="flex items-center gap-3">
                                {expandedChapters.has(chapter.chapterNumber) ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                                <div className="text-left">
                                  <span className="font-medium">
                                    Chapter {chapter.chapterNumber}: {chapter.title}
                                  </span>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                    <span>{chapter.wordCount.toLocaleString()} words</span>
                                    {chapter.startPage && (
                                      <span>Pages {chapter.startPage}-{chapter.endPage}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Badge variant="outline" className="font-mono text-xs shrink-0">
                                ID: {chapter.id.slice(0, 8)}...
                              </Badge>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="p-4 border-t">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-muted-foreground">Content:</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2"
                                  onClick={() => copyToClipboard(chapter.content, chapter.id)}
                                >
                                  {copiedId === chapter.id ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                  <span className="ml-1 text-xs">
                                    {copiedId === chapter.id ? 'Copied!' : 'Copy'}
                                  </span>
                                </Button>
                              </div>
                              <ScrollArea className="h-64 w-full rounded-md border bg-muted/30 p-4">
                                <pre className="text-sm whitespace-pre-wrap font-mono text-foreground">
                                  {chapter.content || '(No content)'}
                                </pre>
                              </ScrollArea>
                              <div className="mt-3 text-xs text-muted-foreground">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>Created: {new Date(chapter.createdAt).toLocaleString()}</div>
                                  <div>Chapter ID: {chapter.id}</div>
                                </div>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Extracted Images</CardTitle>
              </CardHeader>
              <CardContent>
                {book.images.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No images extracted yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {book.images.map((image) => (
                      <div key={image.id} className="border rounded-lg p-4">
                        <div className="aspect-video bg-muted rounded-md mb-3 flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium truncate">{image.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            Page {image.pageNumber} • {image.width}x{image.height}px
                          </p>
                          <p className="text-xs font-mono text-muted-foreground">
                            ID: {image.id}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Raw Data Tab */}
          <TabsContent value="raw">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Raw JSON Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(book, null, 2), 'raw-data')}
                  >
                    {copiedId === 'raw-data' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    <span className="ml-2">
                      {copiedId === 'raw-data' ? 'Copied!' : 'Copy JSON'}
                    </span>
                  </Button>
                </div>
                <ScrollArea className="h-[600px] w-full rounded-md border bg-muted/30 p-4">
                  <pre className="text-xs font-mono text-foreground">
                    {JSON.stringify(book, null, 2)}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function MetadataItem({ 
  icon, 
  label, 
  value,
  valueClassName = ''
}: { 
  icon: React.ReactNode
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <span className={`text-sm font-medium ${valueClassName}`}>{value}</span>
    </div>
  )
}

function CodeIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  )
}
