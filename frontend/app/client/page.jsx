"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, Star, TrendingUp, Shield } from "lucide-react";

export default function ClientPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
              <span className="font-display text-xl font-bold text-accent-foreground">F</span>
            </div>
            <span className="font-display text-2xl font-bold text-foreground">
              Freelance<span className="text-accent">Hub</span>
            </span>
          </div>
          <div className="w-20"></div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl mb-6">
          Find the Perfect Freelancer
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Connect with talented professionals ready to bring your projects to life. 
          Browse thousands of verified freelancers across all categories.
        </p>
        
        {isAuthenticated ? (
          <div className="flex gap-4 justify-center">
            <Link href="/marketplace">
              <Button size="lg" variant="accent" className="text-lg px-8">
                <Search className="mr-2 h-5 w-5" />
                Browse Freelancers
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="accent" className="text-lg px-8">
                Get Started
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-border bg-card">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-accent/10 mb-4">
              <Search className="h-8 w-8 text-accent" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              Easy Search
            </h3>
            <p className="text-muted-foreground">
              Find freelancers by skills, experience, and ratings with our powerful search tools
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-border bg-card">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-accent/10 mb-4">
              <Star className="h-8 w-8 text-accent" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              Verified Talent
            </h3>
            <p className="text-muted-foreground">
              All freelancers are verified with reviews and ratings from real clients
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-border bg-card">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-accent/10 mb-4">
              <Shield className="h-8 w-8 text-accent" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              Secure Platform
            </h3>
            <p className="text-muted-foreground">
              Your projects and payments are protected with our secure platform
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <TrendingUp className="h-16 w-16 text-accent mx-auto mb-6" />
          <h2 className="font-display text-3xl font-bold text-foreground mb-4">
            Ready to Start Your Project?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of clients who have successfully completed projects with our talented freelancers
          </p>
          {!isAuthenticated && (
            <Link href="/register">
              <Button size="lg" variant="accent" className="text-lg px-8">
                Create Free Account
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
