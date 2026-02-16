'use client';

import { TaxResult } from '../lib/types';

interface TaxSummaryProps {
  result: TaxResult;
  onBack: () => void;
  onStartOver: () => void;
}

function formatCurrency(n: number): string {
  const abs = Math.abs(n);
  const formatted = '$' + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n < 0 ? '-' + formatted : formatted;
}

function formatPercent(n: number): string {
  return (n * 100).toFixed(0) + '%';
}

export default function TaxSummary({ result, onBack, onStartOver }: TaxSummaryProps) {
  const isRefund = result.refundOrOwed > 0;
  const isOwed = result.refundOrOwed < 0;
  const hasOtherIncome = result.otherIncomeTotals.total > 0;
  const hasCredits = result.credits.totalCredits > 0;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-6 text-center">Tax Estimate Summary</h2>

      {/* Refund/Owed Banner */}
      <div
        className={`rounded-xl p-6 mb-6 text-center ${
          isRefund
            ? 'bg-green-50 border border-green-200'
            : isOwed
            ? 'bg-red-50 border border-red-200'
            : 'bg-gray-50 border border-gray-200'
        }`}
      >
        <div className="text-sm font-medium text-gray-500 mb-1">
          {isRefund ? 'Estimated Refund' : isOwed ? 'Estimated Amount Owed' : 'You Break Even'}
        </div>
        <div
          className={`text-3xl font-bold ${
            isRefund ? 'text-green-700' : isOwed ? 'text-red-700' : 'text-gray-700'
          }`}
        >
          {formatCurrency(Math.abs(result.refundOrOwed))}
        </div>
      </div>

      {/* Income Section */}
      <SectionHeader title="Income" />
      <div className="bg-white rounded-xl border divide-y mb-4">
        <Row label="W2 Wages" value={formatCurrency(result.w2Wages)} />
        {hasOtherIncome && (
          <>
            {result.otherIncomeTotals.interest > 0 && (
              <Row label="Interest Income" value={formatCurrency(result.otherIncomeTotals.interest)} indent />
            )}
            {result.otherIncomeTotals.ordinaryDividends > 0 && (
              <Row label="Ordinary Dividends" value={formatCurrency(result.otherIncomeTotals.ordinaryDividends)} indent />
            )}
            {result.otherIncomeTotals.qualifiedDividends > 0 && (
              <Row label="  (Qualified Dividends)" value={formatCurrency(result.otherIncomeTotals.qualifiedDividends)} indent muted />
            )}
            {result.otherIncomeTotals.shortTermCapGains > 0 && (
              <Row label="Short-Term Capital Gains" value={formatCurrency(result.otherIncomeTotals.shortTermCapGains)} indent />
            )}
            {result.otherIncomeTotals.longTermCapGains > 0 && (
              <Row label="Long-Term Capital Gains" value={formatCurrency(result.otherIncomeTotals.longTermCapGains)} indent />
            )}
          </>
        )}
        <Row label="Adjusted Gross Income (AGI)" value={formatCurrency(result.agi)} bold />
      </div>

      {/* Deductions Section */}
      <SectionHeader title="Deductions" />
      <div className="bg-white rounded-xl border divide-y mb-4">
        <Row
          label={result.deductionType === 'itemized' ? 'Itemized Deductions' : 'Standard Deduction'}
          value={`- ${formatCurrency(result.deductionAmount)}`}
        />
        {result.deductionType === 'itemized' && result.itemizedDeductionDetail && (
          <>
            <Row label="Mortgage Interest" value={formatCurrency(result.itemizedDeductionDetail.mortgageInterest)} indent />
            <Row label="SALT (capped)" value={formatCurrency(result.itemizedDeductionDetail.saltTaxes)} indent />
            <Row label="Charitable" value={formatCurrency(result.itemizedDeductionDetail.charitableContributions)} indent />
            <Row label="Medical (after 7.5% AGI)" value={formatCurrency(result.itemizedDeductionDetail.medicalExpenses)} indent />
          </>
        )}
        <Row label="Taxable Income" value={formatCurrency(result.taxableIncome)} bold />
      </div>

      {/* Tax Calculation Section */}
      <SectionHeader title="Tax Calculation" />
      <div className="bg-white rounded-xl border divide-y mb-4">
        {/* Ordinary Tax Brackets */}
        <div className="px-4 py-3">
          <div className="text-sm font-medium text-gray-500 mb-2">Ordinary Income Tax by Bracket</div>
          <div className="space-y-1">
            {result.bracketBreakdown.map((b, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-500">
                  {formatPercent(b.rate)} on {formatCurrency(b.taxableInBracket)}
                </span>
                <span className="text-gray-700 font-mono">
                  {formatCurrency(b.taxForBracket)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <Row label="Ordinary Income Tax" value={formatCurrency(result.ordinaryTax)} />

        {result.capitalGainsTax > 0 && (
          <Row label="Capital Gains / Qualified Dividends Tax" value={formatCurrency(result.capitalGainsTax)} />
        )}

        <Row label="Total Tax Before Credits" value={formatCurrency(result.totalTaxBeforeCredits)} bold />
      </div>

      {/* Credits Section */}
      {hasCredits && (
        <>
          <SectionHeader title="Credits" />
          <div className="bg-white rounded-xl border divide-y mb-4">
            {result.credits.childTaxCredit > 0 && (
              <Row label="Child Tax Credit" value={`- ${formatCurrency(result.credits.childTaxCredit)}`} highlight="green" />
            )}
            {result.credits.otherDependentCredit > 0 && (
              <Row label="Other Dependent Credit" value={`- ${formatCurrency(result.credits.otherDependentCredit)}`} highlight="green" />
            )}
            {result.credits.dependentCareCredit > 0 && (
              <Row label="Dependent Care Credit" value={`- ${formatCurrency(result.credits.dependentCareCredit)}`} highlight="green" />
            )}
            {result.credits.educationCredit > 0 && (
              <Row label="Education Credit" value={`- ${formatCurrency(result.credits.educationCredit)}`} highlight="green" />
            )}
            <Row label="Total Credits" value={`- ${formatCurrency(result.credits.totalCredits)}`} bold highlight="green" />
          </div>
        </>
      )}

      {/* AMT Section */}
      {result.amt.triggered && (
        <>
          <SectionHeader title="Alternative Minimum Tax" />
          <div className="bg-white rounded-xl border divide-y mb-4">
            <Row label="AMT Income" value={formatCurrency(result.amt.amtIncome)} />
            <Row label="AMT Exemption" value={`- ${formatCurrency(result.amt.exemption)}`} />
            <Row label="AMT Tax" value={formatCurrency(result.amt.amtTax)} bold highlight="red" />
            <div className="px-4 py-3">
              <p className="text-xs text-red-600">
                AMT applies because it exceeds your regular tax after credits.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Final Summary */}
      <SectionHeader title="Summary" />
      <div className="bg-white rounded-xl border divide-y mb-4">
        <Row label="Total Federal Tax" value={formatCurrency(result.totalTax)} bold />
        <Row label="Federal Tax Withheld (from W2)" value={formatCurrency(result.federalWithheld)} />
        <Row
          label={isRefund ? 'Refund' : 'Amount Owed'}
          value={formatCurrency(Math.abs(result.refundOrOwed))}
          bold
          highlight={isRefund ? 'green' : isOwed ? 'red' : undefined}
        />
      </div>

      {/* Disclaimer */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800">
          <strong>Disclaimer:</strong> This is an estimate only based on the information provided.
          It may not account for all tax situations. Consult a tax professional for accurate tax advice.
        </p>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
        >
          &larr; Back
        </button>
        <button
          onClick={onStartOver}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 mt-2">
      {title}
    </h3>
  );
}

function Row({
  label,
  value,
  bold,
  highlight,
  indent,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: 'green' | 'red';
  indent?: boolean;
  muted?: boolean;
}) {
  return (
    <div className={`flex justify-between px-4 py-3 ${indent ? 'pl-8' : ''}`}>
      <span className={`text-sm ${bold ? 'font-semibold text-gray-800' : muted ? 'text-gray-400 italic' : 'text-gray-600'}`}>
        {label}
      </span>
      <span
        className={`font-mono text-sm ${
          highlight === 'green'
            ? 'text-green-700 font-bold'
            : highlight === 'red'
            ? 'text-red-700 font-bold'
            : bold
            ? 'font-semibold text-gray-800'
            : muted
            ? 'text-gray-400'
            : 'text-gray-700'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
