'use client'

import { BookOpen, MoreHorizontal, Trash2, Upload, Brain, Settings, Moon, User } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ModeToggle } from '@/components/mode-toggle'

interface Book {
  id: string
  title: string
  author: string
  mastery: number
  status: 'new' | 'in_progress' | 'completed'
  addedDate: string
  coverGradient: string
}

const books: Book[] = [
  {
    id: '1',
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    mastery: 68,
    status: 'in_progress',
    addedDate: '6/2/2026',
    coverGradient: 'from-blue-500/20 via-purple-500/20 to-indigo-500/20',
  },
  {
    id: '2',
    title: 'Atomic Habits: An Easy & Proven Way to Build Good Habits',
    author: 'James Clear',
    mastery: 0,
    status: 'new',
    addedDate: '5/2/2026',
    coverGradient: 'from-emerald-500/20 via-teal-500/20 to-cyan-500/20',
  },
  {
    id: '3',
    title: 'Deep Work: Rules for Focused Success in a Distracted World',
    author: 'Cal Newport',
    mastery: 100,
    status: 'completed',
    addedDate: '1/2/2026',
    coverGradient: 'from-amber-500/20 via-orange-500/20 to-red-500/20',
  },
]

function getStatusBadge(status: Book['status']) {
  switch (status) {
    case 'new':
      return <Badge variant="secondary">New</Badge>
    case 'in_progress':
      return (
        <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">
          In Progress
        </Badge>
      )
    case 'completed':
      return (
        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">
          Completed
        </Badge>
      )
  }
}

function AppHeader() {
  return (
    <header className="border-b border-zinc-800 bg-[#09090b]">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-zinc-100 hover:text-zinc-300 transition-colors"
          >
            <Brain className="h-5 w-5" />
            <span className="font-semibold text-xl tracking-tight">DeepRead</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
              <Moon className="h-4 w-4" />
            </Button>
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <div className="h-5 w-px bg-zinc-800" />
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              <User className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-100">Francisco</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

function BookCard({ book }: { book: Book }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-lg bg-zinc-900 border border-zinc-800 transition-all hover:border-zinc-700">
      {/* Cover Area */}
      <div 
        className={`relative aspect-[4/3] bg-gradient-to-br ${book.coverGradient} rounded-t-lg flex flex-col items-center justify-center p-6`}
      >
        <h3 className="text-center font-serif text-xl md:text-2xl font-medium text-zinc-100 line-clamp-3 leading-tight">
          {book.title}
        </h3>
        <BookOpen className="h-6 w-6 text-zinc-400/60 mt-4" />
      </div>

      {/* Card Body */}
      <div className="flex flex-col p-4 space-y-3">
        <div>
          <h4 className="font-semibold text-base text-zinc-100 line-clamp-2 leading-snug">
            {book.title}
          </h4>
          <p className="text-sm text-zinc-400 mt-1">{book.author}</p>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Mastery</span>
            <span className="text-zinc-300 font-medium">{book.mastery}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                book.mastery === 100 ? 'bg-emerald-500' : 'bg-blue-500'
              }`}
              style={{ width: `${book.mastery}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            {getStatusBadge(book.status)}
            <span className="text-xs text-zinc-500">Added {book.addedDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LibraryPage() {
  return (
    <div className="min-h-screen bg-[#09090b]">
      <AppHeader />
      
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-100">Your Library</h1>
            <p className="text-zinc-400 mt-1">{books.length} {books.length === 1 ? 'book' : 'books'}</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shrink-0">
            <Upload className="h-4 w-4 mr-2" />
            Upload a book
          </Button>
        </div>

        {/* Book Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>

        {/* Empty State (hidden for now) */}
        {books.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-zinc-500" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-100">No books yet</h3>
            <p className="text-zinc-400 mt-1 max-w-sm">
              Upload your first book to start building your knowledge library
            </p>
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
              <Upload className="h-4 w-4 mr-2" />
              Upload a book
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
