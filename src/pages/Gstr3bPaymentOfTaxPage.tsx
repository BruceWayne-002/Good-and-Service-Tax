import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { loadUserData } from '@/lib/userStorage';
import PaymentTaxTable from '@/components/PaymentTaxTable';
import { calculateTax, PaymentRows, TaxRow, PaymentTaxPayload } from '@/logic/gstPaymentCalculator';

const emptyTax: TaxRow = { igst: 0, cgst: 0, sgst: 0, cess: 0 };

const initialState: PaymentRows = {
  col6: { ...emptyTax },
  col7: { ...emptyTax },
  col8: { ...emptyTax },
  col9: { ...emptyTax },
  col10: { ...emptyTax },
  col11: { ...emptyTax },
  col12: { ...emptyTax },
  col13: { ...emptyTax },
  col14: { ...emptyTax },
  col15: { ...emptyTax },
  col16: { ...emptyTax },
  col17: { ...emptyTax },
  col18: { ...emptyTax },
  col19: { ...emptyTax }
};

const Gstr3bPaymentOfTaxPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fy = searchParams.get('fy') || '';
  const q = searchParams.get('q') || '';
  const p = searchParams.get('p') || '';

  const [loading, setLoading] = useState(true);
  const [gstin, setGstin] = useState('');
  const [rows, setRows] = useState<PaymentRows>(initialState);

  // 8️⃣ Auto Calculation Trigger using useMemo for performance
  const displayRows = useMemo(() => calculateTax(rows), [rows]);

  const isPaymentReady = useMemo(() => 
    Object.values(displayRows.col19).every(v => v === 0),
    [displayRows.col19]
  );

  // Load Data
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !fy || !p) {
        setLoading(false);
        return;
      }

      try {
        const [profileData, s31Result, ledgerResult, savedResult] = await Promise.all([
          loadUserData<{ gstin?: string }>('profile:gstin'),
          supabase
            .from('gstr3b_section_3_1')
            .select('row_code, igst, cgst, sgst, cess')
            .eq('user_id', user.id)
            .eq('filing_year', fy)
            .eq('period', p)
            .in('row_code', ['a', 'd']),
          supabase
            .from('cash_ledger_balance')
            .select('igst, cgst, sgst, cess')
            .eq('company_email', user.email)
            .eq('financial_year', fy)
            .single(),
          supabase
            .from('gstr3b_payment_tax')
            .select('*')
            .eq('user_id', user.id)
            .eq('filing_year', fy)
            .eq('period', p)
            .single()
        ]);

        setGstin(profileData?.gstin || '');

        const s31Data = s31Result.data;
        const ledger = ledgerResult.data;
        const saved = savedResult.data;

        const outward = s31Data?.find(r => r.row_code === 'a') || emptyTax;
        const reverse = s31Data?.find(r => r.row_code === 'd') || emptyTax;

        setRows(prev => ({
          ...prev,
          col6: { igst: reverse.igst, cgst: reverse.cgst, sgst: reverse.sgst, cess: reverse.cess },
          col7: { igst: outward.igst, cgst: outward.cgst, sgst: outward.sgst, cess: outward.cess },
          col18: { igst: ledger?.igst || 0, cgst: ledger?.cgst || 0, sgst: ledger?.sgst || 0, cess: ledger?.cess || 0 },
          ...(saved && {
            col8: saved.col_8 || emptyTax,
            col9: saved.col_9 || emptyTax,
            col10: saved.col_10 || emptyTax,
            col11: saved.col_11 || emptyTax,
            col14: saved.col_14 || emptyTax,
            col16: saved.col_16 || emptyTax,
          })
        }));
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, fy, p]);

  // 9️⃣ Save Button Behaviour
  const handleSave = async () => {
    if (!user) return;

    // Use a typed payload to ensure only valid columns are sent to Supabase
    // This prevents 400 errors from extra "dummy" columns like col14, col15, etc.
    const payload: PaymentTaxPayload = {
      user_id: user.id,
      gstin: gstin,
      filing_year: fy,
      quarter: q,
      period: p,

      col_6: displayRows.col6,
      col_7: displayRows.col7,
      col_8: displayRows.col8,
      col_9: displayRows.col9,
      col_10: displayRows.col10,
      col_11: displayRows.col11,
      col_12: displayRows.col12,
      col_13: displayRows.col13,
      col_18: displayRows.col18,
      col_19: displayRows.col19,

      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from("gstr3b_payment_tax")
      .upsert(payload, {
        onConflict: "user_id,filing_year,quarter,period"
      });

    if (error) {
      console.error(error);
      toast.error("Failed to save data");
      return false;
    } else {
      toast.success("Saved successfully");
      return true;
    }
  };

  // 🔟 Proceed to Payment Logic
  const handleProceedToFile = async () => {
    // Step 1: Save payment data
    const saved = await handleSave();
    if (!saved) return;

    // Step 2: Check if additional cash required > 0
    if (!isPaymentReady) {
      toast.error('Insufficient cash balance. Please deposit funds.');
      return;
    }

    // Step 3: If sufficient balance exists, insert ledger utilization transaction
    try {
      const transactionPayload = {
        company_email: user.email,
        financial_year: fy,
        tax_period: p,

        igst: -(displayRows.col12.igst + displayRows.col13.igst),
        cgst: -(displayRows.col12.cgst + displayRows.col13.cgst),
        sgst: -(displayRows.col12.sgst + displayRows.col13.sgst),
        cess: -(displayRows.col12.cess + displayRows.col13.cess),

        transaction_type: 'UTILIZATION',
        transaction_source: 'GSTR3B_PAYMENT',

        reference_id: `${user.id}-${fy}-${p}`,

        created_by: user.email,
        created_at: new Date().toISOString()
      };

      const { error: txError } = await supabase
        .from('cash_ledger_transactions')
        .insert(transactionPayload);

      if (txError) throw txError;

      toast.success('Payment successful. Ledger utilized.');
      
      // Reset state and navigate to success page
      setRows(initialState);
      navigate(`/payment-success?fy=${fy}&p=${p}`);
    } catch (err) {
      console.error('Error during payment utilization:', err);
      toast.error('Failed to process payment utilization.');
    }
  };

  const handleBack = () => {
    // 12. Navigation Rules: Back Button
    navigate(`/returns/gstr3b/prepare-online?fy=${fy}&q=${q}&p=${p}`);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-[1800px] mx-auto">
        <h1 className="text-xl font-semibold mb-4">6.1 Payment of Tax</h1>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="bg-white rounded-lg shadow border p-4">
            <PaymentTaxTable rows={displayRows} setRows={setRows} />
          </div>
        )}

        <div className="flex justify-between mt-6 border-t pt-4">
          <Button variant="outline" onClick={handleBack}>BACK</Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSave}>SAVE</Button>
            <Button 
              className="bg-[#1C244B] text-white hover:bg-[#151b3a]" 
              onClick={handleProceedToFile}
              disabled={!isPaymentReady}
            >
              PROCEED TO FILE / PAYMENT
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gstr3bPaymentOfTaxPage;
