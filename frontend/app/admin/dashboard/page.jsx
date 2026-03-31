"use client";

import { useState, useEffect } from "react";
import { getAdminDashboard } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, AlertCircle, DollarSign, TrendingUp, CheckCircle } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await getAdminDashboard();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Platform overview and statistics</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats?.users?.total_users || 0}
          icon={<Users className="h-6 w-6" />}
          subtitle={`${stats?.users?.new_users_30d || 0} new this month`}
          color="blue"
        />
        <StatCard
          title="Active Projects"
          value={stats?.projects?.open_projects || 0}
          icon={<Briefcase className="h-6 w-6" />}
          subtitle={`${stats?.projects?.total_projects || 0} total projects`}
          color="green"
        />
        <StatCard
          title="Open Disputes"
          value={stats?.disputes?.open_disputes || 0}
          icon={<AlertCircle className="h-6 w-6" />}
          subtitle={`${stats?.disputes?.unassigned_disputes || 0} unassigned`}
          color="red"
        />
        <StatCard
          title="Platform Revenue"
          value={`$${parseFloat(stats?.financial?.platform_revenue || 0).toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6" />}
          subtitle={`$${parseFloat(stats?.financial?.revenue_30d || 0).toLocaleString()} this month`}
          color="purple"
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* User Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              User Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatRow label="Freelancers" value={stats?.users?.freelancers || 0} />
            <StatRow label="Clients" value={stats?.users?.clients || 0} />
            <StatRow label="Verified Users" value={stats?.users?.verified_users || 0} />
            <StatRow label="Active (7 days)" value={stats?.users?.active_users_7d || 0} />
          </CardContent>
        </Card>

        {/* Project Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-accent" />
              Project Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatRow label="Open" value={stats?.projects?.open_projects || 0} />
            <StatRow label="In Progress" value={stats?.projects?.in_progress_projects || 0} />
            <StatRow label="Completed" value={stats?.projects?.completed_projects || 0} />
            <StatRow label="New (30 days)" value={stats?.projects?.new_projects_30d || 0} />
          </CardContent>
        </Card>

        {/* Dispute Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-accent" />
              Dispute Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatRow label="Open" value={stats?.disputes?.open_disputes || 0} />
            <StatRow label="In Mediation" value={stats?.disputes?.in_mediation_disputes || 0} />
            <StatRow label="Resolved" value={stats?.disputes?.resolved_disputes || 0} />
            <StatRow label="Unassigned" value={stats?.disputes?.unassigned_disputes || 0} />
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-accent" />
            Financial Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
              <p className="text-2xl font-bold">${parseFloat(stats?.financial?.total_revenue || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Platform Fee</p>
              <p className="text-2xl font-bold">${parseFloat(stats?.financial?.platform_revenue || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Completed</p>
              <p className="text-2xl font-bold">{stats?.financial?.completed_transactions || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Pending</p>
              <p className="text-2xl font-bold">{stats?.financial?.pending_transactions || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            href="/admin/users"
            title="Manage Users"
            description="View, verify, and manage user accounts"
            icon={<Users className="h-8 w-8" />}
          />
          <QuickActionCard
            href="/admin/disputes"
            title="Review Disputes"
            description="Assign mediators and resolve disputes"
            icon={<AlertCircle className="h-8 w-8" />}
          />
          <QuickActionCard
            href="/admin/transactions"
            title="View Transactions"
            description="Monitor platform financial activity"
            icon={<DollarSign className="h-8 w-8" />}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, subtitle, color }) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    red: 'text-red-600 bg-red-50',
    purple: 'text-purple-600 bg-purple-50'
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function QuickActionCard({ href, title, description, icon }) {
  return (
    <a
      href={href}
      className="block p-6 bg-card border border-border rounded-xl hover:border-accent hover:shadow-lg transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="text-accent">{icon}</div>
        <div>
          <h3 className="text-lg font-semibold mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </a>
  );
}
