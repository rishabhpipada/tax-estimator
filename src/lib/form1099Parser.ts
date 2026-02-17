import { Form1099Data, Form1099Type } from './types';
import { parseCurrency, performOcr } from './ocrUtils';

/**
 * Detect which 1099 form type the OCR text represents.
 */
export function detectFormType(text: string): Form1099Type | null {
  const upper = text.toUpperCase();

  const matchesINT =
    /1099[-\s]*INT/i.test(text) ||
    /INTEREST\s*INCOME/i.test(text) ||
    upper.includes('INTEREST INCOME') ||
    /BOX\s*1.*INTEREST/i.test(text);

  const matchesDIV =
    /1099[-\s]*DIV/i.test(text) ||
    /DIVIDENDS\s*AND\s*DISTRIBUTIONS/i.test(text) ||
    upper.includes('ORDINARY DIVIDENDS') ||
    upper.includes('QUALIFIED DIVIDENDS');

  const matchesB =
    /1099[-\s]*B\b/i.test(text) ||
    /PROCEEDS\s*FROM\s*BROKER/i.test(text) ||
    upper.includes('SHORT-TERM') ||
    upper.includes('LONG-TERM');

  const matched: Form1099Type[] = [];
  if (matchesINT) matched.push('1099-INT');
  if (matchesDIV) matched.push('1099-DIV');
  if (matchesB) matched.push('1099-B');

  if (matched.length >= 2) return '1099-CONSOLIDATED';
  if (matched.length === 1) return matched[0];
  return null;
}

/**
 * Find a dollar amount near a label pattern.
 * Searches the matched line and adjacent lines for currency values.
 */
function findAmountNearLabel(lines: string[], patterns: RegExp[]): number {
  for (const pattern of patterns) {
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        // Check this line for an amount
        const lineMatch = lines[i].match(/\$?\d[\d,]*\.\d{2}/);
        if (lineMatch) {
          const val = parseCurrency(lineMatch[0]);
          if (val > 0) return val;
        }
        // Check next line
        if (i + 1 < lines.length) {
          const nextMatch = lines[i + 1].match(/\$?\d[\d,]*\.\d{2}/);
          if (nextMatch) {
            const val = parseCurrency(nextMatch[0]);
            if (val > 0) return val;
          }
        }
        // Check previous line
        if (i > 0) {
          const prevMatch = lines[i - 1].match(/\$?\d[\d,]*\.\d{2}/);
          if (prevMatch) {
            const val = parseCurrency(prevMatch[0]);
            if (val > 0) return val;
          }
        }
      }
    }
  }
  return 0;
}

function parse1099INT(lines: string[]): Form1099Data {
  const interest = findAmountNearLabel(lines, [
    /box\s*1\b/i,
    /interest\s*income/i,
    /interest\s*earned/i,
  ]);

  return { formType: '1099-INT', interest };
}

function parse1099DIV(lines: string[]): Form1099Data {
  const ordinaryDividends = findAmountNearLabel(lines, [
    /box\s*1a\b/i,
    /1a\s*.*ordinary\s*dividends/i,
    /ordinary\s*dividends/i,
    /total\s*ordinary\s*dividends/i,
  ]);

  const qualifiedDividends = findAmountNearLabel(lines, [
    /box\s*1b\b/i,
    /1b\s*.*qualified\s*dividends/i,
    /qualified\s*dividends/i,
  ]);

  return { formType: '1099-DIV', ordinaryDividends, qualifiedDividends };
}

function parse1099B(lines: string[]): Form1099Data {
  const shortTermCapGains = findAmountNearLabel(lines, [
    /short[-\s]*term\s*(capital\s*)?(gain|proceeds|total)/i,
    /short[-\s]*term/i,
  ]);

  const longTermCapGains = findAmountNearLabel(lines, [
    /long[-\s]*term\s*(capital\s*)?(gain|proceeds|total)/i,
    /long[-\s]*term/i,
  ]);

  return { formType: '1099-B', shortTermCapGains, longTermCapGains };
}

function parse1099Consolidated(lines: string[]): Form1099Data {
  const intData = parse1099INT(lines);
  const divData = parse1099DIV(lines);
  const bData = parse1099B(lines);

  return {
    formType: '1099-CONSOLIDATED',
    interest: intData.interest || undefined,
    ordinaryDividends: divData.ordinaryDividends || undefined,
    qualifiedDividends: divData.qualifiedDividends || undefined,
    shortTermCapGains: bData.shortTermCapGains || undefined,
    longTermCapGains: bData.longTermCapGains || undefined,
  };
}

/**
 * Parse OCR text into structured 1099 data.
 * Auto-detects the form type and extracts relevant fields.
 */
export function parse1099Text(text: string): Form1099Data | null {
  const formType = detectFormType(text);
  if (!formType) return null;

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  switch (formType) {
    case '1099-INT':
      return parse1099INT(lines);
    case '1099-DIV':
      return parse1099DIV(lines);
    case '1099-B':
      return parse1099B(lines);
    case '1099-CONSOLIDATED':
      return parse1099Consolidated(lines);
  }
}

export interface Ocr1099Result {
  data: Form1099Data;
  rawText: string;
}

/**
 * OCR a 1099 form file and parse the results.
 */
export async function ocr1099(
  file: File,
  onProgress?: (progress: number) => void
): Promise<Ocr1099Result> {
  const rawText = await performOcr(file, onProgress);
  const data = parse1099Text(rawText);

  if (!data) {
    throw new Error('Could not detect 1099 form type. Please ensure you uploaded a 1099-INT, 1099-DIV, 1099-B, or consolidated 1099.');
  }

  return { data, rawText };
}
