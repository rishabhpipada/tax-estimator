'use client';

import { useState, useCallback, useRef } from 'react';
import { Form1099Data } from '../lib/types';
import { ocr1099 } from '../lib/form1099Parser';

interface Form1099UploadProps {
  onParsed: (data: Form1099Data, fileName: string, rawText: string) => void;
}

export default function Form1099Upload({ onParsed }: Form1099UploadProps) {
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
        const { data, rawText } = await ocr1099(file, setProgress);
        onParsed(data, file.name, rawText);
      } catch (err) {
        console.error('1099 OCR error:', err);
        setError(err instanceof Error ? err.message : 'OCR processing failed.');
      } finally {
        setIsProcessing(false);
        // Reset file input so the same file can be re-uploaded
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [onParsed]
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

  if (isProcessing) {
    return (
      <div className="text-center py-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Processing 1099...</p>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-1">
          <div
            className="bg-green-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">{progress}% - Extracting text with OCR</p>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'}
        `}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <p className="text-gray-600 text-sm font-medium">
          Upload a 1099 form (INT, DIV, or B)
        </p>
        <p className="text-gray-400 text-xs mt-1">Drag & drop or click to browse (PNG, JPG, PDF)</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.pdf"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </div>
  );
}
