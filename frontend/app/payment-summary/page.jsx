'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import CommandRail from '@/components/layout/CommandRail';
import EmptyState from '@/components/common/EmptyState';
import { 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  FileText
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import api from '@/lib/api';

export default function PaymentSummaryPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
              ${payments.map(payment => `
                <tr>
                  <td>${new Date(payment.created_at).toLocaleDateString()}</td>
                  <td>${payment.description || 'Contract Escrow Payment'}</td>
                  <td>${formatCurrency(payment.amount)}</td>
                  <td>[${payment.status.toUpperCase()}]</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <p>FreelanceHub Financial Ledger · Engineered by Nantio Studio</p>
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

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans-ledger selection:bg-[var(--signal)] selection:text-[var(--paper)] flex flex-col justify-between">
      
      {/* Top Navbar */}
      <Navbar userType={userType} />

      {/* Floating Tool Rail */}
      <CommandRail userType={userType} />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 lg:pl-20 py-8 sm:py-12 space-y-10 flex-1 w-full pb-24 lg:pb-12 text-left">
        
        {/* EDITORIAL HEADER */}
        <section className="space-y-4 border-b border-[var(--ink)] pb-8">
          <p className="font-mono-ledger text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal)] inline-block animate-pulse"></span>
            <span>FREELANCEHUB AUDIT · FINANCIAL LEDGER & ESCROW STATEMENT</span>
          </p>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="font-serif-ledger text-[38px] sm:text-[50px] leading-[1.05] font-medium tracking-tight text-[var(--ink)]">
                Payment Summary.
              </h1>
              <p className="text-[15px] text-[var(--muted)] max-w-xl">
                Track your {isFreelancer ? 'earnings' : 'spending'} history, pending escrow balances, and transaction statements in NPR.
              </p>
            </div>

            <button
              onClick={downloadPDFReport}
              className="bg-[var(--signal)] hover:bg-[var(--signal-dark)] text-[var(--paper)] font-mono-ledger font-bold text-[12px] uppercase tracking-wider px-5 py-3 transition-colors inline-flex items-center space-x-2 shrink-0 shadow-xs"
            >
              <Download className="h-4 w-4" />
              <span>DOWNLOAD PDF REPORT →</span>
            </button>
          </div>
        </section>


        {/* NOTIFICATIONS */}
        {error && (
          <div className="p-4 bg-red-50 border border-[var(--signal)] text-[var(--signal-dark)] font-mono-ledger text-[12px] flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-[var(--signal)] shrink-0" />
            <span>{error}</span>
          </div>
        )}


        {/* METRICS SPECIMEN STRIP */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono-ledger">
          
          {/* Card 1 */}
          <div className="border-2 border-[var(--ink)] bg-[var(--paper)] p-5 space-y-2 text-left">
            <span className="text-[10px] text-[var(--muted)] uppercase font-bold block">
              {isFreelancer ? 'TOTAL EARNED (NPR)' : 'TOTAL SPENT (NPR)'}
            </span>
            <span className="text-[24px] font-bold text-[var(--signal)] block tracking-tight">
              {formatCurrency(isFreelancer ? stats.totalEarned : stats.totalSpent)}
            </span>
            <span className="text-[10px] text-[var(--muted)] block">From completed contracts</span>
          </div>

          {/* Card 2 */}
          <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-5 space-y-2 text-left">
            <span className="text-[10px] text-[var(--muted)] uppercase font-bold block">PENDING IN ESCROW</span>
            <span className="text-[24px] font-bold text-[var(--ink)] block tracking-tight">
              {formatCurrency(stats.pendingAmount)}
            </span>
            <span className="text-[10px] text-[var(--muted)] block">Awaiting milestone approval</span>
          </div>

          {/* Card 3 */}
          <div className="border-2 border-[var(--ink)] bg-[var(--paper)] p-5 space-y-2 text-left">
            <span className="text-[10px] text-[var(--muted)] uppercase font-bold block">COMPLETED TRANSACTIONS</span>
            <span className="text-[24px] font-bold text-green-700 block tracking-tight">
              {stats.completedCount}
            </span>
            <span className="text-[10px] text-[var(--muted)] block">Successful releases</span>
          </div>

          {/* Card 4 */}
          <div className="border-2 border-[var(--ink)] bg-[var(--paper-2)] p-5 space-y-2 text-left">
            <span className="text-[10px] text-[var(--muted)] uppercase font-bold block">TOTAL VOLUME</span>
            <span className="text-[24px] font-bold text-[var(--ink)] block tracking-tight">
              {payments.length}
            </span>
            <span className="text-[10px] text-[var(--muted)] block">All time records</span>
          </div>

        </section>


        {/* TRANSACTION LEDGER TABLE */}
        <section className="space-y-4">
          <div className="border-b border-[var(--ink)] pb-2 font-mono-ledger text-[11px] uppercase tracking-wider font-bold text-[var(--ink)] flex items-center justify-between">
            <span>TRANSACTION HISTORY REGISTER</span>
            <span className="text-[var(--signal)]">{payments.length} RECORDS</span>
          </div>

          {loading ? (
            <div className="border-2 border-[var(--line)] bg-[var(--paper-2)] p-8 text-center font-mono-ledger text-[12px] text-[var(--muted)]">
              SYNCHRONIZING FINANCIAL LEDGER...
            </div>
          ) : payments.length === 0 ? (
            <EmptyState
              marker="FINANCIAL LEDGER"
              title="No transaction records found."
              description="Once milestone escrow deposits are made or released, your financial transactions will log here automatically."
              actionLabel="VIEW CONTRACT REGISTER →"
              actionHref="/contracts"
            />
          ) : (
            <div className="border-2 border-[var(--ink)] bg-[var(--paper)] overflow-x-auto font-mono-ledger text-[12px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--ink)] bg-[var(--paper-2)] text-[10px] uppercase font-bold text-[var(--muted)]">
                    <th className="py-3 px-4">DATE</th>
                    <th className="py-3 px-4">DESCRIPTION</th>
                    <th className="py-3 px-4">TYPE</th>
                    <th className="py-3 px-4 text-right">AMOUNT (NPR)</th>
                    <th className="py-3 px-4 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-[var(--paper-2)] transition-colors">
                      <td className="py-3 px-4 font-bold text-[var(--ink)]">
                        {new Date(payment.created_at || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-[var(--ink)]">
                        {payment.description || 'Escrow Milestone Deposit'}
                      </td>
                      <td className="py-3 px-4 text-[11px]">
                        {payment.payer_id === user?.id ? (
                          <span className="text-[var(--signal)] font-bold">[SENT]</span>
                        ) : (
                          <span className="text-green-700 font-bold">[RECEIVED]</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[var(--ink)]">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase border ${
                          payment.status === 'completed' 
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          [{payment.status?.toUpperCase() || 'RECORDED'}]
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[var(--line)] py-6 text-center mt-12 font-mono-ledger text-[12px] text-[var(--muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FreelanceHub · Financial Ledger Statement</span>
          <span>Engineered by Nantio Studio (www.nantio.it.com)</span>
        </div>
      </footer>

    </div>
  );
}
