export type FilingStatus = 'single' | 'married_filing_jointly' | 'married_filing_separately' | 'head_of_household';

export interface W2Data {
  employerName: string;
  employerEIN: string;
  wages: number;          // Box 1
  federalWithheld: number; // Box 2
  socialSecurityWages: number; // Box 3
  socialSecurityWithheld: number; // Box 4
  medicareWages: number;  // Box 5
  medicareWithheld: number; // Box 6
  stateName: string;      // Box 15
  stateWages: number;     // Box 16
  stateWithheld: number;  // Box 17
}

export interface OtherIncome {
  interest: number;
  ordinaryDividends: number;
  qualifiedDividends: number;
  shortTermCapGains: number;
  longTermCapGains: number;
}

export interface ItemizedDeductions {
  mortgageInterest: number;
  saltTaxes: number;
  charitableContributions: number;
  medicalExpenses: number;
}

export type DeductionChoice = 'standard' | 'itemized';

export interface DependentInfo {
  numChildrenUnder17: number;
  numOtherDependents: number;
  dependentCareExpenses: number;
  educationExpenses: number;
}

export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

export interface BracketBreakdown {
  rate: number;
  taxableInBracket: number;
  taxForBracket: number;
}

export interface CreditsBreakdown {
  childTaxCredit: number;
  otherDependentCredit: number;
  dependentCareCredit: number;
  educationCredit: number;
  totalCredits: number;
}

export interface AMTResult {
  amtIncome: number;
  exemption: number;
  amtTax: number;
  triggered: boolean;
}

export type Form1099Type = '1099-INT' | '1099-DIV' | '1099-B';

export interface Form1099Data {
  formType: Form1099Type;
  interest?: number;           // 1099-INT Box 1
  ordinaryDividends?: number;  // 1099-DIV Box 1a
  qualifiedDividends?: number; // 1099-DIV Box 1b
  shortTermCapGains?: number;  // 1099-B short-term
  longTermCapGains?: number;   // 1099-B long-term
}

export interface Uploaded1099 {
  id: string;
  fileName: string;
  formType: Form1099Type;
  data: Form1099Data;
  rawText: string;
}

export interface StateTaxBracketBreakdown {
  rate: number;
  taxableInBracket: number;
  taxForBracket: number;
}

export interface StateTaxResult {
  stateCode: string;
  stateName: string;
  taxType: 'none' | 'flat' | 'progressive';
  stateWages: number;
  stateAGI: number;
  standardDeduction: number;
  stateTaxableIncome: number;
  taxRate?: number; // for flat-rate states
  bracketBreakdown?: StateTaxBracketBreakdown[]; // for progressive states
  stateTax: number;
  stateWithheld: number;
  stateRefundOrOwed: number; // positive = refund, negative = owed
}

export interface TaxResult {
  // Income
  grossIncome: number;
  w2Wages: number;
  otherIncomeTotals: {
    interest: number;
    ordinaryDividends: number;
    qualifiedDividends: number;
    shortTermCapGains: number;
    longTermCapGains: number;
    total: number;
  };
  agi: number;

  // Deductions
  deductionType: DeductionChoice;
  deductionAmount: number;
  standardDeduction: number;
  itemizedDeductionDetail?: ItemizedDeductions;

  // Taxable income
  taxableIncome: number;
  taxableOrdinaryIncome: number;

  // Tax calculations
  bracketBreakdown: BracketBreakdown[];
  ordinaryTax: number;
  capitalGainsTax: number;
  totalTaxBeforeCredits: number;

  // Credits
  credits: CreditsBreakdown;

  // AMT
  amt: AMTResult;

  // Final
  totalTax: number;
  federalWithheld: number;
  refundOrOwed: number; // positive = refund, negative = owed

  // State tax
  stateTax?: StateTaxResult;
}
