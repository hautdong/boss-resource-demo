import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { useAuth } from "./AuthContext"

interface EditModeContextType {
  editing: boolean
  toggleEditing: () => void
}

const EditModeContext = createContext<EditModeContextType | null>(null)

export function EditModeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const isDeveloper = user?.role === "developer"
  const [editing, setEditing] = useState(false)

  const toggleEditing = useCallback(() => {
    setEditing((prev) => !prev)
  }, [])

  // Only developer can use edit mode
  const value: EditModeContextType = {
    editing: isDeveloper && editing,
    toggleEditing,
  }

  return (
    <EditModeContext.Provider value={value}>
      {children}
    </EditModeContext.Provider>
  )
}

export function useEditMode() {
  const ctx = useContext(EditModeContext)
  if (!ctx) throw new Error("useEditMode must be used within EditModeProvider")
  return ctx
}
