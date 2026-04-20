import { Button } from "@/components/ui/button";
import { MapPin, Clock, Users, Bookmark } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";

const JobCard = ({
  title,
  description,
  budget,
  duration,
  location,
  skills,
  postedAt,
  proposals,
  projectId,
}) => {
  return (
    <div className="group rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <Link href={`/projects/${projectId}`}>
          <h3 className="font-display text-lg font-semibold text-foreground line-clamp-2 hover:text-accent transition-colors cursor-pointer">
            {title}
          </h3>
        </Link>
        <button className="shrink-0 text-muted-foreground transition-colors hover:text-accent">
          <Bookmark className="h-5 w-5" />
        </button>
      </div>

      <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {skills.slice(0, 4).map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground"
          >
            {skill}
          </span>
        ))}
        {skills.length > 4 && (
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            +{skills.length - 4}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4" />
          <span>{location}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          <span>{duration}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          <span>{proposals} proposals</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <div>
          <p className="text-xs text-muted-foreground">Budget</p>
          <p className="mt-0.5 font-display text-lg font-bold text-foreground">
            {typeof budget === 'object' && budget.min !== undefined && budget.max !== undefined
              ? `${formatCurrency(budget.min)} - ${formatCurrency(budget.max)}`
              : budget}
          </p>
        </div>
        <Link href={`/projects/${projectId}`}>
          <Button variant="accent" size="sm">
            View Details
          </Button>
        </Link>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">Posted {postedAt}</p>
    </div>
  );
};

export default JobCard;
