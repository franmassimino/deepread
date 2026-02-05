import { TestView } from '@/components/screens/test-view'

export default async function TestPage({
  params,
}: {
  params: Promise<{ bookId: string; chapterId: string }>
}) {
  const { bookId, chapterId } = await params
  return <TestView bookId={bookId} chapterId={chapterId} />
}
