'use client';

import { useState, useCallback } from 'react';
import { W2Data, FilingStatus, TaxResult, OtherIncome, DeductionChoice, ItemizedDeductions, DependentInfo } from '../lib/types';
import { calculateTax } from '../lib/taxCalculator';
import StepIndicator from '../components/StepIndicator';
import W2Upload from '../components/W2Upload';
import W2Review from '../components/W2Review';
import OtherIncomeForm from '../components/OtherIncomeForm';
import DeductionsForm from '../components/DeductionsForm';
import CreditsForm from '../components/CreditsForm';
import FilingStatusSelect from '../components/FilingStatusSelect';
import TaxSummary from '../components/TaxSummary';

const EMPTY_OTHER_INCOME: OtherIncome = {
  interest: 0,
  ordinaryDividends: 0,
  qualifiedDividends: 0,
  shortTermCapGains: 0,
  longTermCapGains: 0,
};

const EMPTY_ITEMIZED: ItemizedDeductions = {
  mortgageInterest: 0,
  saltTaxes: 0,
  charitableContributions: 0,
  medicalExpenses: 0,
};

const EMPTY_DEPENDENTS: DependentInfo = {
  numChildrenUnder17: 0,
  numOtherDependents: 0,
  dependentCareExpenses: 0,
  educationExpenses: 0,
};

export default function Home() {
  const [step, setStep] = useState(0);
  const [w2Data, setW2Data] = useState<W2Data | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [filingStatus, setFilingStatus] = useState<FilingStatus | null>(null);
  const [taxResult, setTaxResult] = useState<TaxResult | null>(null);
  const [rawOcrText, setRawOcrText] = useState('');
  const [otherIncome, setOtherIncome] = useState<OtherIncome>(EMPTY_OTHER_INCOME);
  const [deductionChoice, setDeductionChoice] = useState<DeductionChoice>('standard');
  const [itemizedDeductions, setItemizedDeductions] = useState<ItemizedDeductions>(EMPTY_ITEMIZED);
  const [dependents, setDependents] = useState<DependentInfo>(EMPTY_DEPENDENTS);

  const handleUploadComplete = useCallback((data: W2Data, url: string | null, rawText: string) => {
    setW2Data(data);
    setImageUrl(url);
    setRawOcrText(rawText);
    setStep(1);
  }, []);

  const handleFilingNext = () => {
    if (!filingStatus || !w2Data) return;
    const result = calculateTax(
      w2Data.wages,
      w2Data.federalWithheld,
      filingStatus,
      otherIncome,
      deductionChoice,
      deductionChoice === 'itemized' ? itemizedDeductions : undefined,
      dependents,
      w2Data.stateName ? {
        stateCode: w2Data.stateName,
        stateWages: w2Data.stateWages,
        stateWithheld: w2Data.stateWithheld,
      } : undefined,
    );
    setTaxResult(result);
    setStep(6);
  };

  const handleStartOver = () => {
    setStep(0);
    setW2Data(null);
    setImageUrl(null);
    setFilingStatus(null);
    setTaxResult(null);
    setRawOcrText('');
    setOtherIncome(EMPTY_OTHER_INCOME);
    setDeductionChoice('standard');
    setItemizedDeductions(EMPTY_ITEMIZED);
    setDependents(EMPTY_DEPENDENTS);
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-center mb-2">
        W2 Tax Liability Estimator
      </h1>
      <p className="text-sm text-gray-500 text-center mb-8">
        2025 Federal Tax Year
      </p>

      <StepIndicator currentStep={step} />

      {step === 0 && (
        <W2Upload onComplete={handleUploadComplete} />
      )}

      {step === 1 && w2Data && (
        <W2Review
          data={w2Data}
          imageUrl={imageUrl}
          rawOcrText={rawOcrText}
          onChange={setW2Data}
          onNext={() => setStep(2)}
          onBack={() => setStep(0)}
        />
      )}

      {step === 2 && (
        <OtherIncomeForm
          data={otherIncome}
          onChange={setOtherIncome}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <DeductionsForm
          filingStatus={filingStatus}
          deductionChoice={deductionChoice}
          itemized={itemizedDeductions}
          onChoiceChange={setDeductionChoice}
          onItemizedChange={setItemizedDeductions}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}

      {step === 4 && (
        <CreditsForm
          data={dependents}
          onChange={setDependents}
          onNext={() => setStep(5)}
          onBack={() => setStep(3)}
        />
      )}

      {step === 5 && (
        <FilingStatusSelect
          selected={filingStatus}
          onSelect={setFilingStatus}
          onNext={handleFilingNext}
          onBack={() => setStep(4)}
        />
      )}

      {step === 6 && taxResult && (
        <TaxSummary
          result={taxResult}
          onBack={() => setStep(5)}
          onStartOver={handleStartOver}
        />
      )}
    </main>
  );
}
