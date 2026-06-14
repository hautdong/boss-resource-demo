import { useState, useRef, useEffect, type ReactNode } from "react"
import { useEditMode } from "../context/EditModeContext"
import { Edit3, Check, X } from "lucide-react"

interface EditableFieldProps {
  text: string
  storageKey: string
  className?: string
  as?: "span" | "p" | "h1" | "h2" | "h3" | "h4"
  children?: ReactNode
}

export function EditableField({ text, storageKey, className = "", as: Tag = "span", children }: EditableFieldProps) {
  const { editing } = useEditMode()
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(() => {
    return localStorage.getItem(storageKey) || text
  })
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = () => {
    localStorage.setItem(storageKey, value)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setValue(localStorage.getItem(storageKey) || text)
    setIsEditing(false)
  }

  if (!editing) {
    return <Tag className={className}>{value}{children}</Tag>
  }

  if (isEditing) {
    return (
      <span className="inline-flex items-center gap-1">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="rounded border-2 border-primary bg-background px-2 py-0.5 text-sm font-medium outline-none min-w-[120px]"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave()
            if (e.key === "Escape") handleCancel()
          }}
        />
        <button onClick={handleSave} className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
          <Check className="h-3.5 w-3.5" />
        </button>
        <button onClick={handleCancel} className="flex h-6 w-6 items-center justify-center rounded bg-muted text-muted-foreground hover:bg-accent transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </span>
    )
  }

  return (
    <span className="group relative inline-flex items-center gap-1">
      <Tag className={className}>{value}{children}</Tag>
      <button
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary hover:bg-primary/20 transition-all"
        title="点击编辑"
      >
        <Edit3 className="h-3 w-3" />
      </button>
    </span>
  )
}
