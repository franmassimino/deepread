import { ReadingView } from '@/components/screens/reading-view'

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ bookId: string; chapterId: string }>
}) {
  const { bookId, chapterId } = await params
  return <ReadingView bookId={bookId} chapterId={chapterId} />
}
