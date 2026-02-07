"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Clock,
  DollarSign,
  MapPin,
  Filter,
  ChevronDown,
  Calendar,
  Users,
  Briefcase
} from "lucide-react";

// Dummy project data
const projects = [
  {
    id: "1",
    title: "E-commerce Website Development with React",
    description: "Looking for an experienced React developer to build a modern e-commerce platform with payment integration, product management, and user authentication.",
    budget: { min: 3000, max: 5000 },
    duration: "2-3 months",
    postedDate: "2 days ago",
    proposals: 12,
    category: "Web Development",
    skills: ["React", "Node.js", "MongoDB", "Stripe", "AWS"],
    experienceLevel: "Expert",
    projectType: "Fixed Price",
    client: {
      name: "TechStart Inc",
      location: "San Francisco, USA",
      jobsPosted: 15,
      hireRate: 87
    }
  },
  {
    id: "2",
    title: "Mobile App UI/UX Design for Fitness Platform",
    description: "Need a talented UI/UX designer to create modern, user-friendly designs for our fitness tracking mobile app. Must include wireframes and high-fidelity mockups.",
    budget: { min: 1500, max: 2500 },
    duration: "3-4 weeks",
    postedDate: "5 hours ago",
    proposals: 8,
    category: "Design",
    skills: ["Figma", "UI Design", "Mobile Design", "Prototyping"],
    experienceLevel: "Intermediate",
    projectType: "Fixed Price",
    client: {
      name: "FitLife Solutions",
      location: "New York, USA",
      jobsPosted: 8,
      hireRate: 92
    }
  },
  {
    id: "3",
    title: "SEO Optimization and Content Marketing Strategy",
    description: "Seeking an SEO expert to improve our website rankings and develop a comprehensive content marketing strategy. Must have proven track record.",
    budget: { min: 2000, max: 3500 },
    duration: "1-2 months",
    postedDate: "1 day ago",
    proposals: 15,
    category: "Marketing",
    skills: ["SEO", "Content Strategy", "Google Analytics", "Link Building"],
    experienceLevel: "Expert",
    projectType: "Fixed Price",
    client: {
      name: "Digital Growth Co",
      location: "London, UK",
      jobsPosted: 23,
      hireRate: 95
    }
  },
  {
    id: "4",
    title: "Python Data Analysis and Visualization Dashboard",
    description: "Need a data scientist to analyze sales data and create interactive dashboards using Python, Pandas, and visualization libraries.",
    budget: { min: 1000, max: 2000 },
    duration: "2-3 weeks",
    postedDate: "3 days ago",
    proposals: 10,
    category: "Data Science",
    skills: ["Python", "Pandas", "Data Visualization", "Tableau", "SQL"],
    experienceLevel: "Intermediate",
    projectType: "Fixed Price",
    client: {
      name: "Analytics Pro",
      location: "Toronto, Canada",
      jobsPosted: 12,
      hireRate: 88
    }
  },
  {
    id: "5",
    title: "WordPress Website Redesign and Optimization",
    description: "Looking to redesign our existing WordPress site with modern design, improve loading speed, and implement SEO best practices.",
    budget: { min: 800, max: 1500 },
    duration: "2-4 weeks",
    postedDate: "1 week ago",
    proposals: 18,
    category: "Web Development",
    skills: ["WordPress", "PHP", "CSS", "SEO", "Page Speed"],
    experienceLevel: "Intermediate",
    projectType: "Fixed Price",
    client: {
      name: "Small Business Hub",
      location: "Austin, USA",
      jobsPosted: 5,
      hireRate: 80
    }
  },
  {
    id: "6",
    title: "Social Media Content Creation and Management",
    description: "Need a creative content creator to manage our social media accounts, create engaging posts, and grow our online presence.",
    budget: { min: 500, max: 1000 },
    duration: "Ongoing",
    postedDate: "4 days ago",
    proposals: 22,
    category: "Marketing",
    skills: ["Social Media", "Content Creation", "Copywriting", "Canva", "Instagram"],
    experienceLevel: "Entry Level",
    projectType: "Hourly",
    client: {
      name: "Fashion Boutique",
      location: "Los Angeles, USA",
      jobsPosted: 3,
      hireRate: 75
    }
  }
];

export default function BrowseProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType="client" />

      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-hero py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
              Browse <span className="text-gradient-gold">Projects</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Discover opportunities and find the perfect project for your skills
            </p>

            {/* Search Bar */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search projects by title, skills, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 w-full rounded-xl border-border bg-card pl-12 pr-4 text-base"
                />
              </div>
              <Button variant="accent" size="xl">
                Search Projects
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
              Budget
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              Project Type
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              Experience Level
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              Duration
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            <div className="ml-auto">
              <Button variant="ghost" size="sm">
                Sort by: Newest First
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
              {projects.length} projects available
            </p>
          </div>

          {/* Projects List */}
          <div className="space-y-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-xl"
              >
                {/* Header */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <Link href={`/project/${project.id}`}>
                      <h3 className="font-display text-xl font-bold text-foreground hover:text-accent transition-colors mb-2">
                        {project.title}
                      </h3>
                    </Link>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Posted {project.postedDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {project.client.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {project.proposals} proposals
                      </span>
                    </div>
                  </div>
                  <div className="rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
                    {project.category}
                  </div>
                </div>

                {/* Description */}
                <p className="mb-4 text-muted-foreground line-clamp-2">
                  {project.description}
                </p>

                {/* Skills */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {project.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-secondary px-3 py-1 text-xs text-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Budget</p>
                        <p className="font-semibold text-foreground">
                          ${project.budget.min.toLocaleString()} - ${project.budget.max.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-semibold text-foreground">{project.duration}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Experience</p>
                        <p className="font-semibold text-foreground">{project.experienceLevel}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      Save
                    </Button>
                    <Button variant="accent">
                      Apply Now
                    </Button>
                  </div>
                </div>

                {/* Client Info */}
                <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent font-semibold">
                    {project.client.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{project.client.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {project.client.jobsPosted} jobs posted • {project.client.hireRate}% hire rate
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          <div className="mt-8 text-center">
            <Button variant="outline" size="lg">
              Load More Projects
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
