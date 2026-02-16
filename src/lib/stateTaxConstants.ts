import { TaxBracket } from './types';

// Discriminated union for state tax configurations
export type StateTaxConfig =
  | { type: 'none' }
  | { type: 'flat'; rate: number; standardDeduction: number }
  | { type: 'progressive'; brackets: TaxBracket[]; standardDeduction: number };

// 2025 tax year state income tax data (single filer)
// Sources: state tax authorities, Tax Foundation
export const STATE_TAX_CONFIG: Record<string, StateTaxConfig> = {
  // === No income tax states (9) ===
  AK: { type: 'none' },
  FL: { type: 'none' },
  NV: { type: 'none' },
  NH: { type: 'none' },
  SD: { type: 'none' },
  TN: { type: 'none' },
  TX: { type: 'none' },
  WA: { type: 'none' },
  WY: { type: 'none' },

  // === Flat rate states ===
  CO: { type: 'flat', rate: 0.044, standardDeduction: 14600 },
  IL: { type: 'flat', rate: 0.0495, standardDeduction: 0 }, // IL has no standard deduction; uses personal exemption but we simplify
  IN: { type: 'flat', rate: 0.0305, standardDeduction: 0 },
  KY: { type: 'flat', rate: 0.04, standardDeduction: 3160 },
  MA: { type: 'flat', rate: 0.05, standardDeduction: 0 },
  MI: { type: 'flat', rate: 0.0425, standardDeduction: 5400 },
  NC: { type: 'flat', rate: 0.045, standardDeduction: 12750 },
  PA: { type: 'flat', rate: 0.0307, standardDeduction: 0 },
  UT: { type: 'flat', rate: 0.0465, standardDeduction: 0 },

  // === Progressive bracket states ===
  AL: {
    type: 'progressive',
    standardDeduction: 3000,
    brackets: [
      { min: 0, max: 500, rate: 0.02 },
      { min: 500, max: 3000, rate: 0.04 },
      { min: 3000, max: Infinity, rate: 0.05 },
    ],
  },
  AZ: {
    type: 'progressive',
    standardDeduction: 14600,
    brackets: [
      { min: 0, max: 28653, rate: 0.025 },
      { min: 28653, max: Infinity, rate: 0.025 },
    ],
  },
  AR: {
    type: 'progressive',
    standardDeduction: 2340,
    brackets: [
      { min: 0, max: 4400, rate: 0.02 },
      { min: 4400, max: 8800, rate: 0.04 },
      { min: 8800, max: Infinity, rate: 0.039 },
    ],
  },
  CA: {
    type: 'progressive',
    standardDeduction: 5540,
    brackets: [
      { min: 0, max: 10412, rate: 0.01 },
      { min: 10412, max: 24684, rate: 0.02 },
      { min: 24684, max: 38959, rate: 0.04 },
      { min: 38959, max: 54081, rate: 0.06 },
      { min: 54081, max: 68350, rate: 0.08 },
      { min: 68350, max: 349137, rate: 0.093 },
      { min: 349137, max: 418961, rate: 0.103 },
      { min: 418961, max: 698271, rate: 0.113 },
      { min: 698271, max: 1000000, rate: 0.123 },
      { min: 1000000, max: Infinity, rate: 0.133 },
    ],
  },
  CT: {
    type: 'progressive',
    standardDeduction: 0,
    brackets: [
      { min: 0, max: 10000, rate: 0.02 },
      { min: 10000, max: 50000, rate: 0.045 },
      { min: 50000, max: 100000, rate: 0.055 },
      { min: 100000, max: 200000, rate: 0.06 },
      { min: 200000, max: 250000, rate: 0.065 },
      { min: 250000, max: 500000, rate: 0.069 },
      { min: 500000, max: Infinity, rate: 0.0699 },
    ],
  },
  DE: {
    type: 'progressive',
    standardDeduction: 3250,
    brackets: [
      { min: 0, max: 2000, rate: 0.0 },
      { min: 2000, max: 5000, rate: 0.022 },
      { min: 5000, max: 10000, rate: 0.039 },
      { min: 10000, max: 20000, rate: 0.048 },
      { min: 20000, max: 25000, rate: 0.052 },
      { min: 25000, max: 60000, rate: 0.0555 },
      { min: 60000, max: Infinity, rate: 0.066 },
    ],
  },
  DC: {
    type: 'progressive',
    standardDeduction: 14600,
    brackets: [
      { min: 0, max: 10000, rate: 0.04 },
      { min: 10000, max: 40000, rate: 0.06 },
      { min: 40000, max: 60000, rate: 0.065 },
      { min: 60000, max: 250000, rate: 0.085 },
      { min: 250000, max: 500000, rate: 0.0925 },
      { min: 500000, max: 1000000, rate: 0.0975 },
      { min: 1000000, max: Infinity, rate: 0.1075 },
    ],
  },
  GA: {
    type: 'progressive',
    standardDeduction: 12000,
    brackets: [
      { min: 0, max: 750, rate: 0.01 },
      { min: 750, max: 2250, rate: 0.02 },
      { min: 2250, max: 3750, rate: 0.03 },
      { min: 3750, max: 5250, rate: 0.04 },
      { min: 5250, max: 7000, rate: 0.05 },
      { min: 7000, max: Infinity, rate: 0.055 },
    ],
  },
  HI: {
    type: 'progressive',
    standardDeduction: 2200,
    brackets: [
      { min: 0, max: 2400, rate: 0.014 },
      { min: 2400, max: 4800, rate: 0.032 },
      { min: 4800, max: 9600, rate: 0.055 },
      { min: 9600, max: 14400, rate: 0.064 },
      { min: 14400, max: 19200, rate: 0.068 },
      { min: 19200, max: 24000, rate: 0.072 },
      { min: 24000, max: 36000, rate: 0.076 },
      { min: 36000, max: 48000, rate: 0.079 },
      { min: 48000, max: 150000, rate: 0.0825 },
      { min: 150000, max: 175000, rate: 0.09 },
      { min: 175000, max: 200000, rate: 0.10 },
      { min: 200000, max: Infinity, rate: 0.11 },
    ],
  },
  ID: {
    type: 'progressive',
    standardDeduction: 14600,
    brackets: [
      { min: 0, max: 4489, rate: 0.01 },
      { min: 4489, max: Infinity, rate: 0.058 },
    ],
  },
  IA: {
    type: 'progressive',
    standardDeduction: 14600,
    brackets: [
      { min: 0, max: 6210, rate: 0.044 },
      { min: 6210, max: 31050, rate: 0.0482 },
      { min: 31050, max: Infinity, rate: 0.057 },
    ],
  },
  KS: {
    type: 'progressive',
    standardDeduction: 3500,
    brackets: [
      { min: 0, max: 15000, rate: 0.031 },
      { min: 15000, max: 30000, rate: 0.0525 },
      { min: 30000, max: Infinity, rate: 0.057 },
    ],
  },
  LA: {
    type: 'progressive',
    standardDeduction: 12500,
    brackets: [
      { min: 0, max: 12500, rate: 0.0185 },
      { min: 12500, max: 50000, rate: 0.035 },
      { min: 50000, max: Infinity, rate: 0.045 },
    ],
  },
  ME: {
    type: 'progressive',
    standardDeduction: 14600,
    brackets: [
      { min: 0, max: 26050, rate: 0.058 },
      { min: 26050, max: 61600, rate: 0.0675 },
      { min: 61600, max: Infinity, rate: 0.0715 },
    ],
  },
  MD: {
    type: 'progressive',
    standardDeduction: 2550,
    brackets: [
      { min: 0, max: 1000, rate: 0.02 },
      { min: 1000, max: 2000, rate: 0.03 },
      { min: 2000, max: 3000, rate: 0.04 },
      { min: 3000, max: 100000, rate: 0.0475 },
      { min: 100000, max: 125000, rate: 0.05 },
      { min: 125000, max: 150000, rate: 0.0525 },
      { min: 150000, max: 250000, rate: 0.055 },
      { min: 250000, max: Infinity, rate: 0.0575 },
    ],
  },
  MN: {
    type: 'progressive',
    standardDeduction: 14575,
    brackets: [
      { min: 0, max: 31690, rate: 0.0535 },
      { min: 31690, max: 104090, rate: 0.068 },
      { min: 104090, max: 193240, rate: 0.0785 },
      { min: 193240, max: Infinity, rate: 0.0985 },
    ],
  },
  MS: {
    type: 'progressive',
    standardDeduction: 2300,
    brackets: [
      { min: 0, max: 5000, rate: 0.0 },
      { min: 5000, max: 10000, rate: 0.04 },
      { min: 10000, max: Infinity, rate: 0.05 },
    ],
  },
  MO: {
    type: 'progressive',
    standardDeduction: 14600,
    brackets: [
      { min: 0, max: 1207, rate: 0.02 },
      { min: 1207, max: 2414, rate: 0.025 },
      { min: 2414, max: 3621, rate: 0.03 },
      { min: 3621, max: 4828, rate: 0.035 },
      { min: 4828, max: 6035, rate: 0.04 },
      { min: 6035, max: 7242, rate: 0.045 },
      { min: 7242, max: 8449, rate: 0.048 },
      { min: 8449, max: Infinity, rate: 0.048 },
    ],
  },
  MT: {
    type: 'progressive',
    standardDeduction: 14600,
    brackets: [
      { min: 0, max: 20500, rate: 0.047 },
      { min: 20500, max: Infinity, rate: 0.059 },
    ],
  },
  NE: {
    type: 'progressive',
    standardDeduction: 8000,
    brackets: [
      { min: 0, max: 3700, rate: 0.0246 },
      { min: 3700, max: 22170, rate: 0.0351 },
      { min: 22170, max: 35730, rate: 0.0501 },
      { min: 35730, max: Infinity, rate: 0.0584 },
    ],
  },
  NJ: {
    type: 'progressive',
    standardDeduction: 0,
    brackets: [
      { min: 0, max: 20000, rate: 0.014 },
      { min: 20000, max: 35000, rate: 0.0175 },
      { min: 35000, max: 40000, rate: 0.035 },
      { min: 40000, max: 75000, rate: 0.05525 },
      { min: 75000, max: 500000, rate: 0.0637 },
      { min: 500000, max: 1000000, rate: 0.0897 },
      { min: 1000000, max: Infinity, rate: 0.1075 },
    ],
  },
  NM: {
    type: 'progressive',
    standardDeduction: 14600,
    brackets: [
      { min: 0, max: 5500, rate: 0.017 },
      { min: 5500, max: 11000, rate: 0.032 },
      { min: 11000, max: 16000, rate: 0.047 },
      { min: 16000, max: 210000, rate: 0.049 },
      { min: 210000, max: Infinity, rate: 0.059 },
    ],
  },
  NY: {
    type: 'progressive',
    standardDeduction: 8000,
    brackets: [
      { min: 0, max: 8500, rate: 0.04 },
      { min: 8500, max: 11700, rate: 0.045 },
      { min: 11700, max: 13900, rate: 0.0525 },
      { min: 13900, max: 80650, rate: 0.055 },
      { min: 80650, max: 215400, rate: 0.06 },
      { min: 215400, max: 1077550, rate: 0.0685 },
      { min: 1077550, max: 5000000, rate: 0.0965 },
      { min: 5000000, max: 25000000, rate: 0.103 },
      { min: 25000000, max: Infinity, rate: 0.109 },
    ],
  },
  ND: {
    type: 'progressive',
    standardDeduction: 14600,
    brackets: [
      { min: 0, max: 44725, rate: 0.0195 },
      { min: 44725, max: Infinity, rate: 0.025 },
    ],
  },
  OH: {
    type: 'progressive',
    standardDeduction: 0,
    brackets: [
      { min: 0, max: 26050, rate: 0.0 },
      { min: 26050, max: 100000, rate: 0.028 },
      { min: 100000, max: Infinity, rate: 0.035 },
    ],
  },
  OK: {
    type: 'progressive',
    standardDeduction: 6350,
    brackets: [
      { min: 0, max: 1000, rate: 0.0025 },
      { min: 1000, max: 2500, rate: 0.0075 },
      { min: 2500, max: 3750, rate: 0.0175 },
      { min: 3750, max: 4900, rate: 0.0275 },
      { min: 4900, max: 7200, rate: 0.0375 },
      { min: 7200, max: Infinity, rate: 0.0475 },
    ],
  },
  OR: {
    type: 'progressive',
    standardDeduction: 2745,
    brackets: [
      { min: 0, max: 4050, rate: 0.0475 },
      { min: 4050, max: 10200, rate: 0.0675 },
      { min: 10200, max: 125000, rate: 0.0875 },
      { min: 125000, max: Infinity, rate: 0.099 },
    ],
  },
  RI: {
    type: 'progressive',
    standardDeduction: 10550,
    brackets: [
      { min: 0, max: 77450, rate: 0.0375 },
      { min: 77450, max: 176050, rate: 0.0475 },
      { min: 176050, max: Infinity, rate: 0.0599 },
    ],
  },
  SC: {
    type: 'progressive',
    standardDeduction: 14600,
    brackets: [
      { min: 0, max: 3460, rate: 0.0 },
      { min: 3460, max: 17330, rate: 0.03 },
      { min: 17330, max: Infinity, rate: 0.064 },
    ],
  },
  VT: {
    type: 'progressive',
    standardDeduction: 14600,
    brackets: [
      { min: 0, max: 45400, rate: 0.0335 },
      { min: 45400, max: 110050, rate: 0.066 },
      { min: 110050, max: 229550, rate: 0.076 },
      { min: 229550, max: Infinity, rate: 0.0875 },
    ],
  },
  VA: {
    type: 'progressive',
    standardDeduction: 4500,
    brackets: [
      { min: 0, max: 3000, rate: 0.02 },
      { min: 3000, max: 5000, rate: 0.03 },
      { min: 5000, max: 17000, rate: 0.05 },
      { min: 17000, max: Infinity, rate: 0.0575 },
    ],
  },
  WV: {
    type: 'progressive',
    standardDeduction: 0,
    brackets: [
      { min: 0, max: 10000, rate: 0.0236 },
      { min: 10000, max: 25000, rate: 0.0315 },
      { min: 25000, max: 40000, rate: 0.0354 },
      { min: 40000, max: 60000, rate: 0.0472 },
      { min: 60000, max: Infinity, rate: 0.0512 },
    ],
  },
  WI: {
    type: 'progressive',
    standardDeduction: 13230,
    brackets: [
      { min: 0, max: 14320, rate: 0.035 },
      { min: 14320, max: 28640, rate: 0.044 },
      { min: 28640, max: 315310, rate: 0.053 },
      { min: 315310, max: Infinity, rate: 0.0765 },
    ],
  },
};

export const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas',
  CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
  DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii',
  ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine',
  MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska',
  NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico',
  NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island',
  SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas',
  UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

export function isValidStateCode(code: string): boolean {
  return code.toUpperCase() in STATE_TAX_CONFIG;
}
