"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getMilestones, createMilestone, updateMilestone, deleteMilestone, getMilestoneSubmissions, reviewMilestoneSubmission } from "@/lib/api";
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Calendar,
  Save,
  X,
  FileText,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", icon: Clock, color: "text-gray-500" },
  { value: "in_progress", label: "In Progress", icon: Clock, color: "text-blue-500" },
  { value: "under_review", label: "Under Review", icon: AlertCircle, color: "text-yellow-500" },
  { value: "completed", label: "Completed", icon: CheckCircle, color: "text-green-500" },
  { value: "cancelled", label: "Cancelled", icon: X, color: "text-red-500" },
];

export default function MilestoneManager({ projectId, isOwner = false }) {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewingSubmissions, setViewingSubmissions] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [reviewingSubmission, setReviewingSubmission] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  
  // Debug logging
  console.log('MilestoneManager props:', { projectId, isOwner, showAddForm, editingId });
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    dueDate: "",
    status: "pending",
  });

  useEffect(() => {
    if (projectId) {
      fetchMilestones();
    }
  }, [projectId]);

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      setError("");
      
      console.log('Fetching milestones for project:', projectId);
      const response = await getMilestones(projectId);
      console.log('Milestones response:', response);
      
      if (response.success) {
        setMilestones(response.milestones || []);
        console.log('Milestones loaded:', response.milestones?.length || 0);
      } else {
        setError(response.error || "Failed to load milestones");
      }
    } catch (err) {
      console.error("Error fetching milestones:", err);
      setError(err.message || "Failed to load milestones");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      amount: "",
      dueDate: "",
      status: "pending",
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleAdd = () => {
    console.log('handleAdd clicked - setting showAddForm to true');
    setEditingId(null);
    setFormData({
      title: "",
      description: "",
      amount: "",
      dueDate: "",
      status: "pending",
    });
    setShowAddForm(true);
  };

  const handleEdit = (milestone) => {
    setFormData({
      title: milestone.title,
      description: milestone.description || "",
      amount: milestone.amount.toString(),
      dueDate: milestone.dueDate ? milestone.dueDate.split('T')[0] : "",
      status: milestone.status,
    });
    setEditingId(milestone.id);
    setShowAddForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError("");
      setSuccess("");
      
      const milestoneData = {
        title: formData.title,
        description: formData.description,
        amount: parseFloat(formData.amount),
        dueDate: formData.dueDate || null,
        status: formData.status,
      };
      
      let response;
      
      if (editingId) {
        // Update existing milestone
        response = await updateMilestone(editingId, milestoneData);
      } else {
        // Create new milestone
        response = await createMilestone(projectId, milestoneData);
      }
      
      if (response.success) {
        setSuccess(editingId ? "Milestone updated successfully" : "Milestone created successfully");
        resetForm();
        fetchMilestones();
        
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.error || "Failed to save milestone");
      }
    } catch (err) {
      console.error("Error saving milestone:", err);
      setError(err.message || "Failed to save milestone");
    }
  };

  const handleDelete = async (milestoneId) => {
    if (!confirm("Are you sure you want to delete this milestone?")) {
      return;
    }
    
    try {
      setError("");
      setSuccess("");
      
      const response = await deleteMilestone(milestoneId);
      
      if (response.success) {
        setSuccess("Milestone deleted successfully");
        fetchMilestones();
        
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.error || "Failed to delete milestone");
      }
    } catch (err) {
      console.error("Error deleting milestone:", err);
      setError(err.message || "Failed to delete milestone");
    }
  };

  const handleViewSubmissions = async (milestoneId) => {
    try {
      setLoadingSubmissions(true);
      setError("");
      setViewingSubmissions(milestoneId);
      
      const response = await getMilestoneSubmissions(milestoneId);
      
      if (response.success) {
        setSubmissions(response.submissions || []);
      } else {
        setError(response.error || "Failed to load submissions");
      }
    } catch (err) {
      console.error("Error fetching submissions:", err);
      setError(err.message || "Failed to load submissions");
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleReviewSubmission = async (submissionId, action) => {
    try {
      setError("");
      setSuccess("");
      
      const response = await reviewMilestoneSubmission(submissionId, {
        action, // 'approve', 'reject', 'request_revision'
        notes: reviewNotes
      });
      
      if (response.success) {
        setSuccess(`Milestone ${action}d successfully`);
        setReviewingSubmission(null);
        setReviewNotes("");
        setViewingSubmissions(null);
        fetchMilestones();
        
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.error || `Failed to ${action} submission`);
      }
    } catch (err) {
      console.error(`Error ${action}ing submission:`, err);
      setError(err.message || `Failed to ${action} submission`);
    }
  };

  const getStatusInfo = (status) => {
    return STATUS_OPTIONS.find(opt => opt.value === status) || STATUS_OPTIONS[0];
  };

  const calculateProgress = () => {
    if (milestones.length === 0) return 0;
    const completed = milestones.filter(m => m.status === 'completed').length;
    return Math.round((completed / milestones.length) * 100);
  };

  const calculateTotalAmount = () => {
    return milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
  };

  const calculateCompletedAmount = () => {
    return milestones
      .filter(m => m.status === 'completed')
      .reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
  };

  if (loading) {
    return (
      <Card className="border-border">
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Debug: Log button visibility conditions
  console.log('Button visibility check:', {
    isOwner,
    showAddForm,
    editingId,
    shouldShowButton: isOwner && !showAddForm && !editingId
  });
  
  // Debug: Log form visibility
  console.log('Form visibility check:', {
    showAddForm,
    editingId,
    isOwner,
    shouldShowForm: (showAddForm || editingId) && isOwner
  });

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center font-display text-xl">
            <CheckCircle className="h-5 w-5 mr-2 text-accent" />
            Project Milestones
          </CardTitle>
          {isOwner && !showAddForm && !editingId && (
            <Button onClick={handleAdd} variant="accent" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Milestone
            </Button>
          )}
        </div>
        
        {/* Progress Summary */}
        {milestones.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg bg-secondary/30 p-3">
              <p className="text-xs text-muted-foreground">Progress</p>
              <p className="text-2xl font-bold text-foreground">{calculateProgress()}%</p>
            </div>
            <div className="rounded-lg bg-secondary/30 p-3">
              <p className="text-xs text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold text-foreground">${calculateTotalAmount().toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-secondary/30 p-3">
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-green-600">${calculateCompletedAmount().toLocaleString()}</p>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Success/Error Messages */}
        {success && (
          <Alert className="border-2 border-green-200 bg-green-50">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800 font-semibold">
              {success}
            </AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert className="border-2 border-red-200 bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 font-semibold">
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Add/Edit Form */}
        {((showAddForm || editingId) && isOwner) && (
          <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-4 space-y-4">
            <h3 className="font-semibold text-foreground">
              {editingId ? "Edit Milestone" : "Add New Milestone"}
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Milestone Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Initial Design Phase"
                required
                className="border-border bg-background"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe what needs to be completed..."
                className="w-full min-h-[80px] px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-vertical"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="1000"
                    required
                    className="pl-10 border-border bg-background"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split("T")[0]}
                  className="border-border bg-background"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" variant="accent">
                <Save className="h-4 w-4 mr-2" />
                {editingId ? "Update" : "Create"} Milestone
              </Button>
            </div>
          </form>
        )}
        
        {/* Milestones List */}
        {milestones.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
              No milestones yet
            </h3>
            <p className="mt-2 text-muted-foreground">
              {isOwner ? "Add milestones to track project progress and payments" : "This project doesn't have any milestones"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {milestones.map((milestone, index) => {
              const statusInfo = getStatusInfo(milestone.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <div
                  key={milestone.id}
                  className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/10 text-accent font-semibold text-sm">
                          {index + 1}
                        </span>
                        <h4 className="font-semibold text-foreground">{milestone.title}</h4>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-xs ${statusInfo.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          <span>{statusInfo.label}</span>
                        </div>
                      </div>
                      
                      {milestone.description && (
                        <p className="text-sm text-muted-foreground mb-3 ml-11">
                          {milestone.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 ml-11 text-sm">
                        <div className="flex items-center gap-1 text-foreground">
                          <DollarSign className="h-4 w-4 text-accent" />
                          <span className="font-semibold">${milestone.amount.toLocaleString()}</span>
                        </div>
                        
                        {milestone.dueDate && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        
                        {milestone.status === 'under_review' && isOwner && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewSubmissions(milestone.id)}
                            className="ml-auto"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Submission
                          </Button>
                        )}
                      </div>
                      
                      {/* Submission Details */}
                      {viewingSubmissions === milestone.id && (
                        <div className="mt-4 ml-11 p-4 border border-border rounded-lg bg-secondary/30">
                          {loadingSubmissions ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
                            </div>
                          ) : submissions.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No submissions found</p>
                          ) : (
                            <div className="space-y-4">
                              {submissions.map((submission) => (
                                <div key={submission.id} className="space-y-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <FileText className="h-4 w-4 text-accent" />
                                        <span className="font-semibold text-foreground">Submission</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                          submission.status === 'approved' ? 'bg-green-100 text-green-700' :
                                          submission.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                          submission.status === 'revision_requested' ? 'bg-yellow-100 text-yellow-700' :
                                          'bg-gray-100 text-gray-700'
                                        }`}>
                                          {submission.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                      </div>
                                      
                                      {submission.submissionNotes && (
                                        <p className="text-sm text-muted-foreground mb-2">
                                          {submission.submissionNotes}
                                        </p>
                                      )}
                                      
                                      <div className="flex gap-4 text-xs text-muted-foreground">
                                        <span>Hours: {submission.totalHours.toFixed(1)}</span>
                                        <span>Amount: ${submission.totalAmount.toFixed(2)}</span>
                                        <span>Submitted: {new Date(submission.createdAt).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {submission.status === 'pending' && isOwner && (
                                    <div className="space-y-3 pt-3 border-t border-border">
                                      {reviewingSubmission === submission.id ? (
                                        <div className="space-y-3">
                                          <div>
                                            <Label htmlFor="reviewNotes">Review Notes (optional)</Label>
                                            <textarea
                                              id="reviewNotes"
                                              value={reviewNotes}
                                              onChange={(e) => setReviewNotes(e.target.value)}
                                              placeholder="Add notes about your decision..."
                                              className="w-full min-h-[60px] px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-vertical"
                                            />
                                          </div>
                                          <div className="flex gap-2">
                                            <Button
                                              size="sm"
                                              variant="accent"
                                              onClick={() => handleReviewSubmission(submission.id, 'approve')}
                                            >
                                              <ThumbsUp className="h-4 w-4 mr-2" />
                                              Approve
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleReviewSubmission(submission.id, 'request_revision')}
                                              className="text-yellow-600 hover:text-yellow-700"
                                            >
                                              <MessageSquare className="h-4 w-4 mr-2" />
                                              Request Revision
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleReviewSubmission(submission.id, 'reject')}
                                              className="text-red-600 hover:text-red-700"
                                            >
                                              <ThumbsDown className="h-4 w-4 mr-2" />
                                              Reject
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => {
                                                setReviewingSubmission(null);
                                                setReviewNotes("");
                                              }}
                                            >
                                              Cancel
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="accent"
                                          onClick={() => setReviewingSubmission(submission.id)}
                                        >
                                          Review Submission
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                  
                                  {submission.reviewNotes && (
                                    <div className="pt-3 border-t border-border">
                                      <p className="text-xs text-muted-foreground mb-1">Review Notes:</p>
                                      <p className="text-sm text-foreground">{submission.reviewNotes}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {isOwner && milestone.status !== 'completed' && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(milestone)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(milestone.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
