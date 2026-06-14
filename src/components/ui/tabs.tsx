import * as React from "react"
import { cn } from "../../lib/utils"

interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  children: React.ReactNode
}

interface TabsListProps {
  className?: string
  children: React.ReactNode
}

interface TabsTriggerProps {
  value: string
  className?: string
  children: React.ReactNode
  disabled?: boolean
  id?: string
}

interface TabsContentProps {
  value: string
  className?: string
  children: React.ReactNode
}

const TabsContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
}>({})

function Tabs({ defaultValue, value, onValueChange, className, children }: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "")
  const currentValue = value !== undefined ? value : internalValue

  const handleChange = React.useCallback(
    (newValue: string) => {
      if (onValueChange) {
        onValueChange(newValue)
      } else {
        setInternalValue(newValue)
      }
    },
    [onValueChange]
  )

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

function TabsList({ className, children }: TabsListProps) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
        className
      )}
    >
      {children}
    </div>
  )
}

function TabsTrigger({ value, className, children, disabled, id }: TabsTriggerProps) {
  const context = React.useContext(TabsContext)
  const isActive = context.value === value

  return (
    <button
      id={id}
      disabled={disabled}
      onClick={() => context.onValueChange?.(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive && "bg-background text-foreground shadow-sm",
        !isActive && "hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  )
}

function TabsContent({ value, className, children }: TabsContentProps) {
  const context = React.useContext(TabsContext)
  if (context.value !== value) return null

  return (
    <div
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 animate-fade-in",
        className
      )}
    >
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
