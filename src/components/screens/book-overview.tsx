'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ArrowLeft, BookOpen, FileText, CheckCircle2, Circle, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { AppHeader } from '@/components/ui/app-header'
import { useState } from 'react'

const mockChapters = [
  {
    id: 1,
    number: 1,
    title: 'Introduction',
    read: true,
    notes: true,
    test: true,
  },
  {
    id: 2,
    number: 2,
    title: 'Reliable, Scalable, and Maintainable Applications',
    read: true,
    notes: true,
    test: false,
  },
  {
    id: 3,
    number: 3,
    title: 'Storage and Retrieval',
    read: true,
    notes: false,
    test: false,
  },
  {
    id: 4,
    number: 4,
    title: 'Encoding and Evolution',
    read: false,
    notes: false,
    test: false,
  },
  {
    id: 5,
    number: 5,
    title: 'Replication',
    read: false,
    notes: false,
    test: false,
  },
  {
    id: 6,
    number: 6,
    title: 'Partitioning',
    read: false,
    notes: false,
    test: false,
  },
]

export function BookOverview({ bookId }: { bookId: string }) {
  const [isChaptersOpen, setIsChaptersOpen] = useState(true)

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl py-6 px-[5%]">
        {/* Back Link */}
        <Button variant="ghost" size="sm" asChild className="mb-4 pl-0">
          <Link
            href="/"
            className="inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Link>
        </Button>

        {/* Book Header */}
        <div className="mb-8">
          <h2 className="text-4xl font-semibold tracking-tight text-foreground">
            Designing Data-Intensive Applications
          </h2>
          <p className="mt-2 text-lg text-muted-foreground">Martin Kleppmann</p>

          <div className='flex gap-2 my-4'>
            <Button size="lg" className='p-4'>
              <Link
                href="/book/designing-data-intensive-apps/chapter/1"
              >
                Continue reading
              </Link>
            </Button>

            <Button size="lg" variant="secondary" className='p-4'>
              <Link
                href="/book/designing-data-intensive-apps/test/1"
              >
                Test your knowledge
              </Link>
            </Button>
          </div>
        </div>


        {/* Chapters List */}
        <Card className='mb-6'>
          <Collapsible open={isChaptersOpen} onOpenChange={setIsChaptersOpen}>
            <CardHeader className="">
              <CollapsibleTrigger className="flex w-full items-center justify-between hover:opacity-70">
                <CardTitle className="text-xl font-semibold">Chapters</CardTitle>
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${
                    isChaptersOpen ? 'rotate-180' : ''
                  }`}
                />
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-1 pt-3">
                {mockChapters.map((chapter, index) => (
                  <Link
                    key={chapter.id}
                    href={`/book/${bookId}/chapter/${chapter.id}`}
                    className="group block"
                  >
                    <div className="flex items-center justify-between rounded-lg py-4 transition-colors hover:bg-accent/50">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-muted-foreground/80">
                          {chapter.number}.
                        </span>
                        <span className="font-medium text-foreground group-hover:text-muted-foreground">
                          {chapter.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Read Indicator */}
                        <div className="flex items-center gap-1.5" title="Read">
                          {chapter.read ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground/30" />
                          )}
                          <BookOpen className="h-4 w-4 text-muted-foreground/50" />
                        </div>

                        {/* Notes Indicator */}
                        <div className="flex items-center gap-1.5" title="Notes">
                          {chapter.notes ? (
                            <CheckCircle2 className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground/30" />
                          )}
                          <FileText className="h-4 w-4 text-muted-foreground/50" />
                        </div>

                        {/* Test Indicator */}
                        <div className="flex items-center gap-1.5" title="Test">
                          {chapter.test ? (
                            <CheckCircle2 className="h-4 w-4 text-purple-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground/30" />
                          )}
                          <Badge
                            variant="outline"
                            className="h-4 w-4 rounded-full border-muted-foreground/60 p-0"
                          />
                        </div>
                      </div>
                    </div>
                    {index < mockChapters.length - 1 && (
                      <div className="ml-4 border-b border-border" />
                    )}
                  </Link>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
        <div className='flex gap-6'>
          {/* Progress Overview */}
          <Card className="w-1/2">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Your Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Reading Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                    <BookOpen className="h-4 w-4" />
                    Reading Progress
                  </div>
                  <span className="text-sm font-semibold text-neutral-900">50%</span>
                </div>
                <Progress value={50} className="h-2" />
                <p className="text-xs text-muted-foreground/80">3 of 6 chapters read</p>
              </div>

              {/* Notes Completed */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                    <FileText className="h-4 w-4" />
                    Notes Completed
                  </div>
                  <span className="text-sm font-semibold text-neutral-900">33%</span>
                </div>
                <Progress value={33} className="h-2" />
                <p className="text-xs text-muted-foreground/80">2 of 6 chapters with notes</p>
              </div>

              {/* Understanding (Tests) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Understanding
                  </div>
                  <span className="text-sm font-semibold text-neutral-900">17%</span>
                </div>
                <Progress value={17} className="h-2" />
                <p className="text-xs text-muted-foreground/80">1 of 6 chapters tested</p>
              </div>
            </CardContent>
          </Card>

          {/* What I'm Taking From This Book */}
          <Card className="gap-2 w-1/2">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">
                What I'm taking from this book so far
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed text-muted-foreground">
                The core insight is that data systems need to be designed with three key properties in
                mind: reliability, scalability, and maintainability. What's interesting is how these
                concepts are interconnected—you can't optimize for one without considering the
                trade-offs with the others. The storage engine discussion really clarified the
                difference between OLTP and OLAP workloads and why different data structures (LSM-trees
                vs B-trees) matter for different use cases.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
