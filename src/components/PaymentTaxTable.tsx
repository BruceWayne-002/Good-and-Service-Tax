import React from 'react';
import { Input } from '@/components/ui/input';
import { PaymentRows, TaxRow } from '@/logic/gstPaymentCalculator';

interface PaymentTaxTableProps {
  rows: PaymentRows;
  setRows: React.Dispatch<React.SetStateAction<PaymentRows>>;
}

const PaymentTaxTable: React.FC<PaymentTaxTableProps> = ({ rows, setRows }) => {
  const taxTypes: (keyof TaxRow)[] = ['igst', 'cgst', 'sgst', 'cess'];
  const editableCols = [6, 7, 8, 9, 10]; // 11, 14, 15, 16, 17 are Grey Dummy

  const updateValue = (col: keyof PaymentRows, type: keyof TaxRow, value: number) => {
    setRows(prev => ({
      ...prev,
      [col]: {
        ...prev[col],
        [type]: value
      }
    }));
  };

  const renderInput = (col: keyof PaymentRows, type: keyof TaxRow) => {
    const colNum = parseInt(col.replace('col', ''));
    const isEditable = editableCols.includes(colNum);
    const value = rows[col][type];
    
    // Column 19 is special (Bold Blue)
    const isCol19 = colNum === 19;
    const isCol18 = colNum === 18;
    const isAutoCalculated = [12, 13, 19].includes(colNum);
    const isDummy = [11, 14, 15, 16, 17].includes(colNum);

    return (
      <Input
        type="number"
        value={value === 0 ? '' : value}
        placeholder="0"
        disabled={!isEditable}
        onChange={(e) => updateValue(col, type, Number(e.target.value))}
        className={`
          ${isEditable ? 'bg-white' : 'bg-gray-100'} 
          ${isCol19 ? 'font-bold text-blue-700' : ''} 
          text-right min-w-[130px]
        `}
      />
    );
  };

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-[2200px] w-full border-collapse text-xs">
        <thead className="bg-[#eef1f5] text-gray-700">
          <tr>
            <th className="border p-2 text-left w-[150px] sticky left-0 bg-[#eef1f5] z-10">Description</th>
            <th className="border p-2 w-[140px]">Reverse charge liability (6)</th>
            <th className="border p-2 w-[140px]">Other than reverse charge (7)</th>
            <th className="border p-2 w-[140px]">ITC – IGST (8)</th>
            <th className="border p-2 w-[140px]">ITC – CGST (9)</th>
            <th className="border p-2 w-[140px]">ITC – SGST (10)</th>
            <th className="border p-2 w-[140px]">ITC – CESS (11)</th>
            <th className="border p-2 w-[160px]">Other than RC Tax paid in Cash (12)</th>
            <th className="border p-2 w-[160px]">RC Tax paid in Cash (13)</th>
            <th className="border p-2 w-[140px]">Interest payable (14)</th>
            <th className="border p-2 w-[160px]">Interest paid in cash (15)</th>
            <th className="border p-2 w-[140px]">Late Fee Payable (16)</th>
            <th className="border p-2 w-[160px]">Late Fee paid in cash (17)</th>
            <th className="border p-2 w-[160px]">Utilizable cash balance (18)</th>
            <th className="border p-2 w-[160px]">Additional cash required (19)</th>
          </tr>
        </thead>
        <tbody>
          {taxTypes.map((type) => (
            <tr key={type} className="hover:bg-gray-50">
              <td className="p-2 border font-medium capitalize sticky left-0 bg-white z-10">{type.toUpperCase()}</td>
              <td className="border p-1">{renderInput('col6', type)}</td>
              <td className="border p-1">{renderInput('col7', type)}</td>
              <td className="border p-1">{renderInput('col8', type)}</td>
              <td className="border p-1">{renderInput('col9', type)}</td>
              <td className="border p-1">{renderInput('col10', type)}</td>
              <td className="border p-1">{renderInput('col11', type)}</td>
              <td className="border p-1">{renderInput('col12', type)}</td>
              <td className="border p-1">{renderInput('col13', type)}</td>
              <td className="border p-1">{renderInput('col14', type)}</td>
              <td className="border p-1">{renderInput('col15', type)}</td>
              <td className="border p-1">{renderInput('col16', type)}</td>
              <td className="border p-1">{renderInput('col17', type)}</td>
              <td className="border p-1">{renderInput('col18', type)}</td>
              <td className="border p-1">{renderInput('col19', type)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(PaymentTaxTable);
