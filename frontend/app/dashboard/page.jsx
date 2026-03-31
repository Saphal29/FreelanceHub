"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const featuredServices = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&h=375&fit=crop",
    title: "I will build a modern responsive website using React and Tailwind",
    seller: { name: "Alex Morgan", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop", level: "Top Rated" },
    rating: 4.9,
    reviewCount: 342,
    price: 150,
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&h=375&fit=crop",
    title: "I will design a professional logo and complete brand identity",
    seller: { name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", level: "Pro" },
    rating: 5.0,
    reviewCount: 567,
    price: 200,
  },
  {
    id: "3",
    id: "3",
    image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=500&h=375&fit=crop",
    title: "I will create stunning social media content and graphics",
    seller: { name: "Mike Johnson", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", level: "Rising Talent" },
    rating: 4.8,
    reviewCount: 128,
    price: 75,
  },
  {
    id: "4",
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=500&h=375&fit=crop",
    title: "I will develop a custom mobile app for iOS and Android",
    seller: { name: "Emma Davis", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop", level: "Top Rated" },
    rating: 4.9,
    reviewCount: 289,
    price: 500,
  },
];

const topFreelancers = [
  {
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop",
    name: "David Wilson",
    title: "Senior Full-Stack Developer",
    location: "San Francisco, USA",
    rating: 4.9,
    reviewCount: 456,
    hourlyRate: 85,
    skills: ["React", "Node.js", "TypeScript", "AWS"],
    isVerified: true,
  },
  {
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop",
    name: "Lisa Zhang",
    title: "UI/UX Designer",
    location: "New York, USA",
    rating: 5.0,
    reviewCount: 312,
    hourlyRate: 75,
    skills: ["Figma", "UI Design", "Prototyping", "Research"],
    isVerified: true,
  },
  {
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop",
    name: "James Miller",
    title: "Marketing Strategist",
    location: "London, UK",
    rating: 4.8,
    reviewCount: 178,
    hourlyRate: 65,
    skills: ["SEO", "Content Marketing", "Analytics", "PPC"],
    isVerified: false,
  },
  {
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop",
    name: "Anna Roberts",
    title: "Content Writer",
    location: "Toronto, Canada",
    rating: 4.9,
    reviewCount: 234,
    hourlyRate: 45,
    skills: ["Copywriting", "SEO Writing", "Blog Posts", "Technical"],
    isVerified: true,
  },
];

const ClientHome = () => {
  const [searchQuery, setSearchQuery] = useState("");

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
              <span className="text-sm font-medium text-foreground">10M+ Freelancers</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-accent" />
              <span className="text-sm font-medium text-foreground">5M+ Projects Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-accent" />
              <span className="text-sm font-medium text-foreground">4.9 Average Rating</span>
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
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                Explore Categories
              </h2>
              <p className="mt-2 text-muted-foreground">
                Find the right service for your needs
              </p>
            </div>
            <Button variant="ghost" className="hidden sm:flex">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.id}`}
                className="group cursor-pointer rounded-2xl border border-border bg-card p-6 transition-all hover:border-accent hover:shadow-lg"
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
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                Featured Services
              </h2>
              <p className="mt-2 text-muted-foreground">
                Hand-picked services from top-rated sellers
              </p>
            </div>
            <Button variant="ghost" className="hidden sm:flex">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredServices.map((service) => (
              <Link
                key={service.id}
                href={`/service/${service.id}`}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-xl"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <img
                      src={service.seller.avatar}
                      alt={service.seller.name}
                      className="h-8 w-8 rounded-full"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">{service.seller.name}</p>
                      <p className="text-xs text-muted-foreground">{service.seller.level}</p>
                    </div>
                  </div>
                  <h3 className="mb-3 line-clamp-2 text-sm font-medium text-foreground">
                    {service.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <span className="text-sm font-semibold text-foreground">{service.rating}</span>
                      <span className="text-xs text-muted-foreground">({service.reviewCount})</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      From ${service.price}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
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
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                Top Freelancers
              </h2>
              <p className="mt-2 text-muted-foreground">
                Work with the best professionals in the industry
              </p>
            </div>
            <Button variant="ghost" className="hidden sm:flex">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {topFreelancers.map((freelancer) => (
              <div
                key={freelancer.name}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-xl"
              >
                <div className="mb-4 flex items-start justify-between">
                  <img
                    src={freelancer.avatar}
                    alt={freelancer.name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                  {freelancer.isVerified && (
                    <Shield className="h-5 w-5 text-accent" />
                  )}
                </div>
                <h3 className="font-semibold text-foreground">{freelancer.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{freelancer.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{freelancer.location}</p>
                <div className="mt-3 flex items-center gap-1">
                  <Star className="h-4 w-4 fill-accent text-accent" />
                  <span className="text-sm font-semibold text-foreground">{freelancer.rating}</span>
                  <span className="text-xs text-muted-foreground">({freelancer.reviewCount})</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {freelancer.skills.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-secondary px-2 py-1 text-xs text-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Starting at{" "}
                    <span className="font-semibold text-foreground">${freelancer.hourlyRate}/hr</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl bg-foreground p-8 lg:p-12">
            <div className="relative z-10 max-w-xl">
              <h2 className="font-display text-3xl font-bold text-background sm:text-4xl">
                Ready to get started?
              </h2>
              <p className="mt-4 text-lg text-background/70">
                Join millions of businesses who hire freelancers on FreelanceHub.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/client/post-project">
                  <Button variant="accent" size="lg">
                    Post a Project
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-background/20 text-background hover:bg-background/10"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Watch Demo
                </Button>
              </div>
            </div>

            {/* Background Pattern */}
            <div className="absolute right-0 top-0 h-full w-1/2 opacity-10">
              <div className="absolute right-8 top-8 h-32 w-32 rounded-full bg-accent" />
              <div className="absolute bottom-8 right-32 h-24 w-24 rounded-full bg-accent" />
              <div className="absolute right-48 top-24 h-16 w-16 rounded-full bg-accent" />
            </div>
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
