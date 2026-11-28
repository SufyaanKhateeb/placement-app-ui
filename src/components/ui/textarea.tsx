import * as React from "react"
import { Textarea as TextareaPrimitive } from "@ui-sdk/react/textarea"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentPropsWithoutRef<typeof TextareaPrimitive> & Pick<React.ComponentProps<"textarea">, "onSelect">
>(({ className, onSelect, ...props }, ref) => {
  return (
    <TextareaPrimitive
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive md:text-sm",
        className
      )}
      ref={ref}
      render={onSelect ? <textarea onSelect={onSelect} /> : undefined}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
