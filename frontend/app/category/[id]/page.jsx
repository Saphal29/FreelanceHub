"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { getAvatarUrl } from "@/lib/avatarUtils";
import {
  ArrowLeft,
  Star,
  Loader2,
  Code,
  Paintbrush,
  PenTool,
  Video,
  Music,
  BarChart3,
  FileText,
  Megaphone,
} from "lucide-react";

const categoryIcons = {
  "programming-tech": Code,
  "graphics-design": Paintbrush,
  "writing-translation": PenTool,
  "video-animation": Video,
  "music-audio": Music,
  "business": BarChart3,
  "data": FileText,
  "marketing": Megaphone,
};

const categoryNames = {
  "programming-tech": "Programming & Tech",
  "graphics-design": "Graphics & Design",
  "writing-translation": "Writing & Translation",
  "video-animation": "Video & Animation",
  "music-audio": "Music & Audio",
  "business": "Business",
  "data": "Data",
  "marketing": "Marketing",
};

const CategoryPage = () => {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id;
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const CategoryIcon = categoryIcons[categoryId] || Code;
  const categoryName = categoryNames[categoryId] || "Category";

  useEffect(() => {
    fetchCompletedProjects();
  }, [categoryId]);

  const fetchCompletedProjects = async () => {
    try {
      setLoading(true);
      console.log('Fetching completed projects for category:', categoryId);
      const response = await api.get('/projects/completed', {
        params: { category: categoryId, limit: 50 }
      });
      console.log('Received projects:', response.data);
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Error fetching completed projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType="client" />

      {/* Header */}
      <section className="border-b border-border bg-secondary/30 py-8">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <CategoryIcon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">
                {categoryName}
              </h1>
              <p className="mt-1 text-muted-foreground">
                Completed projects by talented freelancers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-accent" />
            </div>
          ) : projects.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-xl"
                >
                  <div className="p-5">
                    {/* Freelancer Info */}
                    <div className="mb-4 flex items-center gap-3">
                      {project.freelancer?.avatar ? (
                        <img
                          src={getAvatarUrl(project.freelancer.avatar)}
                          alt={project.freelancer.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-accent">
                            {project.freelancer?.name?.charAt(0) || 'F'}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {project.freelancer?.name || 'Freelancer'}
                        </p>
                        <p className="text-xs text-muted-foreground">Completed Project</p>
                      </div>
                    </div>

                    {/* Project Title */}
                    <h3 className="mb-2 line-clamp-2 text-base font-semibold text-foreground group-hover:text-accent transition-colors">
                      {project.title}
                    </h3>

                    {/* Project Description */}
                    <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
                      {project.description}
                    </p>

                    {/* Skills */}
                    {project.skills && project.skills.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {project.skills.slice(0, 4).map((skill, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-secondary px-3 py-1 text-xs text-foreground"
                          >
                            {skill}
                          </span>
                        ))}
                        {project.skills.length > 4 && (
                          <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                            +{project.skills.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      {project.rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-accent text-accent" />
                          <span className="text-sm font-semibold text-foreground">
                            {project.rating}
                          </span>
                          {project.reviewCount > 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({project.reviewCount})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No reviews yet</span>
                      )}
                      <p className="text-sm font-semibold text-foreground">
                        ${project.budget?.min || 0} - ${project.budget?.max || 0}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
                <CategoryIcon className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                No Completed Projects Yet
              </h3>
              <p className="text-muted-foreground mb-6">
                There are no completed projects in this category at the moment.
              </p>
              <Link href="/dashboard">
                <Button variant="accent">
                  Explore Other Categories
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CategoryPage;
