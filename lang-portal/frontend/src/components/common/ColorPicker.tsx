interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
      />
      <input
        type="text"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 p-2 border rounded"
        placeholder="#000000"
      />
    </div>
  )
} 