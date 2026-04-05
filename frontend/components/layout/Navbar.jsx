'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Bell, Settings, LogOut, Menu, X, ChevronDown,
  Search, Briefcase, FileText, Scale,
  MessageSquare, Users
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getInitials, getAvatarColor } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/avatarUtils';

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [workDropdownOpen, setWorkDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const workDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (workDropdownRef.current && !workDropdownRef.current.contains(event.target)) {
        setWorkDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const userRole = user?.role?.toLowerCase();
  const isFreelancer = userRole === 'freelancer';
  const isClient = userRole === 'client';

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/dashboard"
              className="text-xl font-bold hover:opacity-80 transition-opacity"
            >
              <span className="text-black">Freelance</span>
              <span className="text-amber-500">Hub</span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Freelancer Navigation */}
            {isFreelancer && (
              <>
                {/* Find Work */}
                <Button
                  variant="ghost"
                  onClick={() => router.push('/freelancer/jobs')}
                  className="hover:bg-gray-100"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Find Work
                </Button>

                {/* Work Dropdown */}
                <div className="relative" ref={workDropdownRef}>
                  <Button
                    variant="ghost"
                    onClick={() => setWorkDropdownOpen(!workDropdownOpen)}
                    className="hover:bg-gray-100"
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    Work
                    <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${workDropdownOpen ? 'rotate-180' : ''}`} />
                  </Button>

                  {workDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <button
                        onClick={() => {
                          router.push('/freelancer/proposals');
                          setWorkDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center text-sm text-gray-700"
                      >
                        <FileText className="h-4 w-4 mr-3 text-gray-500" />
                        My Proposals
                      </button>
                      <button
                        onClick={() => {
                          router.push('/freelancer/my-projects');
                          setWorkDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center text-sm text-gray-700"
                      >
                        <Briefcase className="h-4 w-4 mr-3 text-gray-500" />
                        My Projects
                      </button>
                      <button
                        onClick={() => {
                          router.push('/contracts');
                          setWorkDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center text-sm text-gray-700"
                      >
                        <FileText className="h-4 w-4 mr-3 text-gray-500" />
                        Contracts
                      </button>
                    </div>
                  )}
                </div>

                {/* Disputes */}
                <Button
                  variant="ghost"
                  onClick={() => router.push('/disputes')}
                  className="hover:bg-gray-100"
                >
                  <Scale className="h-4 w-4 mr-2" />
                  Disputes
                </Button>

                {/* Messages */}
                <Button
                  variant="ghost"
                  onClick={() => router.push('/chat')}
                  className="hover:bg-gray-100"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Messages
                </Button>
              </>
            )}

            {/* Client Navigation */}
            {isClient && (
              <>
                {/* Find Talent */}
                <Button
                  variant="ghost"
                  onClick={() => router.push('/client/talent')}
                  className="hover:bg-gray-100"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Find Talent
                </Button>

                {/* Projects Dropdown */}
                <div className="relative" ref={workDropdownRef}>
                  <Button
                    variant="ghost"
                    onClick={() => setWorkDropdownOpen(!workDropdownOpen)}
                    className="hover:bg-gray-100"
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    Projects
                    <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${workDropdownOpen ? 'rotate-180' : ''}`} />
                  </Button>

                  {workDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <button
                        onClick={() => {
                          router.push('/client/projects');
                          setWorkDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center text-sm text-gray-700"
                      >
                        <Briefcase className="h-4 w-4 mr-3 text-gray-500" />
                        My Projects
                      </button>
                      <button
                        onClick={() => {
                          router.push('/client/post-project');
                          setWorkDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center text-sm text-gray-700"
                      >
                        <FileText className="h-4 w-4 mr-3 text-gray-500" />
                        Post Project
                      </button>
                      <button
                        onClick={() => {
                          router.push('/contracts');
                          setWorkDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center text-sm text-gray-700"
                      >
                        <FileText className="h-4 w-4 mr-3 text-gray-500" />
                        Contracts
                      </button>
                    </div>
                  )}
                </div>

                {/* Disputes */}
                <Button
                  variant="ghost"
                  onClick={() => router.push('/disputes')}
                  className="hover:bg-gray-100"
                >
                  <Scale className="h-4 w-4 mr-2" />
                  Disputes
                </Button>
              </>
            )}
          </div>

          {/* Search Bar (Client only) */}
          {isClient && (
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search freelancers, projects..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          )}

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => router.push('/notifications')}
            >
              <Bell className="h-5 w-5" />
              {user?.unreadNotifications > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {user.unreadNotifications}
                </Badge>
              )}
            </Button>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-3 hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={getAvatarUrl(user.avatarUrl)} 
                    alt={user.fullName || user.email} 
                  />
                  <AvatarFallback 
                    className="text-white font-semibold"
                    style={{ backgroundColor: getAvatarColor(user.email || user.fullName) }}
                  >
                    {getInitials(user.fullName || user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                  <p className="text-xs text-gray-500 capitalize">{userRole}</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileDropdownOpen && (
                <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={() => {
                      router.push('/profile');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center text-sm text-gray-700"
                  >
                    <Settings className="h-4 w-4 mr-3 text-gray-500" />
                    Profile Settings
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center text-sm text-red-600"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            {/* Mobile User Info */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={getAvatarUrl(user.avatarUrl)} 
                    alt={user.fullName || user.email} 
                  />
                  <AvatarFallback 
                    className="text-white font-semibold"
                    style={{ backgroundColor: getAvatarColor(user.email || user.fullName) }}
                  >
                    {getInitials(user.fullName || user.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                  <p className="text-xs text-gray-500 capitalize">{userRole}</p>
                </div>
              </div>
            </div>

            {/* Mobile Navigation Links */}
            <div className="px-4 py-2 space-y-2">
              {isFreelancer && (
                <>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      router.push('/freelancer/jobs');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Search className="h-4 w-4 mr-3" />
                    Find Work
                  </Button>

                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Work
                    </p>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        router.push('/freelancer/proposals');
                        setMobileMenuOpen(false);
                      }}
                    >
                      <FileText className="h-4 w-4 mr-3" />
                      My Proposals
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        router.push('/freelancer/my-projects');
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Briefcase className="h-4 w-4 mr-3" />
                      My Projects
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        router.push('/contracts');
                        setMobileMenuOpen(false);
                      }}
                    >
                      <FileText className="h-4 w-4 mr-3" />
                      Contracts
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      router.push('/disputes');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Scale className="h-4 w-4 mr-3" />
                    Disputes
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      router.push('/chat');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-3" />
                    Messages
                  </Button>
                </>
              )}

              {isClient && (
                <>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      router.push('/client/talent');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Users className="h-4 w-4 mr-3" />
                    Find Talent
                  </Button>

                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Projects
                    </p>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        router.push('/client/projects');
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Briefcase className="h-4 w-4 mr-3" />
                      My Projects
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        router.push('/client/post-project');
                        setMobileMenuOpen(false);
                      }}
                    >
                      <FileText className="h-4 w-4 mr-3" />
                      Post Project
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        router.push('/contracts');
                        setMobileMenuOpen(false);
                      }}
                    >
                      <FileText className="h-4 w-4 mr-3" />
                      Contracts
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      router.push('/disputes');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Scale className="h-4 w-4 mr-3" />
                    Disputes
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  router.push('/profile');
                  setMobileMenuOpen(false);
                }}
              >
                <Settings className="h-4 w-4 mr-3" />
                Profile Settings
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start relative"
                onClick={() => {
                  router.push('/notifications');
                  setMobileMenuOpen(false);
                }}
              >
                <Bell className="h-4 w-4 mr-3" />
                Notifications
                {user?.unreadNotifications > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {user.unreadNotifications}
                  </Badge>
                )}
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
