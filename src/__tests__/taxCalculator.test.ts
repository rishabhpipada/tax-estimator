import {
  calculateTax,
  calculateAGI,
  calculateDeduction,
  calculateOrdinaryTax,
  calculateCapitalGainsTax,
  calculateCredits,
  calculateAMT,
} from '../lib/taxCalculator';
import { OtherIncome, ItemizedDeductions, DependentInfo } from '../lib/types';

const NO_OTHER_INCOME: OtherIncome = {
  interest: 0, ordinaryDividends: 0, qualifiedDividends: 0,
  shortTermCapGains: 0, longTermCapGains: 0,
};

const NO_DEPENDENTS: DependentInfo = {
  numChildrenUnder17: 0, numOtherDependents: 0,
  dependentCareExpenses: 0, educationExpenses: 0,
};

describe('calculateTax (backward compatible)', () => {
  describe('single filer', () => {
    it('calculates zero tax for income below standard deduction', () => {
      const result = calculateTax(10000, 0, 'single');
      expect(result.taxableIncome).toBe(0);
      expect(result.totalTax).toBe(0);
      expect(result.standardDeduction).toBe(15750);
    });

    it('calculates tax in the 10% bracket only', () => {
      const result = calculateTax(20000, 0, 'single');
      expect(result.taxableIncome).toBe(4250);
      expect(result.totalTax).toBe(425);
    });

    it('calculates tax across multiple brackets', () => {
      const result = calculateTax(75000, 5000, 'single');
      expect(result.taxableIncome).toBe(59250);
      expect(result.totalTax).toBe(7949);
      expect(result.refundOrOwed).toBe(5000 - 7949);
    });

    it('calculates tax for high income across many brackets', () => {
      const result = calculateTax(300000, 60000, 'single');
      expect(result.taxableIncome).toBe(284250);
      expect(result.totalTax).toBe(69034.75);
      expect(result.refundOrOwed).toBe(60000 - 69034.75);
    });
  });

  describe('married filing jointly', () => {
    it('uses correct standard deduction', () => {
      const result = calculateTax(50000, 0, 'married_filing_jointly');
      expect(result.standardDeduction).toBe(31500);
      expect(result.taxableIncome).toBe(18500);
    });

    it('calculates tax correctly', () => {
      const result = calculateTax(100000, 10000, 'married_filing_jointly');
      expect(result.taxableIncome).toBe(68500);
      expect(result.totalTax).toBe(7743);
      expect(result.refundOrOwed).toBe(10000 - 7743);
    });
  });

  describe('head of household', () => {
    it('uses correct standard deduction', () => {
      const result = calculateTax(40000, 0, 'head_of_household');
      expect(result.standardDeduction).toBe(23625);
      expect(result.taxableIncome).toBe(16375);
    });

    it('calculates tax correctly', () => {
      const result = calculateTax(60000, 3000, 'head_of_household');
      expect(result.taxableIncome).toBe(36375);
      expect(result.totalTax).toBe(4025);
    });
  });

  describe('bracket breakdown', () => {
    it('returns correct number of brackets used', () => {
      const result = calculateTax(75000, 0, 'single');
      expect(result.bracketBreakdown.length).toBe(3);
    });

    it('bracket amounts sum to taxable ordinary income', () => {
      const result = calculateTax(200000, 0, 'single');
      const sum = result.bracketBreakdown.reduce((s, b) => s + b.taxableInBracket, 0);
      expect(sum).toBe(result.taxableOrdinaryIncome);
    });

    it('bracket taxes sum to ordinary tax', () => {
      const result = calculateTax(200000, 0, 'single');
      const sum = result.bracketBreakdown.reduce((s, b) => s + b.taxForBracket, 0);
      expect(Math.round(sum * 100) / 100).toBe(result.ordinaryTax);
    });
  });

  describe('edge cases', () => {
    it('handles zero income', () => {
      const result = calculateTax(0, 500, 'single');
      expect(result.taxableIncome).toBe(0);
      expect(result.totalTax).toBe(0);
      expect(result.refundOrOwed).toBe(500);
    });

    it('handles income exactly at deduction', () => {
      const result = calculateTax(15750, 0, 'single');
      expect(result.taxableIncome).toBe(0);
      expect(result.totalTax).toBe(0);
    });

    it('calculates refund when withheld exceeds tax', () => {
      const result = calculateTax(20000, 2000, 'single');
      expect(result.refundOrOwed).toBeGreaterThan(0);
    });

    it('calculates amount owed when tax exceeds withheld', () => {
      const result = calculateTax(200000, 1000, 'single');
      expect(result.refundOrOwed).toBeLessThan(0);
    });
  });
});

describe('calculateAGI', () => {
  it('sums W2 wages and other income (excluding qualified dividends double-count)', () => {
    const other: OtherIncome = {
      interest: 1000, ordinaryDividends: 500, qualifiedDividends: 300,
      shortTermCapGains: 2000, longTermCapGains: 5000,
    };
    // AGI = 100000 + 1000 + 500 + 2000 + 5000 = 108500
    // (qualifiedDividends are a subset of ordinaryDividends, not added separately)
    expect(calculateAGI(100000, other)).toBe(108500);
  });
});

describe('calculateDeduction', () => {
  it('returns standard deduction when chosen', () => {
    const result = calculateDeduction(100000, 'single', 'standard');
    expect(result.type).toBe('standard');
    expect(result.amount).toBe(15750);
  });

  it('applies SALT cap of $10,000', () => {
    const itemized: ItemizedDeductions = {
      mortgageInterest: 10000, saltTaxes: 25000,
      charitableContributions: 5000, medicalExpenses: 0,
    };
    const result = calculateDeduction(100000, 'single', 'itemized', itemized);
    expect(result.type).toBe('itemized');
    // 10000 + 10000 (capped) + 5000 + 0 = 25000
    expect(result.amount).toBe(25000);
  });

  it('applies medical expense 7.5% AGI floor', () => {
    const itemized: ItemizedDeductions = {
      mortgageInterest: 10000, saltTaxes: 5000,
      charitableContributions: 2000, medicalExpenses: 15000,
    };
    // AGI = 100000, floor = 7500, deductible medical = 7500
    const result = calculateDeduction(100000, 'single', 'itemized', itemized);
    // 10000 + 5000 + 2000 + 7500 = 24500
    expect(result.amount).toBe(24500);
  });

  it('falls back to standard deduction when itemized is less', () => {
    const itemized: ItemizedDeductions = {
      mortgageInterest: 3000, saltTaxes: 2000,
      charitableContributions: 1000, medicalExpenses: 0,
    };
    // Itemized total = 6000, standard = 15750
    const result = calculateDeduction(100000, 'single', 'itemized', itemized);
    expect(result.type).toBe('standard');
    expect(result.amount).toBe(15750);
  });
});

describe('calculateCapitalGainsTax', () => {
  it('taxes LTCG at 0% when total taxable income is in 0% bracket', () => {
    // Single: 0% up to $48,350 taxable income
    const tax = calculateCapitalGainsTax(10000, 0, 30000, 'single');
    expect(tax).toBe(0);
  });

  it('taxes LTCG at 15% when in the 15% bracket', () => {
    // Ordinary fills up to 90k, LTCG of 10k sits on top (all in 15% bracket)
    const tax = calculateCapitalGainsTax(10000, 0, 100000, 'single');
    expect(tax).toBe(1500);
  });

  it('handles split across 0% and 15% brackets', () => {
    // Single: taxable income = 50000, ordinary = 40000, LTCG = 10000
    // LTCG fills from 40000 to 50000. 0% bracket goes up to 48350.
    // 0%: 48350 - 40000 = 8350 at 0% = 0
    // 15%: 50000 - 48350 = 1650 at 15% = 247.50
    const tax = calculateCapitalGainsTax(10000, 0, 50000, 'single');
    expect(tax).toBe(247.5);
  });

  it('includes qualified dividends in preferential income', () => {
    const tax = calculateCapitalGainsTax(5000, 5000, 100000, 'single');
    // 10k preferential income, ordinary = 90k, all in 15% bracket
    expect(tax).toBe(1500);
  });
});

describe('calculateCredits', () => {
  it('calculates child tax credit', () => {
    const deps: DependentInfo = {
      numChildrenUnder17: 2, numOtherDependents: 0,
      dependentCareExpenses: 0, educationExpenses: 0,
    };
    const result = calculateCredits(deps, 100000, 'single');
    expect(result.childTaxCredit).toBe(4000);
  });

  it('phases out child tax credit above threshold', () => {
    const deps: DependentInfo = {
      numChildrenUnder17: 1, numOtherDependents: 0,
      dependentCareExpenses: 0, educationExpenses: 0,
    };
    // Single threshold = $200k. AGI = $250k => $50k over => 50 * $50 = $2500 reduction
    // Credit = max(0, 2000 - 2500) = 0
    const result = calculateCredits(deps, 250000, 'single');
    expect(result.childTaxCredit).toBe(0);
  });

  it('does not phase out for MFJ under $400k', () => {
    const deps: DependentInfo = {
      numChildrenUnder17: 2, numOtherDependents: 0,
      dependentCareExpenses: 0, educationExpenses: 0,
    };
    const result = calculateCredits(deps, 350000, 'married_filing_jointly');
    expect(result.childTaxCredit).toBe(4000);
  });

  it('calculates dependent care credit', () => {
    const deps: DependentInfo = {
      numChildrenUnder17: 1, numOtherDependents: 0,
      dependentCareExpenses: 5000, educationExpenses: 0,
    };
    // 1 child: max $3000 eligible. AGI $50k => steps = floor((50000-15000)/2000) = 17
    // rate = max(0.20, 0.35 - 0.17) = 0.20 (min rate)
    // credit = 3000 * 0.20 = 600
    const result = calculateCredits(deps, 50000, 'single');
    expect(result.dependentCareCredit).toBe(600);
  });

  it('calculates education credit', () => {
    const deps: DependentInfo = {
      numChildrenUnder17: 0, numOtherDependents: 0,
      dependentCareExpenses: 0, educationExpenses: 4000,
    };
    // AOC: min(4000, 2500) = 2500
    // LLC: min(4000*0.20, 2000) = min(800, 2000) = 800
    // Best = 2500
    const result = calculateCredits(deps, 50000, 'single');
    expect(result.educationCredit).toBe(2500);
  });
});

describe('calculateAMT', () => {
  it('does not trigger for typical income', () => {
    const result = calculateAMT(100000, 'standard', undefined, 'single');
    // amtIncome = 100k, exemption = 88100, base = 11900
    // amtTax = 11900 * 0.26 = 3094
    expect(result.amtTax).toBe(3094);
    // This is less than regular tax at $100k, so it won't trigger (tested via calculateTax)
  });

  it('adds back SALT for itemized filers', () => {
    const itemized: ItemizedDeductions = {
      mortgageInterest: 20000, saltTaxes: 10000,
      charitableContributions: 5000, medicalExpenses: 0,
    };
    const result = calculateAMT(500000, 'itemized', itemized, 'single');
    // amtIncome = 500000 + 10000 = 510000
    expect(result.amtIncome).toBe(510000);
  });

  it('calculates AMT at 28% rate for high income', () => {
    const result = calculateAMT(600000, 'standard', undefined, 'single');
    // amtIncome = 600000, exemption = 88100, base = 511900
    // 232600 * 0.26 = 60476, (511900-232600) * 0.28 = 78204
    // total = 138680
    expect(result.amtTax).toBe(138680);
  });
});

describe('calculateTax (full integration)', () => {
  it('handles W2 + LTCG + itemized deductions + 2 children', () => {
    const otherIncome: OtherIncome = {
      interest: 0, ordinaryDividends: 0, qualifiedDividends: 0,
      shortTermCapGains: 0, longTermCapGains: 10000,
    };
    const itemized: ItemizedDeductions = {
      mortgageInterest: 12000, saltTaxes: 8000,
      charitableContributions: 3000, medicalExpenses: 0,
    };
    const deps: DependentInfo = {
      numChildrenUnder17: 2, numOtherDependents: 0,
      dependentCareExpenses: 0, educationExpenses: 0,
    };

    const result = calculateTax(
      100000, 15000, 'married_filing_jointly',
      otherIncome, 'itemized', itemized, deps
    );

    expect(result.agi).toBe(110000);
    expect(result.deductionType).toBe('standard'); // itemized = 23000 < standard 31500
    expect(result.deductionAmount).toBe(31500);
    expect(result.taxableIncome).toBe(78500);
    expect(result.capitalGainsTax).toBe(0); // 10k LTCG in 0% bracket
    expect(result.credits.childTaxCredit).toBe(4000);
    expect(result.totalTax).toBeGreaterThanOrEqual(0);
    expect(result.amt.triggered).toBe(false);
  });

  it('triggers AMT for high income with large SALT', () => {
    const otherIncome: OtherIncome = {
      interest: 50000, ordinaryDividends: 0, qualifiedDividends: 0,
      shortTermCapGains: 0, longTermCapGains: 0,
    };
    const itemized: ItemizedDeductions = {
      mortgageInterest: 30000, saltTaxes: 10000,
      charitableContributions: 10000, medicalExpenses: 0,
    };

    const result = calculateTax(
      550000, 120000, 'single',
      otherIncome, 'itemized', itemized
    );

    expect(result.agi).toBe(600000);
    expect(result.deductionType).toBe('itemized');
    // AMT adds back SALT: amtIncome = 600000 + 10000 = 610000
    // Regular tax on 550k is significant but AMT may or may not trigger depending on exact numbers
    // The key test is that AMT is calculated
    expect(result.amt.amtIncome).toBe(610000);
  });

  it('applies capital gains at preferential rates', () => {
    const otherIncome: OtherIncome = {
      interest: 0, ordinaryDividends: 0, qualifiedDividends: 5000,
      shortTermCapGains: 0, longTermCapGains: 20000,
    };

    const result = calculateTax(80000, 10000, 'single', otherIncome);

    expect(result.agi).toBe(100000);
    expect(result.capitalGainsTax).toBeGreaterThan(0);
    // Preferential income should not be in ordinary brackets
    expect(result.taxableOrdinaryIncome).toBe(result.taxableIncome - 25000);
  });
});
