"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Search, 
  Star, 
  Clock,
  DollarSign,
  Filter,
  ChevronDown
} from "lucide-react";

// Dummy data for category services
const categoryServices = {
  "programming-tech": {
    title: "Programming & Tech",
    description: "Find expert developers and programmers for your projects",
    services: [
      {
        id: "1",
        image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&h=375&fit=crop",
        title: "Full Stack Web Development with React and Node.js",
        seller: { name: "John Developer", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop", level: "Top Rated" },
        rating: 4.9,
        reviewCount: 234,
        price: 200,
        deliveryTime: "3 days"
      },
      {
        id: "2",
        image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=500&h=375&fit=crop",
        title: "Mobile App Development for iOS and Android",
        seller: { name: "Sarah Mobile", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", level: "Pro" },
        rating: 5.0,
        reviewCount: 189,
        price: 350,
        deliveryTime: "5 days"
      },
      {
        id: "3",
        image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&h=375&fit=crop",
        title: "Python Automation and Scripting Solutions",
        seller: { name: "Mike Python", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", level: "Rising Talent" },
        rating: 4.8,
        reviewCount: 156,
        price: 150,
        deliveryTime: "2 days"
      },
      {
        id: "4",
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=375&fit=crop",
        title: "WordPress Website Development and Customization",
        seller: { name: "Emma WordPress", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop", level: "Top Rated" },
        rating: 4.9,
        reviewCount: 298,
        price: 180,
        deliveryTime: "4 days"
      },
    ]
  },
  "graphics-design": {
    title: "Graphics & Design",
    description: "Creative design services for your brand and business",
    services: [
      {
        id: "5",
        image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=500&h=375&fit=crop",
        title: "Professional Logo Design with Unlimited Revisions",
        seller: { name: "Alex Designer", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop", level: "Top Rated" },
        rating: 5.0,
        reviewCount: 445,
        price: 120,
        deliveryTime: "2 days"
      },
      {
        id: "6",
        image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&h=375&fit=crop",
        title: "Complete Brand Identity Package",
        seller: { name: "Lisa Brand", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", level: "Pro" },
        rating: 4.9,
        reviewCount: 312,
        price: 250,
        deliveryTime: "5 days"
      },
    ]
  },
  // Add more categories as needed
};

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params.id;
  const category = categoryServices[categoryId] || {
    title: "Category Not Found",
    description: "This category doesn't exist yet",
    services: []
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType="client" />

      {/* Header */}
      <section className="border-b border-border bg-secondary/30 py-8">
        <div className="container mx-auto px-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            {category.title}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {category.description}
          </p>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="border-b border-border bg-card py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
              <Button variant="outline" size="sm">
                Budget
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                Delivery Time
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search services..."
                className="h-10 w-full rounded-full border-border bg-secondary pl-10 pr-4"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-muted-foreground">
              {category.services.length} services available
            </p>
            <Button variant="ghost" size="sm">
              Sort by: Recommended
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {category.services.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {category.services.map((service) => (
                <Link
                  key={service.id}
                  href={`/service/${service.id}`}
                  className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-xl"
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
                    <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {service.deliveryTime}
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-3">
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
          ) : (
            <div className="py-16 text-center">
              <p className="text-lg text-muted-foreground">No services found in this category yet.</p>
              <Link href="/dashboard">
                <Button variant="accent" className="mt-4">
                  Explore Other Categories
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
