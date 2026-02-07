"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Star, 
  Clock,
  RefreshCw,
  Shield,
  MessageSquare,
  Heart,
  Share2,
  Check
} from "lucide-react";

// Dummy service data
const servicesData = {
  "1": {
    title: "I will build a modern responsive website using React and Tailwind",
    description: "I will create a stunning, fully responsive website using the latest React and Tailwind CSS technologies. Your website will be fast, modern, and optimized for all devices.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=675&fit=crop",
    seller: {
      name: "Alex Morgan",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
      level: "Top Rated",
      rating: 4.9,
      reviewCount: 342,
      completedOrders: 1250,
      responseTime: "1 hour"
    },
    rating: 4.9,
    reviewCount: 342,
    price: 150,
    deliveryTime: "3 days",
    revisions: "Unlimited",
    features: [
      "Responsive Design",
      "Modern UI/UX",
      "Fast Loading Speed",
      "SEO Optimized",
      "Cross-browser Compatible",
      "Clean Code"
    ],
    packages: [
      {
        name: "Basic",
        price: 150,
        deliveryTime: "3 days",
        revisions: 2,
        features: ["3 Pages", "Responsive Design", "Basic SEO"]
      },
      {
        name: "Standard",
        price: 300,
        deliveryTime: "5 days",
        revisions: 5,
        features: ["5 Pages", "Responsive Design", "Advanced SEO", "Contact Form"]
      },
      {
        name: "Premium",
        price: 500,
        deliveryTime: "7 days",
        revisions: "Unlimited",
        features: ["10 Pages", "Responsive Design", "Advanced SEO", "Contact Form", "CMS Integration", "E-commerce"]
      }
    ],
    reviews: [
      {
        id: 1,
        author: "John Client",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
        rating: 5,
        date: "2 weeks ago",
        comment: "Excellent work! Very professional and delivered on time. Highly recommended!"
      },
      {
        id: 2,
        author: "Sarah Business",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
        rating: 5,
        date: "1 month ago",
        comment: "Amazing developer! The website looks fantastic and works perfectly."
      }
    ]
  },
  "2": {
    title: "I will design a professional logo and complete brand identity",
    description: "Get a unique, professional logo design that represents your brand perfectly. I'll work with you to create a memorable brand identity.",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&h=675&fit=crop",
    seller: {
      name: "Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
      level: "Pro",
      rating: 5.0,
      reviewCount: 567,
      completedOrders: 2100,
      responseTime: "30 minutes"
    },
    rating: 5.0,
    reviewCount: 567,
    price: 200,
    deliveryTime: "2 days",
    revisions: "Unlimited",
    features: [
      "Custom Logo Design",
      "Multiple Concepts",
      "Unlimited Revisions",
      "Source Files Included",
      "Brand Guidelines",
      "Social Media Kit"
    ],
    packages: [
      {
        name: "Basic",
        price: 200,
        deliveryTime: "2 days",
        revisions: 3,
        features: ["Logo Design", "3 Concepts", "Source Files"]
      },
      {
        name: "Standard",
        price: 400,
        deliveryTime: "3 days",
        revisions: 5,
        features: ["Logo Design", "5 Concepts", "Source Files", "Brand Guidelines"]
      },
      {
        name: "Premium",
        price: 700,
        deliveryTime: "5 days",
        revisions: "Unlimited",
        features: ["Logo Design", "Unlimited Concepts", "Source Files", "Brand Guidelines", "Social Media Kit", "Stationery Design"]
      }
    ],
    reviews: [
      {
        id: 1,
        author: "Mike Startup",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
        rating: 5,
        date: "1 week ago",
        comment: "Perfect logo! Sarah understood exactly what I wanted and delivered beyond expectations."
      }
    ]
  }
};

export default function ServicePage() {
  const params = useParams();
  const serviceId = params.id;
  const service = servicesData[serviceId] || null;

  if (!service) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar userType="client" />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Service Not Found</h1>
          <p className="text-muted-foreground mb-8">This service doesn't exist or has been removed.</p>
          <Link href="/dashboard">
            <Button variant="accent">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType="client" />

      {/* Breadcrumb */}
      <section className="border-b border-border bg-secondary/30 py-4">
        <div className="container mx-auto px-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Service Details */}
            <div className="lg:col-span-2">
              {/* Service Image */}
              <div className="mb-6 overflow-hidden rounded-2xl">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-auto"
                />
              </div>

              {/* Service Title and Actions */}
              <div className="mb-6 flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl mb-2">
                    {service.title}
                  </h1>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <span className="font-semibold text-foreground">{service.rating}</span>
                      <span className="text-muted-foreground">({service.reviewCount} reviews)</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Heart className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* About This Service */}
              <div className="mb-8 rounded-2xl border border-border bg-card p-6">
                <h2 className="font-display text-xl font-bold text-foreground mb-4">
                  About This Service
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
              </div>

              {/* Features */}
              <div className="mb-8 rounded-2xl border border-border bg-card p-6">
                <h2 className="font-display text-xl font-bold text-foreground mb-4">
                  What's Included
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {service.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-accent" />
                      <span className="text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviews */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-display text-xl font-bold text-foreground mb-6">
                  Reviews ({service.reviewCount})
                </h2>
                <div className="space-y-6">
                  {service.reviews.map((review) => (
                    <div key={review.id} className="border-b border-border pb-6 last:border-0 last:pb-0">
                      <div className="flex items-start gap-4">
                        <img
                          src={review.avatar}
                          alt={review.author}
                          className="h-12 w-12 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-semibold text-foreground">{review.author}</p>
                              <p className="text-sm text-muted-foreground">{review.date}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              {[...Array(review.rating)].map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                              ))}
                            </div>
                          </div>
                          <p className="text-muted-foreground">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Seller Card and Packages */}
            <div className="lg:col-span-1">
              {/* Seller Card */}
              <div className="sticky top-20 mb-6 rounded-2xl border border-border bg-card p-6">
                <div className="mb-6 flex items-center gap-4">
                  <img
                    src={service.seller.avatar}
                    alt={service.seller.name}
                    className="h-16 w-16 rounded-full"
                  />
                  <div>
                    <p className="font-semibold text-foreground">{service.seller.name}</p>
                    <p className="text-sm text-muted-foreground">{service.seller.level}</p>
                    <div className="mt-1 flex items-center gap-1">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <span className="text-sm font-semibold text-foreground">{service.seller.rating}</span>
                      <span className="text-xs text-muted-foreground">({service.seller.reviewCount})</span>
                    </div>
                  </div>
                </div>

                <div className="mb-6 space-y-3 border-t border-border pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Response time</span>
                    <span className="font-medium text-foreground">{service.seller.responseTime}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Orders completed</span>
                    <span className="font-medium text-foreground">{service.seller.completedOrders}</span>
                  </div>
                </div>

                <Button variant="accent" className="w-full mb-3">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Contact Seller
                </Button>
              </div>

              {/* Package Card */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold text-foreground">Basic Package</h3>
                  <p className="text-2xl font-bold text-foreground">${service.price}</p>
                </div>

                <div className="mb-6 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{service.deliveryTime} Delivery</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{service.revisions} Revisions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">Money-back Guarantee</span>
                  </div>
                </div>

                <Button variant="accent" className="w-full" size="lg">
                  Continue (${service.price})
                </Button>

                <p className="mt-4 text-center text-xs text-muted-foreground">
                  You won't be charged yet
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
