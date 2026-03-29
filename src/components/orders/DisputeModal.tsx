'use client';

import React, { useState } from 'react';
import { AlertTriangle, Loader2, Scale } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface DisputeModalProps {
  isOpen: boolean;
  orderId: string;
  onClose: () => void;
  onSubmit: (payload: { reason: string; description: string; images: string[] }) => Promise<void>;
}

const MIN_DESCRIPTION = 10;
const MAX_DESCRIPTION = 500;
const MAX_FILES = 3;
const MAX_FILE_SIZE_MB = 5;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function DisputeModal({ isOpen, orderId, onClose, onSubmit }: DisputeModalProps) {
  const [reason, setReason] = useState('DAMAGED_GOODS');
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    const trimmed = description.trim();
    if (trimmed.length < MIN_DESCRIPTION) {
      setError(`Description must be at least ${MIN_DESCRIPTION} characters.`);
      return false;
    }
    if (trimmed.length > MAX_DESCRIPTION) {
      setError(`Description cannot exceed ${MAX_DESCRIPTION} characters.`);
      return false;
    }
    if (selectedFiles.length > MAX_FILES) {
      setError(`You can upload up to ${MAX_FILES} images.`);
      return false;
    }
    setError('');
    return true;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const next = [...selectedFiles, ...files].slice(0, MAX_FILES);

    const invalidType = next.find((file) => !ALLOWED_IMAGE_TYPES.includes(file.type));
    if (invalidType) {
      setError('Only JPG and PNG images are allowed.');
      return;
    }

    const tooLarge = next.find((file) => file.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    if (tooLarge) {
      setError(`Each image must be smaller than ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setSelectedFiles(next);
    setError('');
  };

  const removeImage = (index: number) => {
    setSelectedFiles((previous) => previous.filter((_, idx) => idx !== index));
  };

  const resetState = () => {
    setReason('DAMAGED_GOODS');
    setDescription('');
    setSelectedFiles([]);
    setSubmitting(false);
    setError('');
  };

  const handleClose = () => {
    if (submitting) return;
    resetState();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const images = await Promise.all(selectedFiles.map((file) => fileToDataUrl(file)));
      await onSubmit({ reason, description: description.trim(), images });
      resetState();
      onClose();
    } catch (submitError: any) {
      setError(submitError?.message || 'Unable to submit dispute. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="File Dispute"
      titleIcon={<Scale className="w-5 h-5 text-orange-500" />}
      headerClassName="bg-orange-50"
      maxWidth="max-w-lg"
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 disabled:opacity-70"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="dispute-form"
            disabled={submitting}
            className="flex-1 px-4 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
          </button>
        </>
      }
    >
      <form id="dispute-form" onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-600">
          Create a dispute for order <span className="font-bold text-slate-900">#{orderId}</span>.
        </p>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Reason *</label>
          <select
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-cyan-500"
          >
            <option value="DAMAGED_GOODS">Received damaged goods</option>
            <option value="WRONG_ITEM">Received wrong item</option>
            <option value="NOT_AS_DESCRIBED">Product not as described</option>
            <option value="PAYMENT_ISSUE">Payment issue</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Description *</label>
          <textarea
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe your issue in detail..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-cyan-500 resize-none"
          />
          <p className="text-xs text-slate-500 mt-1">
            {description.trim().length}/{MAX_DESCRIPTION} characters
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Images (optional)</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            multiple
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-600 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 file:font-bold"
          />
          <p className="text-xs text-slate-500 mt-1">
            Up to {MAX_FILES} images, JPG/PNG, max {MAX_FILE_SIZE_MB}MB each.
          </p>

          {selectedFiles.length > 0 && (
            <div className="mt-2 space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-xs font-medium text-slate-700 truncate pr-2">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="text-xs font-bold text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 font-medium">{error}</p>
          </div>
        )}
      </form>
    </Modal>
  );
}
