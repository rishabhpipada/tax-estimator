'use client';

import { useState, useCallback } from 'react';
import { OtherIncome, Form1099Data, Uploaded1099 } from '../lib/types';
import Form1099Upload from './Form1099Upload';
import Uploaded1099List from './Uploaded1099List';

interface OtherIncomeFormProps {
  data: OtherIncome;
  onChange: (data: OtherIncome) => void;
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

/** Add 1099 amounts into an OtherIncome object */
function addFormData(current: OtherIncome, form: Form1099Data): OtherIncome {
  return {
    interest: current.interest + (form.interest || 0),
    ordinaryDividends: current.ordinaryDividends + (form.ordinaryDividends || 0),
    qualifiedDividends: current.qualifiedDividends + (form.qualifiedDividends || 0),
    shortTermCapGains: current.shortTermCapGains + (form.shortTermCapGains || 0),
    longTermCapGains: current.longTermCapGains + (form.longTermCapGains || 0),
  };
}

/** Subtract 1099 amounts from an OtherIncome object */
function subtractFormData(current: OtherIncome, form: Form1099Data): OtherIncome {
  return {
    interest: Math.max(0, current.interest - (form.interest || 0)),
    ordinaryDividends: Math.max(0, current.ordinaryDividends - (form.ordinaryDividends || 0)),
    qualifiedDividends: Math.max(0, current.qualifiedDividends - (form.qualifiedDividends || 0)),
    shortTermCapGains: Math.max(0, current.shortTermCapGains - (form.shortTermCapGains || 0)),
    longTermCapGains: Math.max(0, current.longTermCapGains - (form.longTermCapGains || 0)),
  };
}

export default function OtherIncomeForm({ data, onChange, onNext, onBack }: OtherIncomeFormProps) {
  const [uploaded1099s, setUploaded1099s] = useState<Uploaded1099[]>([]);

  const update = (field: keyof OtherIncome, value: number) => {
    onChange({ ...data, [field]: value });
  };

  const handleParsed = useCallback(
    (formData: Form1099Data, fileName: string, rawText: string) => {
      const newEntry: Uploaded1099 = {
        id: crypto.randomUUID(),
        fileName,
        formType: formData.formType,
        data: formData,
        rawText,
      };
      setUploaded1099s((prev) => [...prev, newEntry]);
      onChange(addFormData(data, formData));
    },
    [data, onChange]
  );

  const handleRemove = useCallback(
    (id: string) => {
      const item = uploaded1099s.find((u) => u.id === id);
      if (!item) return;
      setUploaded1099s((prev) => prev.filter((u) => u.id !== id));
      onChange(subtractFormData(data, item.data));
    },
    [data, onChange, uploaded1099s]
  );

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-2">Other Income</h2>
      <p className="text-sm text-gray-500 mb-6">
        Enter any additional income besides your W2 wages. Leave fields at $0 if they don&apos;t apply.
      </p>

      <div className="mb-6 space-y-3">
        <Form1099Upload onParsed={handleParsed} />
        <Uploaded1099List items={uploaded1099s} onRemove={handleRemove} />
      </div>

      <div className="space-y-4">
        <CurrencyInput
          label="Interest Income"
          hint="From bank accounts, bonds, etc. (1099-INT)"
          value={data.interest}
          onChange={(v) => update('interest', v)}
        />
        <CurrencyInput
          label="Ordinary Dividends"
          hint="Total dividends received (1099-DIV Box 1a)"
          value={data.ordinaryDividends}
          onChange={(v) => update('ordinaryDividends', v)}
        />
        <CurrencyInput
          label="Qualified Dividends"
          hint="Subset of ordinary dividends taxed at lower rates (1099-DIV Box 1b)"
          value={data.qualifiedDividends}
          onChange={(v) => update('qualifiedDividends', v)}
        />
        <CurrencyInput
          label="Short-Term Capital Gains"
          hint="From assets held 1 year or less"
          value={data.shortTermCapGains}
          onChange={(v) => update('shortTermCapGains', v)}
        />
        <CurrencyInput
          label="Long-Term Capital Gains"
          hint="From assets held more than 1 year"
          value={data.longTermCapGains}
          onChange={(v) => update('longTermCapGains', v)}
        />
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
