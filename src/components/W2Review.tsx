'use client';

import { useState } from 'react';
import { W2Data } from '../lib/types';

interface W2ReviewProps {
  data: W2Data;
  imageUrl: string | null;
  rawOcrText: string;
  onChange: (data: W2Data) => void;
  onNext: () => void;
  onBack: () => void;
}

function CurrencyInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          placeholder="0.00"
        />
      </div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
      />
    </div>
  );
}

export default function W2Review({ data, imageUrl, rawOcrText, onChange, onNext, onBack }: W2ReviewProps) {
  const [showRawText, setShowRawText] = useState(false);
  const update = (field: keyof W2Data, value: string | number) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-2 text-center">Review W2 Data</h2>
      <p className="text-sm text-gray-500 text-center mb-6">
        Verify and correct the extracted values. OCR may not be 100% accurate.
      </p>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          {/* Employer Info */}
          <div className="bg-white rounded-xl border p-4 space-y-3">
            <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Employer Info</h3>
            <TextInput label="Employer Name (Box c)" value={data.employerName} onChange={(v) => update('employerName', v)} />
            <TextInput label="Employer EIN (Box b)" value={data.employerEIN} onChange={(v) => update('employerEIN', v)} />
          </div>

          {/* Income */}
          <div className="bg-white rounded-xl border p-4 space-y-3">
            <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Income & Withholding</h3>
            <div className="grid grid-cols-2 gap-3">
              <CurrencyInput label="Box 1 - Wages" value={data.wages} onChange={(v) => update('wages', v)} />
              <CurrencyInput label="Box 2 - Federal Tax Withheld" value={data.federalWithheld} onChange={(v) => update('federalWithheld', v)} />
            </div>
          </div>

          {/* Social Security & Medicare */}
          <div className="bg-white rounded-xl border p-4 space-y-3">
            <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Social Security & Medicare</h3>
            <div className="grid grid-cols-2 gap-3">
              <CurrencyInput label="Box 3 - SS Wages" value={data.socialSecurityWages} onChange={(v) => update('socialSecurityWages', v)} />
              <CurrencyInput label="Box 4 - SS Tax Withheld" value={data.socialSecurityWithheld} onChange={(v) => update('socialSecurityWithheld', v)} />
              <CurrencyInput label="Box 5 - Medicare Wages" value={data.medicareWages} onChange={(v) => update('medicareWages', v)} />
              <CurrencyInput label="Box 6 - Medicare Withheld" value={data.medicareWithheld} onChange={(v) => update('medicareWithheld', v)} />
            </div>
          </div>

          {/* State */}
          <div className="bg-white rounded-xl border p-4 space-y-3">
            <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">State Info</h3>
            <div className="grid grid-cols-3 gap-3">
              <TextInput label="Box 15 - State" value={data.stateName} onChange={(v) => update('stateName', v)} />
              <CurrencyInput label="Box 16 - State Wages" value={data.stateWages} onChange={(v) => update('stateWages', v)} />
              <CurrencyInput label="Box 17 - State Tax" value={data.stateWithheld} onChange={(v) => update('stateWithheld', v)} />
            </div>
          </div>
        </div>

        {imageUrl && (
          <div className="lg:w-80 shrink-0">
            <div className="sticky top-4">
              <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-2">Original W2</h3>
              {imageUrl.endsWith('.pdf') || imageUrl.includes('application/pdf') ? (
                <object
                  data={imageUrl}
                  type="application/pdf"
                  className="w-full h-96 rounded-lg border shadow-sm"
                >
                  <p className="text-sm text-gray-400 p-4">PDF preview not supported in this browser.</p>
                </object>
              ) : (
                <img
                  src={imageUrl}
                  alt="Uploaded W2"
                  className="w-full rounded-lg border shadow-sm"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {rawOcrText && (
        <div className="mt-6">
          <button
            onClick={() => setShowRawText(!showRawText)}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            {showRawText ? 'Hide' : 'Show'} raw OCR text (debug)
          </button>
          {showRawText && (
            <pre className="mt-2 p-3 bg-gray-100 border rounded text-xs text-gray-600 max-h-64 overflow-auto whitespace-pre-wrap">
              {rawOcrText}
            </pre>
          )}
        </div>
      )}

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
