'use client';

import { Uploaded1099 } from '../lib/types';

interface Uploaded1099ListProps {
  items: Uploaded1099[];
  onRemove: (id: string) => void;
}

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '1099-INT': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  '1099-DIV': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  '1099-B': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  '1099-CONSOLIDATED': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
};

function formatAmount(value: number | undefined): string {
  if (!value) return '';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

function getSummary(item: Uploaded1099): string {
  const parts: string[] = [];
  const d = item.data;
  if (d.interest) parts.push(`Interest: ${formatAmount(d.interest)}`);
  if (d.ordinaryDividends) parts.push(`Div: ${formatAmount(d.ordinaryDividends)}`);
  if (d.qualifiedDividends) parts.push(`Qual: ${formatAmount(d.qualifiedDividends)}`);
  if (d.shortTermCapGains) parts.push(`ST: ${formatAmount(d.shortTermCapGains)}`);
  if (d.longTermCapGains) parts.push(`LT: ${formatAmount(d.longTermCapGains)}`);
  return parts.join(' | ') || 'No amounts detected';
}

export default function Uploaded1099List({ items, onRemove }: Uploaded1099ListProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const colors = TYPE_COLORS[item.formType] || TYPE_COLORS['1099-INT'];
        return (
          <div
            key={item.id}
            className={`flex items-center justify-between px-3 py-2 rounded-lg border ${colors.bg} ${colors.border}`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${colors.text} ${colors.bg}`}>
                  {item.formType}
                </span>
                <span className="text-sm text-gray-600 truncate">{item.fileName}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{getSummary(item)}</p>
            </div>
            <button
              onClick={() => onRemove(item.id)}
              className="ml-2 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
              title="Remove this 1099"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
