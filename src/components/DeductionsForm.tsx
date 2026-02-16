'use client';

import { DeductionChoice, ItemizedDeductions, FilingStatus } from '../lib/types';
import { STANDARD_DEDUCTIONS, SALT_CAP } from '../lib/taxConstants';

interface DeductionsFormProps {
  filingStatus: FilingStatus | null;
  deductionChoice: DeductionChoice;
  itemized: ItemizedDeductions;
  onChoiceChange: (choice: DeductionChoice) => void;
  onItemizedChange: (data: ItemizedDeductions) => void;
  onNext: () => void;
  onBack: () => void;
}

function CurrencyInput({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
        <input
          type="number"
          min={0}
          step={1}
          value={value || ''}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
          placeholder="0"
          className="w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );
}

export default function DeductionsForm({
  filingStatus,
  deductionChoice,
  itemized,
  onChoiceChange,
  onItemizedChange,
  onNext,
  onBack,
}: DeductionsFormProps) {
  const standardAmount = filingStatus ? STANDARD_DEDUCTIONS[filingStatus] : STANDARD_DEDUCTIONS.single;

  const update = (field: keyof ItemizedDeductions, value: number) => {
    onItemizedChange({ ...itemized, [field]: value });
  };

  const itemizedTotal = itemized.mortgageInterest
    + Math.min(itemized.saltTaxes, SALT_CAP)
    + itemized.charitableContributions
    + itemized.medicalExpenses;

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-2">Deductions</h2>
      <p className="text-sm text-gray-500 mb-6">
        Choose between the standard deduction or itemize your deductions.
      </p>

      <div className="space-y-3 mb-6">
        <label
          className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${
            deductionChoice === 'standard' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
          }`}
        >
          <input
            type="radio"
            checked={deductionChoice === 'standard'}
            onChange={() => onChoiceChange('standard')}
            className="w-4 h-4 text-blue-600"
          />
          <div>
            <div className="font-medium">Standard Deduction</div>
            <div className="text-sm text-gray-500">
              ${standardAmount.toLocaleString()} for {filingStatus?.replace(/_/g, ' ') || 'your filing status'}
            </div>
          </div>
        </label>

        <label
          className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${
            deductionChoice === 'itemized' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
          }`}
        >
          <input
            type="radio"
            checked={deductionChoice === 'itemized'}
            onChange={() => onChoiceChange('itemized')}
            className="w-4 h-4 text-blue-600"
          />
          <div>
            <div className="font-medium">Itemized Deductions</div>
            <div className="text-sm text-gray-500">
              Enter your individual deductions below
            </div>
          </div>
        </label>
      </div>

      {deductionChoice === 'itemized' && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <CurrencyInput
            label="Mortgage Interest"
            hint="From Form 1098"
            value={itemized.mortgageInterest}
            onChange={(v) => update('mortgageInterest', v)}
          />
          <CurrencyInput
            label="State & Local Taxes (SALT)"
            hint={`Capped at $${SALT_CAP.toLocaleString()}`}
            value={itemized.saltTaxes}
            onChange={(v) => update('saltTaxes', v)}
          />
          <CurrencyInput
            label="Charitable Contributions"
            value={itemized.charitableContributions}
            onChange={(v) => update('charitableContributions', v)}
          />
          <CurrencyInput
            label="Medical Expenses"
            hint="Only the amount exceeding 7.5% of AGI is deductible"
            value={itemized.medicalExpenses}
            onChange={(v) => update('medicalExpenses', v)}
          />

          <div className="pt-3 border-t text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated itemized total:</span>
              <span className="font-semibold">${itemizedTotal.toLocaleString()}</span>
            </div>
            {itemizedTotal < standardAmount && (
              <p className="text-yellow-600 mt-1 text-xs">
                Your itemized deductions are less than the standard deduction. We&apos;ll automatically use the standard deduction.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
        >
          &larr; Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
}
