'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import EmptyState from '@/components/common/EmptyState';
import { AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import api from '@/lib/api';

export default function PaymentSummaryPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const isFreelancer = user?.role === 'FREELANCER';

  useEffect(() => {
    if (user) {
      fetchPaymentsData();
    }
  }, [user]);

  const fetchPaymentsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/payments/my-payments');
      
      if (response.data?.success) {
        setPayments(response.data.payments || []);
      } else {
        setError('Failed to load transaction ledger.');
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Network error while loading payment ledger.');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalEarned = payments
      .filter(p => p.status === 'completed' && p.payee_id === user?.id)
      .reduce((sum, p) => sum + parseFloat(p.net_amount || p.amount || 0), 0);

    const totalSpent = payments
      .filter(p => p.status === 'completed' && p.payer_id === user?.id)
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    const pendingAmount = payments
      .filter(p => p.status === 'pending' || p.status === 'initiated')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    const completedCount = payments.filter(p => p.status === 'completed').length;

    return { totalEarned, totalSpent, pendingAmount, completedCount };
  };

  const downloadPDFReport = () => {
    const stats = calculateStats();
    const printWindow = window.open('', '_blank');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>FreelanceHub Financial Ledger</title>
        <style>
          body { font-family: 'Courier New', monospace; padding: 40px; background: #F6F3EA; color: #0A0A08; }
          .header { text-align: left; margin-bottom: 30px; border-bottom: 2px solid #0A0A08; padding-bottom: 20px; }
          .header h1 { font-size: 24px; margin: 0; text-transform: uppercase; }
          .header p { color: #555; margin: 5px 0; font-size: 12px; }
          .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
          .stat-card { border: 2px solid #0A0A08; padding: 15px; background: #FFF; }
          .stat-card h3 { margin: 0 0 10px 0; color: #555; font-size: 11px; text-transform: uppercase; }
          .stat-card p { margin: 0; font-size: 20px; font-weight: bold; color: #E8371A; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #0A0A08; }
          th { background-color: #EBE7DC; font-weight: bold; text-transform: uppercase; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 11px; border-top: 1px solid #0A0A08; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FREELANCEHUB · FINANCIAL LEDGER REPORT</h1>
          <p>PARTICIPANT: ${user?.fullName || user?.email}</p>
          <p>DATE: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="stats">
          <div class="stat-card">
            <h3>${isFreelancer ? 'TOTAL EARNED (NPR)' : 'TOTAL SPENT (NPR)'}</h3>
            <p>${formatCurrency(isFreelancer ? stats.totalEarned : stats.totalSpent)}</p>
          </div>
          <div class="stat-card">
            <h3>PENDING IN ESCROW</h3>
            <p>${formatCurrency(stats.pendingAmount)}</p>
          </div>
        </div>
        
        <div class="transactions">
          <h2>TRANSACTION LEDGER HISTORY</h2>
          <table>
            <thead>
              <tr>
                <th>DATE</th>
                <th>DESCRIPTION</th>
                <th>AMOUNT (NPR)</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              ${payments.map(p => `
                <tr>
                  <td>${new Date(p.created_at || p.createdAt || Date.now()).toLocaleDateString()}</td>
                  <td>${p.description || 'Milestone Payment'}</td>
                  <td>${formatCurrency(p.amount)}</td>
                  <td>[${p.status?.toUpperCase()}]</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>Engineered by Nantio Studio (www.nantio.it.com)</p>
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

  const userType = isFreelancer ? "freelancer" : "client";
  const stats = calculateStats();

  const filteredPayments = payments.filter(p => {
    if (statusFilter === 'all') return true;
    return p.status === statusFilter;
  });

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar userType={userType} />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 space-y-8 flex-1 w-full pb-24 lg:pb-12 text-left">
        
        {/* EDITORIAL HEADER */}
        <section className="space-y-4 border-b border-[var(--ink)] pb-8">
          <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal)] inline-block animate-pulse"></span>
            <span>FREELANCEHUB REGISTER · FINANCIAL STATEMENT</span>
          </p>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="font-serif-ledger text-[38px] sm:text-[50px] leading-[1.05] font-medium tracking-tight text-[var(--ink)]">
                Financial Statement.
              </h1>
              <p className="text-[15px] text-[var(--muted)] max-w-xl">
                Review complete transaction history, milestone releases, and escrow account balances in NPR.
              </p>
            </div>

            <button 
              onClick={downloadPDFReport}
              className="bg-[var(--ink)] hover:bg-[var(--signal)] text-[var(--paper)] font-mono-ledger font-bold text-[12px] uppercase tracking-wider px-5 py-3 transition-colors inline-flex items-center space-x-2 shrink-0"
            >
              <span>Export statement PDF →</span>
            </button>
          </div>
        </section>

        {/* ARCHETYPE E: THE ONE FILTER BAR */}
        <section className="border-y border-[var(--ink)] py-3 font-mono-ledger text-[11px]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[var(--muted)] font-bold mr-2 uppercase">Status:</span>
              {[
                { id: "all", label: "All transactions" },
                { id: "completed", label: "Completed" },
                { id: "pending", label: "Pending" },
                { id: "initiated", label: "Initiated" }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setStatusFilter(t.id)}
                  className={`px-3 py-1.5 border transition-colors ${
                    statusFilter === t.id
                      ? "bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)] font-bold"
                      : "bg-[var(--paper)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--ink)]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="text-[var(--muted)] text-[11px]">
              Showing {filteredPayments.length} transaction record{filteredPayments.length === 1 ? '' : 's'}
            </div>
          </div>
        </section>

        {/* NOTIFICATIONS */}
        {error && (
          <div className="p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] font-mono-ledger text-[12px] flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* TRANSACTION REGISTER ROWS */}
        <section className="space-y-4">
          {loading ? (
            <div className="space-y-3 font-mono-ledger text-[12px] text-[var(--muted)] py-12 text-center border border-[var(--line)]">
              LOADING TRANSACTION REGISTER...
            </div>
          ) : filteredPayments.length === 0 ? (
            <EmptyState
              marker="FINANCIAL REGISTER · STATUS: EMPTY"
              title="No transaction records found."
              description="Once milestone funds are deposited or released on active contracts, transactions will populate this financial ledger."
              actionLabel="View active contracts →"
              actionHref="/contracts"
            />
          ) : (
            <div className="border border-[var(--ink)] divide-y divide-[var(--line)] bg-[var(--paper)] font-mono-ledger text-[12px]">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--paper-2)] transition-colors">
                  <div className="space-y-1 text-left">
                    <div className="flex items-center space-x-2 text-[10px] uppercase">
                      <span className="text-[var(--signal)] font-bold">
                        TX / #{payment.id?.slice(0, 8) || '0001'}
                      </span>
                      <span>·</span>
                      <span className="text-[var(--muted)]">
                        {new Date(payment.created_at || payment.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="font-sans-ledger text-[15px] font-medium text-[var(--ink)]">
                      {payment.description || 'Milestone Escrow Deposit'}
                    </h4>

                    <p className="text-[11px] text-[var(--muted)]">
                      Method: {payment.payment_method?.toUpperCase() || 'ESEWA'}
                    </p>
                  </div>

                  <div className="sm:text-right space-y-1 shrink-0">
                    <span className="text-[18px] font-bold text-[var(--signal)] block">
                      {formatCurrency(payment.amount || 0)}
                    </span>
                    <span className="text-[10px] text-[var(--ink)] font-bold block">
                      [{payment.status?.toUpperCase() || 'COMPLETED'}]
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-center font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FreelanceHub · Financial Statement Archetype E</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}
