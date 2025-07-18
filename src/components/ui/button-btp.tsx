import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive btp-hover-lift",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg",
        primary:
          "bg-orange-600 text-white shadow-md hover:bg-orange-700 hover:shadow-lg focus-visible:ring-orange-500/20",
        secondary:
          "bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:shadow-lg focus-visible:ring-blue-500/20",
        destructive:
          "bg-destructive text-white shadow-md hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-gray-300 bg-background shadow-sm hover:bg-gray-50 hover:text-gray-900 hover:shadow-md dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        ghost:
          "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-accent/50",
        link: 
          "text-orange-600 underline-offset-4 hover:underline hover:text-orange-700",
        gradient:
          "btp-gradient text-white shadow-md hover:shadow-lg transform hover:scale-105"
      },
      size: {
        default: "h-10 px-6 py-2 has-[>svg]:px-4",
        sm: "h-8 rounded-md gap-1.5 px-4 has-[>svg]:px-3 text-xs",
        lg: "h-12 rounded-lg px-8 has-[>svg]:px-6 text-base font-semibold",
        xl: "h-14 rounded-lg px-10 has-[>svg]:px-8 text-lg font-semibold",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
