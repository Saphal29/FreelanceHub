"use client";

import { useState, useEffect } from "react";
import { getAdminTransactions, getAdminFinancialStats } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, CreditCard, CheckCircle, Clock, XCircle } from "lucide-react";

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transactionsRes, statsRes] = await Promise.all([
        getAdminTransactions(filters),
        getAdminFinancialStats()
      ]);
      
      if (transactionsRes.success) {
        setTransactions(transactionsRes.transactions);
        setPagination(transactionsRes.pagination);
      }
      
      if (statsRes.success) {
        setStats(statsRes.stats);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      completed: <CheckCircle className="h-4 w-4" />,
      pending: <Clock className="h-4 w-4" />,
      failed: <XCircle className="h-4 w-4" />,
      refunded: <CreditCard className="h-4 w-4" />
    };
    return icons[status] || <CreditCard className="h-4 w-4" />;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Transaction Management</h1>
        <p className="text-muted-foreground mt-2">Monitor platform financial activity</p>
      </div>

      {/* Financial Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${parseFloat(stats.total_revenue || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All time revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Platform Fee
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${parseFloat(stats.platform_revenue || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Platform earnings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.completed_transactions || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Successful transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
              <Clock className="h-5 w-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.pending_transactions || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting completion
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-border rounded-xl bg-background"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            <Button onClick={fetchData} variant="outline">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({pagination?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No transactions found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4">Transaction ID</th>
                    <th className="text-left py-3 px-4">Project</th>
                    <th className="text-left py-3 px-4">Client</th>
                    <th className="text-left py-3 px-4">Freelancer</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Platform Fee</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-border hover:bg-accent/5">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm">{transaction.id.slice(0, 8)}...</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">{transaction.project_title}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">{transaction.client_name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">{transaction.freelancer_name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold">
                          ${parseFloat(transaction.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-muted-foreground">
                          ${parseFloat(transaction.platform_fee || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(transaction.status)}`}>
                          {getStatusIcon(transaction.status)}
                          {transaction.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </span>
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
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} transactions
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
