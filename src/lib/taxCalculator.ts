import {
  FilingStatus,
  OtherIncome,
  ItemizedDeductions,
  DeductionChoice,
  DependentInfo,
  TaxResult,
  BracketBreakdown,
  CreditsBreakdown,
  AMTResult,
} from './types';
import { calculateStateTax } from './stateTaxCalculator';
import {
  STANDARD_DEDUCTIONS,
  TAX_BRACKETS,
  CAPITAL_GAINS_BRACKETS,
  CHILD_TAX_CREDIT_AMOUNT,
  OTHER_DEPENDENT_CREDIT_AMOUNT,
  CHILD_TAX_CREDIT_PHASE_OUT,
  CHILD_TAX_CREDIT_PHASE_OUT_RATE,
  DEPENDENT_CARE_MAX_EXPENSES_ONE,
  DEPENDENT_CARE_MAX_EXPENSES_TWO_PLUS,
  DEPENDENT_CARE_BASE_RATE,
  DEPENDENT_CARE_MIN_RATE,
  DEPENDENT_CARE_RATE_STEP_INCOME,
  DEPENDENT_CARE_RATE_STEP_START,
  AMERICAN_OPPORTUNITY_CREDIT_MAX,
  LIFETIME_LEARNING_CREDIT_MAX,
  AMT_EXEMPTION,
  AMT_PHASE_OUT_START,
  AMT_RATE_LOW,
  AMT_RATE_HIGH,
  AMT_RATE_THRESHOLD,
  SALT_CAP,
  MEDICAL_EXPENSE_AGI_FLOOR,
} from './taxConstants';

const round2 = (n: number) => Math.round(n * 100) / 100;

const DEFAULT_OTHER_INCOME: OtherIncome = {
  interest: 0,
  ordinaryDividends: 0,
  qualifiedDividends: 0,
  shortTermCapGains: 0,
  longTermCapGains: 0,
};

const DEFAULT_DEPENDENTS: DependentInfo = {
  numChildrenUnder17: 0,
  numOtherDependents: 0,
  dependentCareExpenses: 0,
  educationExpenses: 0,
};

export function calculateAGI(w2Wages: number, otherIncome: OtherIncome): number {
  return w2Wages
    + otherIncome.interest
    + otherIncome.ordinaryDividends
    + otherIncome.shortTermCapGains
    + otherIncome.longTermCapGains;
}

export function calculateDeduction(
  agi: number,
  filingStatus: FilingStatus,
  deductionChoice: DeductionChoice,
  itemized?: ItemizedDeductions
): { type: DeductionChoice; amount: number; adjustedItemized?: ItemizedDeductions } {
  const standardAmount = STANDARD_DEDUCTIONS[filingStatus];

  if (deductionChoice === 'standard' || !itemized) {
    return { type: 'standard', amount: standardAmount };
  }

  // Apply limits to itemized deductions
  const saltCapped = Math.min(itemized.saltTaxes, SALT_CAP);
  const medicalFloor = agi * MEDICAL_EXPENSE_AGI_FLOOR;
  const medicalDeductible = Math.max(0, itemized.medicalExpenses - medicalFloor);

  const adjustedItemized: ItemizedDeductions = {
    mortgageInterest: itemized.mortgageInterest,
    saltTaxes: saltCapped,
    charitableContributions: itemized.charitableContributions,
    medicalExpenses: medicalDeductible,
  };

  const itemizedTotal = adjustedItemized.mortgageInterest
    + adjustedItemized.saltTaxes
    + adjustedItemized.charitableContributions
    + adjustedItemized.medicalExpenses;

  // Use whichever is larger
  if (itemizedTotal > standardAmount) {
    return { type: 'itemized', amount: itemizedTotal, adjustedItemized };
  }
  return { type: 'standard', amount: standardAmount };
}

export function calculateOrdinaryTax(
  taxableOrdinaryIncome: number,
  filingStatus: FilingStatus
): { bracketBreakdown: BracketBreakdown[]; tax: number } {
  const brackets = TAX_BRACKETS[filingStatus];
  const bracketBreakdown: BracketBreakdown[] = [];
  let remaining = taxableOrdinaryIncome;
  let tax = 0;

  for (const bracket of brackets) {
    if (remaining <= 0) break;
    const width = bracket.max - bracket.min;
    const taxableInBracket = Math.min(remaining, width);
    const taxForBracket = taxableInBracket * bracket.rate;
    bracketBreakdown.push({ rate: bracket.rate, taxableInBracket, taxForBracket });
    tax += taxForBracket;
    remaining -= taxableInBracket;
  }

  return { bracketBreakdown, tax: round2(tax) };
}

export function calculateCapitalGainsTax(
  longTermGains: number,
  qualifiedDividends: number,
  taxableIncome: number,
  filingStatus: FilingStatus
): number {
  const preferentialIncome = longTermGains + qualifiedDividends;
  if (preferentialIncome <= 0) return 0;

  // The preferential income sits "on top" of ordinary income for bracket purposes
  const ordinaryIncome = Math.max(0, taxableIncome - preferentialIncome);
  const brackets = CAPITAL_GAINS_BRACKETS[filingStatus];
  let tax = 0;
  let filled = ordinaryIncome; // ordinary income fills brackets first
  let remaining = preferentialIncome;

  for (const bracket of brackets) {
    if (remaining <= 0) break;
    const bracketTop = bracket.max;
    const spaceInBracket = Math.max(0, bracketTop - Math.max(filled, bracket.min));
    const taxableInBracket = Math.min(remaining, spaceInBracket);
    tax += taxableInBracket * bracket.rate;
    filled += taxableInBracket;
    remaining -= taxableInBracket;
  }

  return round2(tax);
}

export function calculateCredits(
  dependents: DependentInfo,
  agi: number,
  filingStatus: FilingStatus
): CreditsBreakdown {
  // Child Tax Credit with phase-out
  const totalChildren = dependents.numChildrenUnder17;
  let childCredit = totalChildren * CHILD_TAX_CREDIT_AMOUNT;
  const phaseOutThreshold = CHILD_TAX_CREDIT_PHASE_OUT[filingStatus];
  if (agi > phaseOutThreshold) {
    const excess = Math.ceil((agi - phaseOutThreshold) / 1000) * CHILD_TAX_CREDIT_PHASE_OUT_RATE;
    childCredit = Math.max(0, childCredit - excess);
  }

  // Other Dependent Credit (same phase-out applies)
  let otherCredit = dependents.numOtherDependents * OTHER_DEPENDENT_CREDIT_AMOUNT;
  if (agi > phaseOutThreshold) {
    const totalCreditBeforePhaseOut = totalChildren * CHILD_TAX_CREDIT_AMOUNT
      + dependents.numOtherDependents * OTHER_DEPENDENT_CREDIT_AMOUNT;
    const excess = Math.ceil((agi - phaseOutThreshold) / 1000) * CHILD_TAX_CREDIT_PHASE_OUT_RATE;
    const remainingAfterPhaseOut = Math.max(0, totalCreditBeforePhaseOut - excess);
    childCredit = Math.min(childCredit, remainingAfterPhaseOut);
    otherCredit = Math.max(0, remainingAfterPhaseOut - childCredit);
  }

  // Dependent Care Credit
  let dependentCareCredit = 0;
  if (dependents.dependentCareExpenses > 0 && (totalChildren + dependents.numOtherDependents) > 0) {
    const maxExpenses = (totalChildren + dependents.numOtherDependents) >= 2
      ? DEPENDENT_CARE_MAX_EXPENSES_TWO_PLUS
      : DEPENDENT_CARE_MAX_EXPENSES_ONE;
    const eligibleExpenses = Math.min(dependents.dependentCareExpenses, maxExpenses);
    const stepsOver = Math.max(0, Math.floor((agi - DEPENDENT_CARE_RATE_STEP_START) / DEPENDENT_CARE_RATE_STEP_INCOME));
    const rate = Math.max(DEPENDENT_CARE_MIN_RATE, DEPENDENT_CARE_BASE_RATE - stepsOver * 0.01);
    dependentCareCredit = round2(eligibleExpenses * rate);
  }

  // Education Credit (simplified: use the better of AOC or LLC)
  let educationCredit = 0;
  if (dependents.educationExpenses > 0) {
    const aoc = Math.min(dependents.educationExpenses, AMERICAN_OPPORTUNITY_CREDIT_MAX);
    const llc = Math.min(dependents.educationExpenses * 0.20, LIFETIME_LEARNING_CREDIT_MAX);
    educationCredit = Math.max(aoc, llc);
  }

  const totalCredits = round2(childCredit + otherCredit + dependentCareCredit + educationCredit);

  return {
    childTaxCredit: childCredit,
    otherDependentCredit: otherCredit,
    dependentCareCredit,
    educationCredit,
    totalCredits,
  };
}

export function calculateAMT(
  agi: number,
  deductionType: DeductionChoice,
  itemizedDeductions: ItemizedDeductions | undefined,
  filingStatus: FilingStatus
): AMTResult {
  // Start with AGI
  let amtIncome = agi;

  // Add back certain itemized deductions for AMT
  if (deductionType === 'itemized' && itemizedDeductions) {
    // SALT deduction is added back for AMT
    amtIncome += itemizedDeductions.saltTaxes;
  }

  // Calculate exemption with phase-out
  const baseExemption = AMT_EXEMPTION[filingStatus];
  const phaseOutStart = AMT_PHASE_OUT_START[filingStatus];
  let exemption = baseExemption;
  if (amtIncome > phaseOutStart) {
    const reduction = (amtIncome - phaseOutStart) * 0.25;
    exemption = Math.max(0, baseExemption - reduction);
  }

  const amtBase = Math.max(0, amtIncome - exemption);

  // 26% on first portion, 28% on excess
  const threshold = AMT_RATE_THRESHOLD[filingStatus];
  let amtTax = 0;
  if (amtBase <= threshold) {
    amtTax = amtBase * AMT_RATE_LOW;
  } else {
    amtTax = threshold * AMT_RATE_LOW + (amtBase - threshold) * AMT_RATE_HIGH;
  }
  amtTax = round2(amtTax);

  return {
    amtIncome,
    exemption,
    amtTax,
    triggered: false, // will be determined by orchestrator
  };
}

export function calculateTax(
  w2Wages: number,
  federalWithheld: number,
  filingStatus: FilingStatus,
  otherIncome: OtherIncome = DEFAULT_OTHER_INCOME,
  deductionChoice: DeductionChoice = 'standard',
  itemizedDeductions?: ItemizedDeductions,
  dependents: DependentInfo = DEFAULT_DEPENDENTS,
  stateData?: { stateCode: string; stateWages: number; stateWithheld: number },
): TaxResult {
  // 1. Calculate AGI
  const agi = calculateAGI(w2Wages, otherIncome);
  const otherIncomeTotal = otherIncome.interest
    + otherIncome.ordinaryDividends
    + otherIncome.shortTermCapGains
    + otherIncome.longTermCapGains;

  // 2. Calculate deductions
  const deductionResult = calculateDeduction(agi, filingStatus, deductionChoice, itemizedDeductions);
  const standardDeduction = STANDARD_DEDUCTIONS[filingStatus];

  // 3. Taxable income
  const taxableIncome = Math.max(0, agi - deductionResult.amount);

  // Preferential income (taxed at cap gains rates)
  const preferentialIncome = otherIncome.longTermCapGains + otherIncome.qualifiedDividends;
  const taxableOrdinaryIncome = Math.max(0, taxableIncome - preferentialIncome);

  // 4. Ordinary tax
  const ordinaryResult = calculateOrdinaryTax(taxableOrdinaryIncome, filingStatus);

  // 5. Capital gains tax
  const capitalGainsTax = calculateCapitalGainsTax(
    otherIncome.longTermCapGains,
    otherIncome.qualifiedDividends,
    taxableIncome,
    filingStatus
  );

  const totalTaxBeforeCredits = round2(ordinaryResult.tax + capitalGainsTax);

  // 6. Credits
  const credits = calculateCredits(dependents, agi, filingStatus);

  // Tax after credits (non-refundable credits can't go below 0)
  const taxAfterCredits = Math.max(0, totalTaxBeforeCredits - credits.totalCredits);

  // 7. AMT
  const amtResult = calculateAMT(
    agi,
    deductionResult.type,
    deductionResult.adjustedItemized,
    filingStatus
  );
  const amtTriggered = amtResult.amtTax > taxAfterCredits;
  amtResult.triggered = amtTriggered;

  // Final tax is the greater of regular tax or AMT
  const totalTax = round2(amtTriggered ? amtResult.amtTax : taxAfterCredits);

  // 8. State tax (if state data provided)
  const stateTaxResult = stateData
    ? calculateStateTax(stateData.stateCode, stateData.stateWages, stateData.stateWithheld, agi) ?? undefined
    : undefined;

  return {
    grossIncome: agi,
    w2Wages,
    otherIncomeTotals: {
      interest: otherIncome.interest,
      ordinaryDividends: otherIncome.ordinaryDividends,
      qualifiedDividends: otherIncome.qualifiedDividends,
      shortTermCapGains: otherIncome.shortTermCapGains,
      longTermCapGains: otherIncome.longTermCapGains,
      total: otherIncomeTotal,
    },
    agi,
    deductionType: deductionResult.type,
    deductionAmount: deductionResult.amount,
    standardDeduction,
    itemizedDeductionDetail: deductionResult.adjustedItemized,
    taxableIncome,
    taxableOrdinaryIncome,
    bracketBreakdown: ordinaryResult.bracketBreakdown,
    ordinaryTax: ordinaryResult.tax,
    capitalGainsTax,
    totalTaxBeforeCredits,
    credits,
    amt: amtResult,
    totalTax,
    federalWithheld,
    refundOrOwed: round2(federalWithheld - totalTax),
    stateTax: stateTaxResult,
  };
}
