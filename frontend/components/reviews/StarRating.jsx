import { Star } from "lucide-react";

export default function StarRating({ rating, maxRating = 5, size = "md", showNumber = false, interactive = false, onChange }) {
  const sizes = {
    sm: "h-3 w-3",
    md: "h-5 w-5",
    lg: "h-6 w-6",
    xl: "h-8 w-8"
  };

  const handleClick = (value) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[...Array(maxRating)].map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= rating;
        
        return (
          <Star
            key={index}
            className={`${sizes[size]} ${
              isFilled ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            } ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
            onClick={() => handleClick(starValue)}
          />
        );
      })}
      {showNumber && (
        <span className="ml-2 text-sm font-medium text-foreground">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
