'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getFreelancerWorkspace } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Navbar from '@/components/layout/Navbar';
import { 
  Briefcase, 
  DollarSign, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Timer,
  User
} from 'lucide-react';

export default function MyProjects() {
  const router = useRouter();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user?.role === 'FREELANCER') {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getFreelancerWorkspace();
      if (response.success) {
        setProjects(response.projects || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredProjects = () => {
    if (filter === 'all') return projects;
    if (filter === 'active') return projects.filter(p => p.contractStatus === 'active' || p.contractStatus === 'in_progress');
    if (filter === 'completed') return projects.filter(p => p.projectStatus === 'completed');
    return projects;
  };

  const getProgressPercentage = (project) => {
    if (project.stats.totalMilestones === 0) return 0;
    return Math.round((project.stats.completedMilestones / project.stats.totalMilestones) * 100);
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle, label: "Active" },
      in_progress: { bg: "bg-blue-100", text: "text-blue-700", icon: Clock, label: "In Progress" },
      completed: { bg: "bg-gray-100", text: "text-gray-700", icon: CheckCircle, label: "Completed" },
      on_hold: { bg: "bg-yellow-100", text: "text-yellow-700", icon: AlertCircle, label: "On Hold" }
    };
    
    const badge = badges[status] || badges.active;
    const Icon = badge.icon;
    
    return (
      <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="h-4 w-4" />
        {badge.label}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== 'FREELANCER') {
    return null;
  }

  const filteredProjects = getFilteredProjects();

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType="freelancer" />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="font-display text-3xl font-bold text-foreground">
              My Projects
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage your active projects
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={filter === "all" ? "accent" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "active" ? "accent" : "outline"}
              size="sm"
              onClick={() => setFilter("active")}
            >
              Active
            </Button>
            <Button
              variant={filter === "completed" ? "accent" : "outline"}
              size="sm"
              onClick={() => setFilter("completed")}
            >
              Completed
            </Button>
          </div>

          {/* Error */}
          {error && (
            <Alert className="mb-6 border-2 border-red-200 bg-red-50">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-800 font-semibold">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Projects List */}
          {filteredProjects.length === 0 ? (
            <Card className="border-border">
              <CardContent className="py-12 text-center">
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No projects yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredProjects.map((project) => (
                <Card
                  key={project.projectId}
                  className="border-border hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/freelancer/my-projects/${project.projectId}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="font-display text-lg">
                          {project.projectTitle}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Project #{project.projectId.slice(0, 8)}
                        </p>
                      </div>
                      {getStatusBadge(project.contractStatus)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Client Info */}
                      <div className="flex items-center gap-2 pb-3 border-b border-border">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                          {project.client.avatar ? (
                            <img 
                              src={project.client.avatar} 
                              alt={project.client.name} 
                              className="h-8 w-8 rounded-full object-cover" 
                            />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{project.client.name}</p>
                          {project.client.company && (
                            <p className="text-xs text-muted-foreground">{project.client.company}</p>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-accent" />
                        <span className="text-sm text-muted-foreground">Earned:</span>
                        <span className="font-semibold text-foreground">
                          NPR {project.stats.earnedAmount.toFixed(0)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-accent" />
                        <span className="text-sm text-muted-foreground">Hours:</span>
                        <span className="font-semibold text-foreground">
                          {project.stats.totalTimeHours.toFixed(1)}h
                        </span>
                      </div>

                      {/* Progress */}
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{project.stats.completedMilestones}/{project.stats.totalMilestones} Milestones</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-accent h-2 rounded-full transition-all"
                            style={{ width: `${getProgressPercentage(project)}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-border">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Category: {project.category}</span>
                          {project.stats.activeTimers > 0 && (
                            <span className="flex items-center gap-1 text-red-600">
                              <Timer className="h-3 w-3 animate-pulse" />
                              Timer active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
