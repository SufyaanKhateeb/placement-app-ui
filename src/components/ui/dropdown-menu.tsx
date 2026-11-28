import { isValidElement, type ComponentProps } from "react"
import {
  Menu as DropdownMenu, MenuContent, MenuGroup as DropdownMenuGroup,
  MenuGroupLabel, MenuItem, MenuSeparator, MenuTrigger,
} from "@ui-sdk/react/menu"

import { cn } from "@/lib/utils"

function DropdownMenuTrigger({ asChild, children, ...props }: ComponentProps<typeof MenuTrigger> & { asChild?: boolean }) {
  if (asChild && isValidElement(children)) return <MenuTrigger {...props} render={children} />
  return <MenuTrigger {...props}>{children}</MenuTrigger>
}

function DropdownMenuContent({ className, sideOffset = 4, ...props }: ComponentProps<typeof MenuContent>) {
  return (
    <MenuContent
      className={cn("min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md", className)}
      sideOffset={sideOffset}
      {...props}
    />
  )
}

function DropdownMenuItem({ asChild, className, children, ...props }: ComponentProps<typeof MenuItem> & { asChild?: boolean }) {
  const itemClass = cn("relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)
  if (asChild && isValidElement(children)) return <MenuItem {...props} className={itemClass} render={children} />
  return <MenuItem {...props} className={itemClass}>{children}</MenuItem>
}

function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof MenuGroupLabel>) {
  return <MenuGroupLabel className={cn("px-2 py-1.5 text-sm font-semibold", className)} {...props} />
}

function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof MenuSeparator>) {
  return <MenuSeparator className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
}

export {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
}
