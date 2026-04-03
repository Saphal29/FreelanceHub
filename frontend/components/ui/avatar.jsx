import * as React from "react"
import { cn } from "@/lib/utils"
import { getInitials, getAvatarColor } from "@/lib/utils"

const Avatar = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef(({ className, onError, ...props }, ref) => {
  const [imageError, setImageError] = React.useState(false);

  const handleError = (e) => {
    setImageError(true);
    if (onError) onError(e);
  };

  if (imageError || !props.src) {
    return null; // This will show the fallback
  }

  return (
    <img
      ref={ref}
      className={cn("aspect-square h-full w-full object-cover", className)}
      onError={handleError}
      {...props}
    />
  );
})
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef(({ className, children, name, email, ...props }, ref) => {
  const initials = name ? getInitials(name) : children
  const bgColor = email ? getAvatarColor(email) : 'bg-gray-500'
  
  return (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full text-white font-medium text-sm",
        bgColor,
        className
      )}
      {...props}
    >
      {initials}
    </div>
  )
})
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }