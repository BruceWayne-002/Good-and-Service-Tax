import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fy = searchParams.get('fy') || '';
  const p = searchParams.get('p') || '';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg border p-10 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-20 h-20 text-green-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Payment Successful
        </h1>
        
        <p className="text-gray-600 mb-8">
          Your GSTR-3B tax payment for <strong>{p} {fy}</strong> has been successfully processed and the ledger has been updated.
        </p>
        
        <div className="space-y-3">
          <Button 
            className="w-full bg-[#1C244B] text-white hover:bg-[#151b3a]"
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard
          </Button>
          
          <Button 
            variant="outline"
            className="w-full"
            onClick={() => navigate('/returns')}
          >
            Go to Return Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
