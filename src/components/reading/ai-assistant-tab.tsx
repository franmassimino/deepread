import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, ListChecks, MessagesSquare } from 'lucide-react'

const AI_TOOLS = [
  {
    id: 'questions',
    icon: Sparkles,
    title: 'Generate Questions',
    description: 'Create conceptual questions based on this chapter to test your understanding.',
    buttonText: 'Generate Questions',
  },
  {
    id: 'test',
    icon: ListChecks,
    title: 'Create Mini Test',
    description: 'Generate a short test to verify you understand the key concepts.',
    buttonText: 'Create Test',
  },
  {
    id: 'compare',
    icon: MessagesSquare,
    title: 'Compare Summary',
    description: 'Compare your notes with the chapter content to identify gaps.',
    buttonText: 'Compare with Text',
  },
]

export function AIAssistantTab() {
  return (
    <div className="mt-6 space-y-4">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">AI Assistant</h3>
        <p className="mb-6 text-xs text-muted-foreground">
          Contextual tools to deepen your understanding.
        </p>
      </div>

      {AI_TOOLS.map((tool) => {
        const Icon = tool.icon
        return (
          <Card key={tool.id} className="border-border gap-3">
            <CardHeader className="">
              <CardTitle className="flex items-center gap-2 text-md font-medium">
                <Icon className="h-4 w-4" />
                {tool.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-md text-muted-foreground">
                {tool.description}
              </p>
              <Button size="lg" className="w-full text-xs">
                {tool.buttonText}
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
