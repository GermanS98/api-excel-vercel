import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded ${className}`}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

export { Button }
