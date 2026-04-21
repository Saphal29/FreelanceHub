"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Menu, 
  X, 
  User, 
  ChevronDown, 
  Briefcase,
  FileText,
  Clock,
  AlertCircle,
  LogOut,
  Settings,
  Users
} from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = ({ userType = "client" }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('userType', userType);
    }
  }, [userType]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Navigation structure with dropdowns
  const freelancerNav = [
    { label: "Find Work", href: "/freelancer/jobs", icon: Search },
    {
      label: "My Work",
      icon: Briefcase,
      dropdown: [
        { label: "My Projects", href: "/freelancer/my-projects" },
        { label: "My Proposals", href: "/freelancer/proposals" },
        { label: "Contracts", href: "/contracts" },
        { label: "Time Tracking", href: "/time-tracking" },
      ]
    },
    { label: "Disputes", href: "/disputes", icon: AlertCircle },
  ];

  const clientNav = [
    { label: "Find Talent", href: "/client/talent", icon: Users },
    {
      label: "Projects",
      icon: Briefcase,
      dropdown: [
        { label: "My Projects", href: "/client/projects" },
        { label: "Post Project", href: "/client/post-project" },
        { label: "Contracts", href: "/contracts" },
      ]
    },
    { label: "Disputes", href: "/disputes", icon: AlertCircle },
  ];

  const adminNav = [
    { label: "Dashboard", href: "/admin", icon: Briefcase },
    { label: "Users", href: "/admin/users", icon: User },
    { label: "Projects", href: "/admin/projects", icon: FileText },
    { label: "Disputes", href: "/admin/disputes", icon: AlertCircle },
    { label: "Transactions", href: "/admin/transactions", icon: Clock },
  ];

  const navItems = userType === "admin" ? adminNav : userType === "client" ? clientNav : freelancerNav;

  const profileMenuItems = [
    { label: "View Profile", href: "/profile", icon: User },
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "My Earnings", href: "/earnings", icon: Clock },
    { label: "Help & Support", href: "/support", icon: AlertCircle },
  ];

  const isActive = (item) => {
    if (item.dropdown) {
      return item.dropdown.some(sub => pathname === sub.href);
    }
    return pathname === item.href;
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link 
            href={userType === "client" ? "/client" : userType === "admin" ? "/admin" : "/freelancer"} 
            className="flex items-center gap-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
              <span className="font-display text-lg font-bold text-accent-foreground">F</span>
            </div>
            <span className="hidden font-display text-xl font-bold text-foreground sm:block">
              Freelance<span className="text-accent">Hub</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-1 lg:flex" ref={dropdownRef}>
            {navItems.map((item, index) => (
              item.dropdown ? (
                <div key={index} className="relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === index ? null : index)}
                    className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                      isActive(item) ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    <ChevronDown className={`h-3 w-3 transition-transform ${openDropdown === index ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === index && (
                    <div className="absolute left-0 top-full mt-1 w-48 rounded-lg border border-border bg-background shadow-lg">
                      {item.dropdown.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={() => setOpenDropdown(null)}
                          className={`block px-4 py-2 text-sm transition-colors hover:bg-accent first:rounded-t-lg last:rounded-b-lg ${
                            pathname === subItem.href ? "bg-accent text-accent-foreground font-medium" : "text-foreground"
                          }`}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                    isActive(item) ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            ))}
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden flex-1 max-w-md lg:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={userType === "client" ? "Search for services..." : userType === "admin" ? "Search..." : "Search for jobs..."}
                className="h-10 w-full rounded-full border-border bg-secondary pl-10 pr-4 text-sm placeholder:text-muted-foreground focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <NotificationBell />

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'profile' ? null : 'profile')}
                className="hidden items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent sm:flex"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <User className="h-4 w-4" />
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${openDropdown === 'profile' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'profile' && (
                <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-border bg-background shadow-lg">
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{user?.fullName || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  {profileMenuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpenDropdown(null)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  ))}
                  <button
                    onClick={() => {
                      setOpenDropdown(null);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-2 rounded-b-lg px-4 py-2 text-sm text-destructive transition-colors hover:bg-accent"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out lg:hidden ${
            isMenuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="border-t border-border py-4">
            {/* Mobile Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={userType === "client" ? "Search for services..." : "Search for jobs..."}
                className="h-10 w-full rounded-full border-border bg-secondary pl-10 pr-4"
              />
            </div>

            {/* Mobile Links */}
            <div className="flex flex-col gap-1">
              {navItems.map((item, index) => (
                item.dropdown ? (
                  <div key={index}>
                    <button
                      onClick={() => setOpenDropdown(openDropdown === `mobile-${index}` ? null : `mobile-${index}`)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform ${openDropdown === `mobile-${index}` ? 'rotate-180' : ''}`} />
                    </button>
                    {openDropdown === `mobile-${index}` && (
                      <div className="ml-6 mt-1 flex flex-col gap-1">
                        {item.dropdown.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent ${
                              pathname === subItem.href ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground"
                            }`}
                            onClick={() => {
                              setIsMenuOpen(false);
                              setOpenDropdown(null);
                            }}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${
                      pathname === item.href ? "bg-accent text-accent-foreground" : "text-foreground"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
