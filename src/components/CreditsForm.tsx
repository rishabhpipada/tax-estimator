'use client';

import { DependentInfo } from '../lib/types';

interface CreditsFormProps {
  data: DependentInfo;
  onChange: (data: DependentInfo) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function CreditsForm({ data, onChange, onNext, onBack }: CreditsFormProps) {
  const update = (field: keyof DependentInfo, value: number) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-2">Credits & Dependents</h2>
      <p className="text-sm text-gray-500 mb-6">
        Enter information about your dependents to calculate applicable tax credits.
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Children Under 17
          </label>
          <p className="text-xs text-gray-400 mb-1">Eligible for Child Tax Credit ($2,000 each)</p>
          <input
            type="number"
            min={0}
            max={20}
            step={1}
            value={data.numChildrenUnder17}
            onChange={(e) => update('numChildrenUnder17', Math.max(0, Math.floor(Number(e.target.value))))}
            className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Other Dependents
          </label>
          <p className="text-xs text-gray-400 mb-1">Eligible for Other Dependent Credit ($500 each)</p>
          <input
            type="number"
            min={0}
            max={20}
            step={1}
            value={data.numOtherDependents}
            onChange={(e) => update('numOtherDependents', Math.max(0, Math.floor(Number(e.target.value))))}
            className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dependent Care Expenses
          </label>
          <p className="text-xs text-gray-400 mb-1">
            Daycare, after-school care, etc. (max $3,000 for 1 dependent, $6,000 for 2+)
          </p>
          <div className="relative w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input
              type="number"
              min={0}
              step={1}
              value={data.dependentCareExpenses || ''}
              onChange={(e) => update('dependentCareExpenses', Math.max(0, Number(e.target.value)))}
              placeholder="0"
              className="w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Education Expenses
          </label>
          <p className="text-xs text-gray-400 mb-1">
            Tuition and fees for higher education (American Opportunity or Lifetime Learning Credit)
          </p>
          <div className="relative w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input
              type="number"
              min={0}
              step={1}
              value={data.educationExpenses || ''}
              onChange={(e) => update('educationExpenses', Math.max(0, Number(e.target.value)))}
              placeholder="0"
              className="w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

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
