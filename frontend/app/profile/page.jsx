'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Navbar from '@/components/layout/Navbar';
import { 
  User, 
  Mail, 
  Phone, 
  ArrowLeft, 
  Save, 
  Briefcase, 
  Building,
  MapPin,
  Globe,
  CheckCircle,
  AlertCircle,
  DollarSign,
  LogOut,
  Camera,
  Star
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile, getProfile, uploadProfileImage } from '@/lib/api';
import RatingDisplay from '@/components/reviews/RatingDisplay';

// Base validation schema
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

// Freelancer schema
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

// Client schema
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

  // Populate form data
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

  // Auth check
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
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center font-mono-ledger">
        <div className="space-y-3 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--signal)] mx-auto"></div>
          <p className="text-[12px] text-[var(--muted)] uppercase">LOADING PROFILE SPECIMEN...</p>
        </div>
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10 flex-1 w-full pb-24 lg:pb-12 text-left">
        
        {/* EDITORIAL HEADER */}
        <section className="space-y-4 border-b border-[var(--ink)] pb-8">
          <div className="flex items-center justify-between font-mono-ledger text-[11px] uppercase tracking-wider">
            <Link 
              href={isFreelancer ? "/freelancer" : "/dashboard"} 
              className="text-[var(--muted)] hover:text-[var(--ink)] flex items-center space-x-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>RETURN TO WORKSPACE</span>
            </Link>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-3.5 py-1.5 border border-[var(--ink)] text-[var(--signal)] hover:bg-red-50 font-bold uppercase transition-colors"
            >
              {isLoggingOut ? "SIGNING OUT..." : "SIGN OUT"}
            </button>
          </div>

          <div className="space-y-2">
            <h1 className="font-serif-ledger text-[36px] sm:text-[48px] leading-[1.05] font-medium tracking-tight text-[var(--ink)]">
              Account Profile.
            </h1>
            <p className="text-[15px] text-[var(--muted)]">
              Update your individual identification record, professional title, contact details, and reputation history.
            </p>
          </div>
        </section>


        {/* NOTIFICATIONS */}
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


        {/* PROFILE FORM */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          
          {/* AVATAR SPECIMEN BLOCK */}
          <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-6 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="relative shrink-0">
              {imagePreview ? (
                <img
                  src={imagePreview.startsWith('http') ? imagePreview : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${imagePreview}`}
                  alt="Profile Avatar"
                  className="w-24 h-24 border-2 border-[var(--ink)] object-cover"
                />
              ) : (
                <div className="w-24 h-24 bg-[var(--ink)] text-[var(--paper)] font-bold text-[32px] flex items-center justify-center border-2 border-[var(--ink)]">
                  {user.fullName?.charAt(0) || 'U'}
                </div>
              )}
              {uploadingImage && (
                <div className="absolute inset-0 bg-[var(--ink)]/60 flex items-center justify-center text-[var(--paper)] text-[10px] font-mono-ledger">
                  UPLOADING...
                </div>
              )}
            </div>

            <div className="space-y-2 text-center sm:text-left font-mono-ledger">
              <div>
                <span className="font-bold text-[14px] text-[var(--ink)] block">{user.fullName || 'Registered Participant'}</span>
                <span className="text-[11px] text-[var(--muted)] uppercase">{user.email} • [{user.role}]</span>
              </div>

              <label
                htmlFor="avatar-upload"
                className="inline-block bg-[var(--ink)] hover:bg-[var(--signal)] text-[var(--paper)] font-bold text-[10px] uppercase px-4 py-2 cursor-pointer transition-colors"
              >
                UPLOAD PROFILE PHOTO →
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


          {/* 01 / BASIC IDENTIFICATION & CONTACT */}
          <div className="space-y-5">
            <div className="border-b border-[var(--ink)] pb-2 font-mono-ledger text-[11px] uppercase tracking-wider font-bold text-[var(--ink)]">
              01 / BASIC IDENTIFICATION & CONTACT
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono-ledger">
              <div className="space-y-1">
                <label htmlFor="fullName" className="text-[10px] text-[var(--muted)] uppercase font-bold block">FULL NAME *</label>
                <input
                  id="fullName"
                  type="text"
                  {...register('fullName')}
                  className="w-full bg-[var(--paper-2)] border-2 border-[var(--ink)] p-3 text-[13px] font-bold focus:outline-none"
                />
                {errors.fullName && <p className="text-[11px] text-[var(--signal)]">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">EMAIL ADDRESS (VERIFIED)</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full bg-[var(--paper-2)]/60 border-2 border-[var(--line)] p-3 text-[13px] text-[var(--muted)] cursor-not-allowed font-bold"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="phone" className="text-[10px] text-[var(--muted)] uppercase font-bold block">PHONE NUMBER (NEPAL)</label>
                <input
                  id="phone"
                  type="text"
                  {...register('phone')}
                  placeholder="+977-98XXXXXXXX"
                  className="w-full bg-[var(--paper-2)] border-2 border-[var(--ink)] p-3 text-[13px] focus:outline-none"
                />
                {errors.phone && <p className="text-[11px] text-[var(--signal)]">{errors.phone.message}</p>}
              </div>

              <div className="space-y-1">
                <label htmlFor="location" className="text-[10px] text-[var(--muted)] uppercase font-bold block">PRIMARY LOCATION</label>
                <input
                  id="location"
                  type="text"
                  {...register('location')}
                  placeholder="Kathmandu, Nepal"
                  className="w-full bg-[var(--paper-2)] border-2 border-[var(--ink)] p-3 text-[13px] focus:outline-none"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label htmlFor="website" className="text-[10px] text-[var(--muted)] uppercase font-bold block">WEBSITE / PORTFOLIO LINK</label>
                <input
                  id="website"
                  type="text"
                  {...register('website')}
                  placeholder="https://yourportfolio.com"
                  className="w-full bg-[var(--paper-2)] border-2 border-[var(--ink)] p-3 text-[13px] focus:outline-none"
                />
                {errors.website && <p className="text-[11px] text-[var(--signal)]">{errors.website.message}</p>}
              </div>
            </div>
          </div>


          {/* 02 / ROLE-SPECIFIC DISCIPLINE SPECIMEN */}
          {isFreelancer && (
            <div className="space-y-5">
              <div className="border-b border-[var(--ink)] pb-2 font-mono-ledger text-[11px] uppercase tracking-wider font-bold text-[var(--ink)]">
                02 / FREELANCER DISCIPLINE & HOURLY RATE
              </div>

              <div className="space-y-4 font-mono-ledger">
                <div className="space-y-1">
                  <label htmlFor="title" className="text-[10px] text-[var(--muted)] uppercase font-bold block">PROFESSIONAL TITLE</label>
                  <input
                    id="title"
                    type="text"
                    {...register('title')}
                    placeholder="e.g. Senior Full Stack Engineer & System Architect"
                    className="w-full bg-[var(--paper-2)] border-2 border-[var(--ink)] p-3 text-[13px] font-bold focus:outline-none font-sans-ledger"
                  />
                  {errors.title && <p className="text-[11px] text-[var(--signal)]">{errors.title.message}</p>}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-[var(--muted)] uppercase font-bold">
                    <label htmlFor="bio">PROFESSIONAL SUMMARY & BIO</label>
                    <span>{watch('bio')?.length || 0}/500</span>
                  </div>
                  <textarea
                    id="bio"
                    rows={4}
                    {...register('bio')}
                    placeholder="Describe your technical expertise, track record, and delivery methodology..."
                    className="w-full bg-[var(--paper-2)] border-2 border-[var(--ink)] p-3 text-[13px] text-[var(--ink)] focus:outline-none font-sans-ledger leading-relaxed"
                    maxLength={500}
                  />
                  {errors.bio && <p className="text-[11px] text-[var(--signal)]">{errors.bio.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="skills" className="text-[10px] text-[var(--muted)] uppercase font-bold block">SKILLS (COMMA SEPARATED)</label>
                    <input
                      id="skills"
                      type="text"
                      {...register('skills')}
                      placeholder="React, Node.js, PostgreSQL, System Design"
                      className="w-full bg-[var(--paper-2)] border-2 border-[var(--ink)] p-3 text-[13px] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="hourlyRate" className="text-[10px] text-[var(--muted)] uppercase font-bold block">HOURLY RATE ESTIMATE (NPR)</label>
                    <input
                      id="hourlyRate"
                      type="text"
                      {...register('hourlyRate')}
                      placeholder="1500"
                      className="w-full bg-[var(--paper-2)] border-2 border-[var(--ink)] p-3 text-[14px] font-bold focus:outline-none"
                    />
                    {errors.hourlyRate && <p className="text-[11px] text-[var(--signal)]">{errors.hourlyRate.message}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {isClient && (
            <div className="space-y-5">
              <div className="border-b border-[var(--ink)] pb-2 font-mono-ledger text-[11px] uppercase tracking-wider font-bold text-[var(--ink)]">
                02 / COMPANY PARTICIPANT PROFILE
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono-ledger">
                <div className="space-y-1">
                  <label htmlFor="companyName" className="text-[10px] text-[var(--muted)] uppercase font-bold block">COMPANY NAME</label>
                  <input
                    id="companyName"
                    type="text"
                    {...register('companyName')}
                    placeholder="Nantio Studio"
                    className="w-full bg-[var(--paper-2)] border-2 border-[var(--ink)] p-3 text-[13px] font-bold focus:outline-none"
                  />
                  {errors.companyName && <p className="text-[11px] text-[var(--signal)]">{errors.companyName.message}</p>}
                </div>

                <div className="space-y-1">
                  <label htmlFor="companySize" className="text-[10px] text-[var(--muted)] uppercase font-bold block">COMPANY SIZE</label>
                  <select
                    id="companySize"
                    {...register('companySize')}
                    className="w-full bg-[var(--paper-2)] border-2 border-[var(--ink)] p-3 text-[13px] focus:outline-none"
                  >
                    <option value="">Select Company Size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>
              </div>
            </div>
          )}


          {/* 03 / REPUTATION & RATING DISPLAY */}
          <div className="space-y-4">
            <div className="border-b border-[var(--ink)] pb-2 font-mono-ledger text-[11px] uppercase tracking-wider font-bold text-[var(--ink)] flex items-center justify-between">
              <span>03 / VERIFIED REPUTATION & REVIEWS RECORD</span>
              <Link href="/reviews" className="text-[var(--signal)] hover:underline">
                VIEW FULL REVIEWS LOG →
              </Link>
            </div>

            <div className="border-2 border-[var(--ink)] bg-[var(--paper)] p-6 font-mono-ledger">
              <RatingDisplay userId={user.id} showDetails={true} />
            </div>
          </div>


          {/* SUBMIT BUTTON */}
          <div className="pt-6 border-t border-[var(--ink)] flex justify-end font-mono-ledger">
            <button
              type="submit"
              disabled={loading || !isDirty}
              className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-bold text-[12px] uppercase tracking-wider px-8 py-3.5 transition-colors shadow-xs disabled:opacity-50"
            >
              {loading ? "SAVING CHANGES..." : "SAVE PROFILE SPECIMEN →"}
            </button>
          </div>

        </form>

      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-center mt-12 font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FreelanceHub · Account Profile Specimen</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}