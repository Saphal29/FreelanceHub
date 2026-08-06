'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile, getProfile, uploadProfileImage } from '@/lib/api';
import RatingDisplay from '@/components/reviews/RatingDisplay';
import { AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/currency';

const baseProfileSchema = z.object({
  fullName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  phone: z.string()
    .optional()
    .refine((val) => !val || /^(\+977[-\s]?)?[0-9]{10}$|^(\+977[-\s]?)?[0-9]{3}[-\s]?[0-9]{7}$/.test(val), {
      message: 'Invalid Nepal phone number format'
    }),
  location: z.string().optional(),
  website: z.string()
    .optional()
    .refine((val) => !val || /^https?:\/\/.+/.test(val), {
      message: 'Website must be a valid URL starting with http:// or https://'
    })
});

const freelancerProfileSchema = baseProfileSchema.extend({
  title: z.string()
    .min(5, 'Professional title must be at least 5 characters')
    .max(100, 'Professional title must be less than 100 characters')
    .optional(),
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  skills: z.string().optional(),
  hourlyRate: z.string()
    .optional()
    .refine((val) => !val || /^\d+(\.\d{1,2})?$/.test(val), {
      message: 'Hourly rate must be a valid number'
    })
});

const clientProfileSchema = baseProfileSchema.extend({
  companyName: z.string()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must be less than 100 characters')
    .optional(),
  companySize: z.string().optional(),
  industry: z.string()
    .max(100, 'Industry must be less than 100 characters')
    .optional()
});

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateUser, logout, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  const isFreelancer = user?.role === 'FREELANCER';
  const isClient = user?.role === 'CLIENT';

  const validationSchema = isFreelancer ? freelancerProfileSchema : clientProfileSchema;

  const { 
    register, 
    handleSubmit, 
    formState: { errors, isDirty },
    reset,
    watch
  } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      location: '',
      website: '',
      title: '',
      bio: '',
      skills: '',
      hourlyRate: '',
      companyName: '',
      companySize: '',
      industry: ''
    }
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        try {
          const profileResponse = await getProfile();
          const profileData = profileResponse.profile;
          
          const avatarPath = profileData.avatarUrl || '';
          const fullAvatarUrl = avatarPath 
            ? (avatarPath.startsWith('http') ? avatarPath : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${avatarPath}`)
            : '';
          
          setAvatarUrl(avatarPath);
          setImagePreview(fullAvatarUrl);
          
          const formData = {
            fullName: profileData.fullName || '',
            phone: profileData.phone || '',
            location: profileData.location || '',
            website: profileData.website || '',
          };

          if (isFreelancer && profileData.freelancerProfile) {
            formData.title = profileData.freelancerProfile.title || '';
            formData.bio = profileData.freelancerProfile.bio || '';
            formData.skills = profileData.freelancerProfile.skills || '';
            formData.hourlyRate = profileData.freelancerProfile.hourlyRate?.toString() || '';
          }

          if (isClient && profileData.clientProfile) {
            formData.companyName = profileData.clientProfile.companyName || '';
            formData.companySize = profileData.clientProfile.companySize || '';
            formData.industry = profileData.clientProfile.industry || '';
          }

          reset(formData);
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      }
    };

    loadProfile();
  }, [user, reset, isFreelancer, isClient]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await updateProfile(data);
      
      if (response.success) {
        setSuccess('Profile specimen updated successfully!');
        updateUser(response.profile);
        setTimeout(() => setSuccess(''), 3500);
      } else {
        setError(response.error || 'Failed to update profile');
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (err) {
      setError('Failed to logout.');
      setIsLoggingOut(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      setError('');

      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);

      const response = await uploadProfileImage(file);

      if (response.success) {
        const fullImageUrl = response.imageUrl.startsWith('http') 
          ? response.imageUrl 
          : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${response.imageUrl}`;
        
        setAvatarUrl(response.imageUrl);
        setImagePreview(fullImageUrl);
        setSuccess('Profile picture updated successfully!');
        updateUser({ ...user, avatarUrl: response.imageUrl });
        setTimeout(() => setSuccess(''), 3500);
      } else {
        setError(response.error || 'Failed to upload image');
      }
    } catch (err) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center font-mono-ledger text-[12px] text-[var(--muted)]">
        LOADING PROFILE SPECIMEN...
      </div>
    );
  }

  if (!user) return null;

  const userType = isFreelancer ? "freelancer" : "client";

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar userType={userType} />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 flex-1 w-full pb-24 lg:pb-12 text-left">
        
        {/* HEADER */}
        <section className="space-y-4 border-b border-[var(--ink)] pb-8">
          <div className="flex items-center justify-between font-mono-ledger text-[11px]">
            <Link 
              href={isFreelancer ? "/freelancer" : "/dashboard"} 
              className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
            >
              ← Return to workspace
            </Link>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-[var(--signal)] font-bold hover:underline"
            >
              {isLoggingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>

          <div className="space-y-2">
            <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[var(--signal)] inline-block animate-pulse"></span>
              <span>FREELANCEHUB FORM · PROFILE SPECIMEN</span>
            </p>
            <h1 className="font-serif-ledger text-[38px] sm:text-[48px] leading-[1.05] font-medium tracking-tight text-[var(--ink)]">
              Account profile
            </h1>
            <p className="text-[15px] text-[var(--muted)]">
              Update your individual identification record, professional title, contact details, and reputation history.
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

        {/* PROFILE FORM */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 font-mono-ledger text-[12px]">
          
          {/* AVATAR STRIP */}
          <div className="border border-[var(--ink)] bg-[var(--paper-2)] p-5 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="relative shrink-0">
              {imagePreview ? (
                <img
                  src={imagePreview.startsWith('http') ? imagePreview : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${imagePreview}`}
                  alt="Profile Avatar"
                  className="w-20 h-20 border border-[var(--ink)] object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-[var(--ink)] text-[var(--paper)] font-bold text-[28px] flex items-center justify-center border border-[var(--ink)]">
                  {user.fullName?.charAt(0) || 'U'}
                </div>
              )}
              {uploadingImage && (
                <div className="absolute inset-0 bg-[var(--ink)]/60 flex items-center justify-center text-[var(--paper)] text-[10px]">
                  Uploading...
                </div>
              )}
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <div>
                <span className="font-bold text-[14px] text-[var(--ink)] block">{user.fullName || 'Registered Participant'}</span>
                <span className="text-[11px] text-[var(--muted)] uppercase">{user.email} · [{user.role}]</span>
              </div>

              <label
                htmlFor="avatar-upload"
                className="inline-block bg-[var(--ink)] hover:bg-[var(--signal)] text-[var(--paper)] font-bold text-[10px] uppercase px-4 py-2 cursor-pointer transition-colors"
              >
                Upload photo →
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="sr-only"
                  disabled={uploadingImage}
                />
              </label>
            </div>
          </div>

          {/* 01 / BASIC IDENTIFICATION */}
          <div className="space-y-4">
            <span className="font-bold text-[var(--ink)] uppercase text-[11px] block border-b border-[var(--ink)] pb-2">
              01 / Basic Identification & Contact
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="fullName" className="text-[10px] text-[var(--muted)] uppercase font-bold block">Full name *</label>
                <input
                  id="fullName"
                  type="text"
                  {...register('fullName')}
                  className={`w-full bg-[var(--paper)] border p-2.5 text-[13px] text-[var(--ink)] outline-none transition-colors ${
                    errors.fullName ? "border-[var(--signal)]" : "border-[var(--line)] focus:border-[var(--ink)]"
                  }`}
                />
                {errors.fullName && <span className="text-[var(--signal-dark)] text-[10px] block">{errors.fullName.message}</span>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">Email address (verified)</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full bg-[var(--paper-2)] border border-[var(--line)] p-2.5 text-[13px] text-[var(--muted)] cursor-not-allowed font-bold"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="phone" className="text-[10px] text-[var(--muted)] uppercase font-bold block">Phone number (Nepal)</label>
                <input
                  id="phone"
                  type="text"
                  {...register('phone')}
                  placeholder="+977-98XXXXXXXX"
                  className={`w-full bg-[var(--paper)] border p-2.5 text-[13px] text-[var(--ink)] outline-none transition-colors ${
                    errors.phone ? "border-[var(--signal)]" : "border-[var(--line)] focus:border-[var(--ink)]"
                  }`}
                />
                {errors.phone && <span className="text-[var(--signal-dark)] text-[10px] block">{errors.phone.message}</span>}
              </div>

              <div className="space-y-1">
                <label htmlFor="location" className="text-[10px] text-[var(--muted)] uppercase font-bold block">Primary location</label>
                <input
                  id="location"
                  type="text"
                  {...register('location')}
                  placeholder="Kathmandu, Nepal"
                  className="w-full bg-[var(--paper)] border border-[var(--line)] p-2.5 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--ink)]"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label htmlFor="website" className="text-[10px] text-[var(--muted)] uppercase font-bold block">Website / portfolio link</label>
                <input
                  id="website"
                  type="text"
                  {...register('website')}
                  placeholder="https://yourportfolio.com"
                  className={`w-full bg-[var(--paper)] border p-2.5 text-[13px] text-[var(--ink)] outline-none transition-colors ${
                    errors.website ? "border-[var(--signal)]" : "border-[var(--line)] focus:border-[var(--ink)]"
                  }`}
                />
                {errors.website && <span className="text-[var(--signal-dark)] text-[10px] block">{errors.website.message}</span>}
              </div>
            </div>
          </div>

          {/* 02 / FREELANCER DISCIPLINE */}
          {isFreelancer && (
            <div className="space-y-4">
              <span className="font-bold text-[var(--ink)] uppercase text-[11px] block border-b border-[var(--ink)] pb-2">
                02 / Freelancer Discipline & Hourly Rate
              </span>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="title" className="text-[10px] text-[var(--muted)] uppercase font-bold block">Professional title</label>
                  <input
                    id="title"
                    type="text"
                    {...register('title')}
                    placeholder="e.g. Senior Full Stack Engineer & System Architect"
                    className={`w-full bg-[var(--paper)] border p-2.5 text-[13px] text-[var(--ink)] font-sans-ledger outline-none transition-colors ${
                      errors.title ? "border-[var(--signal)]" : "border-[var(--line)] focus:border-[var(--ink)]"
                    }`}
                  />
                  {errors.title && <span className="text-[var(--signal-dark)] text-[10px] block">{errors.title.message}</span>}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-[var(--muted)] uppercase font-bold">
                    <label htmlFor="bio">Professional summary & bio</label>
                    <span>{watch('bio')?.length || 0}/500</span>
                  </div>
                  <textarea
                    id="bio"
                    rows={4}
                    {...register('bio')}
                    placeholder="Describe your technical expertise, track record, and delivery methodology..."
                    className="w-full bg-[var(--paper)] border border-[var(--line)] p-3 text-[13px] text-[var(--ink)] font-sans-ledger leading-relaxed outline-none focus:border-[var(--ink)]"
                    maxLength={500}
                  />
                  {errors.bio && <span className="text-[var(--signal-dark)] text-[10px] block">{errors.bio.message}</span>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="skills" className="text-[10px] text-[var(--muted)] uppercase font-bold block">Skills (comma separated)</label>
                    <input
                      id="skills"
                      type="text"
                      {...register('skills')}
                      placeholder="React, Node.js, PostgreSQL, System Design"
                      className="w-full bg-[var(--paper)] border border-[var(--line)] p-2.5 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--ink)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="hourlyRate" className="text-[10px] text-[var(--muted)] uppercase font-bold block">Hourly rate estimate (NPR)</label>
                    <div className="flex items-center border border-[var(--line)] bg-[var(--paper)] focus-within:border-[var(--ink)]">
                      <span className="px-3 py-2 bg-[var(--paper-2)] border-r border-[var(--line)] text-[var(--muted)] font-bold">NPR</span>
                      <input
                        id="hourlyRate"
                        type="text"
                        {...register('hourlyRate')}
                        placeholder="1500"
                        className="w-full bg-transparent p-2 text-[13px] font-bold text-[var(--ink)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    {errors.hourlyRate && <span className="text-[var(--signal-dark)] text-[10px] block">{errors.hourlyRate.message}</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <div className="pt-6 border-t border-[var(--ink)] flex justify-end">
            <button
              type="submit"
              disabled={loading || !isDirty}
              className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold text-[11px] uppercase tracking-wider px-6 py-2.5 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving changes..." : "Save profile changes →"}
            </button>
          </div>

        </form>

      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-center font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FreelanceHub · Profile Form Archetype G</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}