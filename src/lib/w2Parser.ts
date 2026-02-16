import { W2Data } from './types';
import { parseCurrency, performOcr } from './ocrUtils';

export function emptyW2Data(): W2Data {
  return {
    employerName: '',
    employerEIN: '',
    wages: 0,
    federalWithheld: 0,
    socialSecurityWages: 0,
    socialSecurityWithheld: 0,
    medicareWages: 0,
    medicareWithheld: 0,
    stateName: '',
    stateWages: 0,
    stateWithheld: 0,
  };
}

/**
 * Extract all dollar-like amounts (>=100, with decimals) from a string.
 * Returns them in order of appearance.
 */
function extractAmounts(line: string): number[] {
  const amounts: number[] = [];
  // Match: 1287072.40, 313,265.58, $65,000.00, 128707240 (OCR may drop the dot)
  const re = /\$?\d[\d,]*\.\d{2}/g;
  let match;
  while ((match = re.exec(line)) !== null) {
    const val = parseCurrency(match[0]);
    if (val >= 1) amounts.push(val);
  }
  return amounts;
}

/**
 * Find the first pair of amounts on a line near a label pattern.
 * Returns [first, second] or null.
 */
function findAmountPairNearLabel(
  lines: string[],
  labelPatterns: RegExp[],
): [number, number] | null {
  for (const pattern of labelPatterns) {
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        // Check this line and the next few lines for amounts
        for (let j = i; j < Math.min(i + 3, lines.length); j++) {
          const amounts = extractAmounts(lines[j]);
          if (amounts.length >= 2) {
            return [amounts[0], amounts[1]];
          }
        }
        // Check the line just before (values sometimes appear above label)
        if (i > 0) {
          const amounts = extractAmounts(lines[i - 1]);
          if (amounts.length >= 2) {
            return [amounts[0], amounts[1]];
          }
        }
      }
    }
  }
  return null;
}

/**
 * W2 forms have a standard grid layout:
 *   Row 1: Box 1 (wages) | Box 2 (fed withheld)
 *   Row 2: Box 3 (SS wages) | Box 4 (SS withheld)
 *   Row 3: Box 5 (Medicare wages) | Box 6 (Medicare withheld)
 *
 * OCR often produces the values as pairs on the same line, with labels
 * on adjacent lines. We use a multi-strategy approach:
 * 1. Find labeled pairs (Medicare, SS, Employer ID anchors)
 * 2. Find the first pair of large amounts for Box 1/2
 * 3. Extract EIN, employer name, and state separately
 */
export function parseW2Text(text: string): W2Data {
  const data = emptyW2Data();

  console.log('=== RAW OCR TEXT ===');
  console.log(text);
  console.log('=== END OCR TEXT ===');

  // Only parse the first copy (W2s often have 4 copies on one page)
  // Split on "Form W-2" or "FormW-2" to isolate the first copy
  const copies = text.split(/Form\s*W-?\s*2\s+Wage/i);
  const firstCopy = copies[0] || text;

  const lines = firstCopy.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // --- EIN (XX-XXXXXXX) - use as anchor ---
  const einMatch = firstCopy.match(/(\d{2}-\d{7})/);
  if (einMatch) {
    data.employerEIN = einMatch[1];
  }

  // --- Box 5 & 6: Medicare wages / Medicare tax withheld ---
  // These labels are usually well-recognized by OCR
  const medicarePair = findAmountPairNearLabel(lines, [
    /medicare\s*wages/i,
    /5\s*medicare/i,
    /medicare\s*tax\s*withheld/i,
  ]);

  // The Medicare line in OCR often looks like:
  // "26-2211621 1310572.40 28998.45" (EIN + Box5 + Box6 on same line)
  // So also look for lines containing the EIN + two amounts
  if (medicarePair) {
    data.medicareWages = Math.max(...medicarePair);
    data.medicareWithheld = Math.min(...medicarePair);
  } else if (data.employerEIN) {
    // Find a line with EIN + 2 amounts (common layout near Medicare row)
    for (const line of lines) {
      if (line.includes(data.employerEIN)) {
        const amounts = extractAmounts(line);
        if (amounts.length >= 2) {
          data.medicareWages = Math.max(amounts[0], amounts[1]);
          data.medicareWithheld = Math.min(amounts[0], amounts[1]);
          break;
        }
      }
    }
  }

  // --- Box 3 & 4: SS wages / SS tax withheld ---
  // Often on the line with "Employer ID number" label
  const ssPair = findAmountPairNearLabel(lines, [
    /employer\s*i\.?d\.?\s*number/i,
    /employer\s*1d/i,  // OCR may read "ID" as "1D"
    /social\s*security/i,
    /soc.*sec.*wages/i,
  ]);
  if (ssPair) {
    data.socialSecurityWages = Math.max(...ssPair);
    data.socialSecurityWithheld = Math.min(...ssPair);
  }

  // --- Box 1 & 2: Wages / Federal income tax withheld ---
  // These are typically the first pair of large dollar amounts in the OCR text.
  // Strategy: find the first line with 2+ amounts that we haven't already assigned.
  const usedAmounts = new Set([
    data.socialSecurityWages,
    data.socialSecurityWithheld,
    data.medicareWages,
    data.medicareWithheld,
  ]);

  for (const line of lines) {
    const amounts = extractAmounts(line);
    if (amounts.length >= 2) {
      // Skip if these are the amounts we already assigned
      if (usedAmounts.has(amounts[0]) && usedAmounts.has(amounts[1])) continue;
      // Wages (Box 1) are always >= withholding (Box 2), so sort by size
      const sorted = [...amounts].sort((a, b) => b - a);
      data.wages = sorted[0];
      data.federalWithheld = sorted[1];
      break;
    }
  }

  // --- Employer name ---
  const employerNamePatterns = [
    /employer['']?s?\s*name[,.]?\s*address[^\n]*\n\s*([^\n]+)/i,
    /[Cc]\s*Employer['']?s?\s*name[^\n]*\n\s*([^\n]+)/i,
  ];
  for (const pattern of employerNamePatterns) {
    const match = firstCopy.match(pattern);
    if (match?.[1]) {
      const name = match[1].trim();
      // Filter out lines that are just numbers or addresses
      if (name && !/^\d/.test(name)) {
        data.employerName = name;
        break;
      }
    }
  }

  // --- State abbreviation ---
  // Look for 2-letter state code near an address pattern (City, ST ZIP)
  const stateZipMatch = firstCopy.match(
    /,\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\s+\d{5}/
  );
  if (stateZipMatch) {
    data.stateName = stateZipMatch[1];
  }

  // --- Box 16 & 17: State wages / State income tax ---
  // These are often not present or near the bottom
  const stateWagesPair = findAmountPairNearLabel(lines, [
    /state\s*wages/i,
    /state\s*income\s*tax/i,
    /box\s*16/i,
  ]);
  if (stateWagesPair) {
    data.stateWages = stateWagesPair[0];
    data.stateWithheld = stateWagesPair[1];
  }

  return data;
}

export interface OcrResult {
  data: W2Data;
  rawText: string;
}

export async function ocrW2(
  file: File,
  onProgress?: (progress: number) => void
): Promise<OcrResult> {
  const rawText = await performOcr(file, onProgress);
  return { data: parseW2Text(rawText), rawText };
}
