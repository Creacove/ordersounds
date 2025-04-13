
import * as React from "react"

export interface UserProps extends React.SVGProps<SVGSVGElement> {}

const User = React.forwardRef<SVGSVGElement, UserProps>(
  ({ className, ...props }, ref) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      ref={ref}
      className={className}
      {...props}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
)
User.displayName = "User"

export { User }
