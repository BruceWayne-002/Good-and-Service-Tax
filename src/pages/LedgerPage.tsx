
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import CreateChallanPage from './CreateChallanPage';
import LedgerResetPage from './LedgerResetPage';

const LedgerPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin && user) {
      navigate('/dashboard');
    }
  }, [isAdmin, user, navigate]);

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cash_ledger_transactions')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setHistory(data);
    setLoading(false);
  };

  const fetchBalances = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cash_ledger_balance')
      .select('company_email, financial_year, cgst, igst, sgst, cess');
    if (data) setBalances(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 sm:p-6">
      <main className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Ledger</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>BACK</Button>
          </div>
        </div>
        <Tabs defaultValue="create-challan" onValueChange={(val) => {
          if (val === 'challan-history') fetchHistory();
          if (val === 'ledger-balance') fetchBalances();
        }}>
          <TabsList>
            <TabsTrigger value="create-challan">Create Challan</TabsTrigger>
            <TabsTrigger value="reset-balance">Reset Balance</TabsTrigger>
            <TabsTrigger value="challan-history">Challan History</TabsTrigger>
            <TabsTrigger value="ledger-balance">Ledger Balance</TabsTrigger>
          </TabsList>
          <TabsContent value="create-challan">
            <CreateChallanPage />
          </TabsContent>
          <TabsContent value="reset-balance">
            <LedgerResetPage />
          </TabsContent>
          <TabsContent value="challan-history">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="p-3 text-left border">Date</th>
                    <th className="p-3 text-left border">Company</th>
                    <th className="p-3 text-left border">Transaction Type</th>
                    <th className="p-3 text-left border">Period</th>
                    <th className="p-3 text-right border">CGST</th>
                    <th className="p-3 text-right border">IGST</th>
                    <th className="p-3 text-right border">SGST</th>
                    <th className="p-3 text-right border">Cess</th>
                    <th className="p-3 text-right border font-bold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => {
                    const totalAmount = (h.cgst || 0) + (h.igst || 0) + (h.sgst || 0) + (h.cess || 0);
                    return (
                      <tr key={h.id} className={`border-t ${h.transaction_type !== 'DEPOSIT' ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                        <td className="p-3 border">{new Date(h.created_at).toLocaleDateString()}</td>
                        <td className="p-3 border">{h.company_email}</td>
                        <td className="p-3 border">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            h.transaction_type === 'DEPOSIT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {h.transaction_type}
                          </span>
                        </td>
                        <td className="p-3 border">{h.tax_period || 'N/A'} {h.financial_year}</td>
                        <td className={`p-3 border text-right ${h.cgst < 0 ? 'text-red-600' : ''}`}>{h.cgst?.toFixed(2)}</td>
                        <td className={`p-3 border text-right ${h.igst < 0 ? 'text-red-600' : ''}`}>{h.igst?.toFixed(2)}</td>
                        <td className={`p-3 border text-right ${h.sgst < 0 ? 'text-red-600' : ''}`}>{h.sgst?.toFixed(2)}</td>
                        <td className={`p-3 border text-right ${h.cess < 0 ? 'text-red-600' : ''}`}>{h.cess?.toFixed(2)}</td>
                        <td className={`p-3 border text-right font-bold ${totalAmount < 0 ? 'text-red-600' : ''}`}>
                          ₹{totalAmount?.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                  {history.length === 0 && !loading && (
                    <tr><td colSpan={9} className="p-4 text-center text-gray-500">No history found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
          <TabsContent value="ledger-balance">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="p-3 text-left border">Company Email</th>
                    <th className="p-3 text-right border font-bold">Total Utilizable Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {balances.map((b) => {
                    const total = (Number(b.cgst || 0) + Number(b.igst || 0) + Number(b.sgst || 0) + Number(b.cess || 0));
                    return (
                      <tr key={b.company_email} className="border-t">
                        <td className="p-3 border">{b.company_email}</td>
                        <td className="p-3 border text-right font-bold text-green-600">₹{total.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  {balances.length === 0 && !loading && (
                    <tr><td colSpan={2} className="p-4 text-center text-gray-500">No balances found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default LedgerPage;
