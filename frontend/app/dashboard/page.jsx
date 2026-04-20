"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { getAvatarUrl } from "@/lib/avatarUtils";
import {
  Search,
  Code,
  Paintbrush,
  PenTool,
  Video,
  Music,
  BarChart3,
  FileText,
  Megaphone,
  ArrowRight,
  Play,
  Star,
  Users,
  Briefcase,
  Shield,
} from "lucide-react";

const categories = [
  { id: "programming-tech", icon: Code, title: "Programming & Tech", description: "Web, Mobile & Software" },
  { id: "graphics-design", icon: Paintbrush, title: "Graphics & Design", description: "Logos, Branding & UI" },
  { id: "writing-translation", icon: PenTool, title: "Writing & Translation", description: "Content & Copywriting" },
  { id: "video-animation", icon: Video, title: "Video & Animation", description: "Editing & Motion Graphics" },
  { id: "music-audio", icon: Music, title: "Music & Audio", description: "Production & Voice Over" },
  { id: "business", icon: BarChart3, title: "Business", description: "Consulting & Strategy" },
  { id: "data", icon: FileText, title: "Data", description: "Analytics & Visualization" },
  { id: "marketing", icon: Megaphone, title: "Marketing", description: "SEO & Social Media" },
];

const ClientHome = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredServices, setFeaturedServices] = useState([]);
  const [topFreelancers, setTopFreelancers] = useState([]);
  const [platformStats, setPlatformStats] = useState({
    totalFreelancers: 0,
    totalClients: 0,
    totalProjects: 0,
    averageRating: 0,
    totalPaid: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [servicesResponse, freelancersResponse, statsResponse] = await Promise.all([
        api.get('/projects/completed', { params: { limit: 4 } }),
        api.get('/profile/search/freelancers', { params: { limit: 4 } }),
        api.get('/stats/platform'),
      ]);

      setFeaturedServices(servicesResponse.data.projects || []);
      setTopFreelancers(freelancersResponse.data.freelancers || []);
      setPlatformStats(statsResponse.data.stats || {});
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType="client" />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="animate-fade-in font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Find the perfect{" "}
              <span className="text-gradient-gold">freelance</span> services
            </h1>
            <p className="animate-fade-in mt-6 text-lg text-muted-foreground">
              Connect with talented professionals worldwide and get your projects done with confidence.
            </p>

            {/* Search Bar */}
            <div className="animate-fade-in mt-8 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="What service are you looking for today?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 w-full rounded-xl border-border bg-card pl-12 pr-4 text-base shadow-card placeholder:text-muted-foreground"
                />
              </div>
              <Button variant="accent" size="xl">
                Search
              </Button>
            </div>

            {/* Popular Searches */}
            <div className="animate-fade-in mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">Popular:</span>
              {["Website Design", "Logo Design", "WordPress", "SEO", "Video Editing"].map((term) => (
                <button
                  key={term}
                  className="rounded-full border border-border bg-card px-3 py-1 text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Background Decorations */}
        <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />
      </section>

      {/* Trust Indicators */}
      <section className="border-b border-border bg-secondary/30 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              <span className="text-sm font-medium text-foreground">
                {platformStats.totalFreelancers?.toLocaleString() || 0}+ Freelancers
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-accent" />
              <span className="text-sm font-medium text-foreground">
                {platformStats.totalProjects?.toLocaleString() || 0}+ Projects Completed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-accent" />
              <span className="text-sm font-medium text-foreground">
                {platformStats.averageRating ? platformStats.averageRating.toFixed(1) : '0.0'} Average Rating
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              <span className="text-sm font-medium text-foreground">Secure Payments</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10">
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Explore Categories
            </h2>
            <p className="mt-2 text-muted-foreground">
              Find the right service for your needs
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.id}`}
                className="group cursor-pointer rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:border-accent text-left"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <category.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-foreground">{category.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Services Section */}
      <section className="bg-secondary/30 py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10">
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Featured Services
            </h2>
            <p className="mt-2 text-muted-foreground">
              Hand-picked services from top-rated sellers
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="aspect-[4/3] bg-secondary animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-8 bg-secondary animate-pulse rounded" />
                    <div className="h-4 bg-secondary animate-pulse rounded w-3/4" />
                    <div className="h-4 bg-secondary animate-pulse rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : featuredServices.length > 0 ? (
              featuredServices.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-xl"
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center p-6">
                    <div className="text-center">
                      <h4 className="font-semibold text-foreground line-clamp-3">{project.title}</h4>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="mb-3 flex items-center gap-2">
                      {project.freelancer?.avatar ? (
                        <img
                          src={getAvatarUrl(project.freelancer.avatar)}
                          alt={project.freelancer.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                          <span className="text-xs font-semibold text-accent">
                            {project.freelancer?.name?.charAt(0) || 'F'}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">{project.freelancer?.name || 'Freelancer'}</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                    </div>
                    <h3 className="mb-3 line-clamp-2 text-sm font-medium text-foreground">
                      {project.description}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-accent text-accent" />
                        <span className="text-sm font-semibold text-foreground">
                          {project.rating || 'N/A'}
                        </span>
                        {project.reviewCount > 0 && (
                          <span className="text-xs text-muted-foreground">({project.reviewCount})</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        ${project.budget?.min || 0}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-4 text-center py-12 text-muted-foreground">
                <p>No featured services available yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              How It Works
            </h2>
            <p className="mt-2 text-muted-foreground">
              Get your project done in 3 simple steps
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Post Your Project",
                description: "Describe your project requirements and set your budget. It's free to post!",
              },
              {
                step: "02",
                title: "Review Proposals",
                description: "Receive proposals from talented freelancers and review their profiles.",
              },
              {
                step: "03",
                title: "Hire & Collaborate",
                description: "Choose the best match and work together using our secure platform.",
              },
            ].map((item, index) => (
              <div key={item.step} className="relative text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <span className="font-display text-2xl font-bold">{item.step}</span>
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-muted-foreground">{item.description}</p>
                {index < 2 && (
                  <div className="absolute right-0 top-8 hidden h-0.5 w-1/3 bg-border md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Freelancers Section */}
      <section className="bg-secondary/30 py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10">
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Top Freelancers
            </h2>
            <p className="mt-2 text-muted-foreground">
              Work with the best professionals in the industry
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="rounded-2xl border border-border bg-card p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="h-16 w-16 rounded-full bg-secondary animate-pulse" />
                    <div className="h-5 w-5 bg-secondary animate-pulse rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-secondary animate-pulse rounded" />
                    <div className="h-3 bg-secondary animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-secondary animate-pulse rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : topFreelancers.length > 0 ? (
              topFreelancers.map((freelancer) => (
                <Link
                  key={freelancer.id}
                  href={`/freelancer/${freelancer.id}`}
                  className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-xl"
                >
                  <div className="mb-4 flex items-start justify-between">
                    {freelancer.avatarUrl ? (
                      <img
                        src={getAvatarUrl(freelancer.avatarUrl)}
                        alt={freelancer.fullName}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
                        <span className="text-xl font-semibold text-accent">
                          {freelancer.fullName?.charAt(0) || 'F'}
                        </span>
                      </div>
                    )}
                    {freelancer.isFeatured && (
                      <Shield className="h-5 w-5 text-accent" />
                    )}
                  </div>
                  <h3 className="font-semibold text-foreground">{freelancer.fullName}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{freelancer.title || 'Freelancer'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{freelancer.location || 'Remote'}</p>
                  <div className="mt-3 flex items-center gap-1">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    <span className="text-sm font-semibold text-foreground">
                      {freelancer.averageRating ? parseFloat(freelancer.averageRating).toFixed(1) : 'New'}
                    </span>
                    {freelancer.totalJobsCompleted > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({freelancer.totalJobsCompleted} jobs)
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {freelancer.skills?.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-secondary px-2 py-1 text-xs text-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Starting at{" "}
                      <span className="font-semibold text-foreground">
                        ${freelancer.hourlyRate || 0}/hr
                      </span>
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-4 text-center py-12 text-muted-foreground">
                <p>No freelancers available yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/30 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                <span className="font-display text-sm font-bold text-accent-foreground">F</span>
              </div>
              <span className="font-display text-lg font-bold text-foreground">
                Freelance<span className="text-accent">Hub</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 FreelanceHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ClientHome;
