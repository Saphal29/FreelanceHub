"use client";

import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { 
  Search,
  UserPlus,
  FileText,
  MessageSquare,
  CheckCircle,
  DollarSign,
  Shield,
  Star,
  Clock,
  Award,
  Users,
  Briefcase,
  TrendingUp,
  ArrowRight
} from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar userType="client" />

      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-hero py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl mb-6">
            How <span className="text-gradient-gold">FreelanceHub</span> Works
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Connect with talented freelancers or find your next project in three simple steps
          </p>
        </div>
      </section>

      {/* For Clients Section */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl mb-4">
              For Clients
            </h2>
            <p className="text-lg text-muted-foreground">
              Hire top talent for your projects in minutes
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 mb-12">
            {/* Step 1 */}
            <div className="relative text-center">
              <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <FileText className="h-10 w-10" />
              </div>
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent font-bold">
                1
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                Post Your Project
              </h3>
              <p className="text-muted-foreground">
                Describe your project requirements, set your budget, and post it for free. Our platform makes it easy to get started.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative text-center">
              <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <Users className="h-10 w-10" />
              </div>
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent font-bold">
                2
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                Review Proposals
              </h3>
              <p className="text-muted-foreground">
                Receive proposals from qualified freelancers. Review their profiles, portfolios, and ratings to find the perfect match.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative text-center">
              <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <CheckCircle className="h-10 w-10" />
              </div>
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent font-bold">
                3
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                Hire & Collaborate
              </h3>
              <p className="text-muted-foreground">
                Choose your freelancer and start working together. Use our platform for communication, file sharing, and secure payments.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link href="/client">
              <Button variant="accent" size="lg">
                Post a Project
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* For Freelancers Section */}
      <section className="bg-secondary/30 py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl mb-4">
              For Freelancers
            </h2>
            <p className="text-lg text-muted-foreground">
              Find work and grow your freelance business
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 mb-12">
            {/* Step 1 */}
            <div className="relative text-center">
              <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <UserPlus className="h-10 w-10" />
              </div>
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent font-bold">
                1
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                Create Your Profile
              </h3>
              <p className="text-muted-foreground">
                Sign up for free and create a professional profile showcasing your skills, experience, and portfolio.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative text-center">
              <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <Search className="h-10 w-10" />
              </div>
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent font-bold">
                2
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                Find Projects
              </h3>
              <p className="text-muted-foreground">
                Browse thousands of projects matching your skills. Submit proposals and showcase why you're the best fit.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative text-center">
              <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <DollarSign className="h-10 w-10" />
              </div>
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent font-bold">
                3
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                Get Paid Securely
              </h3>
              <p className="text-muted-foreground">
                Complete projects and receive payments securely through our platform. Build your reputation with client reviews.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link href="/freelancer">
              <Button variant="accent" size="lg">
                Start Freelancing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl mb-4">
              Why Choose FreelanceHub?
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need for successful freelance collaboration
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Secure Payments</h3>
              <p className="text-sm text-muted-foreground">
                Protected transactions with escrow and milestone payments
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Star className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Verified Talent</h3>
              <p className="text-sm text-muted-foreground">
                All freelancers are verified with reviews and ratings
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Easy Communication</h3>
              <p className="text-sm text-muted-foreground">
                Built-in messaging and file sharing tools
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">24/7 Support</h3>
              <p className="text-sm text-muted-foreground">
                Our team is always here to help you succeed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-foreground py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-center">
            <div>
              <div className="mb-2 text-4xl font-bold text-accent">10M+</div>
              <div className="text-background/70">Registered Users</div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold text-accent">5M+</div>
              <div className="text-background/70">Projects Completed</div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold text-accent">$2B+</div>
              <div className="text-background/70">Total Earnings</div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold text-accent">4.9</div>
              <div className="text-background/70">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-premium p-8 lg:p-12 text-center">
            <div className="relative z-10">
              <h2 className="font-display text-3xl font-bold text-background sm:text-4xl mb-4">
                Ready to Get Started?
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-background/80 mb-8">
                Join millions of businesses and freelancers who trust FreelanceHub for their projects
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/register">
                  <Button variant="accent" size="lg">
                    Sign Up Free
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-background/20 text-background hover:bg-background/10"
                  >
                    Sign In
                  </Button>
                </Link>
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
    </div>
  );
}
