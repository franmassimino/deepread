import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Trash2, Edit2, Check, X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Note, NoteColor, noteColors } from './types'
import { AIActionButtons } from './ai-action-buttons'

interface NoteCardProps {
  note: Note
  onEdit: (note: Note) => void
  onDelete: (id: string) => void
  onAIAction: (action: string, noteId?: string) => void
}

export function NoteCard({ note, onEdit, onDelete, onAIAction }: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(note.title || '')
  const [editContent, setEditContent] = useState(note.content)
  const [editColor, setEditColor] = useState<NoteColor>(note.color)

  const colorScheme = noteColors[note.color]

  const handleStartEdit = () => {
    setIsEditing(true)
    setEditTitle(note.title || '')
    setEditContent(note.content)
    setEditColor(note.color)
  }

  const handleSave = () => {
    onEdit({
      ...note,
      title: editTitle.trim() || undefined,
      content: editContent,
      color: editColor,
      updatedAt: new Date(),
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditTitle(note.title || '')
    setEditContent(note.content)
    setEditColor(note.color)
  }

  return (
    <Card className={`p-4 border-l-4 ${colorScheme.bg} ${colorScheme.border} gap-3`}>
      {isEditing ? (
        <div className="">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-neutral-700">Color:</span>
            <Select value={editColor} onValueChange={(value) => setEditColor(value as NoteColor)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(noteColors).map((color) => (
                  <SelectItem key={color} value={color} className="text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded ${noteColors[color as NoteColor].bg} border ${
                          noteColors[color as NoteColor].border
                        }`}
                      />
                      <span className="capitalize">{color}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            placeholder="Title (optional)"
            className="border-neutral-200 text-sm bg-white"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[150px] resize-none border-neutral-200 text-sm leading-relaxed bg-white"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={handleCancel} className="text-xs h-8">
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} className="text-xs h-8">
              <Check className="h-3 w-3 mr-1" />
              Save
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <span className="text-xs text-neutral-500">
              {note.createdAt.toLocaleDateString()}{' '}
              {note.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleStartEdit}
                className="h-7 w-7 p-0 text-neutral-600 hover:text-neutral-900"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(note.id)}
                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {note.title && (
            <h4 className={`text-base font-semibold ${colorScheme.text}`}>{note.title}</h4>
          )}
          <p className={`text-sm leading-relaxed whitespace-pre-wrap ${colorScheme.text}`}>
            {note.content}
          </p>

          <AIActionButtons noteId={note.id} onAction={onAIAction} />
        </>
      )}
    </Card>
  )
}
