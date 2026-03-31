'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, Search, Settings, LogOut, User, Menu, X, Home, Briefcase, FileText, MessageSquare } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) return null;

  const userRole = user?.role?.toLowerCase();

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/dashboard"
              className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              FreelanceHub Pro
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="hover:bg-gray-100"
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/projects')}
              className="hover:bg-gray-100"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Projects
            </Button>
            {userRole === 'freelancer' && (
              <Button
                variant="ghost"
                onClick={() => router.push('/freelancer/proposals')}
                className="hover:bg-gray-100"
              >
                <FileText className="h-4 w-4 mr-2" />
                Proposals
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => router.push('/messages')}
              className="hover:bg-gray-100"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
            </Button>
          </div>

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

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8 cursor-pointer" onClick={() => router.push('/profile')}>
                <AvatarImage src={user.profilePicture} alt={user.fullName} />
                <AvatarFallback>
                  {user.fullName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block">
                <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                <p className="text-xs text-gray-500 capitalize">{userRole}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/profile')}
              className="hover:bg-gray-100"
            >
              <Settings className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-5 w-5" />
            </Button>
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
                  <AvatarImage src={user.profilePicture} alt={user.fullName} />
                  <AvatarFallback>
                    {user.fullName?.charAt(0) || user.email?.charAt(0) || 'U'}
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
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  router.push('/dashboard');
                  setMobileMenuOpen(false);
                }}
              >
                <Home className="h-4 w-4 mr-3" />
                Dashboard
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  router.push('/projects');
                  setMobileMenuOpen(false);
                }}
              >
                <Briefcase className="h-4 w-4 mr-3" />
                Projects
              </Button>

              {userRole === 'freelancer' && (
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    router.push('/freelancer/proposals');
                    setMobileMenuOpen(false);
                  }}
                >
                  <FileText className="h-4 w-4 mr-3" />
                  Proposals
                </Button>
              )}

              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  router.push('/messages');
                  setMobileMenuOpen(false);
                }}
              >
                <MessageSquare className="h-4 w-4 mr-3" />
                Messages
              </Button>

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
