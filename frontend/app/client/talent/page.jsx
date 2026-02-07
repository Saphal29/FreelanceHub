"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Star, 
  MapPin,
  DollarSign,
  Clock,
  Shield,
  Filter,
  ChevronDown,
  Briefcase,
  Award
} from "lucide-react";

// Dummy freelancer data
const freelancers = [
  {
    id: "1",
    name: "Alex Morgan",
    title: "Senior Full-Stack Developer",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
    location: "San Francisco, USA",
    hourlyRate: 85,
    rating: 4.9,
    reviewCount: 456,
    completedJobs: 342,
    skills: ["React", "Node.js", "TypeScript", "AWS", "MongoDB"],
    bio: "Experienced full-stack developer specializing in modern web applications. 8+ years of experience.",
    isVerified: true,
    responseTime: "1 hour"
  },
  {
    id: "2",
    name: "Sarah Chen",
    title: "UI/UX Designer & Product Designer",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    location: "New York, USA",
    hourlyRate: 75,
    rating: 5.0,
    reviewCount: 312,
    completedJobs: 289,
    skills: ["Figma", "UI Design", "Prototyping", "User Research", "Wireframing"],
    bio: "Creative designer focused on user-centered design. Worked with Fortune 500 companies.",
    isVerified: true,
    responseTime: "30 minutes"
  },
  {
    id: "3",
    name: "Mike Johnson",
    title: "Digital Marketing Strategist",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    location: "London, UK",
    hourlyRate: 65,
    rating: 4.8,
    reviewCount: 234,
    completedJobs: 198,
    skills: ["SEO", "Content Marketing", "Google Ads", "Analytics", "Social Media"],
    bio: "Results-driven marketer with proven track record of increasing ROI by 300%+.",
    isVerified: false,
    responseTime: "2 hours"
  },
  {
    id: "4",
    name: "Emma Davis",
    title: "Mobile App Developer (iOS & Android)",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    location: "Toronto, Canada",
    hourlyRate: 90,
    rating: 4.9,
    reviewCount: 387,
    completedJobs: 276,
    skills: ["React Native", "Swift", "Kotlin", "Firebase", "API Integration"],
    bio: "Mobile development expert with 50+ published apps on App Store and Play Store.",
    isVerified: true,
    responseTime: "1 hour"
  },
  {
    id: "5",
    name: "David Wilson",
    title: "Content Writer & Copywriter",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop",
    location: "Austin, USA",
    hourlyRate: 45,
    rating: 4.7,
    reviewCount: 189,
    completedJobs: 423,
    skills: ["SEO Writing", "Blog Posts", "Copywriting", "Technical Writing", "Editing"],
    bio: "Professional writer creating engaging content that converts. 1000+ articles published.",
    isVerified: true,
    responseTime: "3 hours"
  },
  {
    id: "6",
    name: "Lisa Zhang",
    title: "Data Scientist & ML Engineer",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop",
    location: "Singapore",
    hourlyRate: 95,
    rating: 5.0,
    reviewCount: 156,
    completedJobs: 134,
    skills: ["Python", "Machine Learning", "TensorFlow", "Data Analysis", "SQL"],
    bio: "PhD in Computer Science. Specialized in AI/ML solutions for business problems.",
    isVerified: true,
    responseTime: "2 hours"
  }
];

export default function FindTalentPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType="client" />

      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-hero py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
              Find the Perfect <span className="text-gradient-gold">Talent</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Browse thousands of verified freelancers ready to bring your projects to life
            </p>

            {/* Search Bar */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by skills, name, or expertise..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 w-full rounded-xl border-border bg-card pl-12 pr-4 text-base"
                />
              </div>
              <Button variant="accent" size="xl">
                Search Talent
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="border-b border-border bg-card py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              All Filters
            </Button>
            <Button variant="outline" size="sm">
              Hourly Rate
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              Experience Level
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              Location
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              Availability
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            <div className="ml-auto">
              <Button variant="ghost" size="sm">
                Sort by: Recommended
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-muted-foreground">
              {freelancers.length} freelancers available
            </p>
          </div>

          {/* Freelancer Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {freelancers.map((freelancer) => (
              <div
                key={freelancer.id}
                className="group overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-xl"
              >
                {/* Header */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <img
                      src={freelancer.avatar}
                      alt={freelancer.name}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-foreground">{freelancer.name}</h3>
                      <p className="text-sm text-muted-foreground">{freelancer.title}</p>
                    </div>
                  </div>
                  {freelancer.isVerified && (
                    <Shield className="h-5 w-5 text-accent" />
                  )}
                </div>

                {/* Bio */}
                <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                  {freelancer.bio}
                </p>

                {/* Stats */}
                <div className="mb-4 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    <span className="font-semibold text-foreground">{freelancer.rating}</span>
                    <span className="text-muted-foreground">({freelancer.reviewCount})</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    <span>{freelancer.completedJobs} jobs</span>
                  </div>
                </div>

                {/* Location & Rate */}
                <div className="mb-4 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{freelancer.location}</span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>${freelancer.hourlyRate}/hr</span>
                  </div>
                </div>

                {/* Skills */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {freelancer.skills.slice(0, 4).map((skill, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-secondary px-3 py-1 text-xs text-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                  {freelancer.skills.length > 4 && (
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                      +{freelancer.skills.length - 4}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="accent" className="flex-1">
                    View Profile
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Invite
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          <div className="mt-8 text-center">
            <Button variant="outline" size="lg">
              Load More Freelancers
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
