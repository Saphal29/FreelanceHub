"use client";

import { useState, useEffect } from "react";
import { getAdminUsers, suspendUser, verifyUser, deleteAdminUser } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  Trash2,
  CheckCircle,
  XCircle,
  Mail
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Helper function to get full avatar URL
const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith('http')) return avatarPath;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
  return `${baseUrl}${avatarPath}`;
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    role: '',
    verified: '',
    search: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getAdminUsers(filters);
      if (response.success) {
        setUsers(response.users);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showMessage('error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (userId) => {
    if (!confirm('Are you sure you want to suspend this user?')) return;
    
    try {
      const response = await suspendUser(userId, 'Suspended by admin');
      if (response.success) {
        showMessage('success', 'User suspended successfully');
        fetchUsers();
      }
    } catch (error) {
      showMessage('error', 'Failed to suspend user');
    }
  };

  const handleVerify = async (userId) => {
    try {
      const response = await verifyUser(userId);
      if (response.success) {
        showMessage('success', 'User verified successfully');
        fetchUsers();
      }
    } catch (error) {
      showMessage('error', 'Failed to verify user');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      const response = await deleteAdminUser(userId);
      if (response.success) {
        showMessage('success', 'User deleted successfully');
        fetchUsers();
      }
    } catch (error) {
      showMessage('error', 'Failed to delete user');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-2">Manage all platform users</p>
      </div>

      {message.text && (
        <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={filters.search}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>
            
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="px-3 py-2 border border-border rounded-xl bg-background"
            >
              <option value="">All Roles</option>
              <option value="FREELANCER">Freelancer</option>
              <option value="CLIENT">Client</option>
              <option value="ADMIN">Admin</option>
            </select>

            <select
              value={filters.verified}
              onChange={(e) => handleFilterChange('verified', e.target.value)}
              className="px-3 py-2 border border-border rounded-xl bg-background"
            >
              <option value="">All Status</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>

            <Button onClick={fetchUsers} variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({pagination?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4">User</th>
                    <th className="text-left py-3 px-4">Role</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Projects</th>
                    <th className="text-left py-3 px-4">Joined</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-accent/5">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden">
                            {user.avatar_url ? (
                              <img 
                                src={getAvatarUrl(user.avatar_url)} 
                                alt={user.full_name} 
                                className="w-10 h-10 rounded-full object-cover" 
                              />
                            ) : (
                              <span className="text-accent font-semibold">
                                {user.full_name?.charAt(0) || 'U'}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'FREELANCER' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'CLIENT' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {user.verified ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            Verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-4 w-4" />
                            Unverified
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">{user.projects_count || 0} projects</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          {!user.verified && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerify(user.id)}
                              title="Verify User"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSuspend(user.id)}
                            title="Suspend User"
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(user.id)}
                            title="Delete User"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
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
