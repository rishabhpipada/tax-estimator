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

  it('returns null for unrecognized form', () => {
    expect(parse1099Text('Some random document without form indicators')).toBeNull();
  });
});
