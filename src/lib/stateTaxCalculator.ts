import { StateTaxResult, StateTaxBracketBreakdown } from './types';
import { STATE_TAX_CONFIG, STATE_NAMES, isValidStateCode } from './stateTaxConstants';

const round2 = (n: number) => Math.round(n * 100) / 100;

export function calculateStateTax(
  stateCode: string,
  stateWages: number,
  stateWithheld: number,
  federalAGI: number,
): StateTaxResult | null {
  const code = stateCode.toUpperCase();
  if (!isValidStateCode(code)) return null;

  const config = STATE_TAX_CONFIG[code];
  const stateName = STATE_NAMES[code] || code;
  // Use federal AGI as state starting point (simplification)
  const stateAGI = federalAGI;

  if (config.type === 'none') {
    return {
      stateCode: code,
      stateName,
      taxType: 'none',
      stateWages,
      stateAGI,
      standardDeduction: 0,
      stateTaxableIncome: 0,
      stateTax: 0,
      stateWithheld,
      stateRefundOrOwed: round2(stateWithheld),
    };
  }

  const standardDeduction = config.standardDeduction;
  const stateTaxableIncome = Math.max(0, stateAGI - standardDeduction);

  if (config.type === 'flat') {
    const stateTax = round2(stateTaxableIncome * config.rate);
    return {
      stateCode: code,
      stateName,
      taxType: 'flat',
      stateWages,
      stateAGI,
      standardDeduction,
      stateTaxableIncome,
      taxRate: config.rate,
      stateTax,
      stateWithheld,
      stateRefundOrOwed: round2(stateWithheld - stateTax),
    };
  }

  // Progressive brackets
  const bracketBreakdown: StateTaxBracketBreakdown[] = [];
  let remaining = stateTaxableIncome;
  let stateTax = 0;

  for (const bracket of config.brackets) {
    if (remaining <= 0) break;
    const width = bracket.max - bracket.min;
    const taxableInBracket = Math.min(remaining, width);
    const taxForBracket = round2(taxableInBracket * bracket.rate);
    bracketBreakdown.push({ rate: bracket.rate, taxableInBracket, taxForBracket });
    stateTax += taxForBracket;
    remaining -= taxableInBracket;
  }
  stateTax = round2(stateTax);

  return {
    stateCode: code,
    stateName,
    taxType: 'progressive',
    stateWages,
    stateAGI,
    standardDeduction,
    stateTaxableIncome,
    bracketBreakdown,
    stateTax,
    stateWithheld,
    stateRefundOrOwed: round2(stateWithheld - stateTax),
  };
}
