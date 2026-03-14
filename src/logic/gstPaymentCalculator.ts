export interface TaxRow {
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
}

export interface PaymentRows {
  col6: TaxRow;
  col7: TaxRow;
  col8: TaxRow;
  col9: TaxRow;
  col10: TaxRow;
  col11: TaxRow;
  col12: TaxRow;
  col13: TaxRow;
  col14: TaxRow;
  col15: TaxRow;
  col16: TaxRow;
  col17: TaxRow;
  col18: TaxRow;
  col19: TaxRow;
}

export interface PaymentTaxPayload {
  user_id: string;
  gstin: string;
  filing_year: string;
  quarter: string;
  period: string;
  col_6: TaxRow;
  col_7: TaxRow;
  col_8: TaxRow;
  col_9: TaxRow;
  col_10: TaxRow;
  col_11: TaxRow;
  col_12: TaxRow;
  col_13: TaxRow;
  col_18: TaxRow;
  col_19: TaxRow;
  updated_at: string;
}

export const calculateTax = (rows: PaymentRows): PaymentRows => {
  const next = {
    ...rows,
    col12: { ...rows.col12 },
    col13: { ...rows.col13 },
    col19: { ...rows.col19 }
  };
  const types: (keyof TaxRow)[] = ["igst", "cgst", "sgst", "cess"];

  types.forEach((type) => {
    const col6 = rows.col6[type] || 0;
    const col7 = rows.col7[type] || 0;
    const col8 = rows.col8[type] || 0;
    const col9 = rows.col9[type] || 0;
    const col10 = rows.col10[type] || 0;
    const col11 = rows.col11[type] || 0; // Grey Dummy
    const col14 = rows.col14[type] || 0; // Dummy
    const col15 = rows.col15[type] || 0; // Dummy
    const col16 = rows.col16[type] || 0; // Dummy
    const col17 = rows.col17[type] || 0; // Dummy
    const col18 = rows.col18[type] || 0; // Admin Ledger

    // column 12: Other than reverse charge tax paid in cash
    // Rule: Column12 = Column7 − Column8 − Column9
    next.col12[type] = Math.max(0, col7 - col8 - col9);

    // column 13: Reverse charge tax paid in cash
    // col13 = col6 (paid fully in cash)
    next.col13[type] = col6;

    // column 19: Additional cash required
    // Rule: Column19 = Column12 − Column18
    next.col19[type] = Math.max(0, next.col12[type] - col18);
  });

  return next;
};
