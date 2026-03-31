"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Briefcase,
  DollarSign,
  Calendar,
  User,
  MapPin,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AdminProjectDetail() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id;
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError("");
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setProject(response.data.project);
      } else {
        setError(response.data.error || "Failed to load project");
      }
    } catch (err) {
      console.error("Error fetching project:", err);
      setError(err.response?.data?.error || "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-8">
        <Alert className="border-2 border-red-200 bg-red-50">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-800 font-semibold">
            {error || "Project not found"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-8">
      <Link
        href="/admin/projects"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Projects</span>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{project.title}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
              {project.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-muted-foreground">
            Project ID: {project.id.slice(0, 8)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{project.description}</p>
            </CardContent>
          </Card>

          {/* Skills Required */}
          {project.skills && project.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Skills Required</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Milestones */}
          {project.milestones && project.milestones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Milestones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.milestones.map((milestone, index) => (
                    <div key={milestone.id} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{milestone.title}</p>
                        {milestone.description && (
                          <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                        )}
                        {milestone.due_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Due: {new Date(milestone.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${parseFloat(milestone.amount).toFixed(2)}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          milestone.status === 'completed' ? 'bg-green-100 text-green-800' :
                          milestone.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {milestone.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-6">
            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{project.client?.full_name || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold mt-1">{project.client?.email || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Budget Range</p>
                  <div className="flex items-center gap-2 mt-1">
                    <DollarSign className="h-4 w-4 text-accent" />
                    <span className="font-semibold">
                      ${project.budget_min?.toLocaleString()} - ${project.budget_max?.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground">Project Type</p>
                  <p className="font-semibold mt-1 capitalize">
                    {project.project_type?.replace('_', ' ') || 'N/A'}
                  </p>
                </div>

                {project.duration_estimate && (
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{project.duration_estimate}</span>
                    </div>
                  </div>
                )}

                {project.deadline && (
                  <div>
                    <p className="text-muted-foreground">Deadline</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">
                        {new Date(project.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}

                {project.location && (
                  <div>
                    <p className="text-muted-foreground">Location</p>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{project.location}</span>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-muted-foreground">Remote Work</p>
                  <p className="font-semibold mt-1">
                    {project.is_remote ? 'Yes' : 'No'}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">Experience Level</p>
                  <p className="font-semibold mt-1 capitalize">
                    {project.experience_level?.replace('_', ' ') || 'N/A'}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-semibold mt-1">{project.category}</p>
                </div>

                <div>
                  <p className="text-muted-foreground">Posted On</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground">Proposals</p>
                  <p className="font-semibold mt-1">{project.proposals_count || 0}</p>
                </div>

                <div>
                  <p className="text-muted-foreground">Views</p>
                  <p className="font-semibold mt-1">{project.views_count || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
