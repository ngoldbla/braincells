import React, { useState } from 'react';
import { useSpreadsheetStore } from '../../stores/spreadsheet-store';
import { Dialog, Input, Button } from '../common';

interface CreateDatasetDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateDatasetDialog({ isOpen, onClose }: CreateDatasetDialogProps) {
  const { createDataset } = useSpreadsheetStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Dataset name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await createDataset(name.trim(), description.trim() || undefined);

      // Reset form
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create dataset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName('');
      setDescription('');
      setError('');
      onClose();
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Dataset"
      maxWidth="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Dataset'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <Input
          label="Dataset Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Product Catalog, Customer Data"
          fullWidth
          required
          disabled={isSubmitting}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this dataset is for..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
            disabled={isSubmitting}
          />
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
          After creating the dataset, you can add columns and import data.
        </div>
      </form>
    </Dialog>
  );
}
