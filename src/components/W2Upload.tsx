'use client';

import { useState, useCallback, useRef } from 'react';
import { W2Data } from '../lib/types';
import { ocrW2, emptyW2Data } from '../lib/w2Parser';

interface W2UploadProps {
  onComplete: (data: W2Data, imageUrl: string | null, rawText: string) => void;
}

export default function W2Upload({ onComplete }: W2UploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a PNG, JPG, or PDF file.');
        return;
      }

      setError(null);
      setIsProcessing(true);
      setProgress(0);

      try {
        const imageUrl = URL.createObjectURL(file);
        const { data, rawText } = await ocrW2(file, setProgress);
        onComplete(data, imageUrl, rawText);
      } catch (err) {
        console.error('OCR error:', err);
        setError('OCR processing failed. You can enter values manually.');
        onComplete(emptyW2Data(), null, '');
      } finally {
        setIsProcessing(false);
      }
    },
    [onComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleSkip = () => {
    onComplete(emptyW2Data(), null, '');
  };

  if (isProcessing) {
    return (
      <div className="max-w-lg mx-auto text-center">
        <h2 className="text-xl font-semibold mb-4">Processing your W2...</h2>
        <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500">{progress}% - Extracting text with OCR</p>
        <p className="text-xs text-gray-400 mt-2">This may take 5-15 seconds</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-center">Upload your W2</h2>

      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        `}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="text-4xl mb-3">📄</div>
        <p className="text-gray-600 font-medium">
          Drag & drop your W2 here
        </p>
        <p className="text-gray-400 text-sm mt-1">or click to browse</p>
        <p className="text-gray-400 text-xs mt-2">PNG, JPG, or PDF</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.pdf"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-3 text-center">{error}</p>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={handleSkip}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Skip upload and enter values manually
        </button>
      </div>
    </div>
  );
}
