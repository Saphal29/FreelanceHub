'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, Download, TrendingUp, TrendingDown, 
  Calendar, FileText, ArrowUpRight, ArrowDownRight,
  Briefcase, Clock, CheckCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import api from '@/lib/api';

export default function PaymentSummaryPage() {
  const { user } = useAuth();
  const { isAuthorized, isLoading, UnauthorizedUI, LoadingUI } = useProtectedRoute();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('all'); // all, month, year

  const isFreelancer = user?.role === 'FREELANCER';
  const isClient = user?.role === 'CLIENT';

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user, dateRange]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/payments/my-payments');
      
      if (response.data.success) {
        setPayments(response.data.payments || []);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    // For freelancers: earned = received payments (payee), use net_amount (after platform fee)
    // For clients: spent = sent payments (payer), use amount (full amount paid)
    const totalEarned = payments
      .filter(p => p.status === 'completed' && p.payee_id === user.id)
      .reduce((sum, p) => sum + parseFloat(p.net_amount || p.amount || 0), 0);

    const totalSpent = payments
      .filter(p => p.status === 'completed' && p.payer_id === user.id)
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    const pendingAmount = payments
      .filter(p => p.status === 'pending' || p.status === 'initiated')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    const completedCount = payments.filter(p => p.status === 'completed').length;

    return { totalEarned, totalSpent, pendingAmount, completedCount };
  };

  const downloadPDF = () => {
    const stats = calculateStats();
    const printWindow = window.open('', '_blank');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Summary Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #f59e0b; padding-bottom: 20px; }
          .header h1 { color: #000; margin: 0; }
          .header p { color: #666; margin: 5px 0; }
          .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
          .stat-card { border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; }
          .stat-card h3 { margin: 0 0 10px 0; color: #666; font-size: 14px; }
          .stat-card p { margin: 0; font-size: 24px; font-weight: bold; color: #000; }
          .transactions { margin-top: 30px; }
          .transactions h2 { border-bottom: 2px solid #f59e0b; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background-color: #f9fafb; font-weight: 600; }
          .status-completed { color: #10b981; }
          .status-pending { color: #f59e0b; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Payment Summary Report</h1>
          <p>${user.fullName || user.email}</p>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="stats">
          <div class="stat-card">
            <h3>${isFreelancer ? 'Total Earned' : 'Total Spent'}</h3>
            <p>${formatCurrency(isFreelancer ? stats.totalEarned : stats.totalSpent)}</p>
          </div>
          <div class="stat-card">
            <h3>Pending Amount</h3>
            <p>${formatCurrency(stats.pendingAmount)}</p>
          </div>
          <div class="stat-card">
            <h3>Completed Transactions</h3>
            <p>${stats.completedCount}</p>
          </div>
          <div class="stat-card">
            <h3>Total Transactions</h3>
            <p>${payments.length}</p>
          </div>
        </div>
        
        <div class="transactions">
          <h2>Transaction History</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${payments.map(payment => `
                <tr>
                  <td>${new Date(payment.created_at).toLocaleDateString()}</td>
                  <td>${payment.description || 'Payment'}</td>
                  <td>${formatCurrency(payment.amount)}</td>
                  <td class="status-${payment.status}">${payment.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <p>FreelanceHub - Payment Summary Report</p>
          <p>This is an automatically generated report</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  if (isLoading) {
    return <LoadingUI />;
  }

  if (!isAuthorized) {
    return <UnauthorizedUI />;
  }

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment Summary</h1>
            <p className="text-gray-600 mt-1">
              Track your {isFreelancer ? 'earnings' : 'spending'} and payment history
            </p>
          </div>
          <Button
            onClick={downloadPDF}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {isFreelancer ? 'Total Earned' : 'Total Spent'}
              </CardTitle>
              {isFreelancer ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(isFreelancer ? stats.totalEarned : stats.totalSpent)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                From completed transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Amount
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.pendingAmount)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Awaiting completion
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Completed
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.completedCount}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Successful transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Transactions
              </CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {payments.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                All time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              Detailed list of all your payment transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading transactions...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No transactions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Description</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {payment.description || 'Payment'}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {payment.payer_id === user.id ? (
                            <span className="inline-flex items-center text-red-600">
                              <ArrowUpRight className="h-4 w-4 mr-1" />
                              Sent
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-green-600">
                              <ArrowDownRight className="h-4 w-4 mr-1" />
                              Received
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-medium">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="py-3 px-4 text-sm text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            payment.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : payment.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
