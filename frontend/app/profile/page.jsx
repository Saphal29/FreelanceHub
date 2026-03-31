'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
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
  Upload,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

// Freelancer-specific schema
const freelancerProfileSchema = baseProfileSchema.extend({
  title: z.string()
    .min(5, 'Professional title must be at least 5 characters')
    .max(100, 'Professional title must be less than 100 characters')
    .optional(),
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  skills: z.string()
    .optional(),
  hourlyRate: z.string()
    .optional()
    .refine((val) => !val || /^\d+(\.\d{1,2})?$/.test(val), {
      message: 'Hourly rate must be a valid number'
    })
});

// Client-specific schema
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

  // Choose schema based on role
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
      // Freelancer fields
      title: '',
      bio: '',
      skills: '',
      hourlyRate: '',
      // Client fields
      companyName: '',
      companySize: '',
      industry: ''
    }
  });

  // Populate form with user data when user is loaded
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        try {
          // Get complete profile data from new API
          const profileResponse = await getProfile();
          const profileData = profileResponse.profile;
          
          // Set avatar URL with full path
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
          // Fallback to user data from context
          const avatarPath = user.avatarUrl || '';
          const fullAvatarUrl = avatarPath 
            ? (avatarPath.startsWith('http') ? avatarPath : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${avatarPath}`)
            : '';
          
          setAvatarUrl(avatarPath);
          setImagePreview(fullAvatarUrl);
          
          const formData = {
            fullName: user.fullName || '',
            phone: user.phone || '',
            location: user.location || '',
            website: user.website || '',
          };

          if (isFreelancer && user.freelancerProfile) {
            formData.title = user.freelancerProfile.title || '';
            formData.bio = user.freelancerProfile.bio || '';
            formData.skills = user.freelancerProfile.skills || '';
            formData.hourlyRate = user.freelancerProfile.hourlyRate?.toString() || '';
          }

          if (isClient && user.clientProfile) {
            formData.companyName = user.clientProfile.companyName || '';
            formData.companySize = user.clientProfile.companySize || '';
            formData.industry = user.clientProfile.industry || '';
          }

          reset(formData);
        }
      }
    };

    loadProfile();
  }, [user, reset, isFreelancer, isClient]);

  // Redirect if not authenticated
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
        setSuccess('Profile updated successfully!');
        // Update user context with new data
        updateUser(response.profile);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
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
      // The logout function in AuthContext will handle the redirect
    } catch (err) {
      setError('Failed to logout. Please try again.');
      setIsLoggingOut(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      setError('');

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload image
      const response = await uploadProfileImage(file);

      if (response.success) {
        const fullImageUrl = response.imageUrl.startsWith('http') 
          ? response.imageUrl 
          : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${response.imageUrl}`;
        
        setAvatarUrl(response.imageUrl);
        setImagePreview(fullImageUrl);
        setSuccess('Profile picture uploaded successfully!');
        
        // Update user context
        updateUser({ ...user, avatarUrl: response.imageUrl });
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.error || 'Failed to upload image');
        // Reset preview on error
        const fallbackUrl = avatarUrl 
          ? (avatarUrl.startsWith('http') ? avatarUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${avatarUrl}`)
          : '';
        setImagePreview(fallbackUrl);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload image');
      // Reset preview on error
      const fallbackUrl = avatarUrl 
        ? (avatarUrl.startsWith('http') ? avatarUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${avatarUrl}`)
        : '';
      setImagePreview(fallbackUrl);
    } finally {
      setUploadingImage(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType={isFreelancer ? "freelancer" : "client"} />

      {/* Header */}
      <section className="border-b border-border bg-secondary/30 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
            <Button
              onClick={handleLogout}
              variant="outline"
              disabled={isLoggingOut}
              className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            >
              {isLoggingOut ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                  <span>Logging out...</span>
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </>
              )}
            </Button>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Edit Profile
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Update your personal information and {isFreelancer ? 'professional' : 'company'} details
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
              <AlertDescription className="text-green-800 font-semibold">{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="border-2 border-red-200 bg-red-50">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-800 font-semibold">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center font-display text-xl">
                  <User className="h-5 w-5 mr-2 text-accent" />
                  Basic Information
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Update your personal information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Profile Picture Upload */}
                <div className="flex flex-col items-center space-y-4 pb-6 border-b border-border">
                  <div className="relative">
                    {imagePreview ? (
                      <img
                        src={imagePreview.startsWith('http') ? imagePreview : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${imagePreview}`}
                        alt="Profile"
                        className="h-32 w-32 rounded-full object-cover border-4 border-border"
                      />
                    ) : (
                      <div className="h-32 w-32 rounded-full bg-secondary flex items-center justify-center border-4 border-border">
                        <User className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                    {uploadingImage && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      </div>
                    )}
                    <label
                      htmlFor="avatar-upload"
                      className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-accent text-white flex items-center justify-center cursor-pointer hover:bg-accent/90 transition-colors shadow-lg"
                    >
                      <Camera className="h-5 w-5" />
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
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Profile Picture</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG or WebP. Max size 5MB.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-foreground font-medium">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        {...register('fullName')}
                        placeholder="John Doe"
                        className="pl-10 border-border bg-card"
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-sm text-red-500">{errors.fullName.message}</p>
                    )}
                  </div>

                  {/* Email (Read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground font-medium">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        value={user.email}
                        disabled
                        className="pl-10 bg-secondary border-border"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground font-medium">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        {...register('phone')}
                        placeholder="+977-9812345678"
                        className="pl-10 border-border bg-card"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-sm text-red-500">{errors.phone.message}</p>
                    )}
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-foreground font-medium">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        {...register('location')}
                        placeholder="Kathmandu, Nepal"
                        className="pl-10 border-border bg-card"
                      />
                    </div>
                  </div>

                  {/* Website */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="website" className="text-foreground font-medium">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="website"
                        {...register('website')}
                        placeholder="https://yourwebsite.com"
                        className="pl-10 border-border bg-card"
                      />
                    </div>
                    {errors.website && (
                      <p className="text-sm text-red-500">{errors.website.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Role-specific Information */}
            {isFreelancer && (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center font-display text-xl">
                    <Briefcase className="h-5 w-5 mr-2 text-accent" />
                    Freelancer Profile
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Showcase your skills and expertise to potential clients
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Professional Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-foreground font-medium">Professional Title</Label>
                    <Input
                      id="title"
                      {...register('title')}
                      placeholder="Full Stack Developer, Graphic Designer, etc."
                      className="border-border bg-card"
                    />
                    {errors.title && (
                      <p className="text-sm text-red-500">{errors.title.message}</p>
                    )}
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-foreground font-medium">Professional Bio</Label>
                    <textarea
                      id="bio"
                      {...register('bio')}
                      placeholder="Tell clients about your experience, expertise, and what makes you unique..."
                      className="w-full min-h-[100px] px-3 py-2 border border-border rounded-xl bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-vertical"
                      maxLength={500}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Describe your professional background and expertise</span>
                      <span>{watch('bio')?.length || 0}/500</span>
                    </div>
                    {errors.bio && (
                      <p className="text-sm text-red-500">{errors.bio.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Skills */}
                    <div className="space-y-2">
                      <Label htmlFor="skills" className="text-foreground font-medium">Skills</Label>
                      <Input
                        id="skills"
                        {...register('skills')}
                        placeholder="JavaScript, React, Node.js, etc."
                        className="border-border bg-card"
                      />
                      <p className="text-xs text-muted-foreground">
                        Separate skills with commas
                      </p>
                    </div>

                    {/* Hourly Rate */}
                    <div className="space-y-2">
                      <Label htmlFor="hourlyRate" className="text-foreground font-medium">Hourly Rate (USD)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="hourlyRate"
                          {...register('hourlyRate')}
                          placeholder="25.00"
                          className="pl-10 border-border bg-card"
                        />
                      </div>
                      {errors.hourlyRate && (
                        <p className="text-sm text-red-500">{errors.hourlyRate.message}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isClient && (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center font-display text-xl">
                    <Building className="h-5 w-5 mr-2 text-accent" />
                    Company Profile
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Tell freelancers about your company and projects
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Company Name */}
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-foreground font-medium">Company Name</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="companyName"
                          {...register('companyName')}
                          placeholder="Your Company Ltd."
                          className="pl-10 border-border bg-card"
                        />
                      </div>
                      {errors.companyName && (
                        <p className="text-sm text-red-500">{errors.companyName.message}</p>
                      )}
                    </div>

                    {/* Company Size */}
                    <div className="space-y-2">
                      <Label htmlFor="companySize" className="text-foreground font-medium">Company Size</Label>
                      <select
                        id="companySize"
                        {...register('companySize')}
                        className="w-full px-3 py-2 border border-border rounded-xl bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                      >
                        <option value="">Select company size</option>
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="201-500">201-500 employees</option>
                        <option value="500+">500+ employees</option>
                      </select>
                    </div>

                    {/* Industry */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="industry" className="text-foreground font-medium">Industry</Label>
                      <Input
                        id="industry"
                        {...register('industry')}
                        placeholder="Technology, Healthcare, Finance, etc."
                        className="border-border bg-card"
                      />
                      {errors.industry && (
                        <p className="text-sm text-red-500">{errors.industry.message}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews & Ratings Section */}
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center font-display text-xl">
                    <Star className="h-5 w-5 mr-2 text-yellow-400" />
                    Reviews & Ratings
                  </CardTitle>
                  <Link href="/reviews">
                    <Button variant="outline" size="sm">
                      View All Reviews
                    </Button>
                  </Link>
                </div>
                <CardDescription className="text-muted-foreground">
                  Your reputation and feedback from {isFreelancer ? 'clients' : 'freelancers'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RatingDisplay userId={user.id} showDetails={true} />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Link href="/dashboard">
                <Button
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="accent"
                disabled={loading || !isDirty}
                className="min-w-[120px]"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
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