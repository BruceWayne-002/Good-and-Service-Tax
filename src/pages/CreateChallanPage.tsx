
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type ChallanRow = {
  tax: number;
  interest: number;
  penalty: number;
  fees: number;
  other: number;
};

const initialRow: ChallanRow = { tax: 0, interest: 0, penalty: 0, fees: 0, other: 0 };

const CreateChallanPage: React.FC = () => {
  const { user, company, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [cgst, setCgst] = useState<ChallanRow>(initialRow);
  const [igst, setIgst] = useState<ChallanRow>(initialRow);
  const [cess, setCess] = useState<ChallanRow>(initialRow);
  const [sgst, setSgst] = useState<ChallanRow>(initialRow);
  const [isEditing, setIsEditing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<{ email: string; trade_name: string }[]>([]);
  const [selectedCompanyEmail, setSelectedCompanyEmail] = useState<string>('');
  const [financialYear, setFinancialYear] = useState<string>('2025-26');
  const [saving, setSaving] = useState(false);

  const years = ['2023-24', '2024-25', '2025-26'];

  // Restrict to admin only
  useEffect(() => {
    if (!isAdmin && user) {
      navigate('/dashboard');
    }
  }, [isAdmin, user, navigate]);

  // Fetch companies for admin to select
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

  const getRowTotal = (row: ChallanRow) => {
    return row.tax + row.interest + row.penalty + row.fees + row.other;
  };

  const cgstTotal = useMemo(() => getRowTotal(cgst), [cgst]);
  const igstTotal = useMemo(() => getRowTotal(igst), [igst]);
  const cessTotal = useMemo(() => getRowTotal(cess), [cess]);
  const sgstTotal = useMemo(() => getRowTotal(sgst), [sgst]);

  const totalChallanAmount = useMemo(() => {
    return cgstTotal + igstTotal + cessTotal + sgstTotal;
  }, [cgstTotal, igstTotal, cessTotal, sgstTotal]);

  // A simple number to words converter
  const toWords = (num: number): string => {
    if (num === 0) return 'Zero';
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const convert = (n: number): string => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 1000)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
      return 'Number too large';
    }
    return `Rupees ${convert(num)} Only`;
  };

  const totalAmountInWords = useMemo(() => toWords(totalChallanAmount), [totalChallanAmount]);

  const handleSave = async () => {
    if (!user) {
      setError("User not found. Please log in again.");
      return;
    }

    if (!selectedCompanyEmail) {
      setError("Please select a company.");
      return;
    }

    if (totalChallanAmount <= 0) {
      setError("Total Challan Amount must be greater than zero.");
      return;
    }

    setSaving(true);
    try {
      const transactionData = {
        company_email: selectedCompanyEmail,
        financial_year: financialYear,
        tax_period: null, // Deposits are not tied to a specific month
        cgst: cgstTotal,
        igst: igstTotal,
        sgst: sgstTotal,
        cess: cessTotal,
        transaction_type: 'DEPOSIT',
        transaction_source: 'Challan',
        created_by: user.email
      };

      const { error: insertError } = await supabase.from('cash_ledger_transactions').insert(transactionData);

      if (insertError) {
        setError(`Failed to save challan: ${insertError.message}`);
        return;
      }

      setIsEditing(false);
      setError(null);
      toast.success(`Challan of ₹${totalChallanAmount.toFixed(2)} credited to ${selectedCompanyEmail} for FY ${financialYear}`);
    } catch (err: any) {
      setError(err.message || "Failed to save challan");
    } finally {
      setSaving(false);
    }
  };
  
  const renderRow = (label: string, code: string, rowState: ChallanRow, setRowState: React.Dispatch<React.SetStateAction<ChallanRow>>, rowTotal: number) => {
    const handleInputChange = (field: keyof ChallanRow, value: string) => {
        const numValue = Number(value);
        if (!isNaN(numValue) && numValue >= 0) {
            setRowState(prev => ({ ...prev, [field]: numValue }));
        }
    };

    return (
        <tr className="border-b">
            <td className="p-2 font-medium">{label} ({code})</td>
            {Object.keys(initialRow).map((field) => (
                <td key={field} className="p-2">
                    <Input
                        type="number"
                        value={rowState[field as keyof ChallanRow]}
                        onChange={(e) => handleInputChange(field as keyof ChallanRow, e.target.value)}
                        disabled={!isEditing}
                        className="w-full text-right"
                        placeholder="0"
                    />
                </td>
            ))}
            <td className="p-2 text-right font-medium bg-gray-100">{rowTotal.toFixed(2)}</td>
        </tr>
    );
  };

  return (
    <>
        {isAdmin && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-sm font-semibold mb-2">Select Company</h2>
              <Select onValueChange={setSelectedCompanyEmail} value={selectedCompanyEmail} disabled={!isEditing}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a company..." />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.email} value={c.email}>
                      {c.trade_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <h2 className="text-sm font-semibold mb-2">Financial Year</h2>
              <Select onValueChange={setFinancialYear} value={financialYear} disabled={!isEditing}>
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
        )}

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Note:</strong> This deposit will be added to the company's wallet and can be used for any tax period within the selected Financial Year.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border">
          <h2 className="text-xl font-semibold mb-4">Details of Deposit</h2>
          {error && <div className="mb-4 text-red-600">{error}</div>}
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="p-2 text-left border">Tax Head</th>
                  <th className="p-2 text-left border">Tax (₹)</th>
                  <th className="p-2 text-left border">Interest (₹)</th>
                  <th className="p-2 text-left border">Penalty (₹)</th>
                  <th className="p-2 text-left border">Fees (₹)</th>
                  <th className="p-2 text-left border">Other (₹)</th>
                  <th className="p-2 text-left border">Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {renderRow('CGST', '0005', cgst, setCgst, cgstTotal)}
                {renderRow('IGST', '0008', igst, setIgst, igstTotal)}
                {renderRow('CESS', '0009', cess, setCess, cessTotal)}
                {renderRow('Tamil Nadu SGST', '0006', sgst, setSgst, sgstTotal)}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end items-center space-x-4">
            <div className="font-bold text-lg">Total Challan Amount:</div>
            <div className="font-bold text-lg">₹{totalChallanAmount.toFixed(2)}</div>
          </div>
          <div className="mt-2 flex justify-end items-center space-x-4">
            <div className="font-bold">Total Challan Amount (In Words):</div>
            <div className="font-medium">{totalAmountInWords}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border mt-6">
            <h2 className="text-xl font-semibold mb-4">Payment Modes</h2>
            <div className="flex space-x-4">
                <Button variant="outline" disabled>E-Payment</Button>
                <Button variant="outline" disabled>Over The Counter</Button>
                <Button variant="outline" disabled>NEFT/RTGS</Button>
            </div>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
            <Button variant="outline" onClick={() => setIsEditing(true)} disabled={isEditing || saving}>EDIT</Button>
            <Button onClick={handleSave} disabled={!isEditing || saving}>
              {saving ? "SAVING..." : "SAVE"}
            </Button>
        </div>
    </>
  );
};

export default CreateChallanPage;
