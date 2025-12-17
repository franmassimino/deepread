import { NoteColor, noteColors } from './types'

interface ColorSelectorProps {
  selectedColor: NoteColor
  onColorChange: (color: NoteColor) => void
}

export function ColorSelector({ selectedColor, onColorChange }: ColorSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      {Object.keys(noteColors).map((color) => {
        const colorScheme = noteColors[color as NoteColor]
        const isSelected = selectedColor === color
        return (
          <button
            key={color}
            onClick={() => onColorChange(color as NoteColor)}
            className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${colorScheme.bg} ${
              isSelected
                ? `${colorScheme.border} ring-2 ring-offset-1 ring-neutral-400`
                : 'border-neutral-300 hover:border-neutral-400'
            }`}
            title={color.charAt(0).toUpperCase() + color.slice(1)}
          />
        )
      })}
    </div>
  )
}
