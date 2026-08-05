"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Navbar from "@/components/layout/Navbar";
import CommandRail from "@/components/layout/CommandRail";
import { useAuth } from "@/contexts/AuthContext";
import { createProject, getProjectCategories, getProjectById, updateProject } from "@/lib/api";
import FileUpload from "@/components/files/FileUpload";
import {
  Briefcase,
  Banknote,
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
  Send
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";

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

function PostProjectForm() {
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
    watch,
    setValue,
    formState: { errors },
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

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await getProjectCategories();
        if (response.success) {
          setCategories(response.categories || []);
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
          
          if (project.skills && Array.isArray(project.skills)) {
            setSkills(project.skills);
            setValue("skills", project.skills);
          }
          if (project.milestones && Array.isArray(project.milestones)) {
            setMilestones(project.milestones);
          }
        }
      } catch (err) {
        console.error("Error loading project:", err);
      } finally {
        setLoadingProject(false);
      }
    };

    loadProjectData();
  }, [isEditMode, editProjectId, setValue]);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "CLIENT")) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Skill management
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

  // Milestone management
  const addMilestone = () => {
    if (!milestoneForm.title || !milestoneForm.amount) {
      setError("Milestone title and amount in NPR are required.");
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
        fileIds: attachedFiles.map(f => f.file?.id || f.id).filter(Boolean),
      };

      let response;
      if (isEditMode) {
        response = await updateProject(editProjectId, projectData);
      } else {
        response = await createProject(projectData);
      }

      if (response.success) {
        setSuccess(
          isEditMode
            ? "Project brief updated successfully!"
            : isDraft
            ? "Project brief saved as draft."
            : "Project brief posted successfully! Freelancers can now view and submit proposals."
        );

        setTimeout(() => {
          router.push("/client/projects");
        }, 1800);
      } else {
        setError(response.error || `Failed to ${isEditMode ? "update" : "create"} project brief.`);
      }
    } catch (err) {
      setError(err.message || `Failed to ${isEditMode ? "update" : "create"} project brief.`);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loadingProject) {
    return (
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center font-mono-ledger">
        <div className="space-y-3 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--signal)] mx-auto"></div>
          <p className="text-[12px] text-[var(--muted)] uppercase">LOADING BRIEF WIZARD...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "CLIENT") return null;

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar userType="client" />

      {/* Floating Tool Rail */}
      <CommandRail userType="client" />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10 flex-1 w-full pb-24 lg:pb-12 text-left">
        
        {/* HEADER */}
        <section className="space-y-4 border-b border-[var(--ink)] pb-8">
          <div className="flex items-center justify-between font-mono-ledger text-[11px] uppercase tracking-wider">
            <Link href="/client/projects" className="text-[var(--muted)] hover:text-[var(--ink)] flex items-center space-x-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>MY PROJECTS</span>
            </Link>
            <span className="text-[var(--signal)] font-bold">[BUILD BRIEF]</span>
          </div>

          <div className="space-y-2">
            <h1 className="font-serif-ledger text-[36px] sm:text-[48px] leading-[1.05] font-medium tracking-tight text-[var(--ink)]">
              {isEditMode ? "Update Project Brief." : "Post a New Brief."}
            </h1>
            <p className="text-[15px] text-[var(--muted)]">
              Specify your scope, technical requirements, budget range in NPR, and milestone timeline for verified freelancers.
            </p>
          </div>
        </section>


        {/* NOTIFICATION MESSAGES */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-600 text-green-800 font-mono-ledger text-[12px] flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
            <span className="font-bold">{success}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] font-mono-ledger text-[12px] flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0" />
            <span className="font-bold">{error}</span>
          </div>
        )}


        {/* PROJECT BRIEF BUILDER FORM */}
        <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="space-y-10">
          
          {/* SECTION 01: BRIEF IDENTIFICATION & SCOPE */}
          <div className="space-y-5">
            <div className="border-b border-[var(--ink)] pb-2 font-mono-ledger text-[11px] uppercase tracking-wider font-bold text-[var(--ink)]">
              01 / BRIEF IDENTIFICATION & SCOPE
            </div>

            {/* Title */}
            <div className="space-y-1.5 font-mono-ledger">
              <label htmlFor="title" className="text-[11px] uppercase font-bold text-[var(--ink)] block">
                PROJECT TITLE *
              </label>
              <input
                id="title"
                type="text"
                {...register("title")}
                placeholder="e.g. Build a Modern Mobile & Web App in React Native"
                className="w-full bg-[var(--paper-2)] border-2 border-[var(--ink)] p-3 text-[14px] text-[var(--ink)] focus:outline-none focus:border-[var(--signal)] font-sans-ledger"
              />
              {errors.title && <p className="text-[11px] text-[var(--signal)]">{errors.title.message}</p>}
            </div>

            {/* Category */}
            <div className="space-y-1.5 font-mono-ledger">
              <label htmlFor="category" className="text-[11px] uppercase font-bold text-[var(--ink)] block">
                CATEGORY *
              </label>
              <select
                id="category"
                {...register("category")}
                className="w-full bg-[var(--paper-2)] border-2 border-[var(--ink)] p-3 text-[13px] text-[var(--ink)] focus:outline-none focus:border-[var(--signal)]"
              >
                <option value="">Select Category</option>
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))
                ) : (
                  <>
                    <option value="Web & Software Engineering">Web & Software Engineering</option>
                    <option value="Mobile App Development">Mobile App Development</option>
                    <option value="UI/UX & Editorial Design">UI/UX & Editorial Design</option>
                    <option value="Backend & API Infrastructure">Backend & API Infrastructure</option>
                    <option value="AI & Data Science">AI & Data Science</option>
                  </>
                )}
              </select>
              {errors.category && <p className="text-[11px] text-[var(--signal)]">{errors.category.message}</p>}
            </div>

            {/* Description */}
            <div className="space-y-1.5 font-mono-ledger">
              <div className="flex justify-between items-center text-[11px] uppercase font-bold text-[var(--ink)]">
                <label htmlFor="description">PROJECT DESCRIPTION & DELIVERABLE SPECIFICATION *</label>
                <span className="text-[var(--muted)]">{watch("description")?.length || 0}/5000</span>
              </div>
              <textarea
                id="description"
                rows={6}
                {...register("description")}
                placeholder="Describe your project requirements, technical deliverables, and goals in detail..."
                className="w-full bg-[var(--paper-2)] border-2 border-[var(--ink)] p-3 text-[14px] text-[var(--ink)] focus:outline-none focus:border-[var(--signal)] font-sans-ledger leading-relaxed"
                maxLength={5000}
              />
              {errors.description && <p className="text-[11px] text-[var(--signal)]">{errors.description.message}</p>}
            </div>
          </div>


          {/* SECTION 02: REQUIRED SKILLS SPECIMEN */}
          <div className="space-y-4">
            <div className="border-b border-[var(--ink)] pb-2 font-mono-ledger text-[11px] uppercase tracking-wider font-bold text-[var(--ink)]">
              02 / REQUIRED TECHNICAL SKILLS
            </div>

            <div className="space-y-2 font-mono-ledger">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                  placeholder="e.g. React Native, Node.js, PostgreSQL"
                  className="flex-1 bg-[var(--paper-2)] border-2 border-[var(--ink)] p-3 text-[13px] text-[var(--ink)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="bg-[var(--ink)] text-[var(--paper)] font-bold px-6 py-3 uppercase hover:bg-[var(--signal)] transition-colors"
                >
                  + ADD
                </button>
              </div>

              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {skills.map((skill, idx) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1 bg-[var(--paper-2)] border border-[var(--ink)] text-[11px] uppercase font-bold flex items-center space-x-2"
                    >
                      <span>{skill}</span>
                      <button type="button" onClick={() => removeSkill(skill)} className="text-[var(--signal)] font-bold hover:text-[var(--ink)]">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {errors.skills && <p className="text-[11px] text-[var(--signal)]">{errors.skills.message}</p>}
            </div>
          </div>


          {/* SECTION 03: FINANCIAL & BUDGET STRUCTURE */}
          <div className="space-y-5">
            <div className="border-b border-[var(--ink)] pb-2 font-mono-ledger text-[11px] uppercase tracking-wider font-bold text-[var(--ink)]">
              03 / FINANCIAL & BUDGET STRUCTURE
            </div>

            {/* Project Type */}
            <div className="space-y-2 font-mono-ledger text-[12px]">
              <span className="text-[11px] uppercase font-bold text-[var(--ink)] block">CONTRACT TYPE *</span>
              <div className="grid grid-cols-2 gap-4">
                <label className={`p-4 border-2 cursor-pointer transition-all ${projectType === "fixed_price" ? "border-[var(--signal)] bg-[var(--signal)]/10 font-bold" : "border-[var(--ink)] bg-[var(--paper-2)]"}`}>
                  <input type="radio" {...register("projectType")} value="fixed_price" className="sr-only" />
                  <span>FIXED PRICE CONTRACT</span>
                </label>
                <label className={`p-4 border-2 cursor-pointer transition-all ${projectType === "hourly" ? "border-[var(--signal)] bg-[var(--signal)]/10 font-bold" : "border-[var(--ink)] bg-[var(--paper-2)]"}`}>
                  <input type="radio" {...register("projectType")} value="hourly" className="sr-only" />
                  <span>HOURLY RATE CONTRACT</span>
                </label>
              </div>
            </div>

            {/* Budget Range (NPR) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono-ledger">
              <div className="space-y-1">
                <label htmlFor="budgetMin" className="text-[10px] text-[var(--muted)] uppercase font-bold block">MINIMUM BUDGET (NPR) *</label>
                <input
                  id="budgetMin"
                  type="number"
                  {...register("budgetMin")}
                  placeholder="25000"
                  className="w-full bg-[var(--paper-2)] border-2 border-[var(--ink)] p-3 text-[14px] font-bold focus:outline-none"
                />
                {errors.budgetMin && <p className="text-[11px] text-[var(--signal)]">{errors.budgetMin.message}</p>}
              </div>

              <div className="space-y-1">
                <label htmlFor="budgetMax" className="text-[10px] text-[var(--muted)] uppercase font-bold block">MAXIMUM BUDGET (NPR) *</label>
                <input
                  id="budgetMax"
                  type="number"
                  {...register("budgetMax")}
                  placeholder="75000"
                  className="w-full bg-[var(--paper-2)] border-2 border-[var(--ink)] p-3 text-[14px] font-bold focus:outline-none"
                />
                {errors.budgetMax && <p className="text-[11px] text-[var(--signal)]">{errors.budgetMax.message}</p>}
              </div>
            </div>

            {/* Duration & Deadline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono-ledger">
              <div className="space-y-1">
                <label htmlFor="durationEstimate" className="text-[10px] text-[var(--muted)] uppercase font-bold block">ESTIMATED DURATION</label>
                <input
                  id="durationEstimate"
                  type="text"
                  {...register("durationEstimate")}
                  placeholder="e.g. 4 Weeks, 2 Months"
                  className="w-full bg-[var(--paper-2)] border-2 border-[var(--ink)] p-3 text-[13px] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="deadline" className="text-[10px] text-[var(--muted)] uppercase font-bold block">TARGET DEADLINE</label>
                <input
                  id="deadline"
                  type="date"
                  {...register("deadline")}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full bg-[var(--paper-2)] border-2 border-[var(--ink)] p-3 text-[13px] focus:outline-none"
                />
              </div>
            </div>
          </div>


          {/* SECTION 04: MILESTONE SCHEDULE BUILDER */}
          <div className="space-y-4">
            <div className="border-b border-[var(--ink)] pb-2 font-mono-ledger text-[11px] uppercase tracking-wider font-bold text-[var(--ink)] flex items-center justify-between">
              <span>04 / MILESTONE SCHEDULE (OPTIONAL)</span>
              <span className="text-[var(--signal)]">{milestones.length} MILESTONES</span>
            </div>

            {milestones.length > 0 && (
              <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] divide-y divide-[var(--line)] font-mono-ledger text-[12px]">
                {milestones.map((m, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[var(--ink)]">{idx + 1}. {m.title}</span>
                      <p className="text-[11px] text-[var(--muted)]">{m.description}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="font-bold text-[var(--signal)]">NPR {m.amount?.toLocaleString()}</span>
                      {!isEditMode && (
                        <button type="button" onClick={() => removeMilestone(idx)} className="text-[var(--signal)] font-bold">
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isEditMode && (
              <>
                {showMilestoneForm ? (
                  <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-4 space-y-3 font-mono-ledger text-[12px]">
                    <span className="font-bold text-[var(--ink)] uppercase block">ADD MILESTONE SPECIFICATION</span>
                    <input
                      type="text"
                      placeholder="Milestone Title (e.g. Design Spec & Prototype)"
                      value={milestoneForm.title}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                      className="w-full bg-[var(--paper)] border border-[var(--ink)] p-2.5"
                    />
                    <input
                      type="number"
                      placeholder="Milestone Amount (NPR)"
                      value={milestoneForm.amount}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, amount: e.target.value })}
                      className="w-full bg-[var(--paper)] border border-[var(--ink)] p-2.5 font-bold"
                    />
                    <div className="flex justify-end space-x-2 pt-2">
                      <button type="button" onClick={() => setShowMilestoneForm(false)} className="px-4 py-2 border border-[var(--ink)] bg-[var(--paper)]">
                        CANCEL
                      </button>
                      <button type="button" onClick={addMilestone} className="px-4 py-2 bg-[var(--signal)] text-[var(--paper)] font-bold uppercase">
                        ADD MILESTONE
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowMilestoneForm(true)}
                    className="w-full py-3 border-2 border-dashed border-[var(--ink)] bg-[var(--paper-2)] font-mono-ledger font-bold text-[12px] uppercase hover:border-[var(--signal)] transition-colors"
                  >
                    + ADD MILESTONE STEP
                  </button>
                )}
              </>
            )}
          </div>


          {/* SUBMIT BUTTONS */}
          <div className="pt-6 border-t border-[var(--ink)] flex flex-col sm:flex-row items-center justify-end gap-4 font-mono-ledger">
            <button
              type="button"
              onClick={handleSubmit((data) => onSubmit(data, true))}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3.5 border-2 border-[var(--ink)] bg-[var(--paper-2)] text-[var(--ink)] font-bold text-[12px] uppercase hover:bg-[var(--paper)] transition-colors"
            >
              SAVE AS DRAFT
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold text-[12px] uppercase tracking-wider transition-colors shadow-xs"
            >
              {loading ? "POSTING BRIEF..." : isEditMode ? "UPDATE BRIEF NOW →" : "POST PROJECT BRIEF NOW →"}
            </button>
          </div>

        </form>

      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-center mt-12 font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FreelanceHub · Brief Builder Wizard</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}

export default function PostProjectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center font-mono-ledger">
        <p className="text-[12px] text-[var(--muted)] uppercase">LOADING WIZARD...</p>
      </div>
    }>
      <PostProjectContent />
    </Suspense>
  );
}
