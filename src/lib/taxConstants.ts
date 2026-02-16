import { FilingStatus, TaxBracket } from './types';

export const STANDARD_DEDUCTIONS: Record<FilingStatus, number> = {
  single: 15750,
  married_filing_jointly: 31500,
  married_filing_separately: 15750,
  head_of_household: 23625,
};

export const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  single: 'Single',
  married_filing_jointly: 'Married Filing Jointly',
  married_filing_separately: 'Married Filing Separately',
  head_of_household: 'Head of Household',
};

// 2025 federal income tax brackets (One Big Beautiful Bill Act)
export const TAX_BRACKETS: Record<FilingStatus, TaxBracket[]> = {
  single: [
    { min: 0, max: 11925, rate: 0.10 },
    { min: 11925, max: 48475, rate: 0.12 },
    { min: 48475, max: 103350, rate: 0.22 },
    { min: 103350, max: 197300, rate: 0.24 },
    { min: 197300, max: 250525, rate: 0.32 },
    { min: 250525, max: 626350, rate: 0.35 },
    { min: 626350, max: Infinity, rate: 0.37 },
  ],
  married_filing_jointly: [
    { min: 0, max: 23850, rate: 0.10 },
    { min: 23850, max: 96950, rate: 0.12 },
    { min: 96950, max: 206700, rate: 0.22 },
    { min: 206700, max: 394600, rate: 0.24 },
    { min: 394600, max: 501050, rate: 0.32 },
    { min: 501050, max: 751600, rate: 0.35 },
    { min: 751600, max: Infinity, rate: 0.37 },
  ],
  married_filing_separately: [
    { min: 0, max: 11925, rate: 0.10 },
    { min: 11925, max: 48475, rate: 0.12 },
    { min: 48475, max: 103350, rate: 0.22 },
    { min: 103350, max: 197300, rate: 0.24 },
    { min: 197300, max: 250525, rate: 0.32 },
    { min: 250525, max: 375800, rate: 0.35 },
    { min: 375800, max: Infinity, rate: 0.37 },
  ],
  head_of_household: [
    { min: 0, max: 17000, rate: 0.10 },
    { min: 17000, max: 64850, rate: 0.12 },
    { min: 64850, max: 103350, rate: 0.22 },
    { min: 103350, max: 197300, rate: 0.24 },
    { min: 197300, max: 250500, rate: 0.32 },
    { min: 250500, max: 626350, rate: 0.35 },
    { min: 626350, max: Infinity, rate: 0.37 },
  ],
};

// 2025 long-term capital gains / qualified dividends brackets
export const CAPITAL_GAINS_BRACKETS: Record<FilingStatus, TaxBracket[]> = {
  single: [
    { min: 0, max: 48350, rate: 0.00 },
    { min: 48350, max: 533400, rate: 0.15 },
    { min: 533400, max: Infinity, rate: 0.20 },
  ],
  married_filing_jointly: [
    { min: 0, max: 96700, rate: 0.00 },
    { min: 96700, max: 600050, rate: 0.15 },
    { min: 600050, max: Infinity, rate: 0.20 },
  ],
  married_filing_separately: [
    { min: 0, max: 48350, rate: 0.00 },
    { min: 48350, max: 300025, rate: 0.15 },
    { min: 300025, max: Infinity, rate: 0.20 },
  ],
  head_of_household: [
    { min: 0, max: 64750, rate: 0.00 },
    { min: 64750, max: 566700, rate: 0.15 },
    { min: 566700, max: Infinity, rate: 0.20 },
  ],
};

// Child Tax Credit
export const CHILD_TAX_CREDIT_AMOUNT = 2000;
export const OTHER_DEPENDENT_CREDIT_AMOUNT = 500;
export const CHILD_TAX_CREDIT_PHASE_OUT: Record<FilingStatus, number> = {
  single: 200000,
  married_filing_jointly: 400000,
  married_filing_separately: 200000,
  head_of_household: 200000,
};
export const CHILD_TAX_CREDIT_PHASE_OUT_RATE = 50; // $50 reduction per $1,000 over threshold

// Dependent Care Credit
export const DEPENDENT_CARE_MAX_EXPENSES_ONE = 3000;
export const DEPENDENT_CARE_MAX_EXPENSES_TWO_PLUS = 6000;
export const DEPENDENT_CARE_BASE_RATE = 0.35;
export const DEPENDENT_CARE_MIN_RATE = 0.20;
export const DEPENDENT_CARE_RATE_STEP_INCOME = 2000; // rate drops 1% per $2k over $15k AGI
export const DEPENDENT_CARE_RATE_STEP_START = 15000;

// Education Credits
export const AMERICAN_OPPORTUNITY_CREDIT_MAX = 2500;
export const LIFETIME_LEARNING_CREDIT_MAX = 2000;

// AMT
export const AMT_EXEMPTION: Record<FilingStatus, number> = {
  single: 88100,
  married_filing_jointly: 137000,
  married_filing_separately: 68500,
  head_of_household: 88100,
};
export const AMT_PHASE_OUT_START: Record<FilingStatus, number> = {
  single: 609350,
  married_filing_jointly: 1218700,
  married_filing_separately: 609350,
  head_of_household: 609350,
};
export const AMT_RATE_LOW = 0.26;
export const AMT_RATE_HIGH = 0.28;
export const AMT_RATE_THRESHOLD: Record<FilingStatus, number> = {
  single: 232600,
  married_filing_jointly: 232600,
  married_filing_separately: 116300,
  head_of_household: 232600,
};

// Itemized deduction limits
export const SALT_CAP = 10000;
export const MEDICAL_EXPENSE_AGI_FLOOR = 0.075; // 7.5% of AGI
