"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { createProject, getProjectCategories, getProjectById, updateProject } from "@/lib/api";
import FileUpload from "@/components/files/FileUpload";
import {
  Briefcase,
  DollarSign,
  Calendar,
  MapPin,
  FileText,
  Tag,
  Users,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Plus,
  X,
  Save,
  Send,
} from "lucide-react";
import Link from "next/link";

// Validation schema
const projectSchema = z.object({
  title: z.string()
    .min(5, "Title must be at least 5 characters")
    .max(255, "Title must be less than 255 characters"),
  description: z.string()
    .min(20, "Description must be at least 20 characters")
    .max(5000, "Description must be less than 5000 characters"),
  category: z.string().min(1, "Please select a category"),
  skills: z.array(z.string()).min(1, "Add at least one required skill"),
  budgetMin: z.string()
    .min(1, "Minimum budget is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Must be a valid number"),
  budgetMax: z.string()
    .min(1, "Maximum budget is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Must be a valid number"),
  projectType: z.enum(["fixed_price", "hourly"]),
  experienceLevel: z.enum(["entry_level", "intermediate", "expert"]),
  durationEstimate: z.string().optional(),
  deadline: z.string().optional(),
  location: z.string().optional(),
  isRemote: z.boolean(),
  visibility: z.enum(["public", "private", "invite_only"]),
}).refine((data) => parseFloat(data.budgetMin) <= parseFloat(data.budgetMax), {
  message: "Minimum budget cannot be greater than maximum budget",
  path: ["budgetMax"],
});

function PostProjectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editProjectId = searchParams.get("edit");
  const isEditMode = !!editProjectId;
  
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingProject, setLoadingProject] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({
    title: "",
    description: "",
    amount: "",
    dueDate: "",
  });
  const [attachedFiles, setAttachedFiles] = useState([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      skills: [],
      budgetMin: "",
      budgetMax: "",
      projectType: "fixed_price",
      experienceLevel: "intermediate",
      durationEstimate: "",
      deadline: "",
      location: "",
      isRemote: true,
      visibility: "public",
    },
  });

  const projectType = watch("projectType");
  const isRemote = watch("isRemote");

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await getProjectCategories();
        if (response.success) {
          setCategories(response.categories);
        }
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    };

    loadCategories();
  }, []);

  // Load project data if in edit mode
  useEffect(() => {
    const loadProjectData = async () => {
      if (!isEditMode || !editProjectId) return;
      
      try {
        setLoadingProject(true);
        setError("");
        
        const response = await getProjectById(editProjectId);
        
        if (response.success && response.project) {
          const project = response.project;
          
          // Set form values
          setValue("title", project.title || "");
          setValue("description", project.description || "");
          setValue("category", project.category || "");
          setValue("budgetMin", project.budget_min?.toString() || "");
          setValue("budgetMax", project.budget_max?.toString() || "");
          setValue("projectType", project.project_type || "fixed_price");
          setValue("experienceLevel", project.experience_level || "intermediate");
          setValue("durationEstimate", project.duration_estimate || "");
          setValue("deadline", project.deadline ? project.deadline.split('T')[0] : "");
          setValue("location", project.location || "");
          setValue("isRemote", project.is_remote ?? true);
          setValue("visibility", project.visibility || "public");
          
          // Set skills
          if (project.skills && Array.isArray(project.skills)) {
            setSkills(project.skills);
            setValue("skills", project.skills);
          }
          
          // Set milestones (for display only - editing milestones should be done in View Details page)
          if (project.milestones && Array.isArray(project.milestones)) {
            setMilestones(project.milestones);
          }
        } else {
          setError("Failed to load project data");
        }
      } catch (err) {
        console.error("Error loading project:", err);
        setError(err.message || "Failed to load project data");
      } finally {
        setLoadingProject(false);
      }
    };

    loadProjectData();
  }, [isEditMode, editProjectId, setValue]);

  // Redirect if not authenticated or not a client
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "CLIENT")) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Handle skill addition
  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      const newSkills = [...skills, skillInput.trim()];
      setSkills(newSkills);
      setValue("skills", newSkills, { shouldValidate: true });
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove) => {
    const newSkills = skills.filter((skill) => skill !== skillToRemove);
    setSkills(newSkills);
    setValue("skills", newSkills, { shouldValidate: true });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  // Milestone handlers
  const addMilestone = () => {
    if (!milestoneForm.title || !milestoneForm.amount) {
      setError("Milestone title and amount are required");
      return;
    }
    
    const newMilestone = {
      title: milestoneForm.title,
      description: milestoneForm.description,
      amount: parseFloat(milestoneForm.amount),
      dueDate: milestoneForm.dueDate || null,
      orderIndex: milestones.length,
    };
    
    setMilestones([...milestones, newMilestone]);
    setMilestoneForm({ title: "", description: "", amount: "", dueDate: "" });
    setShowMilestoneForm(false);
    setError("");
  };

  const removeMilestone = (index) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const onSubmit = async (data, isDraft = false) => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const projectData = {
        ...data,
        budgetMin: parseFloat(data.budgetMin),
        budgetMax: parseFloat(data.budgetMax),
        skills: skills,
        status: isDraft ? "draft" : "active",
        milestones: milestones.length > 0 ? milestones : undefined,
        fileIds: attachedFiles.map(f => f.file.id), // Add file IDs
      };

      let response;
      
      if (isEditMode) {
        // Update existing project
        response = await updateProject(editProjectId, projectData);
      } else {
        // Create new project
        response = await createProject(projectData);
      }

      if (response.success) {
        setSuccess(
          isEditMode
            ? "Project updated successfully!"
            : isDraft
            ? "Project saved as draft successfully!"
            : "Project posted successfully! Freelancers can now see and apply to your project."
        );

        // Redirect after 2 seconds
        setTimeout(() => {
          router.push("/client/projects");
        }, 2000);
      } else {
        setError(response.error || `Failed to ${isEditMode ? "update" : "create"} project`);
      }
    } catch (err) {
      setError(err.message || `Failed to ${isEditMode ? "update" : "create"} project`);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loadingProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== "CLIENT") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType="client" />

      {/* Header */}
      <section className="border-b border-border bg-secondary/30 py-8">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            {isEditMode ? (
              <>Edit <span className="text-amber-500">Project</span></>
            ) : (
              <>Post <span className="text-amber-500">Project</span></>
            )}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {isEditMode 
              ? "Update your project details" 
              : "Tell us about your project and find the perfect freelancer"}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto py-8 px-4">
        <div className="mx-auto max-w-4xl space-y-6">
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

          <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="space-y-6">
            {/* Project Details */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center font-display text-xl">
                  <FileText className="h-5 w-5 mr-2 text-accent" />
                  Project Details
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Provide clear information about your project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Project Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-foreground font-medium">
                    Project Title *
                  </Label>
                  <Input
                    id="title"
                    {...register("title")}
                    placeholder="e.g., Build a modern e-commerce website with React"
                    className="border-border bg-card"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">{errors.title.message}</p>
                  )}
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-foreground font-medium">
                    Category *
                  </Label>
                  <select
                    id="category"
                    {...register("category")}
                    className="w-full px-3 py-2 border border-border rounded-xl bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-sm text-red-500">{errors.category.message}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-foreground font-medium">
                    Project Description *
                  </Label>
                  <textarea
                    id="description"
                    {...register("description")}
                    placeholder="Describe your project in detail. Include what you need, your goals, and any specific requirements..."
                    className="w-full min-h-[150px] px-3 py-2 border border-border rounded-xl bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-vertical"
                    maxLength={5000}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Be as detailed as possible to attract the right freelancers</span>
                    <span>{watch("description")?.length || 0}/5000</span>
                  </div>
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description.message}</p>
                  )}
                </div>

                {/* Skills Required */}
                <div className="space-y-2">
                  <Label htmlFor="skills" className="text-foreground font-medium">
                    Required Skills *
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="skills"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="e.g., React, Node.js, UI Design"
                      className="flex-1 border-border bg-card"
                    />
                    <Button
                      type="button"
                      onClick={addSkill}
                      variant="outline"
                      className="px-4"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-sm text-accent"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="hover:text-accent-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {errors.skills && (
                    <p className="text-sm text-red-500">{errors.skills.message}</p>
                  )}
                </div>

                {/* Project Attachments */}
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">
                    Project Attachments (Optional)
                  </Label>
                  <FileUpload
                    category="project_attachment"
                    maxSize={25}
                    multiple={true}
                    onUploadSuccess={(files) => {
                      setAttachedFiles(files);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload reference documents, specifications, or examples (Max 25MB per file)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Budget & Timeline */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center font-display text-xl">
                  <DollarSign className="h-5 w-5 mr-2 text-accent" />
                  Budget & Timeline
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Set your budget and project timeline
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Project Type */}
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Project Type *</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <label
                      className={`flex items-center justify-center gap-2 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                        projectType === "fixed_price"
                          ? "border-accent bg-accent/10"
                          : "border-border bg-card hover:border-accent/50"
                      }`}
                    >
                      <input
                        type="radio"
                        {...register("projectType")}
                        value="fixed_price"
                        className="sr-only"
                      />
                      <Briefcase className="h-5 w-5" />
                      <span className="font-medium">Fixed Price</span>
                    </label>
                    <label
                      className={`flex items-center justify-center gap-2 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                        projectType === "hourly"
                          ? "border-accent bg-accent/10"
                          : "border-border bg-card hover:border-accent/50"
                      }`}
                    >
                      <input
                        type="radio"
                        {...register("projectType")}
                        value="hourly"
                        className="sr-only"
                      />
                      <Calendar className="h-5 w-5" />
                      <span className="font-medium">Hourly Rate</span>
                    </label>
                  </div>
                </div>

                {/* Budget Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budgetMin" className="text-foreground font-medium">
                      Minimum Budget (USD) *
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="budgetMin"
                        type="number"
                        step="0.01"
                        {...register("budgetMin")}
                        placeholder="500"
                        className="pl-10 border-border bg-card"
                      />
                    </div>
                    {errors.budgetMin && (
                      <p className="text-sm text-red-500">{errors.budgetMin.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budgetMax" className="text-foreground font-medium">
                      Maximum Budget (USD) *
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="budgetMax"
                        type="number"
                        step="0.01"
                        {...register("budgetMax")}
                        placeholder="1000"
                        className="pl-10 border-border bg-card"
                      />
                    </div>
                    {errors.budgetMax && (
                      <p className="text-sm text-red-500">{errors.budgetMax.message}</p>
                    )}
                  </div>
                </div>

                {/* Duration & Deadline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="durationEstimate" className="text-foreground font-medium">
                      Estimated Duration
                    </Label>
                    <Input
                      id="durationEstimate"
                      {...register("durationEstimate")}
                      placeholder="e.g., 2-3 months, 4 weeks"
                      className="border-border bg-card"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deadline" className="text-foreground font-medium">
                      Deadline
                    </Label>
                    <Input
                      id="deadline"
                      type="date"
                      {...register("deadline")}
                      min={new Date().toISOString().split("T")[0]}
                      className="border-border bg-card"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Milestones (Optional) */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center font-display text-xl">
                  <CheckCircle className="h-5 w-5 mr-2 text-accent" />
                  Project Milestones (Optional)
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {isEditMode 
                    ? "Existing milestones are shown below. To add, edit, or delete milestones, use the 'View Details' page after saving."
                    : "Break your project into milestones for better tracking and payment management"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Edit Mode Notice */}
                {isEditMode && milestones.length > 0 && (
                  <Alert className="border-2 border-blue-200 bg-blue-50">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      To manage milestones, save your changes and go to the project's "View Details" page.
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Milestones List */}
                {milestones.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {milestones.map((milestone, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between rounded-xl border border-border bg-card p-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent/10 text-accent font-semibold text-xs">
                              {index + 1}
                            </span>
                            <h4 className="font-semibold text-foreground">{milestone.title}</h4>
                          </div>
                          {milestone.description && (
                            <p className="text-sm text-muted-foreground ml-8 mb-2">
                              {milestone.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 ml-8 text-sm">
                            <span className="text-foreground font-semibold">
                              ${milestone.amount.toLocaleString()}
                            </span>
                            {milestone.dueDate && (
                              <span className="text-muted-foreground">
                                Due: {new Date(milestone.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        {!isEditMode && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMilestone(index)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <div className="text-sm text-muted-foreground">
                      Total: ${milestones.reduce((sum, m) => sum + m.amount, 0).toLocaleString()}
                    </div>
                  </div>
                )}

                {/* Add Milestone Form - Only in create mode */}
                {!isEditMode && (
                  <>
                    {showMilestoneForm ? (
                  <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-4">
                    <h4 className="font-semibold text-foreground">Add Milestone</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="milestoneTitle">Milestone Title *</Label>
                      <Input
                        id="milestoneTitle"
                        value={milestoneForm.title}
                        onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                        placeholder="e.g., Initial Design Phase"
                        className="border-border bg-background"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="milestoneDescription">Description</Label>
                      <textarea
                        id="milestoneDescription"
                        value={milestoneForm.description}
                        onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                        placeholder="Describe what needs to be completed..."
                        className="w-full min-h-[60px] px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-vertical"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="milestoneAmount">Amount (USD) *</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="milestoneAmount"
                            type="number"
                            step="0.01"
                            value={milestoneForm.amount}
                            onChange={(e) => setMilestoneForm({ ...milestoneForm, amount: e.target.value })}
                            placeholder="1000"
                            className="pl-10 border-border bg-background"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="milestoneDueDate">Due Date</Label>
                        <Input
                          id="milestoneDueDate"
                          type="date"
                          value={milestoneForm.dueDate}
                          onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                          min={new Date().toISOString().split("T")[0]}
                          className="border-border bg-background"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowMilestoneForm(false);
                          setMilestoneForm({ title: "", description: "", amount: "", dueDate: "" });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="button" variant="accent" onClick={addMilestone}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Milestone
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowMilestoneForm(true)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Milestone
                  </Button>
                )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center font-display text-xl">
                  <Users className="h-5 w-5 mr-2 text-accent" />
                  Freelancer Requirements
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Specify the experience level and location preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Experience Level */}
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Experience Level *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { value: "entry_level", label: "Entry Level", desc: "New freelancers" },
                      { value: "intermediate", label: "Intermediate", desc: "Some experience" },
                      { value: "expert", label: "Expert", desc: "Highly experienced" },
                    ].map((level) => (
                      <label
                        key={level.value}
                        className={`flex flex-col gap-1 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                          watch("experienceLevel") === level.value
                            ? "border-accent bg-accent/10"
                            : "border-border bg-card hover:border-accent/50"
                        }`}
                      >
                        <input
                          type="radio"
                          {...register("experienceLevel")}
                          value={level.value}
                          className="sr-only"
                        />
                        <span className="font-medium">{level.label}</span>
                        <span className="text-xs text-muted-foreground">{level.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-foreground font-medium">
                    Preferred Location
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      {...register("location")}
                      placeholder="e.g., United States, Europe, Worldwide"
                      className="pl-10 border-border bg-card"
                    />
                  </div>
                </div>

                {/* Remote Work */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isRemote"
                    {...register("isRemote")}
                    className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                  />
                  <Label htmlFor="isRemote" className="text-foreground font-medium cursor-pointer">
                    This is a remote project
                  </Label>
                </div>

                {/* Visibility */}
                <div className="space-y-2">
                  <Label htmlFor="visibility" className="text-foreground font-medium">
                    Project Visibility
                  </Label>
                  <select
                    id="visibility"
                    {...register("visibility")}
                    className="w-full px-3 py-2 border border-border rounded-xl bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    <option value="public">Public - Anyone can see and apply</option>
                    <option value="private">Private - Only you can see it</option>
                    <option value="invite_only">Invite Only - Only invited freelancers</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard")}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSubmit((data) => onSubmit(data, true))}
                disabled={loading}
                className="min-w-[140px]"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    Save as Draft
                  </div>
                )}
              </Button>
              <Button
                type="submit"
                variant="accent"
                disabled={loading}
                className="min-w-[140px]"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isEditMode ? "Updating..." : "Posting..."}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Send className="h-4 w-4 mr-2" />
                    {isEditMode ? "Update Project" : "Post Project"}
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function PostProjectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    }>
      <PostProjectContent />
    </Suspense>
  );
}
