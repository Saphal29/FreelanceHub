"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { createProject, getProjectCategories, getProjectById, updateProject } from "@/lib/api";
import FileUpload from "@/components/files/FileUpload";
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";

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

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "CLIENT")) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

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
            : "Project brief posted successfully!"
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
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center font-mono-ledger text-[12px] text-[var(--muted)]">
        LOADING BRIEF FORM...
      </div>
    );
  }

  if (!user || user.role !== "CLIENT") return null;

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar userType="client" />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 flex-1 w-full pb-24 lg:pb-12 text-left">
        
        {/* HEADER */}
        <section className="space-y-4 border-b border-[var(--ink)] pb-8">
          <div className="font-mono-ledger text-[11px]">
            <Link href="/client/projects" className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
              ← Back to Client Projects
            </Link>
          </div>

          <div className="space-y-2">
            <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[var(--signal)] inline-block animate-pulse"></span>
              <span>FREELANCEHUB FORM · PROJECT BRIEF BUILDER</span>
            </p>
            <h1 className="font-serif-ledger text-[38px] sm:text-[48px] leading-[1.05] font-medium tracking-tight text-[var(--ink)]">
              {isEditMode ? "Update project brief" : "Post a project brief"}
            </h1>
            <p className="text-[15px] text-[var(--muted)]">
              Specify your scope, technical requirements, budget range in NPR, and milestone timeline for verified freelancers.
            </p>
          </div>
        </section>

        {/* NOTIFICATIONS */}
        {success && (
          <div className="p-4 bg-[var(--paper-2)] border border-[var(--signal)] text-[var(--ink)] font-mono-ledger text-[12px] flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-[var(--signal)] shrink-0" />
            <span className="font-bold">{success}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] font-mono-ledger text-[12px] flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* PROJECT BRIEF FORM */}
        <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="space-y-8 font-mono-ledger text-[12px]">
          
          {/* SECTION 01: BRIEF IDENTIFICATION & SCOPE */}
          <div className="space-y-4">
            <span className="font-bold text-[var(--ink)] uppercase text-[11px] block border-b border-[var(--ink)] pb-2">
              01 / Brief Identification & Scope
            </span>

            {/* Title */}
            <div className="space-y-1">
              <label htmlFor="title" className="text-[10px] text-[var(--muted)] uppercase font-bold block">
                Project title *
              </label>
              <input
                id="title"
                type="text"
                {...register("title")}
                placeholder="e.g. Full-stack Web & Mobile Application Development"
                className={`w-full bg-[var(--paper)] border p-2.5 text-[13px] text-[var(--ink)] font-sans-ledger outline-none transition-colors ${
                  errors.title ? "border-[var(--signal)]" : "border-[var(--line)] focus:border-[var(--ink)]"
                }`}
              />
              {errors.title && <span className="text-[var(--signal-dark)] text-[10px] block">{errors.title.message}</span>}
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label htmlFor="category" className="text-[10px] text-[var(--muted)] uppercase font-bold block">
                Category *
              </label>
              <select
                id="category"
                {...register("category")}
                className={`w-full bg-[var(--paper)] border p-2.5 text-[12px] text-[var(--ink)] outline-none transition-colors ${
                  errors.category ? "border-[var(--signal)]" : "border-[var(--line)] focus:border-[var(--ink)]"
                }`}
              >
                <option value="">Select category...</option>
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
              {errors.category && <span className="text-[var(--signal-dark)] text-[10px] block">{errors.category.message}</span>}
            </div>

            {/* Description */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] text-[var(--muted)] uppercase font-bold">
                <label htmlFor="description">Project description & deliverables *</label>
                <span>{watch("description")?.length || 0}/5000</span>
              </div>
              <textarea
                id="description"
                rows={6}
                {...register("description")}
                placeholder="Describe project requirements, milestone goals, and expected deliverables..."
                className={`w-full bg-[var(--paper)] border p-3 text-[13px] text-[var(--ink)] font-sans-ledger leading-relaxed outline-none transition-colors ${
                  errors.description ? "border-[var(--signal)]" : "border-[var(--line)] focus:border-[var(--ink)]"
                }`}
                maxLength={5000}
              />
              {errors.description && <span className="text-[var(--signal-dark)] text-[10px] block">{errors.description.message}</span>}
            </div>
          </div>

          {/* SECTION 02: REQUIRED SKILLS */}
          <div className="space-y-3">
            <span className="font-bold text-[var(--ink)] uppercase text-[11px] block border-b border-[var(--ink)] pb-2">
              02 / Required Technical Skills
            </span>

            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                  placeholder="e.g. React Native, Node.js, PostgreSQL"
                  className="flex-1 bg-[var(--paper)] border border-[var(--line)] p-2.5 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--ink)]"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="bg-[var(--ink)] text-[var(--paper)] font-bold px-5 py-2.5 text-[11px] uppercase hover:bg-[var(--signal)] transition-colors shrink-0"
                >
                  Add skill
                </button>
              </div>

              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                  {skills.map((skill, idx) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1 bg-[var(--paper-2)] border border-[var(--line)] text-[var(--ink)] font-bold flex items-center space-x-2"
                    >
                      <span>{skill}</span>
                      <button type="button" onClick={() => removeSkill(skill)} className="text-[var(--signal)] font-bold hover:text-[var(--ink)]">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {errors.skills && <span className="text-[var(--signal-dark)] text-[10px] block">{errors.skills.message}</span>}
            </div>
          </div>

          {/* SECTION 03: BUDGET & CONTRACT TYPE */}
          <div className="space-y-4">
            <span className="font-bold text-[var(--ink)] uppercase text-[11px] block border-b border-[var(--ink)] pb-2">
              03 / Financial & Contract Structure
            </span>

            {/* Contract Type Radio */}
            <div className="space-y-1">
              <span className="text-[10px] text-[var(--muted)] uppercase font-bold block">Contract type *</span>
              <div className="grid grid-cols-2 gap-4">
                <label className={`p-3.5 border cursor-pointer transition-all flex items-center space-x-2 ${projectType === "fixed_price" ? "border-[var(--ink)] bg-[var(--paper-2)] font-bold" : "border-[var(--line)] bg-[var(--paper)]"}`}>
                  <input type="radio" {...register("projectType")} value="fixed_price" className="accent-[var(--ink)]" />
                  <span>Fixed price contract</span>
                </label>
                <label className={`p-3.5 border cursor-pointer transition-all flex items-center space-x-2 ${projectType === "hourly" ? "border-[var(--ink)] bg-[var(--paper-2)] font-bold" : "border-[var(--line)] bg-[var(--paper)]"}`}>
                  <input type="radio" {...register("projectType")} value="hourly" className="accent-[var(--ink)]" />
                  <span>Hourly rate contract</span>
                </label>
              </div>
            </div>

            {/* Budget Range with Static NPR Prefixes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="budgetMin" className="text-[10px] text-[var(--muted)] uppercase font-bold block">
                  Minimum budget (NPR) *
                </label>
                <div className="flex items-center border border-[var(--line)] bg-[var(--paper)] focus-within:border-[var(--ink)]">
                  <span className="px-3 py-2 bg-[var(--paper-2)] border-r border-[var(--line)] text-[var(--muted)] font-bold">NPR</span>
                  <input
                    id="budgetMin"
                    type="number"
                    {...register("budgetMin")}
                    placeholder="25000"
                    className="w-full bg-transparent p-2 text-[13px] font-bold text-[var(--ink)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                {errors.budgetMin && <span className="text-[var(--signal-dark)] text-[10px] block">{errors.budgetMin.message}</span>}
              </div>

              <div className="space-y-1">
                <label htmlFor="budgetMax" className="text-[10px] text-[var(--muted)] uppercase font-bold block">
                  Maximum budget (NPR) *
                </label>
                <div className="flex items-center border border-[var(--line)] bg-[var(--paper)] focus-within:border-[var(--ink)]">
                  <span className="px-3 py-2 bg-[var(--paper-2)] border-r border-[var(--line)] text-[var(--muted)] font-bold">NPR</span>
                  <input
                    id="budgetMax"
                    type="number"
                    {...register("budgetMax")}
                    placeholder="75000"
                    className="w-full bg-transparent p-2 text-[13px] font-bold text-[var(--ink)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                {errors.budgetMax && <span className="text-[var(--signal-dark)] text-[10px] block">{errors.budgetMax.message}</span>}
              </div>
            </div>

            {/* Duration & Deadline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="durationEstimate" className="text-[10px] text-[var(--muted)] uppercase font-bold block">Estimated duration</label>
                <input
                  id="durationEstimate"
                  type="text"
                  {...register("durationEstimate")}
                  placeholder="e.g. 4 Weeks"
                  className="w-full bg-[var(--paper)] border border-[var(--line)] p-2.5 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--ink)]"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="deadline" className="text-[10px] text-[var(--muted)] uppercase font-bold block">Target deadline</label>
                <input
                  id="deadline"
                  type="date"
                  {...register("deadline")}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full bg-[var(--paper)] border border-[var(--line)] p-2.5 text-[12px] text-[var(--ink)] outline-none focus:border-[var(--ink)]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 04: ATTACHMENTS & SPECIMENS */}
          <div className="space-y-2">
            <span className="font-bold text-[var(--ink)] uppercase text-[11px] block border-b border-[var(--ink)] pb-2">
              04 / Specification Attachments (Optional)
            </span>
            <FileUpload
              category="project_attachment"
              maxSize={25}
              multiple={true}
              onUploadSuccess={(files) => setAttachedFiles(prev => [...prev, ...files])}
            />
          </div>

          {/* SUBMIT BUTTONS */}
          <div className="pt-6 border-t border-[var(--ink)] flex flex-col sm:flex-row items-center justify-end gap-3 text-[11px]">
            <button
              type="button"
              onClick={handleSubmit((data) => onSubmit(data, true))}
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 border border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)] font-bold hover:bg-[var(--paper-2)] transition-colors"
            >
              Save as draft
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold transition-colors"
            >
              {loading ? "Posting..." : isEditMode ? "Update project brief →" : "Post project brief →"}
            </button>
          </div>

        </form>

      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-center font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FreelanceHub · Brief Builder Form Archetype G</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}

export default function PostProjectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center font-mono-ledger text-[12px] text-[var(--muted)]">
        LOADING FORM...
      </div>
    }>
      <PostProjectForm />
    </Suspense>
  );
}
