import { calculateStateTax } from '../lib/stateTaxCalculator';

describe('calculateStateTax', () => {
  describe('no-tax states', () => {
    it('returns zero tax for Texas', () => {
      const result = calculateStateTax('TX', 100000, 0, 100000);
      expect(result).not.toBeNull();
      expect(result!.taxType).toBe('none');
      expect(result!.stateTax).toBe(0);
      expect(result!.stateTaxableIncome).toBe(0);
      expect(result!.stateRefundOrOwed).toBe(0);
    });

    it('refunds any withholding for no-tax states', () => {
      const result = calculateStateTax('FL', 80000, 500, 80000);
      expect(result!.taxType).toBe('none');
      expect(result!.stateTax).toBe(0);
      expect(result!.stateRefundOrOwed).toBe(500);
    });
  });

  describe('flat rate states', () => {
    it('calculates Illinois flat tax (no standard deduction)', () => {
      const result = calculateStateTax('IL', 100000, 4000, 100000);
      expect(result).not.toBeNull();
      expect(result!.taxType).toBe('flat');
      expect(result!.taxRate).toBe(0.0495);
      expect(result!.standardDeduction).toBe(0);
      expect(result!.stateTaxableIncome).toBe(100000);
      expect(result!.stateTax).toBe(4950);
      expect(result!.stateRefundOrOwed).toBe(-950); // owed
    });

    it('calculates Colorado flat tax with standard deduction', () => {
      const result = calculateStateTax('CO', 80000, 3000, 80000);
      expect(result!.taxType).toBe('flat');
      expect(result!.standardDeduction).toBe(14600);
      expect(result!.stateTaxableIncome).toBe(65400);
      // 65400 * 0.044 = 2877.60
      expect(result!.stateTax).toBe(2877.6);
      expect(result!.stateRefundOrOwed).toBe(122.4);
    });
  });

  describe('progressive bracket states', () => {
    it('calculates California progressive tax', () => {
      const result = calculateStateTax('CA', 100000, 5000, 100000);
      expect(result).not.toBeNull();
      expect(result!.taxType).toBe('progressive');
      expect(result!.standardDeduction).toBe(5540);
      expect(result!.stateTaxableIncome).toBe(94460);
      expect(result!.bracketBreakdown).toBeDefined();
      expect(result!.bracketBreakdown!.length).toBeGreaterThan(0);
      // Verify total tax is sum of bracket taxes
      const sumOfBrackets = result!.bracketBreakdown!.reduce((sum, b) => sum + b.taxForBracket, 0);
      expect(Math.abs(result!.stateTax - sumOfBrackets)).toBeLessThan(0.02);
      expect(result!.stateTax).toBeGreaterThan(0);
    });

    it('calculates New York progressive tax', () => {
      const result = calculateStateTax('NY', 75000, 3000, 75000);
      expect(result).not.toBeNull();
      expect(result!.taxType).toBe('progressive');
      expect(result!.standardDeduction).toBe(8000);
      expect(result!.stateTaxableIncome).toBe(67000);
      expect(result!.bracketBreakdown!.length).toBeGreaterThan(0);
      expect(result!.stateTax).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('returns null for invalid state code', () => {
      const result = calculateStateTax('XX', 50000, 0, 50000);
      expect(result).toBeNull();
    });

    it('handles zero income', () => {
      const result = calculateStateTax('CA', 0, 0, 0);
      expect(result).not.toBeNull();
      expect(result!.stateTax).toBe(0);
      expect(result!.stateTaxableIncome).toBe(0);
    });

    it('handles income below standard deduction', () => {
      const result = calculateStateTax('CA', 3000, 0, 3000);
      expect(result!.stateTaxableIncome).toBe(0);
      expect(result!.stateTax).toBe(0);
    });

    it('is case-insensitive for state code', () => {
      const result = calculateStateTax('ca', 100000, 0, 100000);
      expect(result).not.toBeNull();
      expect(result!.stateCode).toBe('CA');
    });
  });
});
