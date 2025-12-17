'use client'

import { useState } from 'react'
import { Note, NoteColor } from './notes/types'
import { NoteForm } from './notes/note-form'
import { NoteCard } from './notes/note-card'

const initialNotes: Note[] = [
  {
    id: '1',
    title: 'Storage Engine Trade-offs',
    content:
      "Key insight: The trade-off between write performance and read performance is fundamental to storage engine design.\n\nAppending to a log = fast writes (O(1))\nReading from a log = slow reads (O(n))\n\nThis explains why databases need indexes - they're additional structures that sacrifice write performance to improve read performance.",
    color: 'yellow',
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-15T10:30:00'),
  },
  {
    id: '2',
    content:
      'Question: How do LSM-trees balance this trade-off?\n\nNeed to research more about compaction strategies.',
    color: 'blue',
    createdAt: new Date('2024-01-15T11:45:00'),
    updatedAt: new Date('2024-01-15T11:45:00'),
  },
]

export function NotesTab() {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [newNoteContent, setNewNoteContent] = useState('')
  const [newNoteColor, setNewNoteColor] = useState<NoteColor>('yellow')

  const handleCreateNote = () => {
    if (newNoteContent.trim()) {
      const newNote: Note = {
        id: Date.now().toString(),
        title: newNoteTitle.trim() || undefined,
        content: newNoteContent,
        color: newNoteColor,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setNotes([newNote, ...notes])
      setNewNoteTitle('')
      setNewNoteContent('')
    }
  }

  const handleNewNoteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleCreateNote()
    }
  }

  const handleEditNote = (editedNote: Note) => {
    setNotes(notes.map((note) => (note.id === editedNote.id ? editedNote : note)))
  }

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id))
  }

  const handleAIAction = (action: string, noteId?: string) => {
    // Placeholder for AI functionality
    console.log(`AI Action: ${action}`, noteId ? `for note ${noteId}` : 'for new note')
    // TODO: Implement AI integration
  }

  return (
    <div className="mt-4">
      <div className="mb-10">
        <h3 className="text-sm font-semibold text-neutral-900 mb-3">Your Notes</h3>

        <NoteForm
          title={newNoteTitle}
          content={newNoteContent}
          color={newNoteColor}
          onTitleChange={setNewNoteTitle}
          onContentChange={setNewNoteContent}
          onColorChange={setNewNoteColor}
          onSubmit={handleCreateNote}
          onAIAction={() => handleAIAction('generate-summary')}
          onKeyDown={handleNewNoteKeyDown}
        />
      </div>

      {/* Notes List */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <p className="text-sm">No notes yet.</p>
            <p className="text-xs mt-1">Start by adding your first note above.</p>
          </div>
        ) : (
          notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={handleEditNote}
              onDelete={handleDeleteNote}
              onAIAction={handleAIAction}
            />
          ))
        )}
      </div>
    </div>
  )
}
