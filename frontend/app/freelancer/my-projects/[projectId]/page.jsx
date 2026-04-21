'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getProjectWorkspace } from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MilestoneCard from '@/components/milestones/MilestoneCard';
import {
  ArrowLeft, User, Briefcase, Clock, DollarSign, CheckCircle, 
  AlertCircle, Star, MessageSquare, Video, FileText
} from 'lucide-react';
import Link from 'next/link';

export default function ProjectWorkspace() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'FREELANCER' && params.projectId) {
      loadWorkspace();
    }
  }, [user, params.projectId]);

  const loadWorkspace = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getProjectWorkspace(params.projectId);
      if (response.success) {
        setWorkspace(response);
      }
    } catch (err) {
      setError(err.message || 'Failed to load workspace');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'FREELANCER') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar userType="freelancer" />
        <div className="container mx-auto px-4 py-8">
          <Alert className="border-2 border-red-200 bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 font-semibold">{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!workspace) return null;

  const { project, milestones, recentTimeEntries, pendingRevisions } = workspace;

  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  const progressPercentage = milestones.length > 0 
    ? Math.round((completedMilestones / milestones.length) * 100) 
    : 0;

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: "bg-green-100", text: "text-green-700", label: "Active" },
      in_progress: { bg: "bg-blue-100", text: "text-blue-700", label: "In Progress" },
      completed: { bg: "bg-gray-100", text: "text-gray-700", label: "Completed" },
      on_hold: { bg: "bg-yellow-100", text: "text-yellow-700", label: "On Hold" }
    };
    const badge = badges[status] || badges.active;
    return (
      <span className={`rounded-full px-3 py-1 text-sm font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType="freelancer" />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/freelancer/my-projects" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to My Projects</span>
          </Link>

          {/* Alerts */}
          {pendingRevisions.length > 0 && (
            <Alert className="mb-6 border-2 border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                {pendingRevisions.length} Revision Request{pendingRevisions.length > 1 ? 's' : ''} Pending - Please address the feedback and resubmit
              </AlertDescription>
            </Alert>
          )}

          {project.contractStatus === 'completed' && (
            <Alert className="mb-6 border-2 border-green-200 bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-800 font-semibold">
                🎉 Project Completed! All milestones have been approved.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">{project.title}</h1>
              <p className="text-muted-foreground mt-1">Project #{params.projectId.slice(0, 8)}</p>
            </div>
            {getStatusBadge(project.contractStatus)}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Link href={`/chat?userId=${project.client.id}&contractId=${project.contractId}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Message Client
              </Button>
            </Link>
            {project.contractStatus === 'active' && (
              <Link href={`/calls?calleeId=${project.client.id}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Video className="h-4 w-4" />
                  Video Call
                </Button>
              </Link>
            )}
            {project.contractId && (
              <Link href={`/contracts/${project.contractId}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <FileText className="h-4 w-4" />
                  View Contract
                </Button>
              </Link>
            )}
            {project.contractStatus === 'completed' && (
              <Link href={`/contracts/${project.contractId}/review`}>
                <Button variant="accent" size="sm" className="gap-2">
                  <Star className="h-4 w-4" />
                  Leave Review
                </Button>
              </Link>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Project Overview */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center font-display text-xl">
                    <Briefcase className="h-5 w-5 mr-2 text-accent" />
                    Project Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Description</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{project.description}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Contract Value</h4>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-accent" />
                      <span className="text-2xl font-bold text-foreground">
                        NPR {project.totalAmount?.toFixed(2)}
                      </span>
                    </div>
                    {project.hourlyRate && (
                      <p className="text-sm text-muted-foreground mt-1">NPR {project.hourlyRate}/hr</p>
                    )}
                  </div>
                  {project.skills && project.skills.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">Skills Required</h4>
                      <div className="flex flex-wrap gap-2">
                        {project.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-accent text-foreground text-sm rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Progress</h4>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{progressPercentage}% Complete</span>
                      <span>{completedMilestones}/{milestones.length} Milestones</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-accent h-2 rounded-full transition-all"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Milestones */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center font-display text-xl">
                    <CheckCircle className="h-5 w-5 mr-2 text-accent" />
                    Milestones ({milestones.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {milestones.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No milestones defined for this project</p>
                  ) : (
                    <div className="space-y-4">
                      {milestones.map((milestone) => (
                        <MilestoneCard
                          key={milestone.id}
                          milestone={milestone}
                          userRole="freelancer"
                          onUpdate={loadWorkspace}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Time Tracking */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center font-display text-xl">
                    <Clock className="h-5 w-5 mr-2 text-accent" />
                    Recent Time Entries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentTimeEntries.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No time entries yet</p>
                  ) : (
                    <div className="space-y-3">
                      {recentTimeEntries.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                          <div>
                            <p className="font-semibold text-foreground text-sm">
                              {entry.description || 'No description'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(entry.start_time).toLocaleString()} - 
                              {entry.end_time ? new Date(entry.end_time).toLocaleString() : 'Running'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-foreground">
                              {entry.duration_minutes ? (entry.duration_minutes / 60).toFixed(2) : '0.00'} hrs
                            </p>
                            {entry.total_amount && (
                              <p className="text-sm text-green-600">
                                NPR {parseFloat(entry.total_amount).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pending Revisions */}
              {pendingRevisions.length > 0 && (
                <Card className="border-border border-yellow-200">
                  <CardHeader>
                    <CardTitle className="flex items-center font-display text-xl">
                      <AlertCircle className="h-5 w-5 mr-2 text-yellow-600" />
                      Pending Revisions ({pendingRevisions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {pendingRevisions.map((revision) => (
                      <div key={revision.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-foreground text-sm">{revision.milestone_title}</p>
                            <p className="text-xs text-muted-foreground">
                              Requested on {new Date(revision.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                            Pending
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{revision.revision_notes}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 space-y-6">
                {/* Client Info */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="font-display text-lg">Client</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                        {project.client.avatar ? (
                          <img 
                            src={project.client.avatar} 
                            alt={project.client.name} 
                            className="h-12 w-12 rounded-full object-cover" 
                          />
                        ) : (
                          <User className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{project.client.name}</p>
                        {project.client.company && (
                          <p className="text-sm text-muted-foreground">{project.client.company}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        <span className="font-medium">Email:</span> {project.client.email}
                      </p>
                      {project.client.phone && (
                        <p className="text-muted-foreground">
                          <span className="font-medium">Phone:</span> {project.client.phone}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Project Details */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="font-display text-lg">Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Category</p>
                      <p className="font-semibold text-foreground">{project.category}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Project Type</p>
                      <p className="font-semibold text-foreground">{project.projectType}</p>
                    </div>
                    {project.startDate && (
                      <div>
                        <p className="text-muted-foreground">Start Date</p>
                        <p className="font-semibold text-foreground">
                          {new Date(project.startDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {project.deadline && (
                      <div>
                        <p className="text-muted-foreground">Deadline</p>
                        <p className="font-semibold text-foreground">
                          {new Date(project.deadline).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
