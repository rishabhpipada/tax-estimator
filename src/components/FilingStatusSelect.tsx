'use client';

import { FilingStatus } from '../lib/types';
import { STANDARD_DEDUCTIONS, FILING_STATUS_LABELS } from '../lib/taxConstants';

interface FilingStatusSelectProps {
  selected: FilingStatus | null;
  onSelect: (status: FilingStatus) => void;
  onNext: () => void;
  onBack: () => void;
}

const STATUSES: FilingStatus[] = [
  'single',
  'married_filing_jointly',
  'married_filing_separately',
  'head_of_household',
];

const DESCRIPTIONS: Record<FilingStatus, string> = {
  single: 'Unmarried or legally separated',
  married_filing_jointly: 'Married couple filing one return together',
  married_filing_separately: 'Married couple filing individual returns',
  head_of_household: 'Unmarried with a qualifying dependent',
};

function formatCurrency(n: number): string {
  return '$' + n.toLocaleString('en-US');
}

export default function FilingStatusSelect({
  selected,
  onSelect,
  onNext,
  onBack,
}: FilingStatusSelectProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-2 text-center">Select Filing Status</h2>
      <p className="text-sm text-gray-500 text-center mb-6">
        Your filing status determines your standard deduction and tax brackets.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => onSelect(status)}
            className={`p-4 rounded-xl border-2 text-left transition-all
              ${
                selected === status
                  ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                  : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <div className="font-semibold text-sm">
              {FILING_STATUS_LABELS[status]}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {DESCRIPTIONS[status]}
            </div>
            <div className="text-sm font-medium text-blue-600 mt-2">
              Standard deduction: {formatCurrency(STANDARD_DEDUCTIONS[status])}
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!selected}
          className={`px-6 py-2 rounded-lg font-medium
            ${selected
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          Calculate Tax →
        </button>
      </div>
    </div>
  );
}
