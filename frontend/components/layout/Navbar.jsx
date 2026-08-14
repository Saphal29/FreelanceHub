"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Users,
  PlusCircle,
  MessageSquare,
  LayoutDashboard
} from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = ({ userType = "client" }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const navDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    // userType is passed as a prop — no need to persist it
  }, [userType]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navDropdownRef.current && !navDropdownRef.current.contains(event.target) &&
          profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
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

  const freelancerNav = [
    { label: "Find Work", href: "/projects", icon: Search },
    {
      label: "My Work",
      icon: Briefcase,
      dropdown: [
        { label: "My Proposals", href: "/freelancer/proposals", icon: FileText },
        { label: "Active Contracts", href: "/contracts", icon: Briefcase },
        { label: "Time Tracking", href: "/time-tracking", icon: Clock },
      ]
    },
    { label: "Messages", href: "/chat", icon: MessageSquare },
    { label: "Disputes", href: "/disputes", icon: AlertCircle },
  ];

  const clientNav = [
    { label: "Find Talent", href: "/client/talent", icon: Users },
    {
      label: "Projects",
      icon: Briefcase,
      dropdown: [
        { label: "My Projects", href: "/client/projects", icon: FileText },
        { label: "Post a Project", href: "/client/post-project", icon: PlusCircle },
        { label: "Contracts", href: "/contracts", icon: Briefcase },
      ]
    },
    { label: "Messages", href: "/chat", icon: MessageSquare },
    { label: "Disputes", href: "/disputes", icon: AlertCircle },
  ];

  const adminNav = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Users", href: "/admin/users", icon: User },
    { label: "Projects", href: "/admin/projects", icon: FileText },
    { label: "Disputes", href: "/admin/disputes", icon: AlertCircle },
    { label: "Transactions", href: "/admin/transactions", icon: Clock },
  ];

  const navItems = userType === "admin" ? adminNav : userType === "client" ? clientNav : freelancerNav;

  const profileMenuItems = [
    { label: "View Profile", href: "/profile", icon: User },
    { label: "Payment Summary", href: "/payment-summary", icon: Clock },
  ];

  const isActive = (item) => {
    if (item.dropdown) {
      return item.dropdown.some(sub => pathname === sub.href);
    }
    return pathname === item.href;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--line)] bg-[var(--paper)]/95 backdrop-blur-sm font-sans-ledger">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo */}
          <Link href={userType === 'freelancer' ? '/freelancer' : '/dashboard'} className="flex items-center space-x-2.5">
            <span className="font-serif-ledger text-[20px] font-semibold tracking-tight text-[var(--ink)] hover:text-[var(--signal)] transition-colors">
              FreelanceHub
            </span>
            <span className="font-mono-ledger text-[9px] uppercase px-1.5 py-0.5 bg-[var(--paper-2)] border border-[var(--line)] text-[var(--muted)]">
              {userType}
            </span>
          </Link>

          {/* Desktop Navigation Links with Icons */}
          <div className="hidden items-center space-x-1 lg:flex" ref={navDropdownRef}>
            {navItems.map((item, index) => {
              const ItemIcon = item.icon;
              return item.dropdown ? (
                <div key={index} className="relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === index ? null : index)}
                    className={`flex items-center space-x-1.5 px-3 py-2 text-[13px] font-mono-ledger tracking-wide transition-colors ${
                      isActive(item) 
                        ? "text-[var(--signal)] font-bold" 
                        : "text-[var(--ink)] hover:text-[var(--signal)]"
                    }`}
                  >
                    {ItemIcon && <ItemIcon className="h-3.5 w-3.5 shrink-0" />}
                    <span>{item.label}</span>
                    <ChevronDown className={`h-3 w-3 transition-transform ${openDropdown === index ? 'rotate-180' : ''}`} />
                  </button>

                  {openDropdown === index && (
                    <div className="absolute left-0 top-full mt-1 w-52 border border-[var(--ink)] bg-[var(--paper)] shadow-md font-mono-ledger text-[12px] z-50">
                      {item.dropdown.map((subItem) => {
                        const SubIcon = subItem.icon;
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={() => setOpenDropdown(null)}
                            className={`flex items-center space-x-2 px-4 py-2.5 transition-colors border-b border-[var(--line)] last:border-0 ${
                              pathname === subItem.href 
                                ? "bg-[var(--paper-2)] text-[var(--signal)] font-bold" 
                                : "text-[var(--ink)] hover:bg-[var(--paper-2)] hover:text-[var(--signal)]"
                            }`}
                          >
                            {SubIcon && <SubIcon className="h-3.5 w-3.5 shrink-0" />}
                            <span>{subItem.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 text-[13px] font-mono-ledger tracking-wide transition-colors ${
                    isActive(item) 
                      ? "text-[var(--signal)] font-bold" 
                      : "text-[var(--ink)] hover:text-[var(--signal)]"
                  }`}
                >
                  {ItemIcon && <ItemIcon className="h-3.5 w-3.5 shrink-0" />}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            <NotificationBell />

            {/* Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setOpenDropdown(openDropdown === 'profile' ? null : 'profile')}
                data-tour="profile-dropdown"
                className="flex items-center space-x-2 p-1.5 border border-[var(--line)] bg-[var(--paper-2)] hover:border-[var(--ink)] transition-all text-left"
              >
                <div className="w-7 h-7 bg-[var(--ink)] text-[var(--paper)] font-mono-ledger text-[11px] font-bold flex items-center justify-center">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:flex flex-col text-[11px] font-mono-ledger leading-tight pr-1">
                  <span className="font-bold text-[var(--ink)] truncate max-w-[100px]">
                    {user?.fullName?.split(' ')[0] || 'User'}
                  </span>
                  <span className="text-[var(--muted)] text-[9px] uppercase">
                    {userType}
                  </span>
                </div>
                <ChevronDown className="h-3 w-3 text-[var(--muted)] hidden sm:block" />
              </button>

              {openDropdown === 'profile' && (
                <div className="absolute right-0 top-full mt-2 w-56 border-2 border-[var(--ink)] bg-[var(--paper)] shadow-md z-50 font-mono-ledger text-[12px]">
                  <div className="border-b border-[var(--line)] p-3 bg-[var(--paper-2)] space-y-0.5">
                    <p className="font-bold text-[var(--ink)] truncate">{user?.fullName || 'Authenticated User'}</p>
                    <p className="text-[10px] text-[var(--muted)] truncate">{user?.email}</p>
                  </div>
                  
                  <div className="py-1 divide-y divide-[var(--line)]">
                    {profileMenuItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpenDropdown(null)}
                        className="flex items-center space-x-2 px-3.5 py-2.5 text-[var(--ink)] hover:bg-[var(--paper-2)] hover:text-[var(--signal)] transition-colors"
                      >
                        <item.icon className="h-3.5 w-3.5 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full text-left px-3.5 py-2.5 text-[var(--signal)] hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5 shrink-0" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 border border-[var(--line)] bg-[var(--paper-2)] text-[var(--ink)]"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-[var(--line)] bg-[var(--paper)] p-4 space-y-3 font-mono-ledger text-[13px]">
          {navItems.map((item, index) => {
            const ItemIcon = item.icon;
            return (
              <div key={index} className="space-y-1">
                {item.dropdown ? (
                  <>
                    <div className="font-bold text-[var(--muted)] uppercase text-[10px] tracking-wider pt-2 flex items-center space-x-1.5">
                      {ItemIcon && <ItemIcon className="h-3.5 w-3.5" />}
                      <span>{item.label}</span>
                    </div>
                    {item.dropdown.map((subItem) => {
                      const SubIcon = subItem.icon;
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center space-x-2 py-1.5 pl-4 text-[var(--ink)] hover:text-[var(--signal)]"
                        >
                          {SubIcon && <SubIcon className="h-3.5 w-3.5" />}
                          <span>{subItem.label}</span>
                        </Link>
                      );
                    })}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-2 py-2 text-[var(--ink)] hover:text-[var(--signal)] font-bold"
                  >
                    {ItemIcon && <ItemIcon className="h-3.5 w-3.5" />}
                    <span>{item.label}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </header>
  );
};

export default Navbar;
