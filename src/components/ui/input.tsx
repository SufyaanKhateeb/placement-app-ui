import * as React from "react"
import { Input as InputPrimitive } from "@ui-sdk/react/input"

import { cn } from "@/lib/utils"

export type InputProps =
  Omit<React.ComponentPropsWithoutRef<typeof InputPrimitive>, "value"> & { value?: string | number }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, value, ...props }, ref) => {
    return (
      <InputPrimitive
        type={type}
        value={value === undefined ? undefined : String(value)}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
