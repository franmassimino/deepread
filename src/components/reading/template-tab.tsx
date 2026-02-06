import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const TEMPLATE_QUESTIONS = [
  {
    id: 'main-idea',
    label: 'What is the main idea of this chapter?',
    placeholder: 'In one or two sentences...',
  },
  {
    id: 'problem',
    label: 'What problem does this solve?',
    placeholder: 'What real-world issue does this address?',
  },
  {
    id: 'unclear',
    label: 'What is still unclear to you?',
    placeholder: 'Questions, confusions, or areas to explore...',
  },
  {
    id: 'connections',
    label: 'How does this connect to what you already know?',
    placeholder: 'Links to other concepts, experiences, or chapters...',
  },
]

export function TemplateTab() {
  return (
    <div className="mt-4 space-y-4">
      <div>
        <h3 className="mb-1 text-lg font-semibold text-foreground">
          Chapter Reflection Template
        </h3>
        <p className="mb-6 text-xs text-muted-foreground">
          Answer these questions to deepen your understanding.
        </p>
      </div>

      <div className="space-y-4">
        {TEMPLATE_QUESTIONS.map((question) => (
          <div key={question.id} className="flex flex-col gap-1">
            <label className="mb-2 text-sm font-medium text-muted-foreground">
              {question.label}
            </label>
            <Textarea
              placeholder={question.placeholder}
              className="min-h-[80px] bg-background resize-none text-sm"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button size="sm" variant="outline" className="text-xs">
          Clear All
        </Button>
        <Button size="sm" className="text-xs">
          Save Responses
        </Button>
      </div>
    </div>
  )
}
