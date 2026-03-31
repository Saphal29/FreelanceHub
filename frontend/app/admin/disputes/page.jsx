"use client";

import { useState, useEffect } from "react";
import { getAdminDisputes } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Eye, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchDisputes();
  }, [filters]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const response = await getAdminDisputes(filters);
      if (response.success) {
        setDisputes(response.disputes);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error fetching disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      in_mediation: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryColor = (category) => {
    const colors = {
      payment_issue: 'bg-red-100 text-red-800',
      quality_of_work: 'bg-orange-100 text-orange-800',
      missed_deadline: 'bg-yellow-100 text-yellow-800',
      scope_disagreement: 'bg-blue-100 text-blue-800',
      communication_issue: 'bg-purple-100 text-purple-800',
      contract_breach: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dispute Management</h1>
        <p className="text-muted-foreground mt-2">Monitor and manage platform disputes</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-border rounded-xl bg-background"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="under_review">Under Review</option>
              <option value="in_mediation">In Mediation</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-3 py-2 border border-border rounded-xl bg-background"
            >
              <option value="">All Categories</option>
              <option value="payment_issue">Payment Issue</option>
              <option value="quality_of_work">Quality of Work</option>
              <option value="missed_deadline">Missed Deadline</option>
              <option value="scope_disagreement">Scope Disagreement</option>
              <option value="communication_issue">Communication Issue</option>
              <option value="contract_breach">Contract Breach</option>
              <option value="other">Other</option>
            </select>

            <Button onClick={fetchDisputes} variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Disputes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Disputes ({pagination?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : disputes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No disputes found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4">Dispute</th>
                    <th className="text-left py-3 px-4">Parties</th>
                    <th className="text-left py-3 px-4">Category</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Mediator</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Filed</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {disputes.map((dispute) => (
                    <tr key={dispute.id} className="border-b border-border hover:bg-accent/5">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{dispute.title}</p>
                          <p className="text-sm text-muted-foreground">{dispute.project_title}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <p><span className="font-medium">Filed by:</span> {dispute.filed_by_name}</p>
                          <p className="text-muted-foreground">Against: {dispute.respondent_name}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(dispute.category)}`}>
                          {dispute.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(dispute.status)}`}>
                          {dispute.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {dispute.mediator_name ? (
                          <span className="text-sm">{dispute.mediator_name}</span>
                        ) : (
                          <span className="text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {dispute.amount_disputed ? (
                          <span className="font-medium">${parseFloat(dispute.amount_disputed).toFixed(2)}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-muted-foreground">
                          {new Date(dispute.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/disputes/${dispute.id}`}>
                            <Button size="sm" variant="outline" title="View Dispute">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} disputes
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
