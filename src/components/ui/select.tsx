import type { ComponentProps, ReactNode } from "react"
import {
  Select as SelectPrimitive, SelectContent as ContentPrimitive, SelectGroup,
  SelectItem as ItemPrimitive, SelectItemIndicator, SelectTrigger as TriggerPrimitive,
  SelectValue, type SelectProps,
} from "@ui-sdk/react/select"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

type Props = Omit<SelectProps, "multiple" | "value" | "defaultValue" | "onValueChange"> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

function Select({ value, onValueChange, ...props }: Props) {
  return (
    <SelectPrimitive {...props} value={value === "" ? null : value}
      onValueChange={value => onValueChange?.(value ?? "")} />
  )
}

function SelectTrigger({ className, children, ...props }: Omit<ComponentProps<typeof TriggerPrimitive>, "children"> & { children?: ReactNode }) {
  return (
    <TriggerPrimitive
      className={cn("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive [&>span]:line-clamp-1", className)}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
    </TriggerPrimitive>
  )
}

function SelectContent({ className, ...props }: ComponentProps<typeof ContentPrimitive>) {
  return (
    <ContentPrimitive
      keepMounted
      alignItemWithTrigger={false}
      sideOffset={4}
      className={cn("max-h-80 min-w-32 overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md", className)}
      {...props}
    />
  )
}

function SelectItem({ className, children, ...props }: Omit<ComponentProps<typeof ItemPrimitive<string>>, "children"> & { children?: ReactNode }) {
  return (
    <ItemPrimitive
      className={cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)}
      {...props}
    >
      <SelectItemIndicator className="absolute left-2 flex size-3.5 items-center justify-center">
        <Check className="size-4" aria-hidden="true" />
      </SelectItemIndicator>
      {children}
    </ItemPrimitive>
  )
}

export { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue }
