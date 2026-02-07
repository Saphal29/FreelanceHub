"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import JobCard from "@/components/cards/JobCard";
import {
  Search,
  Filter,
  MapPin,
  DollarSign,
  Clock,
  Briefcase,
  Star,
  TrendingUp,
} from "lucide-react";

// Dummy job listings
const allJobs = [
  {
    title: "Senior React Developer for SaaS Platform",
    description: "Looking for an experienced React developer to help build and maintain our SaaS platform. Must have experience with TypeScript, Node.js, and cloud services.",
    budget: "$5,000 - $8,000",
    duration: "3-6 months",
    location: "Remote",
    skills: ["React", "TypeScript", "Node.js", "AWS"],
    postedAt: "2 hours ago",
    proposals: 12,
  },
  {
    title: "UI/UX Designer for Fintech Mobile App",
    description: "We need a talented designer to create intuitive and beautiful interfaces for our financial technology mobile application.",
    budget: "$2,000 - $3,500",
    duration: "1-2 months",
    location: "Remote",
    skills: ["Figma", "Mobile Design", "UI/UX", "Prototyping"],
    postedAt: "5 hours ago",
    proposals: 8,
  },
  {
    title: "Full-Stack Developer for E-learning Platform",
    description: "Building an innovative e-learning platform and need a full-stack developer to implement new features and optimize performance.",
    budget: "$4,000 - $6,000",
    duration: "2-3 months",
    location: "Remote",
    skills: ["React", "Python", "PostgreSQL", "Docker"],
    postedAt: "1 day ago",
    proposals: 23,
  },
  {
    title: "WordPress Developer for Agency Website",
    description: "Need an experienced WordPress developer to build a custom theme and implement advanced functionality for our digital agency.",
    budget: "$1,500 - $2,500",
    duration: "1 month",
    location: "Remote",
    skills: ["WordPress", "PHP", "JavaScript", "CSS"],
    postedAt: "1 day ago",
    proposals: 15,
  },
  {
    title: "Mobile App Developer - Flutter",
    description: "Seeking a Flutter developer to create a cross-platform mobile application for our startup. Experience with Firebase required.",
    budget: "$3,000 - $5,000",
    duration: "2-3 months",
    location: "Remote",
    skills: ["Flutter", "Dart", "Firebase", "Mobile Development"],
    postedAt: "2 days ago",
    proposals: 19,
  },
  {
    title: "Data Analyst for Marketing Campaign",
    description: "Looking for a data analyst to help analyze marketing campaign performance and provide actionable insights.",
    budget: "$2,000 - $3,000",
    duration: "1 month",
    location: "Remote",
    skills: ["Python", "SQL", "Data Analysis", "Tableau"],
    postedAt: "3 days ago",
    proposals: 11,
  },
  {
    title: "Content Writer for Tech Blog",
    description: "Need a skilled content writer to create engaging articles about technology, software development, and digital trends.",
    budget: "$500 - $1,000",
    duration: "Ongoing",
    location: "Remote",
    skills: ["Content Writing", "SEO", "Technical Writing", "Research"],
    postedAt: "3 days ago",
    proposals: 27,
  },
  {
    title: "DevOps Engineer for Cloud Migration",
    description: "Experienced DevOps engineer needed to help migrate our infrastructure to AWS and set up CI/CD pipelines.",
    budget: "$6,000 - $10,000",
    duration: "3-4 months",
    location: "Remote",
    skills: ["AWS", "Docker", "Kubernetes", "CI/CD"],
    postedAt: "4 days ago",
    proposals: 9,
  },
];

const categories = [
  { name: "All Jobs", count: allJobs.length },
  { name: "Web Development", count: 45 },
  { name: "Mobile Development", count: 28 },
  { name: "Design", count: 32 },
  { name: "Writing", count: 18 },
  { name: "Marketing", count: 24 },
];

export default function FindWorkPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Jobs");
  const [jobs, setJobs] = useState(allJobs);

  const handleSearch = (e) => {
    e.preventDefault();
    // Filter jobs based on search query
    const filtered = allJobs.filter(
      (job) =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.skills.some((skill) =>
          skill.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
    setJobs(filtered);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType="freelancer" />

      {/* Header */}
      <section className="border-b border-border bg-gradient-hero py-8 lg:py-12">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Find Work
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Discover opportunities that match your skills and expertise
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mt-6 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for jobs, skills, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 w-full rounded-xl border-border bg-card pl-12 pr-4 text-base shadow-sm"
              />
            </div>
            <Button type="submit" variant="accent" size="lg" className="px-8">
              Search
            </Button>
          </form>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-border bg-secondary/30 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-accent" />
              <span className="font-medium text-foreground">{jobs.length} Jobs Available</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              <span className="font-medium text-foreground">15 New Today</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-accent" />
              <span className="font-medium text-foreground">Best Match for You</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar - Filters */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              {/* Categories */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="mb-4 flex items-center font-display text-lg font-semibold text-foreground">
                  <Filter className="mr-2 h-5 w-5 text-accent" />
                  Categories
                </h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.name}
                      onClick={() => setSelectedCategory(category.name)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                        selectedCategory === category.name
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-secondary"
                      }`}
                    >
                      <span>{category.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          selectedCategory === category.name
                            ? "bg-accent-foreground/20"
                            : "bg-secondary"
                        }`}
                      >
                        {category.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Filter */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="mb-4 flex items-center font-display text-lg font-semibold text-foreground">
                  <DollarSign className="mr-2 h-5 w-5 text-accent" />
                  Budget Range
                </h3>
                <div className="space-y-2">
                  {[
                    "Under $1,000",
                    "$1,000 - $3,000",
                    "$3,000 - $5,000",
                    "$5,000 - $10,000",
                    "Above $10,000",
                  ].map((range) => (
                    <label
                      key={range}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                      />
                      <span>{range}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Duration Filter */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="mb-4 flex items-center font-display text-lg font-semibold text-foreground">
                  <Clock className="mr-2 h-5 w-5 text-accent" />
                  Project Duration
                </h3>
                <div className="space-y-2">
                  {["Less than 1 month", "1-3 months", "3-6 months", "More than 6 months"].map(
                    (duration) => (
                      <label
                        key={duration}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                        />
                        <span>{duration}</span>
                      </label>
                    )
                  )}
                </div>
              </div>

              {/* Location Filter */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="mb-4 flex items-center font-display text-lg font-semibold text-foreground">
                  <MapPin className="mr-2 h-5 w-5 text-accent" />
                  Location
                </h3>
                <div className="space-y-2">
                  {["Remote", "On-site", "Hybrid"].map((location) => (
                    <label
                      key={location}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                      />
                      <span>{location}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Job Listings */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{jobs.length}</span> jobs
              </p>
              <select className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent">
                <option>Most Relevant</option>
                <option>Newest First</option>
                <option>Highest Budget</option>
                <option>Lowest Budget</option>
              </select>
            </div>

            <div className="space-y-6">
              {jobs.map((job, index) => (
                <div
                  key={index}
                  className="animate-fade-up opacity-0"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <JobCard {...job} />
                </div>
              ))}
            </div>

            {jobs.length === 0 && (
              <div className="rounded-2xl border border-border bg-card p-12 text-center">
                <Search className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-display text-xl font-semibold text-foreground">
                  No jobs found
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Try adjusting your search or filters to find more opportunities
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setJobs(allJobs);
                  }}
                  variant="accent"
                  className="mt-6"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
