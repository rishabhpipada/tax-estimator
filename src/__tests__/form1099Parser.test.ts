import { detectFormType, parse1099Text } from '../lib/form1099Parser';

describe('detectFormType', () => {
  it('detects 1099-INT', () => {
    expect(detectFormType('Form 1099-INT  Interest Income')).toBe('1099-INT');
  });

  it('detects 1099-INT from content keywords', () => {
    expect(detectFormType('INTEREST INCOME\nBox 1 $250.00')).toBe('1099-INT');
  });

  it('detects 1099-DIV', () => {
    expect(detectFormType('Form 1099-DIV  Dividends and Distributions')).toBe('1099-DIV');
  });

  it('detects 1099-B', () => {
    expect(detectFormType('Form 1099-B  Proceeds From Broker')).toBe('1099-B');
  });

  it('returns null for unrecognized text', () => {
    expect(detectFormType('Random unrelated document text')).toBeNull();
  });

  it('detects consolidated when interest and dividends are present', () => {
    expect(detectFormType('INTEREST INCOME\nOrdinary Dividends $500.00')).toBe('1099-CONSOLIDATED');
  });

  it('detects consolidated when all three types are present', () => {
    const text = 'Form 1099-INT\nForm 1099-DIV\nShort-term capital gain $100.00';
    expect(detectFormType(text)).toBe('1099-CONSOLIDATED');
  });

  it('still detects single type when only one section matches', () => {
    expect(detectFormType('Form 1099-DIV Dividends and Distributions')).toBe('1099-DIV');
  });
});

describe('parse1099Text', () => {
  describe('1099-INT', () => {
    it('extracts interest income from Box 1', () => {
      const text = `Form 1099-INT
Interest Income
Box 1 Interest Income $1,234.56
Box 2 Early withdrawal penalty $0.00`;
      const result = parse1099Text(text);
      expect(result).not.toBeNull();
      expect(result!.formType).toBe('1099-INT');
      expect(result!.interest).toBe(1234.56);
    });

    it('handles interest on next line', () => {
      const text = `1099-INT
Interest Income
Box 1
$567.89`;
      const result = parse1099Text(text);
      expect(result!.formType).toBe('1099-INT');
      expect(result!.interest).toBe(567.89);
    });
  });

  describe('1099-DIV', () => {
    it('extracts ordinary and qualified dividends', () => {
      const text = `Form 1099-DIV
Dividends and Distributions
1a Total ordinary dividends $3,456.78
1b Qualified dividends $2,100.00
2a Total capital gain distr $500.00`;
      const result = parse1099Text(text);
      expect(result).not.toBeNull();
      expect(result!.formType).toBe('1099-DIV');
      expect(result!.ordinaryDividends).toBe(3456.78);
      expect(result!.qualifiedDividends).toBe(2100.00);
    });

    it('handles Box 1a / Box 1b labels', () => {
      const text = `1099-DIV
Box 1a $800.50
Box 1b $600.25`;
      const result = parse1099Text(text);
      expect(result!.formType).toBe('1099-DIV');
      expect(result!.ordinaryDividends).toBe(800.50);
      expect(result!.qualifiedDividends).toBe(600.25);
    });
  });

  describe('1099-B', () => {
    it('extracts short-term and long-term capital gains', () => {
      const text = `Form 1099-B
Proceeds From Broker
Short-term capital gain total $5,000.00
Long-term capital gain total $12,500.75`;
      const result = parse1099Text(text);
      expect(result).not.toBeNull();
      expect(result!.formType).toBe('1099-B');
      expect(result!.shortTermCapGains).toBe(5000.00);
      expect(result!.longTermCapGains).toBe(12500.75);
    });

    it('handles short-term / long-term on separate lines', () => {
      const text = `1099-B
Short-term proceeds
$2,345.67
Long-term proceeds
$8,910.11`;
      const result = parse1099Text(text);
      expect(result!.formType).toBe('1099-B');
      expect(result!.shortTermCapGains).toBe(2345.67);
      expect(result!.longTermCapGains).toBe(8910.11);
    });
  });

  describe('1099-CONSOLIDATED', () => {
    it('extracts interest, dividends, and capital gains from consolidated form', () => {
      const text = `Consolidated 1099
INTEREST INCOME
Box 1 Interest Income $1,200.00
Ordinary Dividends $3,400.00
Qualified Dividends $1,500.00
Short-term capital gain total $2,000.00
Long-term capital gain total $7,500.00`;
      const result = parse1099Text(text);
      expect(result).not.toBeNull();
      expect(result!.formType).toBe('1099-CONSOLIDATED');
      expect(result!.interest).toBe(1200.00);
      expect(result!.ordinaryDividends).toBe(3400.00);
      expect(result!.qualifiedDividends).toBe(1500.00);
      expect(result!.shortTermCapGains).toBe(2000.00);
      expect(result!.longTermCapGains).toBe(7500.00);
    });

    it('extracts only present sections in consolidated form', () => {
      const text = `Consolidated 1099
INTEREST INCOME
Box 1 $800.00
1a Total ordinary dividends $2,000.00
1b Qualified dividends $1,000.00`;
      const result = parse1099Text(text);
      expect(result).not.toBeNull();
      expect(result!.formType).toBe('1099-CONSOLIDATED');
      expect(result!.interest).toBe(800.00);
      expect(result!.ordinaryDividends).toBe(2000.00);
      expect(result!.qualifiedDividends).toBe(1000.00);
      expect(result!.shortTermCapGains).toBeUndefined();
      expect(result!.longTermCapGains).toBeUndefined();
    });
  });

  describe('1099-B with proceeds/cost basis (IB-style)', () => {
    it('computes gains from proceeds minus cost basis', () => {
      const text = `Form 1099-B
Proceeds From Broker
Short-term transactions
Proceeds $6,655,431.18
Cost or other basis $4,807,577.93
Long-term transactions
Proceeds $512,300.30
Cost or other basis $324,224.58`;
      const result = parse1099Text(text);
      expect(result).not.toBeNull();
      expect(result!.formType).toBe('1099-B');
      expect(result!.shortTermCapGains).toBe(1847853.25);
      expect(result!.longTermCapGains).toBe(188075.72);
    });

    it('prefers direct capital gain amounts over proceeds/basis fallback', () => {
      const text = `Form 1099-B
Short-term capital gain $5,000.00
Long-term capital gain $12,500.75`;
      const result = parse1099Text(text);
      expect(result!.shortTermCapGains).toBe(5000.00);
      expect(result!.longTermCapGains).toBe(12500.75);
    });
  });

  describe('1099-CONSOLIDATED with IB-style layout', () => {
    it('extracts all fields including proceeds/basis capital gains', () => {
      const text = `Consolidated 1099
INTEREST INCOME
Box 1 Interest Income $3,854.21
1a Total ordinary dividends $52,212.79
1b Qualified dividends $52,082.76
Short-term transactions
Proceeds $6,655,431.18
Cost or other basis $4,807,577.93
Long-term transactions
Proceeds $512,300.30
Cost or other basis $324,224.58`;
      const result = parse1099Text(text);
      expect(result).not.toBeNull();
      expect(result!.formType).toBe('1099-CONSOLIDATED');
      expect(result!.interest).toBe(3854.21);
      expect(result!.ordinaryDividends).toBe(52212.79);
      expect(result!.qualifiedDividends).toBe(52082.76);
      expect(result!.shortTermCapGains).toBe(1847853.25);
      expect(result!.longTermCapGains).toBe(188075.72);
    });
  });

  it('returns null for unrecognized form', () => {
    expect(parse1099Text('Some random document without form indicators')).toBeNull();
  });
});
