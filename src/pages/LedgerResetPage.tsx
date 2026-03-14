import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const LedgerResetPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [companies, setCompanies] = useState<{ email: string; trade_name: string }[]>([]);
  const [selectedCompanyEmail, setSelectedCompanyEmail] = useState<string>('');
  const [financialYear, setFinancialYear] = useState<string>('2025-26');
  const [currentBalance, setCurrentBalance] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const years = ['2023-24', '2024-25', '2025-26'];

  useEffect(() => {
    if (isAdmin) {
      const fetchCompanies = async () => {
        const { data, error } = await supabase
          .from('companies')
          .select('email, trade_name')
          .neq('role', 'admin');
        if (data) setCompanies(data);
        if (error) console.error('Error fetching companies:', error);
      };
      fetchCompanies();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedCompanyEmail && financialYear) {
      fetchCurrentBalance();
    }
  }, [selectedCompanyEmail, financialYear]);

  const fetchCurrentBalance = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cash_ledger_balance')
      .select('company_email, financial_year, cgst, igst, sgst, cess')
      .eq('company_email', selectedCompanyEmail)
      .eq('financial_year', financialYear)
      .maybeSingle();
    
    setCurrentBalance(data);
    setLoading(false);
  };

  const handleResetBalance = async () => {
    if (!currentBalance) {
      toast.error("No balance to reset.");
      return;
    }

    const resetEntry = {
      company_email: selectedCompanyEmail,
      financial_year: financialYear,
      igst: -currentBalance.igst,
      cgst: -currentBalance.cgst,
      sgst: -currentBalance.sgst,
      cess: -currentBalance.cess,
      transaction_type: 'RESET',
      transaction_source: 'Admin Reset',
      created_by: user?.email
    };

    setLoading(true);
    try {
      const { error } = await supabase.from('cash_ledger_transactions').insert(resetEntry);
      if (error) throw error;
      toast.success("Ledger balance has been reset.");
      fetchCurrentBalance(); // Refresh balance
    } catch (err: any) {
      toast.error("Failed to reset balance: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold mb-2">Select Company</h2>
          <Select onValueChange={setSelectedCompanyEmail} value={selectedCompanyEmail}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a company..." />
            </SelectTrigger>
            <SelectContent>
              {companies.map((c) => (
                <SelectItem key={c.email} value={c.email}>
                  {c.trade_name} ({c.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <h2 className="text-sm font-semibold mb-2">Financial Year</h2>
          <Select onValueChange={setFinancialYear} value={financialYear}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedCompanyEmail && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border">
          <h2 className="text-xl font-semibold mb-4">Current Utilizable Balance</h2>
          {loading ? (
            <p>Loading...</p>
          ) : currentBalance ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">CGST</p>
                <p className="font-bold text-lg">{currentBalance.cgst?.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">IGST</p>
                <p className="font-bold text-lg">{currentBalance.igst?.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">SGST</p>
                <p className="font-bold text-lg">{currentBalance.sgst?.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">CESS</p>
                <p className="font-bold text-lg">{currentBalance.cess?.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-blue-100 rounded-lg text-center col-span-2 sm:col-span-1">
                <p className="text-sm text-blue-800">Total</p>
                <p className="font-bold text-lg text-blue-800">₹{((currentBalance.cgst || 0) + (currentBalance.igst || 0) + (currentBalance.sgst || 0) + (currentBalance.cess || 0)).toFixed(2)}</p>
              </div>
            </div>
          ) : (
            <p>No balance found for the selected criteria.</p>
          )}
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={handleResetBalance} 
              disabled={loading || !currentBalance || ((currentBalance.cgst || 0) + (currentBalance.igst || 0) + (currentBalance.sgst || 0) + (currentBalance.cess || 0)) === 0}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? "RESETTING..." : "RESET BALANCE TO ZERO"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LedgerResetPage;
