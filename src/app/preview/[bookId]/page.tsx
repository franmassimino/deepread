import { PreviewView } from '@/components/screens/preview-view'

export default async function PreviewPage({
  params
}: {
  params: Promise<{ bookId: string }>
}) {
  const { bookId } = await params
  return <PreviewView bookId={bookId} />
}
