"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import InviteModal from "@/components/invites/InviteModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { searchFreelancers } from "@/lib/api";
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
  Award,
  AlertCircle,
  User
} from "lucide-react";

export default function FindTalentPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minRate: "",
    maxRate: "",
    location: "",
    availability: "",
  });

  // Load freelancers on mount
  useEffect(() => {
    loadFreelancers();
  }, []);

  const loadFreelancers = async (filters = {}) => {
    try {
      setLoading(true);
      setError("");
      
      const response = await searchFreelancers(filters);
      
      if (response.success) {
        setFreelancers(response.freelancers || []);
      } else {
        setError("Failed to load freelancers");
      }
    } catch (err) {
      console.error("Error loading freelancers:", err);
      setError(err.message || "Failed to load freelancers");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const searchFilters = {};
    
    // Use search query for general search (name, title, bio, skills)
    if (searchQuery.trim()) {
      searchFilters.search = searchQuery.trim();
    }
    
    if (filters.minRate) {
      searchFilters.minRate = parseFloat(filters.minRate);
    }
    
    if (filters.maxRate) {
      searchFilters.maxRate = parseFloat(filters.maxRate);
    }
    
    if (filters.location) {
      searchFilters.location = filters.location;
    }
    
    if (filters.availability) {
      searchFilters.availability = filters.availability;
    }
    
    loadFreelancers(searchFilters);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      minRate: "",
      maxRate: "",
      location: "",
      availability: "",
    });
    setSearchQuery("");
    loadFreelancers();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleInviteClick = (freelancer) => {
    setSelectedFreelancer(freelancer);
    setShowInviteModal(true);
  };

  const handleCloseInviteModal = () => {
    setShowInviteModal(false);
    setSelectedFreelancer(null);
  };

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
                  onKeyPress={handleKeyPress}
                  className="h-14 w-full rounded-xl border-border bg-card pl-12 pr-4 text-base"
                />
              </div>
              <Button variant="accent" size="xl" onClick={handleSearch} disabled={loading}>
                {loading ? "Searching..." : "Search Talent"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="border-b border-border bg-card py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              variant={showFilters ? "default" : "outline"} 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            
            {(searchQuery || filters.minRate || filters.maxRate || filters.location || filters.availability) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearFilters}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Clear All
              </Button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-secondary/30 rounded-xl">
              {/* Hourly Rate Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Hourly Rate (USD)</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minRate}
                    onChange={(e) => handleFilterChange("minRate", e.target.value)}
                    className="border-border bg-card"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxRate}
                    onChange={(e) => handleFilterChange("maxRate", e.target.value)}
                    className="border-border bg-card"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Location</label>
                <Input
                  type="text"
                  placeholder="e.g., United States"
                  value={filters.location}
                  onChange={(e) => handleFilterChange("location", e.target.value)}
                  className="border-border bg-card"
                />
              </div>

              {/* Availability */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Availability</label>
                <select
                  value={filters.availability}
                  onChange={(e) => handleFilterChange("availability", e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                >
                  <option value="">All</option>
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="not_available">Not Available</option>
                </select>
              </div>

              {/* Apply Button */}
              <div className="flex items-end">
                <Button 
                  variant="accent" 
                  className="w-full"
                  onClick={handleSearch}
                  disabled={loading}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Results Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Error Message */}
          {error && (
            <Alert className="mb-6 border-2 border-red-200 bg-red-50">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-800 font-semibold">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent"></div>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-muted-foreground">
                  {freelancers.length} freelancer{freelancers.length !== 1 ? 's' : ''} available
                </p>
              </div>

              {/* Empty State */}
              {freelancers.length === 0 ? (
                <div className="text-center py-20">
                  <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No freelancers found
                  </h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search criteria or check back later
                  </p>
                </div>
              ) : (
                <>
                  {/* Freelancer Grid */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {freelancers.map((freelancer) => {
                      // Parse skills if it's a string
                      const skills = Array.isArray(freelancer.skills) 
                        ? freelancer.skills 
                        : (typeof freelancer.skills === 'string' 
                          ? freelancer.skills.split(',').map(s => s.trim()) 
                          : []);

                      return (
                        <div
                          key={freelancer.id}
                          className="group overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-xl"
                        >
                          {/* Header */}
                          <div className="mb-4 flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              {freelancer.avatarUrl ? (
                                <img
                                  src={freelancer.avatarUrl.startsWith('http') ? freelancer.avatarUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${freelancer.avatarUrl}`}
                                  alt={freelancer.fullName}
                                  className="h-16 w-16 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
                                  <User className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <h3 className="font-semibold text-foreground">{freelancer.fullName}</h3>
                                <p className="text-sm text-muted-foreground">{freelancer.title || "Freelancer"}</p>
                              </div>
                            </div>
                            {freelancer.isFeatured && (
                              <Shield className="h-5 w-5 text-accent" />
                            )}
                          </div>

                          {/* Bio */}
                          <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                            {freelancer.bio || "No bio available"}
                          </p>

                          {/* Stats */}
                          <div className="mb-4 flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-accent text-accent" />
                              <span className="font-semibold text-foreground">
                                {freelancer.averageRating ? parseFloat(freelancer.averageRating).toFixed(1) : "N/A"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Briefcase className="h-4 w-4" />
                              <span>{freelancer.totalJobsCompleted || 0} jobs</span>
                            </div>
                          </div>

                          {/* Location & Rate */}
                          <div className="mb-4 flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{freelancer.location || "Not specified"}</span>
                            </div>
                            <div className="flex items-center gap-1 font-semibold text-foreground">
                              <DollarSign className="h-4 w-4" />
                              <span>${freelancer.hourlyRate || 0}/hr</span>
                            </div>
                          </div>

                          {/* Skills */}
                          {skills.length > 0 && (
                            <div className="mb-4 flex flex-wrap gap-2">
                              {skills.slice(0, 4).map((skill, index) => (
                                <span
                                  key={index}
                                  className="rounded-full bg-secondary px-3 py-1 text-xs text-foreground"
                                >
                                  {skill}
                                </span>
                              ))}
                              {skills.length > 4 && (
                                <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                                  +{skills.length - 4}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Link href={`/freelancer/profile/${freelancer.id}`} className="flex-1">
                              <Button variant="accent" className="w-full">
                                View Profile
                              </Button>
                            </Link>
                            <Button 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => handleInviteClick(freelancer)}
                            >
                              Invite
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Load More */}
                  {freelancers.length >= 50 && (
                    <div className="mt-8 text-center">
                      <Button variant="outline" size="lg">
                        Load More Freelancers
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* Invite Modal */}
      {showInviteModal && selectedFreelancer && (
        <InviteModal
          freelancer={selectedFreelancer}
          onClose={handleCloseInviteModal}
        />
      )}
    </div>
  );
}
