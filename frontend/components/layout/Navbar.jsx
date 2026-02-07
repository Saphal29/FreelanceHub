"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Menu, X, Bell, MessageCircle, User, ChevronDown, MessageSquare, Video } from "lucide-react";

const Navbar = ({ userType = "client" }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCommDropdownOpen, setIsCommDropdownOpen] = useState(false);
  const pathname = usePathname();
  const commDropdownRef = useRef(null);

  // Store userType in sessionStorage when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('userType', userType);
    }
  }, [userType]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (commDropdownRef.current && !commDropdownRef.current.contains(event.target)) {
        setIsCommDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const clientLinks = [
    { label: "Find Talent", href: "/client/talent" },
    { label: "Browse Projects", href: "/client/projects" },
    { label: "How It Works", href: "/how-it-works" },
  ];

  const freelancerLinks = [
    { label: "Find Work", href: "/freelancer/jobs" },
    { label: "My Projects", href: "/projects" },
    { label: "Time Tracking", href: "/time-tracking" },
    { label: "Messages", href: "/chat" },
  ];

  const adminLinks = [
    { label: "Dashboard", href: "/admin" },
    { label: "Users", href: "/admin/users" },
    { label: "Projects", href: "/admin/projects" },
    { label: "Reports", href: "/admin/reports" },
  ];

  const links = userType === "admin" ? adminLinks : userType === "client" ? clientLinks : freelancerLinks;

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link 
            href={userType === "client" ? "/client" : "/freelancer"} 
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
          <div className="hidden items-center gap-6 lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-accent ${
                  pathname === link.href ? "text-accent" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden flex-1 max-w-md lg:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={userType === "client" ? "Search for services..." : "Search for jobs..."}
                className="h-10 w-full rounded-full border-border bg-secondary pl-10 pr-4 text-sm placeholder:text-muted-foreground focus-visible:ring-accent"
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Bell className="h-5 w-5" />
            </Button>

            {/* Communication Dropdown (Messages & Video) */}
            <div className="relative hidden sm:block" ref={commDropdownRef}>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsCommDropdownOpen(!isCommDropdownOpen)}
                className="relative"
              >
                <MessageCircle className="h-5 w-5" />
              </Button>

              {/* Dropdown Menu */}
              {isCommDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card shadow-lg z-50 animate-fade-in">
                  <div className="p-2">
                    <Link href="/chat">
                      <button
                        onClick={() => setIsCommDropdownOpen(false)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary"
                      >
                        <MessageSquare className="h-5 w-5 text-accent" />
                        <div className="text-left">
                          <div className="font-medium">Chat</div>
                          <div className="text-xs text-muted-foreground">Send messages</div>
                        </div>
                      </button>
                    </Link>
                    <Link href="/video-meeting">
                      <button
                        onClick={() => setIsCommDropdownOpen(false)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary"
                      >
                        <Video className="h-5 w-5 text-accent" />
                        <div className="text-left">
                          <div className="font-medium">Video Meeting</div>
                          <div className="text-xs text-muted-foreground">Start a call</div>
                        </div>
                      </button>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <Link href="/profile">
              <Button variant="ghost" className="hidden items-center gap-2 sm:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                  <User className="h-4 w-4" />
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </Link>

            {/* Switch Role Button */}
            <Link href={userType === "client" ? "/freelancer" : "/client"}>
              <Button variant="outline" size="sm" className="hidden sm:flex">
                Switch to {userType === "client" ? "Selling" : "Buying"}
              </Button>
            </Link>

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

        {/* Mobile Menu with smooth slide animation */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out lg:hidden ${
            isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="border-t border-border py-4">
            {/* Mobile Search */}
            <div className="relative mb-4 transform transition-all duration-300 ease-in-out"
              style={{
                transform: isMenuOpen ? "translateY(0)" : "translateY(-10px)",
                transitionDelay: isMenuOpen ? "50ms" : "0ms"
              }}
            >
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={userType === "client" ? "Search for services..." : "Search for jobs..."}
                className="h-10 w-full rounded-full border-border bg-secondary pl-10 pr-4"
              />
            </div>

            {/* Mobile Links */}
            <div className="flex flex-col gap-2">
              {links.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 ease-in-out hover:bg-secondary ${
                    pathname === link.href ? "bg-secondary text-accent" : "text-foreground"
                  }`}
                  style={{
                    transform: isMenuOpen ? "translateY(0)" : "translateY(-10px)",
                    opacity: isMenuOpen ? 1 : 0,
                    transitionDelay: isMenuOpen ? `${100 + index * 50}ms` : "0ms"
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div
                className="transform transition-all duration-300 ease-in-out"
                style={{
                  transform: isMenuOpen ? "translateY(0)" : "translateY(-10px)",
                  opacity: isMenuOpen ? 1 : 0,
                  transitionDelay: isMenuOpen ? `${100 + links.length * 50}ms` : "0ms"
                }}
              >
                <Link href={userType === "client" ? "/freelancer" : "/client"}>
                  <Button variant="outline" className="mt-2 w-full">
                    Switch to {userType === "client" ? "Selling" : "Buying"}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
