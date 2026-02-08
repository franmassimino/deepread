'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Brain, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { AppHeader } from '../ui/app-header'

export function TestView({ bookId, chapterId }: { bookId: string; chapterId: string }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <AppHeader />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl py-6 px-[5%]">
         {/* Back Link */}
         <Button variant="ghost" size="sm" asChild className="mb-4 pl-0">
          <Link
            href="/book/designing-data-intensive-apps"
            className="inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Book
          </Link>
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Understanding Check
            </h2>
            <Badge variant="outline">Question 2 of 5</Badge>
          </div>
          <p className="text-muted-foreground">
            Chapter 3: Storage and Retrieval • Designing Data-Intensive Applications
          </p>
        </div>

        {/* Question Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-medium leading-relaxed text-foreground">
              Explain the fundamental trade-off between write performance and read performance in
              the context of log-structured storage. Why does this trade-off exist, and how do
              databases attempt to balance it?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="mb-3 block text-sm font-medium text-muted-foreground">
                Your Answer
              </label>
              <Textarea
                placeholder="Take your time to think and write a comprehensive answer..."
                className="min-h-[280px] resize-none text-base leading-relaxed focus-visible:ring-ring"
                defaultValue=""
              />
              <p className="mt-2 text-xs text-muted-foreground/80">
                Focus on explaining the concepts in your own words, not memorizing definitions.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline">Skip for Now</Button>
              <Button>Submit Answer</Button>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-12" />

        {/* Feedback Section (Example - shown after submission) */}
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold text-foreground">Feedback</h3>

          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-green-900">
                <CheckCircle2 className="h-5 w-5" />
                Strong Understanding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-green-900/80">
              <div>
                <p className="mb-2 font-medium">What you explained well:</p>
                <ul className="space-y-2 pl-5">
                  <li className="list-disc">
                    You correctly identified that appending to a log provides O(1) write
                    performance because it's a sequential operation
                  </li>
                  <li className="list-disc">
                    You explained that reading requires scanning the entire log, resulting in O(n)
                    time complexity
                  </li>
                  <li className="list-disc">
                    You connected this to the need for indexes as auxiliary data structures
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-amber-900">
                <AlertCircle className="h-5 w-5" />
                Areas to Deepen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-amber-900/80">
              <div>
                <p className="mb-2 font-medium">Consider exploring:</p>
                <ul className="space-y-2 pl-5">
                  <li className="list-disc">
                    <strong>The cost of indexes:</strong> While you mentioned that indexes improve
                    read performance, you didn't discuss the write amplification they introduce.
                    Every write now requires updating both the log and the index structures.
                  </li>
                  <li className="list-disc">
                    <strong>Compaction and merging:</strong> The chapter discusses how
                    log-structured storage engines use background processes to merge and compact
                    segments. This is a key part of how they balance the trade-off.
                  </li>
                  <li className="list-disc">
                    <strong>Real-world examples:</strong> Try connecting this to actual systems like
                    LSM-trees (used in LevelDB, RocksDB) versus B-trees (used in most relational
                    databases).
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Suggested Review
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">
              <p className="mb-3">
                Re-read the section on "Hash Indexes" and "SSTables and LSM-Trees" in Chapter 3.
                Pay special attention to:
              </p>
              <ul className="space-y-2 pl-5">
                <li className="list-disc">
                  How compaction reduces the number of segments that need to be checked during reads
                </li>
                <li className="list-disc">
                  The specific mechanisms LSM-trees use to maintain sorted order while preserving
                  fast writes
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="flex justify-between pt-4">
            <Button variant="outline">Previous Question</Button>
            <Button>Next Question</Button>
          </div>
        </div>
      </main>
    </div>
  )
}
