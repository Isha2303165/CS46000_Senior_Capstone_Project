import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "touch-target inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/20 focus-visible:ring-4 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transform active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl hover:from-yellow-500 hover:to-orange-600 font-semibold",
        destructive:
          "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md hover:shadow-lg hover:from-red-600 hover:to-red-700 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border-2 bg-white/50 backdrop-blur-sm shadow-sm hover:bg-gray-50 hover:shadow-md hover:border-gray-300 dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 shadow-sm hover:shadow-md hover:from-gray-200 hover:to-gray-300 font-medium",
        ghost:
          "hover:bg-gray-100/80 hover:text-gray-900 dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline font-medium",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    'aria-label'?: string
    'aria-describedby'?: string
  }) {
  const Comp = asChild ? Slot : "button"

  // Ensure button has accessible name
  const hasAccessibleName = ariaLabel || (typeof children === 'string' && children.trim().length > 0)
  
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      {...(!hasAccessibleName && { 'aria-label': 'Button' })}
      {...props}
    >
      {children}
    </Comp>
  )
}

export { Button, buttonVariants }
