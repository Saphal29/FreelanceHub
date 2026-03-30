"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowLeft, User, MapPin, DollarSign, Star, Briefcase, 
  Award, Clock, Mail, Phone, Globe, AlertCircle, CheckCircle
} from "lucide-react";

export default function FreelancerProfilePage() {
  const params = useParams();
  const freelancerId = params.id;
  const { user } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (freelancerId) {
      fetchProfile();
    }
  }, [freelancerId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/${freelancerId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.profile);
      } else {
        setError(data.error || "Failed to load profile");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar userType={user?.role === "CLIENT" ? "client" : "freelancer"} />
        <div className="container mx-auto px-4 py-8">
          <Alert className="border-2 border-red-200 bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 font-semibold">
              {error || "Profile not found"}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const skills = Array.isArray(profile.skills) 
    ? profile.skills 
    : (typeof profile.skills === 'string' 
      ? profile.skills.split(',').map(s => s.trim()) 
      : []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType={user?.role === "CLIENT" ? "client" : "freelancer"} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Link 
            href="/client/talent" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Find Talent</span>
          </Link>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Header */}
              <Card className="border-border">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4 mb-6">
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl.startsWith('http') ? profile.avatarUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${profile.avatarUrl}`}
                        alt={profile.fullName}
                        className="h-24 w-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-24 w-24 rounded-full bg-accent flex items-center justify-center">
                        <User className="h-12 w-12 text-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                        {profile.fullName}
                      </h1>
                      <p className="text-lg text-muted-foreground mb-3">
                        {profile.title || "Freelancer"}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        {profile.location && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{profile.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-foreground font-semibold">
                          <DollarSign className="h-4 w-4" />
                          <span>${profile.hourlyRate || 0}/hr</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-secondary rounded-xl">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Star className="h-5 w-5 fill-accent text-accent" />
                        <span className="text-2xl font-bold text-foreground">
                          {profile.averageRating ? parseFloat(profile.averageRating).toFixed(1) : "N/A"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Rating</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Briefcase className="h-5 w-5 text-accent" />
                        <span className="text-2xl font-bold text-foreground">
                          {profile.totalJobsCompleted || 0}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Jobs Completed</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Award className="h-5 w-5 text-accent" />
                        <span className="text-2xl font-bold text-foreground">
                          {profile.totalReviews || 0}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Reviews</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* About */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="font-display text-xl">About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {profile.bio || "No bio available"}
                  </p>
                </CardContent>
              </Card>

              {/* Skills */}
              {skills.length > 0 && (
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="font-display text-xl">Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-accent text-foreground rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Completed Projects */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="font-display text-xl">
                    Completed Projects ({profile.completedProjects?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!profile.completedProjects || profile.completedProjects.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No completed projects yet
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {profile.completedProjects.map((project) => (
                        <div 
                          key={project.id} 
                          className="p-4 border border-border rounded-xl hover:bg-secondary transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-foreground">{project.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {project.category}
                              </p>
                            </div>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {project.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Completed: {new Date(project.completedAt).toLocaleDateString()}</span>
                            {project.budget && (
                              <span className="font-semibold text-foreground">
                                ${parseFloat(project.budget).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Reviews */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="font-display text-xl">
                    Reviews ({profile.reviews?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!profile.reviews || profile.reviews.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No reviews yet
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {profile.reviews.map((review) => (
                        <div 
                          key={review.id} 
                          className="p-4 border border-border rounded-xl"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-semibold text-foreground">{review.clientName}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-accent text-accent" />
                              <span className="font-semibold text-foreground">
                                {review.rating}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {review.comment}
                          </p>
                          {review.projectTitle && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Project: {review.projectTitle}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 space-y-6">
                {/* Contact Info */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="font-display text-lg">Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {profile.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{profile.email}</span>
                      </div>
                    )}
                    {profile.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{profile.phone}</span>
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={profile.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-accent hover:underline"
                        >
                          {profile.website}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Availability */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="font-display text-lg">Availability</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground capitalize">
                        {profile.availability || "Not specified"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                {user?.role === "CLIENT" && (
                  <Card className="border-border">
                    <CardContent className="pt-6 space-y-2">
                      <Button variant="accent" className="w-full">
                        Invite to Project
                      </Button>
                      <Link href={`/chat?userId=${freelancerId}`}>
                        <Button variant="outline" className="w-full">
                          Send Message
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
