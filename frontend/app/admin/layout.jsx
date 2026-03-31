"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  AlertCircle, 
  DollarSign,
  Settings,
  LogOut
} from "lucide-react";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-card border-r border-border">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-accent">Admin Panel</h1>
            <p className="text-sm text-muted-foreground mt-1">FreelanceHub</p>
          </div>

          <nav className="px-4 space-y-2">
            <NavLink href="/admin/dashboard" icon={<LayoutDashboard className="h-5 w-5" />} active={pathname === '/admin/dashboard'}>
              Dashboard
            </NavLink>
            <NavLink href="/admin/users" icon={<Users className="h-5 w-5" />} active={pathname?.startsWith('/admin/users')}>
              Users
            </NavLink>
            <NavLink href="/admin/projects" icon={<Briefcase className="h-5 w-5" />} active={pathname?.startsWith('/admin/projects')}>
              Projects
            </NavLink>
            <NavLink href="/admin/disputes" icon={<AlertCircle className="h-5 w-5" />} active={pathname?.startsWith('/admin/disputes')}>
              Disputes
            </NavLink>
            <NavLink href="/admin/transactions" icon={<DollarSign className="h-5 w-5" />} active={pathname?.startsWith('/admin/transactions')}>
              Transactions
            </NavLink>
          </nav>

          <div className="absolute bottom-0 w-64 p-4 border-t border-border">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-accent/10 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Back to Site</span>
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavLink({ href, icon, children, active }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
        active 
          ? 'bg-amber-100 text-amber-900 border border-amber-200' 
          : 'text-foreground hover:bg-accent/10 hover:text-accent'
      }`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}
